-- Ekip ici chat mesajlari
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_tenant_time ON chat_messages(tenant_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_select ON chat_messages FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY chat_insert ON chat_messages FOR INSERT
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND sender_id = auth.uid()
  );

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
