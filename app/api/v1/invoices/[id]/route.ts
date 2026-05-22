import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api/helpers'

export const runtime = 'nodejs'

// GET /api/v1/invoices/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ tenantId, admin }) => {
    const { id } = await params

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const { data: items } = await admin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ ...invoice, items: items || [] })
  })
}
