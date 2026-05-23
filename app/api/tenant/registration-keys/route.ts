import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canInviteMembers } from '@/lib/tenant/permissions'
import { isValidEmail } from '@/lib/validation'

export async function GET(request: Request) {
  const ctx = await getTenantContext()
  // O-27: pagination
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registration_keys')
    .select('id, email, role, used_at, expires_at, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

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
  // O-15: e-posta formati
  if (!isValidEmail(body.email)) {
    return NextResponse.json({ error: 'Gecersiz e-posta' }, { status: 400 })
  }

  const { email, role } = body
  const allowedRoles = ['admin', 'member', 'viewer']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Gecersiz rol. admin, member veya viewer secin' }, { status: 400 })
  }

  // Y-16: Raw key kullanıcıya bir kez gösterilir; DB'de yalnızca SHA-256 hash'i tutulur
  const rawKey = crypto.randomBytes(24).toString('hex')
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const supabase = await createClient()

  const { error } = await supabase
    .from('registration_keys')
    .insert({
      tenant_id: ctx.tenantId,
      email: email.trim().toLowerCase(),
      role,
      key: keyHash,
      created_by: ctx.userId,
    })

  if (error) {
    return NextResponse.json({ error: 'Key olusturulamadi' }, { status: 500 })
  }

  return NextResponse.json({
    key: rawKey,
    email: email.trim().toLowerCase(),
    role,
    keyNote: 'Bu anahtar yalnızca bir kez gösterilir. Kaydedin.',
  })
}
