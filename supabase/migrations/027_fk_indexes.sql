-- CL-D1: FK kolonlarında covering index eksikti
-- CASCADE DELETE yavaş, FK üzerinden JOIN'ler sequence scan yapıyordu.
-- 14 tablo için index ekle.

CREATE INDEX IF NOT EXISTS idx_api_keys_created_by        ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id    ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id            ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_tenant_id    ON file_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_uploaded_by  ON file_versions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_user_id              ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by        ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_client_id         ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id         ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registration_keys_created_by ON registration_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_services_user_id           ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON team_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id     ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_created_by ON webhook_endpoints(created_by);
