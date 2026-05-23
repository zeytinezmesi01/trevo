# Trevo — Yapılacaklar

Geliştirme sırasında konuşulup "sonra yapılacak" diye ertelenen işlerin
listesi. Bu dosya commit/push EDİLMEZ (bkz. CLAUDE.md).

---

## Güvenlik

### HSTS header'ı (üretim)
- **Ne:** `next.config.ts`'e `Strict-Transport-Security` header'ı eklenecek.
- **Nasıl:** Sadece üretimde (`!isDev`). Değer: `max-age=31536000`.
  White-label custom domain senaryosu yüzünden `includeSubDomains`
  KONULMAYACAK — müşterinin kendi alt-domenlerini etkilememesi için.
- **Neden:** Üretimde HTTPS zorlaması; iyi güvenlik pratiği. ZAP raporunda
  proaktif öneri olarak çıktı (ZAP bizim sitede flag'lemedi, localhost HTTP).
- **Öncelik:** Düşük — üretime çıkmadan önce yapılmalı.

### Nonce tabanlı CSP
- **Ne:** CSP'deki `script-src` / `style-src` `'unsafe-inline'` kaldırılacak.
- **Nasıl:** `proxy.ts`'te her istek için nonce üretip sayfalara geçirmek
  gerekir.
- **Neden:** ZAP "unsafe-inline" uyarısı (Medium). Şu an kabul edilebilir
  risk — XSS'e karşı asıl korumalar (girdi doğrulama, escapeHtml) zaten var.
- **Öncelik:** Düşük — büyük iş, mevcut risk kabul edilebilir.

### Supabase leaked password protection (SEC-3)
- **Ne:** Supabase Auth'ta "leaked password protection" açılacak
  (HaveIBeenPwned kontrolü).
- **Nasıl:** Supabase panel → Authentication ayarları. Pro plan
  gerektirebilir.
- **Öncelik:** Düşük.

---

## Ürün / UX

### Çoklu tenant desteği
- **Ne:** Aynı kullanıcı birden fazla tenant'a üye olabilsin.
- **Nasıl:** `profiles.tenant_id` kaldırılıp sadece `tenant_members` üzerinden
  tenant bağlantısı kurulacak. Kullanıcı dashboard'da tenant seçimi yapabilir.
  `auth_tenant_id()` RLS fonksiyonu aktif tenant'a göre çalışır.
- **Neden:** Kendi ajansı olan biri, başka bir ajansın custom domain'inden
  üye olursa ikinci tenant'a geçemiyor. Şu an 1 kullanıcı = 1 tenant.
- **Öncelik:** Orta.

### Faturalı müşteri için soft-delete
- **Ne:** Bağlı faturası olan müşteri şu an silinemiyor (FK kısıtı → 409).
- **Nasıl:** Gerçek silme yerine "pasife alma" — örn. `clients.is_active`
  alanı. Müşteri listeden kalkar, faturalar/geçmiş korunur.
- **Neden:** Faturalar muhasebe kaydıdır, silinemez; ama kullanıcı müşteriyi
  listeden kaldırmak isteyebilir.
- **Öncelik:** Orta — kullanıcı talebine göre.

### Rol bazlı yetki özelleştirme (Anayetkili)
- **Ne:** Owner, her rol için (admin/member/viewer) hangi dashboard menülerinin
  görüneceğini özelleştirebilsin.
- **Nasıl:** `role_permissions` tablosu (tenant_id, role, menu_key, enabled).
  Sidebar bu tablodan okur. Ayarlar sayfasında owner için rol yetki matrix'i.
- **Neden:** Farklı işletmeler farklı rol ihtiyaçlarına sahip. Şu an roller
  sabit kodlu.
- **Öncelik:** Orta.

### R2 CORS otomasyonu
- **Ne:** Yeni custom domain eklenince R2 bucket CORS'a otomatik eklensin.
- **Nasıl:** Cloudflare API ile `AllowedOrigins` güncellenir. Domain verify
  endpoint'ine eklenebilir.
- **Neden:** Şu an manuel — her domain için R2 dashboard'a gidip eklemek
  gerekiyor. Unutulursa dosya yükleme kırılır.
- **Öncelik:** Düşük — custom domain sayısı artınca önem kazanır.
