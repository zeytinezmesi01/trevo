-- SECURITY FIXES MIGRATION
-- Apply AFTER all previous migrations
-- Run in Supabase SQL Editor

-- ============================================================
-- A-1: apply_payment_success — atomik ödeme işleme (TOCTOU fix)
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_payment_success(
  p_payment_id UUID,
  p_paid_price NUMERIC
) RETURNS TABLE(applied BOOLEAN, current_status TEXT)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
  v_tenant_id UUID;
  v_amount NUMERIC(12,2);
  v_old_paid NUMERIC(12,2);
  v_new_paid NUMERIC(12,2);
  v_total NUMERIC(12,2);
  v_old_status TEXT;
BEGIN
  -- Atomik kontrol ve güncelleme: SADECE 'pending' ise güncelle
  UPDATE payments
  SET status = 'success',
      updated_at = now()
  FROM invoices
  WHERE payments.invoice_id = invoices.id
    AND payments.id = p_payment_id
    AND payments.status = 'pending'
  RETURNING payments.invoice_id, payments.tenant_id, payments.amount,
            invoices.amount_paid, invoices.total
  INTO v_invoice_id, v_tenant_id, v_amount, v_old_paid, v_total;

  IF NOT FOUND THEN
    -- Already processed or not found — check current status
    SELECT status INTO v_old_status FROM payments WHERE id = p_payment_id;
    RETURN QUERY SELECT false, COALESCE(v_old_status, 'not_found');
    RETURN;
  END IF;

  -- SADECE gerçekten güncellediyse invoice'u güncelle
  v_new_paid := COALESCE(v_old_paid, 0) + p_paid_price;

  IF v_new_paid >= COALESCE(v_total, 0) THEN
    UPDATE invoices
    SET amount_paid = v_new_paid,
        status = 'paid',
        paid_at = now(),
        updated_at = now()
    WHERE id = v_invoice_id;
  ELSE
    UPDATE invoices
    SET amount_paid = v_new_paid,
        updated_at = now()
    WHERE id = v_invoice_id;
  END IF;

  RETURN QUERY SELECT true, 'success';
END;
$$;

-- ============================================================
-- B-1: RLS politikaları — tenant_members ve team_invitations
--      INSERT/UPDATE/DELETE için rol kontrolü
-- ============================================================

-- tenant_members
DROP POLICY IF EXISTS tenant_members_insert ON tenant_members;
DROP POLICY IF EXISTS tenant_members_update ON tenant_members;
DROP POLICY IF EXISTS tenant_members_delete ON tenant_members;

CREATE POLICY tenant_members_insert ON tenant_members
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY tenant_members_update ON tenant_members
  FOR UPDATE USING (tenant_id = auth_tenant_id())
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY tenant_members_delete ON tenant_members
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

-- team_invitations
DROP POLICY IF EXISTS team_invitations_insert ON team_invitations;
DROP POLICY IF EXISTS team_invitations_update ON team_invitations;
DROP POLICY IF EXISTS team_invitations_delete ON team_invitations;

CREATE POLICY team_invitations_insert ON team_invitations
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY team_invitations_update ON team_invitations
  FOR UPDATE USING (tenant_id = auth_tenant_id())
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY team_invitations_delete ON team_invitations
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

-- api_keys için de rol kontrolü ekle (sadece owner/admin oluşturabilir/silebilir)
DROP POLICY IF EXISTS api_keys_insert ON api_keys;
DROP POLICY IF EXISTS api_keys_update ON api_keys;
DROP POLICY IF EXISTS api_keys_delete ON api_keys;

CREATE POLICY api_keys_insert ON api_keys
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY api_keys_update ON api_keys
  FOR UPDATE USING (tenant_id = auth_tenant_id())
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY api_keys_delete ON api_keys
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

-- webhook_endpoints için de rol kontrolü ekle
DROP POLICY IF EXISTS webhook_endpoints_insert ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_update ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_delete ON webhook_endpoints;

CREATE POLICY webhook_endpoints_insert ON webhook_endpoints
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY webhook_endpoints_update ON webhook_endpoints
  FOR UPDATE USING (tenant_id = auth_tenant_id())
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

CREATE POLICY webhook_endpoints_delete ON webhook_endpoints
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner','admin')
  );

-- ============================================================
-- B-2: SECURITY DEFINER fonksiyonlara SET search_path = public
-- ============================================================

-- auth_tenant_id
CREATE OR REPLACE FUNCTION public.auth_tenant_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$;

-- handle_new_user (000_clean_schema'dan)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, owner_id)
  VALUES (COALESCE(NEW.full_name, NEW.id::text, 'İşletmem'), NEW.id)
  RETURNING id INTO v_tenant_id;

  UPDATE public.profiles SET tenant_id = v_tenant_id, role = 'owner' WHERE id = NEW.id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, status, joined_at)
  VALUES (v_tenant_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- handle_new_auth_user (005_fix_profile_trigger'dan)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- next_invoice_number (008_invoice_sequence_rpc)
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_tenant_id UUID)
RETURNS TABLE(seq_prefix TEXT, seq_year INT, seq_number INT)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
  seq_prefix TEXT;
  seq_year INT;
  seq_number INT;
BEGIN
  INSERT INTO invoice_number_sequences (tenant_id, prefix, year, last_number)
  VALUES (p_tenant_id, 'TRV', current_year, 1)
  ON CONFLICT (tenant_id) DO UPDATE SET
    year        = CASE WHEN invoice_number_sequences.year = current_year
                       THEN invoice_number_sequences.year
                       ELSE current_year END,
    last_number = CASE WHEN invoice_number_sequences.year = current_year
                       THEN invoice_number_sequences.last_number + 1
                       ELSE 1 END
  WHERE invoice_number_sequences.tenant_id = p_tenant_id
  RETURNING invoice_number_sequences.prefix,
            invoice_number_sequences.year,
            invoice_number_sequences.last_number
  INTO seq_prefix, seq_year, seq_number;

  IF NOT FOUND THEN
    seq_prefix := 'TRV';
    seq_year   := current_year;
    seq_number := 1;
  END IF;

  RETURN NEXT;
END;
$$;

-- next_einvoice_number (009_einvoice_sequence_rpc)
CREATE OR REPLACE FUNCTION public.next_einvoice_number(p_tenant_id UUID)
RETURNS TABLE(seq_year INT, seq_number INT)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
  seq_year INT;
  seq_number INT;
BEGIN
  INSERT INTO einvoice_number_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, current_year, 1)
  ON CONFLICT (tenant_id) DO UPDATE SET
    year        = CASE WHEN einvoice_number_sequences.year = current_year
                       THEN einvoice_number_sequences.year
                       ELSE current_year END,
    last_number = CASE WHEN einvoice_number_sequences.year = current_year
                       THEN einvoice_number_sequences.last_number + 1
                       ELSE 1 END
  WHERE einvoice_number_sequences.tenant_id = p_tenant_id
  RETURNING einvoice_number_sequences.year,
            einvoice_number_sequences.last_number
  INTO seq_year, seq_number;

  IF NOT FOUND THEN
    seq_year   := current_year;
    seq_number := 1;
  END IF;

  RETURN NEXT;
END;
$$;

-- ============================================================
-- B-3: profiles'taki ölü iyzico sütunlarını kaldır
-- ============================================================
ALTER TABLE profiles DROP COLUMN IF EXISTS iyzico_api_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS iyzico_secret_key;

-- ============================================================
-- B-4: clients, files, services — NULL tenant_id temizliği + NOT NULL
-- ============================================================

-- NULL satırları raporla/temizle (owner_id üzerinden dene)
UPDATE clients c
SET tenant_id = t.id
FROM tenants t
WHERE c.tenant_id IS NULL
  AND t.owner_id = c.user_id;

DELETE FROM clients WHERE tenant_id IS NULL;

-- Şimdi NOT NULL ekle
ALTER TABLE clients ALTER COLUMN tenant_id SET NOT NULL;

-- files
UPDATE files f
SET tenant_id = t.id
FROM tenants t
WHERE f.tenant_id IS NULL
  AND t.owner_id = f.user_id;

DELETE FROM files WHERE tenant_id IS NULL;

ALTER TABLE files ALTER COLUMN tenant_id SET NOT NULL;

-- services
UPDATE services s
SET tenant_id = t.id
FROM tenants t
WHERE s.tenant_id IS NULL
  AND t.owner_id = s.user_id;

DELETE FROM services WHERE tenant_id IS NULL;

ALTER TABLE services ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================
-- D-3: api_keys tablosuna role sütunu ekle
-- ============================================================
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('owner','admin','member','viewer'));

-- Mevcut anahtarların rolünü oluşturan kullanıcıya göre belirle
UPDATE api_keys ak
SET role = COALESCE(
  (SELECT p.role FROM profiles p WHERE p.id = ak.created_by),
  'admin'
)
WHERE ak.role = 'member' AND ak.created_by IS NOT NULL;

-- ============================================================
-- G-5: einvoice concurrency — invoice başına en fazla bir
--      başarılı/pending e-belge kaydı
-- ============================================================
-- Mevcut duplicate varsa temizle
DELETE FROM einvoice_documents
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY invoice_id
      ORDER BY created_at DESC
    ) AS rn
    FROM einvoice_documents
  ) t WHERE t.rn > 1
);

-- Aynı fatura için sadece bir pending/sent/accepted kaydına izin ver
-- (error ve rejected durumlarında yeniden gönderime izin ver)
CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoice_single_active
  ON einvoice_documents(invoice_id)
  WHERE status IN ('pending', 'queued', 'sent', 'accepted');
