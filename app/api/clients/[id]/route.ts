import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const [{ data: files }, { data: invoices }] = await Promise.all([
    supabase
      .from('files')
      .select('id, name, size, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, invoice_date')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ client, files: files || [], invoices: invoices || [] })
}

const EDITABLE = ['name', 'company', 'email', 'phone', 'tax_office', 'tax_number', 'address', 'city'] as const

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const update: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key]
  }

  const { error } = await supabase
    .from('clients')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const supabase = await createClient()
  await supabase.from('clients').delete().eq('id', id).eq('tenant_id', ctx.tenantId)
  return NextResponse.json({ ok: true })
}
