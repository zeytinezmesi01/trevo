import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

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
  const isDefaultDomain = ['localhost', 'trevo-delta.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )

  if (!isDefaultDomain) {
    // RLS bypass: proxy'de kullanıcı oturumu olmayabilir, admin client kullan
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: profile } = await admin
      .from('profiles')
      .select('id, tenant_id, brand_domain_status')
      .eq('brand_domain', domain)
      .eq('brand_domain_status', 'active')
      .maybeSingle()

    if (profile) {
      supabaseResponse.headers.set('x-brand-profile-id', profile.id as string)
      supabaseResponse.cookies.set('brand_profile_id', profile.id as string, {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      })
      if (profile.tenant_id) {
        supabaseResponse.cookies.set('brand_tenant_id', profile.tenant_id as string, {
          httpOnly: false,
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
