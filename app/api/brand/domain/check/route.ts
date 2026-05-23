import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearBrandCache } from '@/lib/brand/server'
import { promises as dns } from 'dns'

async function checkVercelDomain(domain: string): Promise<boolean> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!token || !projectId) return false

  const teamId = process.env.VERCEL_TEAM_ID
  const teamParam = teamId ? `?teamId=${teamId}` : ''

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}${teamParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return false

    const data = await res.json()
    // verified: DNS CNAME dogru yonlenmis, Vercel onaylamis
    return data?.verified === true
  } catch {
    return false
  }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_domain, brand_domain_verification_token')
    .eq('id', user.id)
    .maybeSingle()

  const domain = profile?.brand_domain as string | null
  const token = profile?.brand_domain_verification_token as string | null

  if (!domain || !token) {
    return NextResponse.json({ error: 'Doğrulama başlatılmamış. Önce domain ekleyin.' }, { status: 400 })
  }

  let status: string = 'pending'
  let error: string | null = null
  const now = new Date().toISOString()

  // 1) TXT kaydı kontrolü
  try {
    const txtRecords = await dns.resolveTxt('_trevo-verify.' + domain)
    const flat = txtRecords.flat()
    if (!flat.includes(token)) {
      status = 'pending'
      error = 'TXT kaydı bulunamadı veya hatalı'
    } else {
      // TXT eşleşti → en az verified
      status = 'verified'
      error = null

      // 2) CNAME veya A kaydı kontrolü (Vercel'e yönleniyor mu?)
      let resolved = false
      try {
        const cnames = await dns.resolveCname(domain)
        resolved = cnames.some(
          (c) => c === 'cname.vercel-dns.com' || c.endsWith('.vercel-dns.com')
        )
      } catch { /* CNAME olmayabilir, A kaydına bakariz */ }
      if (!resolved) {
        try {
          const addrs = await dns.resolve4(domain)
          resolved = addrs.some((ip) =>
            ['76.76.21.21', '76.76.21.93', '76.76.21.98', '76.76.21.123', '76.76.21.142'].includes(ip)
          )
        } catch { /* A kaydi da yok */ }
      }
      if (resolved) {
        status = 'active'
        error = null
      } else {
        error = 'DNS yapılandırılmamış (A veya CNAME kaydı ekleyin)'
      }
    }
  } catch (txtErr: unknown) {
    const code = (txtErr as NodeJS.ErrnoException).code
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      status = 'pending'
      error = 'TXT kaydı bulunamadı veya hatalı'
    } else {
      status = 'pending'
      error = 'DNS sorgulanamadı, daha sonra tekrar deneyin'
    }
  }

  // 3) Vercel konfigürasyonu kontrolü
  let vercelConfigured = false
  if (status === 'active') {
    vercelConfigured = await checkVercelDomain(domain)
    if (!vercelConfigured) {
      error = 'Vercel SSL henüz hazır değil, bekleniyor...'
    }
  }

  // Profili güncelle
  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({
      brand_domain_status: status,
      brand_domain_error: error,
      brand_domain_last_check_at: now,
    })
    .eq('id', user.id)

  clearBrandCache(user.id, domain!)

  return NextResponse.json({ status, error, checkedAt: now, vercelConfigured })
}
