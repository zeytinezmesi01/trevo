-- BACKFILL EXISTING DATA
-- Run AFTER 002_tenant_system.sql is executed
-- Creates a tenant for every existing user and links their data

-- 1. Create tenants for existing profiles that don't have one yet
INSERT INTO tenants (id, name, owner_id)
SELECT gen_random_uuid(), COALESCE(NULLIF(company_name, ''), NULLIF(full_name, ''), 'İşletmem'), id
FROM profiles
WHERE tenant_id IS NULL;

-- 2. Link profiles to their tenant
UPDATE profiles p
SET tenant_id = t.id, role = 'owner'
FROM tenants t
WHERE t.owner_id = p.id AND p.tenant_id IS NULL;

-- 3. Backfill tenant_id on clients
UPDATE clients c
SET tenant_id = (SELECT p.tenant_id FROM profiles p WHERE p.id = c.user_id)
WHERE tenant_id IS NULL;

-- 4. Backfill tenant_id on files
UPDATE files f
SET tenant_id = (SELECT p.tenant_id FROM profiles p WHERE p.id = f.user_id)
WHERE tenant_id IS NULL;

-- 5. Backfill tenant_id on services
UPDATE services s
SET tenant_id = (SELECT p.tenant_id FROM profiles p WHERE p.id = s.user_id)
WHERE tenant_id IS NULL;

-- 7. Add owner as tenant_member
INSERT INTO tenant_members (tenant_id, user_id, role, status, joined_at)
SELECT t.id, t.owner_id, 'owner', 'active', now()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_members tm
  WHERE tm.tenant_id = t.id AND tm.user_id = t.owner_id
);

-- 8. Set NOT NULL constraint on tenant_id columns (after backfill)
-- Skip if already set or if there are rows with null (shouldn't be at this point)
DO $$
BEGIN
  ALTER TABLE clients ALTER COLUMN tenant_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'clients.tenant_id might still have nulls';
END $$;

DO $$
BEGIN
  ALTER TABLE files ALTER COLUMN tenant_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'files.tenant_id might still have nulls';
END $$;

DO $$
BEGIN
  ALTER TABLE services ALTER COLUMN tenant_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'services.tenant_id might still have nulls';
END $$;
