import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api/helpers'
import { hasMinRole } from '@/lib/tenant/permissions'
import { encryptSecret } from '@/lib/crypto'

export const runtime = 'nodejs'

// GET /api/v1/webhooks — bu tenant'ın webhook abonelikleri
export async function GET(request: Request) {
  return withApiAuth(request, async ({ tenantId, admin }) => {
    const { data, error } = await admin
      .from('webhook_endpoints')
      .select('id, url, events, active, description, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('v1 GET webhooks error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }
    return NextResponse.json(data || [])
  })
}

// POST /api/v1/webhooks — webhook aboneliği oluştur (Zapier REST hook)
export async function POST(request: Request) {
  return withApiAuth(request, async ({ tenantId, role, admin }) => {
    if (!hasMinRole(role, 'admin')) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }
    const body = await request.json()

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'url zorunludur' }, { status: 400 })
    }
    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'events dizisi zorunludur' }, { status: 400 })
    }

    const rawSecret = crypto.randomBytes(32).toString('hex')
    const secret = encryptSecret(rawSecret)

    const { data, error } = await admin
      .from('webhook_endpoints')
      .insert({
        tenant_id: tenantId,
        url: body.url,
        secret,
        events: body.events,
        active: true,
        description: body.description || null,
        created_by: null,
      })
      .select('id, url, events, active, description, created_at')
      .single()

    if (error) {
      console.error('v1 POST webhooks error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  })
}
