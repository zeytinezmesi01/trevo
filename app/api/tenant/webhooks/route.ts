import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret } from '@/lib/crypto'

export const runtime = 'nodejs'

const WEBHOOK_LIST_FIELDS = 'id, url, events, active, description, created_at, updated_at'

// GET /api/tenant/webhooks
export async function GET(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  // O-27: pagination
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

  const supabase = await createClient()
  const { data } = await supabase
    .from('webhook_endpoints')
    .select(WEBHOOK_LIST_FIELDS)
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json(data || [])
}

// POST /api/tenant/webhooks
export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await request.json()
  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'URL zorunludur' }, { status: 400 })
  }
  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: 'En az bir event seçilmelidir' }, { status: 400 })
  }

  const rawSecret = crypto.randomBytes(32).toString('hex')
  // D-2: Secret'ı şifreli sakla
  const encryptedSecret = encryptSecret(rawSecret)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('webhook_endpoints')
    .insert({
      tenant_id: ctx.tenantId,
      url: body.url,
      secret: encryptedSecret,
      events: body.events,
      active: body.active !== false,
      description: body.description || null,
      created_by: ctx.userId,
    })
    .select(WEBHOOK_LIST_FIELDS)
    .single()

  if (error) {
    console.error('Webhook oluşturma hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
  // Y-5: rawSecret yalnızca oluşturma response'unda gösterilir
  return NextResponse.json(
    {
      ...data,
      secret: rawSecret,
      secretNote: 'Bu secret yalnızca bir kez gösterilir. Kaydedin.',
    },
    { status: 201 },
  )
}
