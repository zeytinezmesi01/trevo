-- K-3: Müşteri portalı veri erişimini token-scoped SECURITY DEFINER RPC'lere taşı.
--
-- Sorun: Portal sayfaları + ilgili API uçları `createAdminClient()` (service_role,
-- RLS bypass) kullanıyordu; güvenlik tamamen uygulama kodundaki `.eq('client_id', ...)`
-- filtrelerine bağlıydı. İleride bir sorguda filtre unutulursa tüm tenant verisi sızabilir.
--
-- Çözüm: Aşağıdaki RPC'ler token'ı argüman alır ve client_id scoping'ini SQL gövdesinde
-- SABİTLER. Uygulama kodu yanlış filtre geçemez; sınır artık veritabanında.
--
-- Hepsi:
--   * SECURITY DEFINER + sabit search_path (search_path injection'a kapalı)
--   * Yalnızca service_role'a GRANT (anon/authenticated PostgREST'ten çağıramaz)
--   * Token uzunluk guard'ı (boş/kısa token hiçbir satır döndürmez)
--   * CREATE OR REPLACE — idempotent, tekrar çalıştırılabilir

-- 1) Token'dan client çöz — portal + ödeme buyer bilgisi için client'ın KENDİ alanları
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
  LIMIT 1;
$$;

-- 2) Portal'da listelenecek dosyalar — yalnızca paylaşılmış olanlar, URL döndürmez
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
    AND f.shared_with_client = true
  ORDER BY f.created_at DESC;
$$;

-- 3) Portal'da listelenecek faturalar
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
  ORDER BY i.created_at DESC;
$$;

-- 4) Tek dosya indirme — yalnızca token'ın client'ına AİT ve PAYLAŞILMIŞ ise döner (URL dahil)
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
    AND f.id = p_file_id
    AND f.shared_with_client = true
  LIMIT 1;
$$;

-- 5) Ödenebilir fatura — ödeme başlatma için, yalnızca token'ın client'ına ait fatura
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
    AND i.id = p_invoice_id
  LIMIT 1;
$$;

-- 6) Ödeme sonucu — yalnızca token'ın client'ına ait payment + ilgili fatura özeti
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
    AND p.id = p_payment_id
  LIMIT 1;
$$;

-- Yetkiler: yalnızca service_role (sunucu admin client) çağırabilir.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN
    SELECT unnest(ARRAY[
      'portal_get_client(text)',
      'portal_list_files(text)',
      'portal_list_invoices(text)',
      'portal_get_file(text, uuid)',
      'portal_get_payable_invoice(text, uuid)',
      'portal_get_payment(text, uuid)'
    ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated;', fn);
    EXECUTE format('GRANT  EXECUTE ON FUNCTION public.%s TO service_role;', fn);
  END LOOP;
END $$;
