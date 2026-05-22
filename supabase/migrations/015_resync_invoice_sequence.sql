-- RESYNC INVOICE NUMBER SEQUENCE
-- Sorun: invoice_number_sequences sayaci, invoices tablosundaki gercek
-- fatura numaralarinin gerisinde kaldigi icin next_invoice_number zaten
-- kullanilmis bir numara uretip (tenant_id, invoice_number) benzersiz
-- kisitini ihlal ediyordu (hata 23505 - duplicate key).
-- Run in Supabase SQL Editor.

-- ============================================================
-- 1. Mevcut sayaclari gercek faturalarla senkronla
-- ============================================================
-- Her tenant icin, ilgili yil+prefix formatindaki en buyuk fatura
-- numarasini bulup last_number'i ona esitler. GREATEST ile mevcut
-- degerin gerisine dusulmez.
UPDATE invoice_number_sequences s
SET last_number = GREATEST(
  s.last_number,
  COALESCE((
    SELECT MAX(
      substring(i.invoice_number from ('^' || s.prefix || s.year::text || '([0-9]+)$'))::int
    )
    FROM invoices i
    WHERE i.tenant_id = s.tenant_id
      AND i.invoice_number ~ ('^' || s.prefix || s.year::text || '[0-9]+$')
  ), 0)
);

-- ============================================================
-- 2. next_invoice_number'i kendi kendini duzeltir hale getir
-- ============================================================
-- Her cagrida invoices tablosundaki gercek en buyuk numarayi da
-- hesaba katar; sayac kayarsa otomatik toparlar. INSERT ... ON CONFLICT
-- satir kilidi sayesinde atomik kalir (race condition yok).
CREATE OR REPLACE FUNCTION next_invoice_number(p_tenant_id UUID)
RETURNS TABLE(seq_prefix TEXT, seq_year INT, seq_number INT)
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
  existing_max INT;
BEGIN
  -- Bu tenant + yil icin invoices tablosundaki en buyuk numara
  SELECT COALESCE(MAX(
           substring(invoice_number from ('^TRV' || current_year::text || '([0-9]+)$'))::int
         ), 0)
  INTO existing_max
  FROM invoices
  WHERE tenant_id = p_tenant_id
    AND invoice_number ~ ('^TRV' || current_year::text || '[0-9]+$');

  INSERT INTO invoice_number_sequences (tenant_id, prefix, year, last_number)
  VALUES (p_tenant_id, 'TRV', current_year, existing_max + 1)
  ON CONFLICT (tenant_id) DO UPDATE SET
    year        = current_year,
    last_number = CASE
                    WHEN invoice_number_sequences.year = current_year
                      THEN GREATEST(invoice_number_sequences.last_number, existing_max) + 1
                    ELSE existing_max + 1
                  END
  WHERE invoice_number_sequences.tenant_id = p_tenant_id
  RETURNING invoice_number_sequences.prefix,
            invoice_number_sequences.year,
            invoice_number_sequences.last_number
  INTO seq_prefix, seq_year, seq_number;

  RETURN NEXT;
END;
$$;
