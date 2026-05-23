import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canCreateInvoices } from '@/lib/tenant/permissions'
import { getInvoice, updateInvoiceStatus } from '@/lib/invoice/server'
import { generateAndStoreInvoicePDF } from '@/lib/pdf/generate-invoice'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/escape-html'
import { rateLimit } from '@/lib/rate-limit'

const FROM = process.env.RESEND_FROM_EMAIL || 'Trevo <bildirim@trevo-delta.vercel.app>'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canCreateInvoices(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  // O-1: fatura gönderim rate limit (e-posta spam koruması)
  if (!rateLimit(`invoice-send:${ctx.tenantId}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
  }
  const { id } = await params

  const invoice = await getInvoice(id, ctx.tenantId)
  if (!invoice) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (!invoice.client_email) return NextResponse.json({ error: 'Müşteri e-postası yok' }, { status: 400 })

  let pdfUrl: string | null = null
  try {
    pdfUrl = await generateAndStoreInvoicePDF(id, ctx.tenantId)
  } catch (e) {
    console.error('PDF oluşturma hatası (send):', e)
  }
  const total = Number(invoice.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })
  const safeTenantName = escapeHtml(ctx.tenantName)
  const safeInvoiceNumber = escapeHtml(invoice.invoice_number as string)

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to: invoice.client_email as string,
      subject: `Faturanız: ${invoice.invoice_number} — ${total} ₺`,
      html: `
<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8edf8;">
        <tr><td style="background:linear-gradient(135deg,#4f7dff,#6a96ff);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;">${safeTenantName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;">Faturanız Hazır</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
            ${safeInvoiceNumber} numaralı faturanız ${total} ₺ tutarındadır.
          </p>
          ${pdfUrl ? `<a href="${escapeHtml(pdfUrl)}" style="display:inline-block;background:#4f7dff;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:600;">Faturayı Görüntüle</a>` : ''}
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">Ödeme bilgileriniz fatura üzerinde yer almaktadır.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    }).catch((err) => { console.error('Email send failed:', err) })
  }

  try {
    await updateInvoiceStatus(id, ctx.tenantId, 'sent', {
      emailed_at: new Date().toISOString(),
      email_to: invoice.client_email as string,
    })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Durum güncellenemedi',
    }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
