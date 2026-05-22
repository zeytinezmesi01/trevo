import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'

import { getTenantContext } from '@/lib/tenant/auth'
import { generateAndStoreInvoicePDF } from '@/lib/pdf/generate-invoice'
import { createClient } from '@/lib/supabase/server'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params

  const supabase = await createClient()
  const { data: inv } = await supabase
    .from('invoices')
    .select('pdf_url, pdf_generated_at, updated_at')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!inv) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  let pdfUrl = inv.pdf_url
  if (!pdfUrl || !inv.pdf_generated_at || new Date(inv.updated_at) > new Date(inv.pdf_generated_at)) {
    try {
      pdfUrl = await generateAndStoreInvoicePDF(id, ctx.tenantId)
    } catch (e) {
      console.error('PDF oluşturma hatası:', e)
      return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 })
    }
  }

  if (!pdfUrl) return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 })

  const key = pdfUrl.replace(`${R2_PUBLIC_URL}/`, '')
  const obj = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }))
  if (!obj.Body) return NextResponse.json({ error: 'PDF bulunamadı' }, { status: 404 })

  const bytes = await obj.Body.transformToByteArray()

  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fatura-${id}.pdf"`,
    },
  })
}
