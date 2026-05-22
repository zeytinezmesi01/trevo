import { NextResponse, after } from 'next/server'
import { authenticateApiRequestOrThrow } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasMinRole } from '@/lib/tenant/permissions'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export const runtime = 'nodejs'

async function authHandler(request: Request) {
  const auth = await authenticateApiRequestOrThrow(request)
  return { ...auth, admin: createAdminClient() }
}

function handleApiError(e: unknown) {
  const msg = e instanceof Error ? e.message : 'Yetkisiz'
  const status = (e as Error & { status?: number }).status || 401
  return NextResponse.json({ error: msg }, { status })
}

// GET /api/v1/clients
export async function GET(request: Request) {
  try {
    const { tenantId, admin } = await authHandler(request)
    const url = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 1), 100)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

    const { data, error } = await admin
      .from('clients')
      .select('id, name, company, email, phone, tax_office, tax_number, address, city, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('v1 GET clients error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (e: unknown) {
    return handleApiError(e)
  }
}

// POST /api/v1/clients
export async function POST(request: Request) {
  try {
    const { tenantId, role, admin } = await authHandler(request)
    if (!hasMinRole(role, 'member')) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name alanı zorunludur' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('clients')
      .insert({
        tenant_id: tenantId,
        user_id: null,
        name: body.name,
        company: body.company || null,
        email: body.email || null,
        phone: body.phone || null,
        tax_office: body.tax_office || null,
        tax_number: body.tax_number || null,
        address: body.address || null,
        city: body.city || null,
      })
      .select('id, name, company, email, created_at')
      .single()

    if (error) {
      console.error('v1 POST clients error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }

    after(() => {
      dispatchEvent(tenantId, WEBHOOK_EVENTS.CLIENT_CREATED, {
        id: data.id,
        name: data.name,
        company: data.company,
        email: data.email,
      }).catch(() => {})
    })

    return NextResponse.json(data, { status: 201 })
  } catch (e: unknown) {
    return handleApiError(e)
  }
}
