-- FIX next_einvoice_number RPC
-- Sorun: 012_security_fixes.sql icinde fonksiyon yeniden tanimlanirken
-- seq_year / seq_number, RETURNS TABLE(...) ile zaten birer CIKTI parametresi
-- oldugu halde DECLARE blogunda yerel degisken olarak da tanimlanmis.
-- Bu golgeleme yuzunden RETURNING ... INTO yerel degiskenlere yaziyor,
-- RETURN NEXT ise hic atanmamis cikti parametrelerini donduruyordu → (NULL, NULL).
-- Sonuc: getNextDocumentSequence her cagrida 1 doneriyor, belge numarasi
-- tum e-belgelerde ayni kaliyordu.
-- Run in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.next_einvoice_number(p_tenant_id UUID)
RETURNS TABLE(seq_year INT, seq_number INT)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- seq_year / seq_number burada DECLARE EDILMEZ; RETURNS TABLE'dan gelen
  -- cikti parametrelerine dogrudan yazilir.
  INSERT INTO einvoice_number_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, current_year, 1)
  ON CONFLICT (tenant_id) DO UPDATE SET
    year        = current_year,
    last_number = CASE WHEN einvoice_number_sequences.year = current_year
                       THEN einvoice_number_sequences.last_number + 1
                       ELSE 1 END
  WHERE einvoice_number_sequences.tenant_id = p_tenant_id
  RETURNING einvoice_number_sequences.year,
            einvoice_number_sequences.last_number
  INTO seq_year, seq_number;

  RETURN NEXT;
END;
$$;
