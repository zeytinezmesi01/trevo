# GÖREV: Trevo kod tabanındaki 10 hatayı düzelt

Trevo, Next.js 16.2.6 (App Router) + React 19 + Supabase (PostgreSQL) + Cloudflare R2 +
Resend ile yazılmış white-label ajans yönetim platformudur. Aşağıdaki 10 hatayı
YALNIZCA belirtilen kapsamda düzelt — başka refactor, başka dosya, ek özellik EKLEME.

## ÖNCE OKU (zorunlu)
Bu proje standart Next.js DEĞİL. Kod yazmadan önce `node_modules/next/dist/docs/`
altındaki ilgili rehberleri oku. `AGENTS.md` bunu şart koşuyor.

## ⛔ DOKUNMA — `proxy.ts`
Kök dizindeki `proxy.ts` dosyası DOĞRUDUR. Next.js 16'da Middleware'in adı "Proxy"
oldu: dosya adı `proxy.ts`, export adı `proxy` olur (bkz.
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Bu dosyayı
`middleware.ts`'e çevirme, yeniden adlandırma veya taşıma — aynen bırak.

---

## DÜZELTME 1 — Root layout'ta kullanılmayan `BrandStyle` (`app/layout.tsx`)
SORUN: `BrandStyle` import ediliyor ama `RootLayout` içinde render edilmiyor —
kullanılmayan import, lint hatası. White-label tema değişkenleri global enjekte edilmiyor.
YAPILACAK: `RootLayout`'u `async` yap. `next/headers`'tan `host`'u al,
`lib/brand/server.ts`'teki `generatePortalBrand(supabase, host)` ile marka bilgisini
çek (varsayılan domain'de `DEFAULT_BRAND` döner, sorun olmaz) ve `<body>` içinde
ilk eleman olarak `<BrandStyle brand={brand} />` render et. `generateMetadata`
zaten benzer marka sorgusu yapıyor — desenini örnek al.

## DÜZELTME 2 — Ödeme bildiriminde anon key ile `auth.admin` (`app/api/payments/callback/route.ts`)
SORUN: `sendPaymentNotification` (satır ~175) `supabase.auth.admin.getUserById`
çağırıyor ama `lib/supabase/server.ts` ANON key kullanıyor. Anon key ile `auth.admin`
çalışmaz; çağrı hata fırlatır, `.catch(()=>{})` yuttuğu için ödeme bildirim
e-postaları HİÇ gönderilmez.
YAPILACAK:
- Yeni dosya `lib/supabase/admin.ts`: `@supabase/supabase-js`'in `createClient`'ı ile
  `SUPABASE_SERVICE_ROLE_KEY` kullanan `createAdminClient()` fonksiyonu yaz
  (`auth: { autoRefreshToken: false, persistSession: false }`). Bu istemci SADECE
  sunucu tarafında kullanılır.
- `callback/route.ts` içindeki `sendPaymentNotification`'da `auth.admin.getUserById`
  çağrısını bu admin istemcisiyle yap. Diğer (RLS'li) sorgular mevcut istemcide kalsın.
- `.env.local` listesine `SUPABASE_SERVICE_ROLE_KEY` ekle.

## DÜZELTME 3 — Başarısız ödemede ham JSON ekranı (`app/api/payments/callback/route.ts`)
SORUN: `retrieveCheckoutResult` hata fırlatınca akış `catch` bloğuna düşüyor; catch
ödeme durumunu `failed` yapıyor ama YÖNLENDİRME yapmıyor. Akış en alttaki
`return NextResponse.json({ status: 'processed' })`'e ulaşıyor — müşteri tarayıcıda
ham JSON görüyor. Ayrıca `client?.token` bulunamazsa da JSON'a düşülüyor.
YAPILACAK: Müşteriyi sonuç sayfasına yönlendiren mantığı bir yardımcı fonksiyona çıkar
(client token'ı bul → `/portal/{token}/odeme-sonuc?payment={id}`'ye `NextResponse.redirect`).
Bu yardımcıyı HEM başarı/başarısızlık (try sonu) HEM `catch` bloğunda çağır. Token
bulunamazsa en azından genel bir sonuç sayfasına yönlendir — son çare dışında ham
JSON döndürme.

## DÜZELTME 4 — e-Arşiv belgesi yanlış tip olarak gönderiliyor (`lib/einvoice/nilvera-provider.ts`)
SORUN: ~183. satır: `documentType: p.documentType === 'e_fatura' ? 'INVOICE' : 'DESPATCH_ADVICE'`.
`DESPATCH_ADVICE` GİB'de e-İrsaliye demektir. e-Arşiv faturası yanlış belge tipiyle
gidiyor — geçersiz istek ve yasal olarak hatalı belge üretimi.
YAPILACAK: e-Arşiv için ASLA `DESPATCH_ADVICE` kullanma. Eşleştirmeyi düzelt:
`e_fatura` → `INVOICE`, `e_arsiv` → e-Arşiv fatura tipi. Nilvera'nın tam enum'undan
emin değilsen dosyanın üstüne net adlı bir sabit koy (örn. `EARCHIVE_DOCUMENT_TYPE`)
ve yanına `// TODO: bayi dokümanından doğrula` yorumu bırak — bu dosyadaki mevcut
TODO desenine uy. e-İrsaliye'ye yol açan eşleştirmeyi tamamen kaldır.

## DÜZELTME 5 — 11 haneli TCKN sorgulanmadan e-Arşiv'e düşürülüyor (`lib/einvoice/index.ts`)
SORUN: `determineDocumentType` (~62. satır): `if (!taxNumber || taxNumber.length !== 10)`
→ 11 haneli TCKN'lerde entegratör sorgusu yapılmadan doğrudan `e_arsiv` dönüyor.
Şahıs şirketleri TCKN kullanır ve e-Fatura mükellefi olabilirler — yasal uyumluluk hatası.
YAPILACAK: Koşulu "`taxNumber` yoksa VEYA uzunluğu 10 da 11 de değilse" şeklinde
değiştir. Uzunluk 10 (VKN) veya 11 (TCKN) ise her iki durumda da
`provider.checkTaxpayer` ile mükellef sorgusu yapılsın. Sorgu başarısız olursa
mevcut güvenli `e_arsiv` fallback'i kalsın.

## DÜZELTME 6 — Fatura numarası üretiminde race condition (`lib/invoice/server.ts`)
SORUN: `generateInvoiceNumber` (~8-19. satır) `last_number`'ı JS'de okuyup +1 yapıp
`upsert` ediyor. Eşzamanlı isteklerde iki işlem aynı numarayı üretir, benzersizlik
kısıtı (`idx_invoices_tenant_number`) ihlal edilir → 500 hatası.
YAPILACAK:
- Yeni migration (`supabase/migrations/` klasörüne bak, bir sonraki numarayı kullan):
  `next_invoice_number(p_tenant_id uuid)` adında bir PL/pgSQL fonksiyonu oluştur.
  Fonksiyon `invoice_number_sequences` üzerinde `INSERT ... ON CONFLICT (tenant_id)
  DO UPDATE` ile atomik artırım yapsın; yıl değiştiyse `last_number`'ı 1'e sıfırlasın;
  `prefix`, `year`, `last_number` değerlerini döndürsün.
- `generateInvoiceNumber`'ı bu fonksiyonu `supabase.rpc('next_invoice_number', ...)`
  ile çağıracak şekilde değiştir. Numara formatı aynı kalsın: `TRV` + yıl + 4 hane.

## DÜZELTME 7 — PDF faturada tarih kayması (`lib/pdf/invoice-template.tsx`)
SORUN: ~99 ve ~104. satır: `new Date(v('invoice_date')).toLocaleDateString('tr-TR')`.
`"2026-05-22"` UTC gece yarısı yorumlanır; UTC-gerisi zaman diliminde bir gün geri
kayar ve faturada yanlış tarih basılır.
YAPILACAK: Zaman diliminden bağımsız bir string formatlayıcı ekle: `"YYYY-MM-DD"`
(veya ISO string'in ilk 10 karakteri) → `"DD.MM.YYYY"`. `new Date` kullanma.
Hem `invoice_date` hem `due_date` için uygula.

## DÜZELTME 8 — Yanlış konumdaki `eslint-disable` (`lib/brand/server.ts`)
SORUN: ~55. satırdaki `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
bir SONRAKİ satırı (fonksiyon imzası) kapatıyor; ama `supabase: any` parametresi ~57.
satırda — disable kapsam dışı, lint hâlâ patlıyor.
YAPILACAK: Tercihen `supabase` parametresine doğru tipi ver — `@supabase/supabase-js`'ten
`SupabaseClient` import et ve `supabase: SupabaseClient` yap, `any` ve disable yorumunu
tamamen kaldır. Tip sürtüşmesi çıkarsa en azından `eslint-disable-next-line` yorumunu
`supabase: any` satırının tam üstüne taşı.

## DÜZELTME 9 — Kaçışsız apostrof (`app/kayit/page.tsx`)
SORUN: ~170. satır: `</Link>'nı okudum` — JSX metnindeki ham `'`, `react/no-unescaped-entities`
hatası veriyor.
YAPILACAK: O `'` karakterini `&apos;` yap.

## DÜZELTME 10 — Effect içinde senkron `setState` (`app/kayit/page.tsx`)
SORUN: ~24-27. satır: `useEffect` içinde `setInviteToken(searchParams.get('invite'))`
senkron çağrılıyor — `react-hooks/set-state-in-effect` hatası.
YAPILACAK: `inviteToken` state'ini kaldır; bunun yerine `const inviteToken =
searchParams.get('invite')` şeklinde türetilmiş değer kullan. Davetiye e-postasını
ön-dolduran async fetch'i effect içinde tut (gerçek bir yan etki) ve `inviteToken`'ı
dependency olarak ekle. `inviteToken` kullanılan diğer yerleri bozma.

---

## KISITLAR
- `proxy.ts`'e dokunma (yukarıdaki uyarı).
- Sadece listelenen dosyaları düzelt; kapsam dışı refactor yapma.
- Kullanıcı metinleri Türkçe, mevcut tasarım dili korunur.
- İş bitince HEM `npm run lint` HEM `npm run build` çalıştır, ikisinin de
  hatasız geçtiğini doğrula.

## TESLİMAT
1. Düzeltilen dosyalar (yukarıdaki 10 madde)
2. Yeni dosya: `lib/supabase/admin.ts`
3. Yeni migration: fatura numarası fonksiyonu
4. `.env.local`'a eklenecek `SUPABASE_SERVICE_ROLE_KEY`
5. `lint` + `build` çıktısının temiz olduğunun teyidi
