import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantContextApi } from '@/lib/tenant/auth'
import crypto from 'crypto'

const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

const BLOCKED_DOMAINS = ['trevo-delta.vercel.app', 'localhost']

async function addDomainToVercel(domain: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!token || !projectId) {
    return { ok: false, error: 'Vercel API yapılandırılmamış (env eksik)' }
  }

  const teamId = process.env.VERCEL_TEAM_ID
  const teamParam = teamId ? `?teamId=${teamId}` : ''

  try {
    // Önce domain zaten ekli mi kontrol et
    const checkRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}${teamParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (checkRes.ok) {
      return { ok: true } // zaten ekli
    }

    // Domain'i Vercel projesine ekle
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains${teamParam}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    )

    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.error?.message || 'Vercel API hatası' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Vercel API çağrısı başarısız' }
  }
}

export async function POST(request: Request) {
  let ctx
  try {
    ctx = await getTenantContextApi()
  } catch (e) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.domain !== 'string') {
    return NextResponse.json({ error: 'Domain gerekli' }, { status: 400 })
  }

  const domain = body.domain.trim().toLowerCase()

  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: 'Geçersiz domain formatı' }, { status: 400 })
  }

  if (BLOCKED_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) {
    return NextResponse.json({ error: 'Bu domain kullanılamaz' }, { status: 400 })
  }

  const token = crypto.randomBytes(16).toString('hex')

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      brand_domain: domain,
      brand_domain_status: 'pending',
      brand_domain_verification_token: token,
      brand_domain_error: null,
    })
    .eq('id', ctx.userId)

  if (error) {
    return NextResponse.json({ error: 'Güncelleme hatası: ' + error.message }, { status: 500 })
  }

  // Vercel'e domain ekle (env varsa otomatik, yoksa atla)
  const vercel = await addDomainToVercel(domain)

  return NextResponse.json({
    domain,
    token,
    cname: { name: domain, value: 'cname.vercel-dns.com' },
    txt: { name: '_trevo-verify.' + domain, value: token },
    vercel,
  })
}
