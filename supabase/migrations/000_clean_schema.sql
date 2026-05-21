-- CLEAN SLATE MIGRATION
-- Supabase SQL Editor'da çalıştır: https://supabase.com/dashboard/project/zqgxbhnoaqmzjknojdqq/sql/new
-- Bu script TÜM tabloları silip sıfırdan oluşturur.

-- 1. DROP ALL EXISTING TABLES (sıralama önemli — FK'ler nedeniyle)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_number_sequences CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS tenant_members CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 2. PROFILES (ana kullanıcı tablosu)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  company_name    TEXT,
  role            TEXT DEFAULT 'owner',
  tenant_id       UUID,
  -- brand white-label
  brand_name      TEXT,
  brand_logo_url  TEXT,
  brand_primary_color TEXT,
  brand_domain    TEXT,
  -- company legal info
  company_tax_office  TEXT,
  company_tax_number  TEXT,
  company_address     TEXT,
  company_city        TEXT,
  company_phone       TEXT,
  company_bank_iban   TEXT,
  -- payment (güvenlik notu: production'da şifreli saklanmalı)
  iyzico_api_key     TEXT,
  iyzico_secret_key  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. TENANTS
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_tenants_owner ON tenants(owner_id);

-- profiles.tenant_id -> tenants FK
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- 4. TENANT MEMBERS
CREATE TABLE tenant_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  invited_at  TIMESTAMPTZ DEFAULT now(),
  joined_at   TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)
);

-- 5. TEAM INVITATIONS
CREATE TABLE team_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  expires_at  TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- 6. CLIENTS
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  user_id     UUID REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  company     TEXT,
  email       TEXT,
  phone       TEXT,
  token       TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  tax_office  TEXT,
  tax_number  TEXT,
  tax_type    TEXT DEFAULT 'vergi_no',
  address     TEXT,
  city        TEXT,
  country     TEXT DEFAULT 'Türkiye',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_token ON clients(token);

-- 7. FILES
CREATE TABLE files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  user_id     UUID REFERENCES auth.users(id),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  size        TEXT,
  file_type   TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_files_tenant ON files(tenant_id);
CREATE INDEX idx_files_client ON files(client_id);

-- 8. SERVICES
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  user_id     UUID REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  price       DECIMAL(12,2),
  delivery    TEXT,
  description TEXT,
  status      TEXT DEFAULT 'Aktif',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_services_tenant ON services(tenant_id);

-- 9. INVOICE NUMBER SEQUENCES
CREATE TABLE invoice_number_sequences (
  tenant_id   UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  prefix      TEXT DEFAULT 'TRV',
  year        INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  last_number INT DEFAULT 0
);

-- 10. INVOICES (Türk formatı)
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  invoice_number  TEXT NOT NULL,
  invoice_date    DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  currency        TEXT DEFAULT 'TRY',
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes           TEXT,
  -- frozen client info
  client_name     TEXT NOT NULL,
  client_company  TEXT,
  client_email    TEXT,
  client_tax_office   TEXT,
  client_tax_number   TEXT,
  client_address      TEXT,
  client_city         TEXT,
  client_country      TEXT DEFAULT 'Türkiye',
  -- financials
  subtotal        DECIMAL(12,2) DEFAULT 0,
  kdv_rate        DECIMAL(5,2) DEFAULT 20.00,
  kdv_amount      DECIMAL(12,2) DEFAULT 0,
  tevkifat_rate   DECIMAL(5,2) DEFAULT 0,
  tevkifat_amount DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) DEFAULT 0,
  amount_paid     DECIMAL(12,2) DEFAULT 0,
  -- pdf
  pdf_url         TEXT,
  pdf_generated_at TIMESTAMPTZ,
  -- client request
  requested_by_client BOOLEAN DEFAULT false,
  request_note    TEXT,
  -- delivery
  emailed_at      TIMESTAMPTZ,
  email_to        TEXT,
  -- flags
  vat_exempt      BOOLEAN DEFAULT false,
  withholding_tax BOOLEAN DEFAULT false,
  e_archive       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);

-- 11. INVOICE ITEMS
CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    DECIMAL(10,3) DEFAULT 1,
  unit        TEXT DEFAULT 'adet',
  unit_price  DECIMAL(12,2) NOT NULL,
  kdv_rate    DECIMAL(5,2) DEFAULT 20.00,
  kdv_amount  DECIMAL(12,2) DEFAULT 0,
  line_total  DECIMAL(12,2) DEFAULT 0,
  sort_order  INT DEFAULT 0
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 12. BRAND DOMAIN UNIQUE INDEX
CREATE UNIQUE INDEX idx_profiles_brand_domain ON profiles(brand_domain) WHERE brand_domain IS NOT NULL;

-- 13. AUTO-CREATE TENANT TRIGGER (yeni kullanıcı kaydolunca otomatik tenant oluşur)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, owner_id)
  VALUES (COALESCE(NEW.full_name, NEW.id::text, 'İşletmem'), NEW.id)
  RETURNING id INTO v_tenant_id;

  -- Link profile to tenant
  UPDATE profiles SET tenant_id = v_tenant_id, role = 'owner' WHERE id = NEW.id;

  -- Add as tenant member
  INSERT INTO tenant_members (tenant_id, user_id, role, status, joined_at)
  VALUES (v_tenant_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sadece INSERT'te çalışır, tenant_id NULL ise
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.tenant_id IS NULL)
  EXECUTE FUNCTION handle_new_user();

-- 14. EXISTING USERS: Create tenants for profiles without one
INSERT INTO tenants (name, owner_id)
SELECT COALESCE(NULLIF(company_name, ''), NULLIF(full_name, ''), 'İşletmem'), id
FROM profiles WHERE tenant_id IS NULL;

UPDATE profiles p SET tenant_id = t.id, role = 'owner'
FROM tenants t WHERE t.owner_id = p.id AND p.tenant_id IS NULL;

INSERT INTO tenant_members (tenant_id, user_id, role, status, joined_at)
SELECT t.id, t.owner_id, 'owner', 'active', now()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_members tm WHERE tm.tenant_id = t.id AND tm.user_id = t.owner_id
);
