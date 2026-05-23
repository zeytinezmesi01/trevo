-- Y-17: chat_messages icin DELETE ve UPDATE politikalari
-- Sadece mesajin sahibi kendi mesajini silebilir/duzenleyebilir
CREATE POLICY chat_delete ON chat_messages FOR DELETE
  USING (tenant_id = auth_tenant_id() AND sender_id = auth.uid());

CREATE POLICY chat_update ON chat_messages FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND sender_id = auth.uid())
  WITH CHECK (tenant_id = auth_tenant_id() AND sender_id = auth.uid());
