import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/payments/[id]/status — dashboard durum sorgulaması
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTenantContext()
  const { id } = await params

  const supabase = await createClient()
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: 'Ödeme bulunamadı' }, { status: 404 })
  }

  return NextResponse.json(payment)
}
