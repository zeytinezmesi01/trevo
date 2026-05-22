-- FILE VISIBILITY — müşteriye açık vs dahili dosya ayrımı
-- files.shared_with_client:
--   client_id boş           → genel ajans dosyası (hiçbir portalda görünmez)
--   client_id dolu + false  → dahili müşteri dosyası (ekip görür, müşteri GÖRMEZ)
--   client_id dolu + true   → müşteri portalında görünür
-- Run in Supabase SQL Editor.

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS shared_with_client BOOLEAN NOT NULL DEFAULT false;
