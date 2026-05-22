-- INVOICE SEQUENCE ATOMIC RPC
-- generateInvoiceNumber'daki race condition'ı çözer.
-- PostgreSQL tarafında atomik artırım yapar.

CREATE OR REPLACE FUNCTION next_invoice_number(p_tenant_id UUID)
RETURNS TABLE(seq_prefix TEXT, seq_year INT, seq_number INT)
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  INSERT INTO invoice_number_sequences (tenant_id, prefix, year, last_number)
  VALUES (p_tenant_id, 'TRV', current_year, 1)
  ON CONFLICT (tenant_id) DO UPDATE SET
    year        = CASE WHEN invoice_number_sequences.year = current_year
                       THEN invoice_number_sequences.year
                       ELSE current_year END,
    last_number = CASE WHEN invoice_number_sequences.year = current_year
                       THEN invoice_number_sequences.last_number + 1
                       ELSE 1 END
  WHERE invoice_number_sequences.tenant_id = p_tenant_id
  RETURNING invoice_number_sequences.prefix,
            invoice_number_sequences.year,
            invoice_number_sequences.last_number
  INTO seq_prefix, seq_year, seq_number;

  -- Eğer INSERT yapıldıysa (ilk sefer) last_number=1 olur
  IF NOT FOUND THEN
    seq_prefix := 'TRV';
    seq_year   := current_year;
    seq_number := 1;
  END IF;

  RETURN NEXT;
END;
$$;
