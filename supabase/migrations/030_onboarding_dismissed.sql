-- 030: Onboarding modal'ı DB'de kalıcı olarak kapat
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;
