import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_DOMAINS } from '@/lib/constants'

type BrandCacheEntry = { id: string; tenant_id: string | null; expiresAt: number }
const brandDomainCache = new Map<string, BrandCacheEntry>()
const BRAND_CACHE_TTL = 60_000

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Nonce tabanlı CSP — script-src/style-src'ta 'unsafe-inline' yok.
 * Nonce her istekte taze üretilir; Next.js, istek header'ındaki CSP'den
 * nonce'u çıkarıp kendi script/style'larına otomatik uygular
 * (bkz. node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * Root layout headers() okuduğu için tüm sayfalar zaten dinamik render'da.
 *
 * İstisna: /api/payments/checkout-frame kendi gevşek CSP'siyle servis edilen
 * "CSP adası"dır (iyzico inline script'i) — ona bu header yazılmaz.
 */
function buildCsp(nonce: string): string {
  const scriptSrc = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`, 'https://*.iyzipay.com']
  const connectSrc = [`'self'`]

  // Geliştirme modunda React eval() ve Turbopack HMR WebSocket'i kullanır;
  // HMR ayrıca nonce'suz <style> enjekte ettiği için dev'de style-src gevşek kalır.
  if (isDev) {
    scriptSrc.push(`'unsafe-eval'`)
    connectSrc.push('ws://localhost:*', 'http://localhost:*')
  }

  const directives: Record<string, string[]> = {
    'default-src': [`'self'`],
    'script-src': scriptSrc,
    'style-src': isDev ? [`'self'`, `'unsafe-inline'`] : [`'self'`, `'nonce-${nonce}'`],
    // React style={{}} propları ve Recharts SVG'leri style ATTRIBUTE kullanır —
    // bunlar script çalıştıramaz; element düzeyindeki <style> sıkı kalır.
    'style-src-attr': [`'unsafe-inline'`],
    'img-src': [`'self'`, 'data:', 'blob:'],
    'connect-src': connectSrc,
    'frame-src': [`'self'`, 'https://*.iyzipay.com'],
    'form-action': [`'self'`, 'https://*.iyzipay.com'],
    'frame-ancestors': [`'none'`],
    'base-uri': [`'self'`],
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    const origin = new URL(supabaseUrl).origin
    directives['connect-src'].push(origin)
    // Supabase Realtime WebSocket bağlantısı (wss://)
    directives['connect-src'].push(origin.replace('https://', 'wss://'))
  }

  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  if (r2PublicUrl) {
    const origin = new URL(r2PublicUrl).origin
    directives['img-src'].push(origin)
    directives['connect-src'].push(origin)
  }

  // R2 S3 API ucu — tarayıcı dosya yüklemelerini (PUT) buraya yapar.
  // Bucket adı alt-domain olarak eklendiği için wildcard de gerekir.
  const r2Endpoint = process.env.R2_ENDPOINT
  if (r2Endpoint) {
    try {
      const host = new URL(r2Endpoint).host
      directives['connect-src'].push(`https://${host}`, `https://*.${host}`)
    } catch {}
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

const CSP_EXEMPT_PREFIX = '/api/payments/checkout-frame'

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)
  const isCspExempt = request.nextUrl.pathname.startsWith(CSP_EXEMPT_PREFIX)

  // Nonce'un SSR'da uygulanması için CSP istek header'ına da yazılır
  const buildRequestHeaders = () => {
    const h = new Headers(request.headers)
    if (!isCspExempt) {
      h.set('x-nonce', nonce)
      h.set('content-security-policy', csp)
    }
    return h
  }

  let supabaseResponse = NextResponse.next({ request: { headers: buildRequestHeaders() } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: buildRequestHeaders() } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Dashboard'a girmeye çalışıyorsa ve giriş yapmamışsa → login'e yönlendir
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/giris', request.url))
  }

  // Giriş yapmışsa auth sayfalarına gitmesin → dashboard'a yönlendir
  if (user && (request.nextUrl.pathname === '/giris' || request.nextUrl.pathname === '/kayit')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Brand detection via domain (white-label)
  const host = request.headers.get('host') || ''
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = DEFAULT_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )

  if (!isDefaultDomain) {
    let profile: BrandCacheEntry | null = null

    const cached = brandDomainCache.get(domain)
    if (cached && cached.expiresAt > Date.now()) {
      profile = cached
    } else {
      // RLS bypass: proxy'de kullanıcı oturumu olmayabilir, admin client kullan
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: row } = await admin
        .from('profiles')
        .select('id, brand_domain_status')
        .eq('brand_domain', domain)
        .eq('brand_domain_status', 'active')
        .maybeSingle()

      if (row) {
        // Domain'in tenant'ı: domain sahibinin SAHİBİ olduğu tenant
        // (çoklu tenant modelinde profiles.tenant_id yok; owner_id UNIQUE)
        const { data: ownedTenant } = await admin
          .from('tenants')
          .select('id')
          .eq('owner_id', row.id as string)
          .maybeSingle()

        profile = { id: row.id as string, tenant_id: (ownedTenant?.id as string) || null, expiresAt: Date.now() + BRAND_CACHE_TTL }
        brandDomainCache.set(domain, profile)
      }
    }

    if (profile) {
      supabaseResponse.headers.set('x-brand-profile-id', profile.id as string)
      // O-10: httpOnly=false bilinçli — lib/brand/client.ts client-side okur (readBrandFromCookie).
      // Cookie içerikleri yalnızca brand kimlikleri olduğundan XSS risk seviyesi düşük.
      supabaseResponse.cookies.set('brand_profile_id', profile.id as string, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      })
      if (profile.tenant_id) {
        supabaseResponse.cookies.set('brand_tenant_id', profile.tenant_id as string, {
          httpOnly: false,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
        })
      }

      // Custom domain'de anasayfa yerine markali giris sayfasini goster
      if (request.nextUrl.pathname === '/') {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/giris'
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  if (!isCspExempt) {
    supabaseResponse.headers.set('Content-Security-Policy', csp)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
