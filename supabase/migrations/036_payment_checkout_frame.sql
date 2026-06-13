-- 036: Ödeme formu için CSP adası altyapısı
--
-- Nonce tabanlı katı CSP'ye geçişte (bkz. proxy.ts) iyzico checkout formu
-- sorun çıkarır: srcdoc iframe'ler üst sayfanın CSP'sini miras alır ve
-- iyzico'nun inline script'i nonce'suz olduğu için engellenir.
--
-- Çözüm: form içeriği payments satırına yazılır ve KENDİ gevşek CSP
-- header'ına sahip ayrı bir HTML dokümanından servis edilir
-- (/api/payments/checkout-frame). Gerçek HTTP dokümanları üst CSP'yi miras
-- almaz; katı CSP uygulamanın geri kalanında geçerli kalır.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_form_content TEXT;

-- K-3 deseni: portal erişimi token-scoped SECURITY DEFINER RPC üzerinden.
-- Yalnızca bekleyen (pending) ödemenin formu döner — tamamlanmış/başarısız
-- ödemelerin form içeriği dışarı sızmaz.
CREATE OR REPLACE FUNCTION public.portal_get_checkout_form(p_token text, p_payment_id uuid)
RETURNS TABLE (id uuid, checkout_form_content text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT p.id, p.checkout_form_content
  FROM payments p
  JOIN clients c ON c.id = p.client_id
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
    AND p.id = p_payment_id
    AND p.status = 'pending'
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.portal_get_checkout_form(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.portal_get_checkout_form(text, uuid) TO service_role;
