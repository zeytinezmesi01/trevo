-- Registration keys: isletme sahibi ekip uyeleri icin tek kullanimlik kayit anahtari uretir
CREATE TABLE registration_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
  key         TEXT NOT NULL UNIQUE,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index: tenant'in kendi key'lerini hizli sorgulamak icin
CREATE INDEX idx_registration_keys_tenant ON registration_keys(tenant_id);
-- Index: key ile hizli arama (validate endpoint)
CREATE INDEX idx_registration_keys_key ON registration_keys(key);

ALTER TABLE registration_keys ENABLE ROW LEVEL SECURITY;

-- Tenant uyeleri kendi tenant'inin key'lerini gorebilir
CREATE POLICY reg_keys_select ON registration_keys FOR SELECT
  USING (tenant_id = auth_tenant_id());

-- Sadece owner key uretebilir
CREATE POLICY reg_keys_insert ON registration_keys FOR INSERT
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner'
  );

-- Sadece owner key silebilir
CREATE POLICY reg_keys_delete ON registration_keys FOR DELETE
  USING (
    tenant_id = auth_tenant_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner'
  );
