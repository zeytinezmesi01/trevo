-- 035: Rol bazlı menü yetki özelleştirme (Anayetkili)
--
-- Owner, her rol için (admin/member/viewer) hangi dashboard menülerinin
-- görüneceğini özelleştirebilir. Satır yoksa koddaki varsayılan (minRole)
-- geçerlidir; satır varsa enabled değeri kazanır.
--
-- Not: Bu tablo yalnızca MENÜ GÖRÜNÜRLÜĞÜNÜ belirler. Asıl yetkilendirme
-- API route'larında (lib/tenant/permissions.ts) ve RLS'te kalır.

CREATE TABLE IF NOT EXISTS role_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('admin','member','viewer')),
  menu_key   TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, role, menu_key)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant ON role_permissions(tenant_id);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Tenant üyeleri okuyabilir (sidebar görünürlüğü için)
DROP POLICY IF EXISTS role_permissions_select ON role_permissions;
CREATE POLICY role_permissions_select ON role_permissions
  FOR SELECT USING (tenant_id = (select auth_tenant_id()));

-- Yalnızca owner yazabilir
DROP POLICY IF EXISTS role_permissions_insert ON role_permissions;
CREATE POLICY role_permissions_insert ON role_permissions
  FOR INSERT WITH CHECK (
    tenant_id = (select auth_tenant_id())
    AND (select auth_tenant_role()) = 'owner'
  );

DROP POLICY IF EXISTS role_permissions_update ON role_permissions;
CREATE POLICY role_permissions_update ON role_permissions
  FOR UPDATE USING (
    tenant_id = (select auth_tenant_id())
    AND (select auth_tenant_role()) = 'owner'
  ) WITH CHECK (
    tenant_id = (select auth_tenant_id())
    AND (select auth_tenant_role()) = 'owner'
  );

DROP POLICY IF EXISTS role_permissions_delete ON role_permissions;
CREATE POLICY role_permissions_delete ON role_permissions
  FOR DELETE USING (
    tenant_id = (select auth_tenant_id())
    AND (select auth_tenant_role()) = 'owner'
  );
