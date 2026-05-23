-- BRAND DOMAIN VERIFICATION — ozel domain dogrulama akisi
-- profiles tablosuna DNS dogrulama durumu, token ve hata takibi ekler.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_domain_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_domain_verification_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_domain_last_check_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_domain_error text;
