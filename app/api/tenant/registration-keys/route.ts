import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canInviteMembers } from '@/lib/tenant/permissions'

export async function GET() {
  const ctx = await getTenantContext()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registration_keys')
    .select('id, email, role, used_at, expires_at, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Key\'ler alinamadi' }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()

  // Sadece owner key uretebilir
  if (ctx.role !== 'owner') {
    return NextResponse.json({ error: 'Sadece isletme sahibi kayit anahtari uretebilir' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || !body.email || !body.role) {
    return NextResponse.json({ error: 'Email ve rol gerekli' }, { status: 400 })
  }

  const { email, role } = body
  const allowedRoles = ['admin', 'member', 'viewer']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Gecersiz rol. admin, member veya viewer secin' }, { status: 400 })
  }

  const key = crypto.randomBytes(16).toString('hex')
  const supabase = await createClient()

  const { error } = await supabase
    .from('registration_keys')
    .insert({
      tenant_id: ctx.tenantId,
      email: email.trim().toLowerCase(),
      role,
      key,
      created_by: ctx.userId,
    })

  if (error) {
    return NextResponse.json({ error: 'Key olusturulamadi' }, { status: 500 })
  }

  return NextResponse.json({ key, email: email.trim().toLowerCase(), role })
}
