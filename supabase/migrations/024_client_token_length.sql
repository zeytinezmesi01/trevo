-- O-13: client.token uzunlugunu 16 byte -> 32 byte yap (yeni musterier icin)
-- Mevcut token'lar etkilenmez; sadece DEFAULT degisir.
ALTER TABLE clients
  ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(32), 'hex');
