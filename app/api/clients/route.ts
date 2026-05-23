import { NextResponse, after } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canManageClients } from '@/lib/tenant/permissions'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'
import { isValidEmail, isValidVkn, isValidPhone } from '@/lib/validation'

export async function GET(request: Request) {
  const ctx = await getTenantContext()
  // O-27: pagination
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  const supabase = await createClient()
  const body = await request.json()
  if (!body.name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })
  if (!canManageClients(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  // O-15: input validasyonu
  if (body.email && !isValidEmail(body.email)) {
    return NextResponse.json({ error: 'Geçersiz e-posta' }, { status: 400 })
  }
  if (body.tax_number && !isValidVkn(body.tax_number)) {
    return NextResponse.json({ error: 'Geçersiz vergi numarası' }, { status: 400 })
  }
  if (body.phone && !isValidPhone(body.phone)) {
    return NextResponse.json({ error: 'Geçersiz telefon' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      tax_office: body.tax_office || null,
      tax_number: body.tax_number || null,
      address: body.address || null,
      city: body.city || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('POST clients error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }

  const clientData = data
  const tenantId = ctx.tenantId

  after(() => {
    dispatchEvent(tenantId, WEBHOOK_EVENTS.CLIENT_CREATED, {
      id: clientData.id,
      name: clientData.name,
      company: clientData.company || null,
      email: clientData.email || null,
    }).catch(() => {})
  })

  return NextResponse.json(data)
}
