-- Y-9: next_invoice_number fonksiyonuna SECURITY DEFINER ve search_path ekle
-- Migration 015 fonksiyonu yeniden tanımlarken bunları atlamıştı.
-- search_path sabitlenmezse kötü niyetli kullanıcı pg_temp üzerinden
-- aynı isimde sahte nesneler oluşturarak fonksiyonu kandırabilir.
ALTER FUNCTION public.next_invoice_number(uuid)
  SECURITY DEFINER
  SET search_path = public, pg_catalog;
