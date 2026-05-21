import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
