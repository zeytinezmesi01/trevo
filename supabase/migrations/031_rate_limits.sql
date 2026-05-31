-- K-2: Dağıtık rate limit — serverless / multi-instance ortam için Postgres tabanlı.
--
-- Sorun: lib/rate-limit.ts in-memory Map kullanıyordu; Vercel'de her invocation
-- ayrı lambda olabileceğinden sayaçlar paylaşılmıyor ve limit atlatılabiliyordu.
-- Çözüm: Postgres'te tek satırlık atomik upsert ile global sayaç.
--
-- Uygulama katmanı (lib/rate-limit.ts -> rateLimitDb) bu RPC'yi service_role
-- (admin client) üzerinden çağırır. RPC erişilemezse bellek-içi limiter'a düşer.

CREATE TABLE IF NOT EXISTS rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0,
  reset_at  TIMESTAMPTZ NOT NULL
);

-- PostgREST üzerinden anon/authenticated erişimini kapat (service_role RLS'i bypass eder)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomik kontrol + artırım. İzin verilirse TRUE döner, limit aşıldıysa FALSE.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_ms BIGINT
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_now   TIMESTAMPTZ := now();
  v_count INTEGER;
BEGIN
  INSERT INTO rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
                  WHEN rate_limits.reset_at < v_now THEN 1
                  ELSE rate_limits.count + 1
                END,
        reset_at = CASE
                  WHEN rate_limits.reset_at < v_now
                    THEN v_now + make_interval(secs => p_window_ms / 1000.0)
                  ELSE rate_limits.reset_at
                END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- Yalnızca service_role (admin client) çağırabilir; anon/authenticated REST'ten erişemez.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, BIGINT) TO service_role;

-- Süresi geçmiş satırları temizlemek için yardımcı (cron/manuel çağrılabilir).
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  DELETE FROM rate_limits WHERE reset_at < now();
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
