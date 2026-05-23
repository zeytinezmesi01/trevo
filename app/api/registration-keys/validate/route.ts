import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`regkey-validate:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await request.json().catch(() => null)
  if (!body || !body.key || !body.email) {
    return NextResponse.json({ valid: false })
  }

  const { key, email } = body
  const admin = createAdminClient()

  const { data } = await admin
    .from('registration_keys')
    .select('id, tenant_id, email, role, used_at, expires_at')
    .eq('key', key)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ valid: false })
  }

  if (data.used_at) {
    return NextResponse.json({ valid: false })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false })
  }

  if (data.email !== email.trim().toLowerCase()) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({
    valid: true,
    tenant_id: data.tenant_id,
    role: data.role,
  })
}
