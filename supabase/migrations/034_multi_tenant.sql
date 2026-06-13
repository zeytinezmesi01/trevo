-- 034: Çoklu tenant desteği
--
-- Sorun: 1 kullanıcı = 1 tenant. Tenant bağlantısı profiles.tenant_id'de tutuluyordu;
-- kendi ajansı olan biri başka bir ajansa üye olduğunda profili yeni tenant'a
-- "taşınıyor" ve eski üyeliği siliniyordu.
--
-- Yeni model:
--   * Üyelik TEK kaynağı: tenant_members (status = 'active')
--   * profiles.active_tenant_id: kullanıcının o an SEÇİLİ tenant'ı (üyelik değil)
--   * auth_tenant_id(): active_tenant_id'yi üyelik doğrulamasıyla döndürür —
--     üyelik silinirse RLS erişimi anında kapanır
--   * Rol artık tenant başına: tenant_members.role (profiles.role kalkar)
--   * profiles.tenant_id ve profiles.role KALDIRILIR

-- ============================================================
-- 1) Yeni kolon + backfill
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE profiles SET active_tenant_id = tenant_id
WHERE active_tenant_id IS NULL AND tenant_id IS NOT NULL;

-- Güvence: eski modelde profiles.tenant_id üyelik sayılıyordu — karşılığı olmayan
-- tenant_members satırlarını oluştur (rol profiles.role'dan taşınır).
INSERT INTO tenant_members (tenant_id, user_id, role, status, joined_at)
SELECT p.tenant_id, p.id, COALESCE(p.role, 'member'), 'active', now()
FROM profiles p
WHERE p.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM tenant_members m
    WHERE m.tenant_id = p.tenant_id AND m.user_id = p.id
  );

-- Üyelik var ama pasif kalmışsa aktive et (eski model erişim veriyordu)
UPDATE tenant_members m SET status = 'active', joined_at = COALESCE(m.joined_at, now())
FROM profiles p
WHERE p.tenant_id = m.tenant_id AND p.id = m.user_id AND m.status <> 'active';

-- ============================================================
-- 2) Trigger: yeni profil → otomatik tenant (active_tenant_id üzerinden)
--    Eski trigger WHEN (NEW.tenant_id IS NULL) kolona bağımlı — önce düşür.
-- ============================================================
DROP TRIGGER IF EXISTS on_profile_created ON profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, owner_id)
  VALUES (COALESCE(NEW.full_name, NEW.id::text, 'İşletmem'), NEW.id)
  RETURNING id INTO v_tenant_id;

  UPDATE public.profiles SET active_tenant_id = v_tenant_id WHERE id = NEW.id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, status, joined_at)
  VALUES (v_tenant_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.active_tenant_id IS NULL)
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3) auth_tenant_id(): aktif tenant, üyelik doğrulamalı.
--    Üyelik tenant_members'tan silinince erişim anında düşer.
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_tenant_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.active_tenant_id
  FROM profiles p
  WHERE p.id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tenant_members m
      WHERE m.tenant_id = p.active_tenant_id
        AND m.user_id = p.id
        AND m.status = 'active'
    )
$$;

-- ============================================================
-- 4) auth_tenant_role(): aktif tenant'taki rol (profiles.role'un yerini alır)
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_tenant_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.role
  FROM tenant_members m
  WHERE m.user_id = auth.uid()
    AND m.tenant_id = public.auth_tenant_id()
    AND m.status = 'active'
$$;

REVOKE EXECUTE ON FUNCTION public.auth_tenant_role() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.auth_tenant_role() TO authenticated;

-- ============================================================
-- 5) Üye olunan tenant id'leri (switcher/RLS yardımcıları)
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_member_tenant_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM tenant_members
  WHERE user_id = auth.uid() AND status = 'active'
$$;

REVOKE EXECUTE ON FUNCTION public.auth_member_tenant_ids() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.auth_member_tenant_ids() TO authenticated;

-- ============================================================
-- 6) profiles.role'a bağımlı politikalar → auth_tenant_role()
-- ============================================================
DROP POLICY IF EXISTS reg_keys_insert ON registration_keys;
DROP POLICY IF EXISTS reg_keys_delete ON registration_keys;

CREATE POLICY reg_keys_insert ON registration_keys
  FOR INSERT WITH CHECK (
    tenant_id = (select auth_tenant_id())
    AND (select auth_tenant_role()) = 'owner'
  );

CREATE POLICY reg_keys_delete ON registration_keys
  FOR DELETE USING (
    tenant_id = (select auth_tenant_id())
    AND (select auth_tenant_role()) = 'owner'
  );

-- ============================================================
-- 7) profiles.tenant_id'ye bağımlı politika: aynı tenant üyeleri birbirinin
--    profilini görebilsin (tenant_members üzerinden)
-- ============================================================
DROP POLICY IF EXISTS profiles_select ON profiles;

CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM tenant_members m
      WHERE m.user_id = profiles.id
        AND m.tenant_id = (select auth_tenant_id())
    )
  );

-- ============================================================
-- 8) Switcher için: kullanıcı KENDİ üyeliklerini ve üye olduğu tenant'ların
--    adlarını görebilmeli (yalnızca aktif tenant değil)
-- ============================================================
DROP POLICY IF EXISTS tenant_members_select ON tenant_members;

CREATE POLICY tenant_members_select ON tenant_members
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR tenant_id = (select auth_tenant_id())
  );

DROP POLICY IF EXISTS tenants_select ON tenants;

CREATE POLICY tenants_select ON tenants
  FOR SELECT USING (id IN (SELECT public.auth_member_tenant_ids()));

-- ============================================================
-- 9) Eski kolonları kaldır — üyelik kaynağı artık yalnızca tenant_members
-- ============================================================
ALTER TABLE profiles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
