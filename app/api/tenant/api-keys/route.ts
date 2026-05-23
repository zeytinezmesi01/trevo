import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api/auth'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// GET /api/tenant/api-keys
export async function GET(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  // O-27: pagination
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

  const supabase = await createClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, role, last_used_at, revoked_at, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json(data || [])
}

// POST /api/tenant/api-keys
export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  // O-1: API key oluşturma rate limit
  if (!rateLimit(`api-keys-create:${ctx.tenantId}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
  }

  const { name } = await request.json()
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'İsim zorunludur' }, { status: 400 })
  }

  // D-3: Anahtar rolü, oluşturan kullanıcının rolünü AŞAMAZ
  const insertRole = ctx.role === 'owner' || ctx.role === 'admin' ? ctx.role : 'member'

  const { fullKey, hash, prefix } = generateApiKey()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      tenant_id: ctx.tenantId,
      name,
      key_hash: hash,
      key_prefix: prefix,
      role: insertRole,
      created_by: ctx.userId,
    })
    .select('id, name, key_prefix, role, created_at')
    .single()

  if (error) {
    console.error('POST api-keys error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }

  return NextResponse.json({
    ...data,
    fullKey, // SADECE bu yanıtta gösterilir
  }, { status: 201 })
}
