-- 029: chat_messages tablosunu Realtime yayınına idempotent olarak ekle
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
