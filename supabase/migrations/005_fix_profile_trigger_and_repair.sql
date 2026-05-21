-- FIX: profile auto-creation + tenant_id data repair
-- Run in Supabase SQL Editor.
--
-- Problem 1: New auth users never received a `profiles` row — there was no
--            trigger on auth.users. Without a profile, tenant setup never ran,
--            so dashboards got stuck and data was tagged with a fallback id.
-- Problem 2: Some clients/files/services rows had tenant_id set to a user_id
--            instead of the real tenant id, so they were invisible to the tenant.

-- ── 1. Auto-create a profile when a new auth user signs up ──
-- Inserting with tenant_id NULL fires the existing on_profile_created trigger,
-- which creates the tenant + tenant_member.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ── 2. Backfill: create profiles for existing auth users without one ──
INSERT INTO public.profiles (id, full_name)
SELECT u.id, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ── 3. Repair rows whose tenant_id was wrongly set to a user_id ──
UPDATE clients  c SET tenant_id = t.id FROM tenants t
  WHERE c.tenant_id = t.owner_id AND c.tenant_id <> t.id;
UPDATE files    f SET tenant_id = t.id FROM tenants t
  WHERE f.tenant_id = t.owner_id AND f.tenant_id <> t.id;
UPDATE services s SET tenant_id = t.id FROM tenants t
  WHERE s.tenant_id = t.owner_id AND s.tenant_id <> t.id;
