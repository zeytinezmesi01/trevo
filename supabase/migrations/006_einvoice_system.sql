-- E-INVOICE SYSTEM MIGRATION
-- e-Fatura / e-Arşiv altyapısı (Nilvera entegrasyonu)
-- Run in Supabase SQL Editor

-- 1. E-INVOICE DOCUMENTS (her gönderim denemesi bir satır)
CREATE TABLE IF NOT EXISTS einvoice_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  document_type     TEXT NOT NULL CHECK (document_type IN ('e_fatura','e_arsiv')),
  document_number   TEXT,            -- GİB formatı: 3 harf + yıl + 9 hane
  ettn              TEXT,            -- entegratör/GİB UUID'si
  integrator_doc_id TEXT,            -- entegratör tarafındaki belge kimliği
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','queued','sent','accepted',
                                      'rejected','error','cancelled')),
  error_message     TEXT,
  gib_response      JSONB,           -- entegratörden dönen ham cevap
  xml_url           TEXT,            -- imzalı UBL-TR XML (R2)
  pdf_url           TEXT,            -- resmi PDF (R2)
  sent_at           TIMESTAMPTZ,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_einvoice_docs_tenant  ON einvoice_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_docs_invoice ON einvoice_documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_docs_status  ON einvoice_documents(status);

-- 2. TENANTS — entegratör alt hesap bilgileri
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS einvoice_enabled       BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS einvoice_provider      TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS einvoice_account_id    TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS einvoice_alias         TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS einvoice_registered_at TIMESTAMPTZ;

-- 3. INVOICES — e-belge durumu (liste ekranı için denormalize)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS einvoice_status TEXT DEFAULT 'none'
  CHECK (einvoice_status IN ('none','pending','sent','accepted','rejected','error'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS einvoice_type TEXT
  CHECK (einvoice_type IN ('e_fatura','e_arsiv'));

-- NOT: invoices.e_archive boolean alanı artık kullanılmıyor.
-- Yeni kod einvoice_status/einvoice_type kullanır.

-- 4. CLIENTS — GİB mükellef sorgu önbelleği
ALTER TABLE clients ADD COLUMN IF NOT EXISTS einvoice_user       BOOLEAN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS einvoice_checked_at TIMESTAMPTZ;
