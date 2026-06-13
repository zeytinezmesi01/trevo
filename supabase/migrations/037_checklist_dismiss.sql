-- 037: Kurulum sihirbazı (SetupChecklist) kalıcı kapatma
--
-- Sorun: SetupChecklist "Gizle" durumu yalnızca localStorage'da tutuluyordu —
-- cihaz/tarayıcı başına. Owner başka cihazdan girince veya localStorage
-- temizlenince sihirbaz geri geliyordu.
--
-- Çözüm: onboarding_dismissed_at deseniyle aynı kalıcı zaman damgası. Owner
-- "Bir daha gösterme"ye basınca VEYA tüm adımlar tamamlanınca set edilir;
-- sihirbaz bir daha (hiçbir cihazda) görünmez. RLS: profiles_update zaten
-- kullanıcının kendi satırını güncellemesine izin verir, ek politika gerekmez.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checklist_dismissed_at TIMESTAMPTZ;
