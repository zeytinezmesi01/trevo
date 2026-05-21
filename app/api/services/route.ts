import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await getTenantContext()
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
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
    .from('services')
    .insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      name: body.name,
      price: body.price != null && body.price !== '' ? Number(body.price) : null,
      delivery: body.delivery || null,
      description: body.description || null,
      status: body.status || 'Aktif',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
