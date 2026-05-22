-- REVOKE EXECUTE ON SECURITY DEFINER FUNCTIONS
-- Bu fonksiyonlar doğrudan çağrılmamalıdır; trigger'lar EXECUTE'dan bağımsız çalışır.
-- Run in Supabase SQL Editor after 012_security_fixes.sql

-- ============================================================
-- 1. Trigger fonksiyonları — tüm rollerden EXECUTE kaldır
-- ============================================================
-- handle_new_user: on_profile_created trigger'ı ile çalışır, doğrudan çağrılmaz
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- handle_new_auth_user: on_auth_user_created trigger'ı ile çalışır, doğrudan çağrılmaz
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2. auth_tenant_id — anon erişimini kapat, authenticated'i koru
-- ============================================================
-- RLS politikaları içinde kullanıldığı için authenticated'in erişmesi ZORUNLU.
-- Anon ve PUBLIC'in erişmesi gereksiz.
REVOKE EXECUTE ON FUNCTION public.auth_tenant_id() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.auth_tenant_id() TO authenticated;
