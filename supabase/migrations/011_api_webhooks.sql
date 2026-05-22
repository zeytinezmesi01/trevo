-- PUBLIC API + WEBHOOK SYSTEM
-- API anahtarları, webhook abonelikleri ve teslimat kayıtları.
-- Run in Supabase SQL Editor.

-- 1. API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  key_prefix    TEXT NOT NULL,
  created_by    UUID REFERENCES auth.users(id),
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash  ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_keys_select ON api_keys;
DROP POLICY IF EXISTS api_keys_insert ON api_keys;
DROP POLICY IF EXISTS api_keys_update ON api_keys;
DROP POLICY IF EXISTS api_keys_delete ON api_keys;

CREATE POLICY api_keys_select ON api_keys
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY api_keys_insert ON api_keys
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY api_keys_update ON api_keys
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY api_keys_delete ON api_keys
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 2. WEBHOOK ENDPOINTS
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  secret        TEXT NOT NULL,
  events        TEXT[] NOT NULL DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT true,
  description   TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_endpoints_select ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_insert ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_update ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_delete ON webhook_endpoints;

CREATE POLICY webhook_endpoints_select ON webhook_endpoints
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY webhook_endpoints_insert ON webhook_endpoints
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY webhook_endpoints_update ON webhook_endpoints
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY webhook_endpoints_delete ON webhook_endpoints
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 3. WEBHOOK DELIVERIES
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id       UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  payload           JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed')),
  attempts          INT NOT NULL DEFAULT 0,
  response_status   INT,
  response_body     TEXT,
  last_attempt_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant     ON webhook_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint   ON webhook_deliveries(endpoint_id);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_deliveries_select ON webhook_deliveries;
DROP POLICY IF EXISTS webhook_deliveries_insert ON webhook_deliveries;
DROP POLICY IF EXISTS webhook_deliveries_update ON webhook_deliveries;
DROP POLICY IF EXISTS webhook_deliveries_delete ON webhook_deliveries;

CREATE POLICY webhook_deliveries_select ON webhook_deliveries
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY webhook_deliveries_insert ON webhook_deliveries
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY webhook_deliveries_update ON webhook_deliveries
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY webhook_deliveries_delete ON webhook_deliveries
  FOR DELETE USING (tenant_id = auth_tenant_id());
