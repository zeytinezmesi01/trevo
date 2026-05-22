import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api/helpers'

export const runtime = 'nodejs'

// GET /api/v1/clients/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ tenantId, admin }) => {
    const { id } = await params

    const { data, error } = await admin
      .from('clients')
      .select('id, name, company, email, phone, tax_office, tax_number, address, city, token, created_at, updated_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json(data)
  })
}
