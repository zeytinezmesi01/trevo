import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_DOMAINS } from '@/lib/constants'

type BrandCacheEntry = { id: string; tenant_id: string | null; expiresAt: number }
const brandDomainCache = new Map<string, BrandCacheEntry>()
const BRAND_CACHE_TTL = 60_000

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
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
        .select('id, tenant_id, brand_domain_status')
        .eq('brand_domain', domain)
        .eq('brand_domain_status', 'active')
        .maybeSingle()

      if (row) {
        profile = { id: row.id as string, tenant_id: row.tenant_id as string | null, expiresAt: Date.now() + BRAND_CACHE_TTL }
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

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
