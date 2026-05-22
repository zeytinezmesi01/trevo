-- REVOKE EXECUTE ON PAYMENT/SEQUENCE RPCS
-- apply_payment_success: yalnızca service-role callback çağırır;
-- hiçbir API rolünün erişmesi gerekmez.
-- next_invoice_number / next_einvoice_number: dashboard'dan authenticated ile çağrılır.
-- Run in Supabase SQL Editor after 013_revoke_function_execute.sql

-- ============================================================
-- 1. apply_payment_success — herkesten kapat
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.apply_payment_success(uuid, numeric)
  FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2. next_invoice_number — anon'u kapat, authenticated'i koru
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.next_invoice_number(uuid)   FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.next_invoice_number(uuid)   TO authenticated;

-- ============================================================
-- 3. next_einvoice_number — anon'u kapat, authenticated'i koru
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.next_einvoice_number(uuid)  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.next_einvoice_number(uuid)  TO authenticated;
