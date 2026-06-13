-- 033: Müşteri soft-delete (pasife alma)
--
-- Sorun: Faturası/dosyası olan müşteri FK kısıtı yüzünden silinemiyordu
-- (23503 → API 409). Faturalar muhasebe kaydıdır, silinemez; ama kullanıcı
-- müşteriyi listeden kaldırmak isteyebilir.
--
-- Çözüm: clients.is_active alanı. DELETE isteği FK kısıtına takılırsa
-- uygulama müşteriyi pasife alır (is_active = false). Pasif müşteri:
--   * dashboard listelerinden ve fatura oluşturma seçiminden kalkar
--   * portal token'ı çalışmaz olur (aşağıdaki RPC güncellemeleri)
--   * faturaları/dosyaları/geçmişi aynen korunur

ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Liste sorguları tenant + aktiflik üzerinden filtreler
CREATE INDEX IF NOT EXISTS idx_clients_tenant_active ON clients(tenant_id, is_active);

-- ============================================================
-- Portal RPC'leri: pasif müşterinin token'ı hiçbir satır döndürmez.
-- Gövdeler 032_portal_rpcs.sql ile aynı, yalnızca `AND c.is_active` eklendi.
-- ============================================================

CREATE OR REPLACE FUNCTION public.portal_get_client(p_token text)
RETURNS TABLE (
  id uuid, tenant_id uuid, name text, company text, email text,
  phone text, address text, city text, tax_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT c.id, c.tenant_id, c.name, c.company, c.email,
         c.phone, c.address, c.city, c.tax_number
  FROM clients c
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.portal_list_files(p_token text)
RETURNS TABLE (id uuid, name text, size text, file_type text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT f.id, f.name, f.size, f.file_type, f.created_at
  FROM files f
  JOIN clients c ON c.id = f.client_id
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
    AND f.shared_with_client = true
  ORDER BY f.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.portal_list_invoices(p_token text)
RETURNS TABLE (id uuid, invoice_number text, invoice_date date, status text, total numeric, amount_paid numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT i.id, i.invoice_number, i.invoice_date, i.status, i.total, i.amount_paid
  FROM invoices i
  JOIN clients c ON c.id = i.client_id
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
  ORDER BY i.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.portal_get_file(p_token text, p_file_id uuid)
RETURNS TABLE (id uuid, name text, url text, file_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT f.id, f.name, f.url, f.file_type
  FROM files f
  JOIN clients c ON c.id = f.client_id
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
    AND f.id = p_file_id
    AND f.shared_with_client = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.portal_get_payable_invoice(p_token text, p_invoice_id uuid)
RETURNS TABLE (id uuid, tenant_id uuid, client_id uuid, invoice_number text, status text, total numeric, amount_paid numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT i.id, i.tenant_id, i.client_id, i.invoice_number, i.status, i.total, i.amount_paid
  FROM invoices i
  JOIN clients c ON c.id = i.client_id
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
    AND i.id = p_invoice_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.portal_get_payment(p_token text, p_payment_id uuid)
RETURNS TABLE (
  id uuid, status text, amount numeric, paid_at timestamptz, created_at timestamptz,
  error_message text, invoice_number text, invoice_status text, invoice_total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT p.id, p.status, p.amount, p.paid_at, p.created_at, p.error_message,
         i.invoice_number, i.status AS invoice_status, i.total AS invoice_total
  FROM payments p
  JOIN clients c ON c.id = p.client_id
  JOIN invoices i ON i.id = p.invoice_id
  WHERE p_token IS NOT NULL
    AND length(p_token) >= 16
    AND c.token = p_token
    AND c.is_active
    AND p.id = p_payment_id
  LIMIT 1;
$$;
