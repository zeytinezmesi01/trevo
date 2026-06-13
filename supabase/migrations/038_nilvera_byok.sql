-- 038: e-Fatura BYOK (Nilvera) — tenant kendi entegratör anahtarını bağlar
--
-- Model: ödeme (iyzico) BYOK deseninin aynısı. Her tenant kendi Nilvera API
-- anahtarını girer; para/sorumluluk merkezîleşmez, Trevo'ya bayi sözleşmesi
-- (şirket) gerekmez. Anahtar lib/crypto ile şifreli saklanır.
--
-- İleride bayi modeline geçilirse: aynı NilveraEInvoiceProvider kullanılır,
-- yalnızca anahtar kaynağı (tenant satırı yerine env master) değişir.
--
-- Mevcut kolonlar yeniden kullanılır:
--   einvoice_enabled  → anahtar girilmiş ve bağlantı doğrulanmış mı
--   einvoice_provider → 'nilvera'
--   einvoice_alias    → tenant'ın kendi Nilvera GİB etiketi (gönderici alias)

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS nilvera_api_key   TEXT,
  ADD COLUMN IF NOT EXISTS nilvera_test_mode BOOLEAN NOT NULL DEFAULT true;
