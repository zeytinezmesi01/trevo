import { NextResponse, after } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canManageClients } from '@/lib/tenant/permissions'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export async function GET() {
  const ctx = await getTenantContext()
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  const supabase = await createClient()
  const body = await request.json()
  if (!body.name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })
  if (!canManageClients(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

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
