-- RLS ENABLE + POLICIES
-- Row Level Security'yi tüm tablolarda aktif et ve tenant bazlı politikaları tanımla.
-- Run in Supabase SQL Editor.

-- 1. YARDIMCI FONKSİYON: mevcut kullanıcının tenant_id'sini döndürür
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$;

-- 2. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_insert ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_delete ON profiles;

CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid() OR tenant_id = auth_tenant_id());

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY profiles_delete ON profiles
  FOR DELETE USING (id = auth.uid());

-- 3. TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select ON tenants;
DROP POLICY IF EXISTS tenants_insert ON tenants;
DROP POLICY IF EXISTS tenants_update ON tenants;
DROP POLICY IF EXISTS tenants_delete ON tenants;

CREATE POLICY tenants_select ON tenants
  FOR SELECT USING (id = auth_tenant_id());

CREATE POLICY tenants_insert ON tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY tenants_update ON tenants
  FOR UPDATE USING (id = auth_tenant_id());

CREATE POLICY tenants_delete ON tenants
  FOR DELETE USING (id = auth_tenant_id() AND owner_id = auth.uid());

-- 4. TENANT MEMBERS
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_members_select ON tenant_members;
DROP POLICY IF EXISTS tenant_members_insert ON tenant_members;
DROP POLICY IF EXISTS tenant_members_update ON tenant_members;
DROP POLICY IF EXISTS tenant_members_delete ON tenant_members;

CREATE POLICY tenant_members_select ON tenant_members
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_members_insert ON tenant_members
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY tenant_members_update ON tenant_members
  FOR UPDATE USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_members_delete ON tenant_members
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 5. TEAM INVITATIONS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_invitations_select ON team_invitations;
DROP POLICY IF EXISTS team_invitations_insert ON team_invitations;
DROP POLICY IF EXISTS team_invitations_update ON team_invitations;
DROP POLICY IF EXISTS team_invitations_delete ON team_invitations;

CREATE POLICY team_invitations_select ON team_invitations
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY team_invitations_insert ON team_invitations
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY team_invitations_update ON team_invitations
  FOR UPDATE USING (tenant_id = auth_tenant_id());

CREATE POLICY team_invitations_delete ON team_invitations
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 6. CLIENTS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select ON clients;
DROP POLICY IF EXISTS clients_insert ON clients;
DROP POLICY IF EXISTS clients_update ON clients;
DROP POLICY IF EXISTS clients_delete ON clients;

CREATE POLICY clients_select ON clients
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY clients_insert ON clients
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY clients_update ON clients
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY clients_delete ON clients
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 7. FILES
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS files_select ON files;
DROP POLICY IF EXISTS files_insert ON files;
DROP POLICY IF EXISTS files_update ON files;
DROP POLICY IF EXISTS files_delete ON files;

CREATE POLICY files_select ON files
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY files_insert ON files
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY files_update ON files
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY files_delete ON files
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 8. SERVICES
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_select ON services;
DROP POLICY IF EXISTS services_insert ON services;
DROP POLICY IF EXISTS services_update ON services;
DROP POLICY IF EXISTS services_delete ON services;

CREATE POLICY services_select ON services
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY services_insert ON services
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY services_update ON services
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY services_delete ON services
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 9. INVOICE NUMBER SEQUENCES
ALTER TABLE invoice_number_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_number_sequences_select ON invoice_number_sequences;
DROP POLICY IF EXISTS invoice_number_sequences_insert ON invoice_number_sequences;
DROP POLICY IF EXISTS invoice_number_sequences_update ON invoice_number_sequences;
DROP POLICY IF EXISTS invoice_number_sequences_delete ON invoice_number_sequences;

CREATE POLICY invoice_number_sequences_select ON invoice_number_sequences
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY invoice_number_sequences_insert ON invoice_number_sequences
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY invoice_number_sequences_update ON invoice_number_sequences
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY invoice_number_sequences_delete ON invoice_number_sequences
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 10. EINVOICE NUMBER SEQUENCES
ALTER TABLE einvoice_number_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS einvoice_number_sequences_select ON einvoice_number_sequences;
DROP POLICY IF EXISTS einvoice_number_sequences_insert ON einvoice_number_sequences;
DROP POLICY IF EXISTS einvoice_number_sequences_update ON einvoice_number_sequences;
DROP POLICY IF EXISTS einvoice_number_sequences_delete ON einvoice_number_sequences;

CREATE POLICY einvoice_number_sequences_select ON einvoice_number_sequences
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY einvoice_number_sequences_insert ON einvoice_number_sequences
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY einvoice_number_sequences_update ON einvoice_number_sequences
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY einvoice_number_sequences_delete ON einvoice_number_sequences
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 11. INVOICES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select ON invoices;
DROP POLICY IF EXISTS invoices_insert ON invoices;
DROP POLICY IF EXISTS invoices_update ON invoices;
DROP POLICY IF EXISTS invoices_delete ON invoices;

CREATE POLICY invoices_select ON invoices
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY invoices_insert ON invoices
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY invoices_update ON invoices
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY invoices_delete ON invoices
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 12. INVOICE ITEMS (tenant_id yok; üst faturadan türet)
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_items_select ON invoice_items;
DROP POLICY IF EXISTS invoice_items_insert ON invoice_items;
DROP POLICY IF EXISTS invoice_items_update ON invoice_items;
DROP POLICY IF EXISTS invoice_items_delete ON invoice_items;

CREATE POLICY invoice_items_select ON invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = auth_tenant_id())
  );

CREATE POLICY invoice_items_insert ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = auth_tenant_id())
  );

CREATE POLICY invoice_items_update ON invoice_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = auth_tenant_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = auth_tenant_id())
  );

CREATE POLICY invoice_items_delete ON invoice_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = auth_tenant_id())
  );

-- 13. EINVOICE DOCUMENTS
ALTER TABLE einvoice_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS einvoice_documents_select ON einvoice_documents;
DROP POLICY IF EXISTS einvoice_documents_insert ON einvoice_documents;
DROP POLICY IF EXISTS einvoice_documents_update ON einvoice_documents;
DROP POLICY IF EXISTS einvoice_documents_delete ON einvoice_documents;

CREATE POLICY einvoice_documents_select ON einvoice_documents
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY einvoice_documents_insert ON einvoice_documents
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY einvoice_documents_update ON einvoice_documents
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY einvoice_documents_delete ON einvoice_documents
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 14. PAYMENTS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select ON payments;
DROP POLICY IF EXISTS payments_insert ON payments;
DROP POLICY IF EXISTS payments_update ON payments;
DROP POLICY IF EXISTS payments_delete ON payments;

CREATE POLICY payments_select ON payments
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY payments_insert ON payments
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY payments_update ON payments
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY payments_delete ON payments
  FOR DELETE USING (tenant_id = auth_tenant_id());

-- 15. AUTO-CREATE TENANT TRIGGER — anon session'dan çalıştığı için RLS bypass needed
-- handle_new_user trigger zaten SECURITY DEFINER olarak çalışır, RLS'i bypass eder.
-- Ek bir değişiklik gerekmez.
