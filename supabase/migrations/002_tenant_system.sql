-- TENANT SYSTEM MIGRATION
-- Run in Supabase SQL Editor

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);

-- 2. Create tenant_members table
CREATE TABLE IF NOT EXISTS tenant_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at   TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)
);

-- 3. Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- 4. Add tenant_id and role to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- 5. Add tenant_id to existing tables
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 6. Add tax/billing fields to clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tax_office TEXT,
  ADD COLUMN IF NOT EXISTS tax_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'vergi_no',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Türkiye',
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 7. Add company tax info to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_tax_office TEXT,
  ADD COLUMN IF NOT EXISTS company_tax_number TEXT,
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_city TEXT,
  ADD COLUMN IF NOT EXISTS company_phone TEXT,
  ADD COLUMN IF NOT EXISTS company_bank_iban TEXT;
