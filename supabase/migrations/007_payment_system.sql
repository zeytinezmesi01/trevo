-- PAYMENT SYSTEM MIGRATION
-- iyzico Checkout Form entegrasyonu (BYOK — Bring Your Own Key)
-- Run in Supabase SQL Editor

-- 1. PAYMENTS (her ödeme denemesi bir satır)
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  provider            TEXT NOT NULL DEFAULT 'iyzico',
  amount              DECIMAL(12,2) NOT NULL,
  currency            TEXT DEFAULT 'TRY',
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','success','failed','cancelled','refunded')),
  conversation_id     TEXT,            -- iyzico conversationId (= payment id)
  payment_token       TEXT,            -- checkout form token
  provider_payment_id TEXT,            -- iyzico paymentId
  error_message       TEXT,
  provider_response   JSONB,           -- iyzico ham cevabı
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant  ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_token   ON payments(payment_token);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);

-- 2. TENANTS — iyzico hesap bilgileri (org düzeyi)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iyzico_api_key    TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iyzico_secret_key TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iyzico_mode       TEXT DEFAULT 'sandbox'
                                CHECK (iyzico_mode IN ('sandbox','production'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payments_enabled  BOOLEAN DEFAULT false;

-- Mevcut anahtarları profiles'tan tenant'a taşı (owner profili)
UPDATE tenants t
SET iyzico_api_key    = p.iyzico_api_key,
    iyzico_secret_key = p.iyzico_secret_key,
    payments_enabled  = (p.iyzico_api_key IS NOT NULL)
FROM profiles p
WHERE p.tenant_id = t.id AND p.role = 'owner';

-- NOT: profiles.iyzico_* kolonları hâlâ duruyor (geriye uyumluluk),
-- ama yeni kod tenants tablosunu kullanır.
-- TODO: production'da anahtarları KMS/pgcrypto ile şifrele

-- 3. INVOICES — ödeme zamanı damgası
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. CLIENTS — portal ödeme bilgisi (opsiyonel)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_customer_ip TEXT;
