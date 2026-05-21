-- INVOICE SYSTEM MIGRATION
-- Run in Supabase SQL Editor

-- 1. Invoice number sequences (per-tenant, atomic)
CREATE TABLE IF NOT EXISTS invoice_number_sequences (
  tenant_id   UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  prefix      TEXT NOT NULL DEFAULT 'TRV',
  year        INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  last_number INT NOT NULL DEFAULT 0
);

-- 2. Invoices table (Turkish format)
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  created_by      UUID NOT NULL REFERENCES auth.users(id),

  invoice_number  TEXT NOT NULL,
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  currency        TEXT NOT NULL DEFAULT 'TRY',
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes           TEXT,

  -- Frozen client info at invoice time
  client_name     TEXT NOT NULL,
  client_company  TEXT,
  client_email    TEXT,
  client_tax_office   TEXT,
  client_tax_number   TEXT,
  client_address      TEXT,
  client_city         TEXT,
  client_country      TEXT DEFAULT 'Türkiye',

  -- Financials
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  kdv_rate        DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  kdv_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  tevkifat_rate   DECIMAL(5,2) DEFAULT 0,
  tevkifat_amount DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid     DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- PDF
  pdf_url         TEXT,
  pdf_generated_at TIMESTAMPTZ,

  -- Client self-service
  requested_by_client BOOLEAN NOT NULL DEFAULT false,
  request_note    TEXT,

  -- Delivery
  emailed_at      TIMESTAMPTZ,
  email_to        TEXT,

  -- Legal flags
  vat_exempt      BOOLEAN NOT NULL DEFAULT false,
  withholding_tax BOOLEAN NOT NULL DEFAULT false,
  e_archive       BOOLEAN NOT NULL DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);

-- 3. Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit        TEXT DEFAULT 'adet',
  unit_price  DECIMAL(12,2) NOT NULL,
  kdv_rate    DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  kdv_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total  DECIMAL(12,2) NOT NULL DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
