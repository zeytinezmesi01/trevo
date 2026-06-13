import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitDb } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/**
 * GET /api/payments/checkout-frame?paymentId=...&token=...
 *
 * iyzico checkout formunu KENDİ gevşek CSP'sine sahip ayrı bir HTML dokümanı
 * olarak servis eder ("CSP adası"). Uygulamanın geri kalanı nonce tabanlı katı
 * CSP kullanır (proxy.ts); srcdoc iframe'ler üst CSP'yi miras aldığı için
 * iyzico'nun inline script'i orada çalışamazdı. Gerçek HTTP dokümanları kendi
 * CSP header'ını taşır — katı politika uygulama genelinde bozulmaz.
 *
 * Erişim: token-scoped RPC (K-3 deseni) — yalnızca portal token'ın client'ına
 * ait ve 'pending' durumdaki ödemenin formu döner.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const paymentId = url.searchParams.get('paymentId')
  const token = url.searchParams.get('token')

  if (!paymentId || !token) {
    return new Response('Geçersiz istek', { status: 400 })
  }

  if (!(await rateLimitDb(`checkout-frame:${token}`, 30, 60_000))) {
    return new Response('Çok fazla istek', { status: 429 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('portal_get_checkout_form', { p_token: token, p_payment_id: paymentId })
    .maybeSingle()

  const formContent = (data as { checkout_form_content?: string } | null)?.checkout_form_content
  if (error || !formContent) {
    return new Response('Ödeme formu bulunamadı', { status: 404 })
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ödeme</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif">
<div id="iyzipay-checkout-form" class="responsive"></div>
${formContent}
</body>
</html>`

  // Bu dokümana ÖZEL gevşek CSP — eski global politikayla aynı erişim genişliği,
  // artı inline script/style (iyzico formunun gereksinimi). Ada, sandbox'lı
  // iframe içinde ve yalnızca kendi origin'imizden çerçevelenebilir.
  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline' https://*.iyzipay.com",
    "style-src 'unsafe-inline' https://*.iyzipay.com",
    "img-src https: data:",
    "font-src https: data:",
    "connect-src https://*.iyzipay.com",
    "frame-src https://*.iyzipay.com",
    "form-action 'self' https://*.iyzipay.com",
    "frame-ancestors 'self'",
    "base-uri 'none'",
  ].join('; ')

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp,
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-store',
    },
  })
}
