-- CL-O2: RLS initplan performans optimizasyonu
-- auth.uid() ve auth_tenant_id() her satır için yeniden değerlendirilir (initplan sorunu).
-- (select auth.uid()) yazımı PostgreSQL'e bu değerin sorgu başına 1 kez
-- hesaplanıp cache'leneceğini söyler; büyük tablolarda önemli sorgu hızlanması sağlar.
-- Supabase advisor: lint=0003_auth_rls_initplan (24 politika etkilenmiş)

-- 1. PROFILES
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_insert ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_delete ON profiles;

CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = (select auth.uid()) OR tenant_id = (select auth_tenant_id()));

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

CREATE POLICY profiles_delete ON profiles
  FOR DELETE USING (id = (select auth.uid()));

-- 2. TENANTS (insert auth.role() güvenli, delete auth.uid() düzelt)
DROP POLICY IF EXISTS tenants_insert ON tenants;
DROP POLICY IF EXISTS tenants_delete ON tenants;

CREATE POLICY tenants_insert ON tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY tenants_delete ON tenants
  FOR DELETE USING (id = (select auth_tenant_id()) AND owner_id = (select auth.uid()));

-- 3. TENANT MEMBERS
DROP POLICY IF EXISTS tenant_members_insert ON tenant_members;
DROP POLICY IF EXISTS tenant_members_update ON tenant_members;
DROP POLICY IF EXISTS tenant_members_delete ON tenant_members;

CREATE POLICY tenant_members_insert ON tenant_members
  FOR INSERT WITH CHECK (tenant_id = (select auth_tenant_id()));

CREATE POLICY tenant_members_update ON tenant_members
  FOR UPDATE USING (tenant_id = (select auth_tenant_id()));

CREATE POLICY tenant_members_delete ON tenant_members
  FOR DELETE USING (tenant_id = (select auth_tenant_id()));

-- 4. TEAM INVITATIONS
DROP POLICY IF EXISTS team_invitations_insert ON team_invitations;
DROP POLICY IF EXISTS team_invitations_update ON team_invitations;
DROP POLICY IF EXISTS team_invitations_delete ON team_invitations;

CREATE POLICY team_invitations_insert ON team_invitations
  FOR INSERT WITH CHECK (tenant_id = (select auth_tenant_id()));

CREATE POLICY team_invitations_update ON team_invitations
  FOR UPDATE USING (tenant_id = (select auth_tenant_id()));

CREATE POLICY team_invitations_delete ON team_invitations
  FOR DELETE USING (tenant_id = (select auth_tenant_id()));

-- 5. API KEYS
DROP POLICY IF EXISTS api_keys_insert ON api_keys;
DROP POLICY IF EXISTS api_keys_update ON api_keys;
DROP POLICY IF EXISTS api_keys_delete ON api_keys;

CREATE POLICY api_keys_insert ON api_keys
  FOR INSERT WITH CHECK (tenant_id = (select auth_tenant_id()));

CREATE POLICY api_keys_update ON api_keys
  FOR UPDATE USING (tenant_id = (select auth_tenant_id()))
  WITH CHECK (tenant_id = (select auth_tenant_id()));

CREATE POLICY api_keys_delete ON api_keys
  FOR DELETE USING (tenant_id = (select auth_tenant_id()));

-- 6. WEBHOOK ENDPOINTS
DROP POLICY IF EXISTS webhook_endpoints_insert ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_update ON webhook_endpoints;
DROP POLICY IF EXISTS webhook_endpoints_delete ON webhook_endpoints;

CREATE POLICY webhook_endpoints_insert ON webhook_endpoints
  FOR INSERT WITH CHECK (tenant_id = (select auth_tenant_id()));

CREATE POLICY webhook_endpoints_update ON webhook_endpoints
  FOR UPDATE USING (tenant_id = (select auth_tenant_id()))
  WITH CHECK (tenant_id = (select auth_tenant_id()));

CREATE POLICY webhook_endpoints_delete ON webhook_endpoints
  FOR DELETE USING (tenant_id = (select auth_tenant_id()));

-- 7. REGISTRATION KEYS
DROP POLICY IF EXISTS reg_keys_insert ON registration_keys;
DROP POLICY IF EXISTS reg_keys_delete ON registration_keys;

CREATE POLICY reg_keys_insert ON registration_keys
  FOR INSERT WITH CHECK (
    tenant_id = (select auth_tenant_id())
    AND (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'owner'
  );

CREATE POLICY reg_keys_delete ON registration_keys
  FOR DELETE USING (
    tenant_id = (select auth_tenant_id())
    AND (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'owner'
  );

-- 8. CHAT MESSAGES (021 + 022)
DROP POLICY IF EXISTS chat_insert ON chat_messages;
DROP POLICY IF EXISTS chat_delete ON chat_messages;
DROP POLICY IF EXISTS chat_update ON chat_messages;

CREATE POLICY chat_insert ON chat_messages FOR INSERT
  WITH CHECK (
    tenant_id = (select auth_tenant_id())
    AND sender_id = (select auth.uid())
  );

CREATE POLICY chat_delete ON chat_messages FOR DELETE
  USING (tenant_id = (select auth_tenant_id()) AND sender_id = (select auth.uid()));

CREATE POLICY chat_update ON chat_messages FOR UPDATE
  USING (tenant_id = (select auth_tenant_id()) AND sender_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth_tenant_id()) AND sender_id = (select auth.uid()));
