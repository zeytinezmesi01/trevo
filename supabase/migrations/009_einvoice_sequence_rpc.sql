-- E-INVOICE DOCUMENT SEQUENCE ATOMIC RPC
-- getNextDocumentSequence'daki race condition'ı çözer.

CREATE TABLE IF NOT EXISTS einvoice_number_sequences (
  tenant_id   UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  year        INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  last_number INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_einvoice_number(p_tenant_id UUID)
RETURNS TABLE(seq_year INT, seq_number INT)
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  INSERT INTO einvoice_number_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, current_year, 1)
  ON CONFLICT (tenant_id) DO UPDATE SET
    year        = CASE WHEN einvoice_number_sequences.year = current_year
                       THEN einvoice_number_sequences.year
                       ELSE current_year END,
    last_number = CASE WHEN einvoice_number_sequences.year = current_year
                       THEN einvoice_number_sequences.last_number + 1
                       ELSE 1 END
  WHERE einvoice_number_sequences.tenant_id = p_tenant_id
  RETURNING einvoice_number_sequences.year,
            einvoice_number_sequences.last_number
  INTO seq_year, seq_number;

  IF NOT FOUND THEN
    seq_year   := current_year;
    seq_number := 1;
  END IF;

  RETURN NEXT;
END;
$$;
