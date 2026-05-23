import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

// GET /api/invitations/lookup?token=xxx — davet bilgilerini token ile sorgula (anon erişim)
export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`invite-lookup:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('team_invitations')
    .select('email, tenant_id')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ error: 'Davet bulunamadı' }, { status: 404 })
  }

  return NextResponse.json(data)
}
