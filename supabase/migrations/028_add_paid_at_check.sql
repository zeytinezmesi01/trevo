-- 028: paid_at sütunu invoices tablosuna ekle (idempotent)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
