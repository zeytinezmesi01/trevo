import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api/helpers'

export const runtime = 'nodejs'

// DELETE /api/v1/webhooks/[id] — abonelik sil
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ tenantId, admin }) => {
    const { id } = await params

    const { data: existing } = await admin
      .from('webhook_endpoints')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    await admin.from('webhook_endpoints').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  })
}
