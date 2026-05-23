import { NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export const runtime = 'nodejs'

const AMOUNT_TOLERANCE = 1 // TL cinsinden tolere edilebilir fark

// POST /api/payments/callback — iyzico (veya mock) ödeme sonucunu bildirir
export async function POST(request: Request) {
  // RLS bypass: callback iyzico'dan anon olarak gelir — admin client kullan
  const admin = createAdminClient()

  // Sadece POST gövdesinden token oku (A-2: query string'den okuma kaldırıldı)
  const bodyText = await request.text()

  let token: string | null = null

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(bodyText)
    token = params.get('token')
  } else {
    try {
      const body = JSON.parse(bodyText)
      token = body.token || null
    } catch {
      return NextResponse.json({ error: 'Geçersiz gövde' }, { status: 400 })
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Token eksik' }, { status: 400 })
  }

  // Token ile payments kaydını bul
  const { data: payment } = await admin
    .from('payments')
    .select('*, invoices!inner(id, tenant_id, invoice_number, client_name, status, total, amount_paid)')
    .eq('payment_token', token)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: 'Ödeme bulunamadı' }, { status: 404 })
  }

  // Yardımcı: sonuç sayfasına yönlendir
  const buildResultRedirect = async () => {
    const { data: c } = await admin
      .from('clients')
      .select('token')
      .eq('id', payment.client_id)
      .maybeSingle()

    if (c?.token) {
      const host = request.headers.get('host') || 'localhost:3000'
      const protocol = host.includes('localhost') ? 'http' : 'https'
      return NextResponse.redirect(
        `${protocol}://${host}/portal/${c.token}/odeme-sonuc?payment=${payment.id}`,
        302,
      )
    }
    return NextResponse.json({ status: 'processed' })
  }

  const invoice = payment.invoices as unknown as {
    id: string
    tenant_id: string
    invoice_number: string
    client_name: string
    status: string
    total: number
    amount_paid: number
  }

  // Provider'dan sonucu sorgula
  const { data: tenant } = await admin
    .from('tenants')
    .select('iyzico_api_key, iyzico_secret_key, iyzico_mode')
    .eq('id', payment.tenant_id)
    .maybeSingle()

  const provider = getPaymentProvider(tenant || {})

  // A-2: iyzico imza doğrulaması (gerçek provider için)
  if (provider.name === 'iyzico') {
    const signature = request.headers.get('x-iyz-signature')
    if (!provider.verifyCallbackSignature(bodyText, signature)) {
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 })
    }
  }

  try {
    const result = await provider.retrieveCheckoutResult(token)

    if (result.status === 'success') {
      const paidPrice = result.paidPrice ?? payment.amount

      // A-3: Tutar doğrulaması
      const expectedAmount = Number(payment.amount)
      const actualAmount = Number(paidPrice)
      if (Math.abs(actualAmount - expectedAmount) > AMOUNT_TOLERANCE) {
        await admin
          .from('payments')
          .update({
            status: 'failed',
            error_message: `Tutar uyuşmazlığı: beklenen ${expectedAmount}, alınan ${actualAmount}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
        return buildResultRedirect()
      }

      // A-1: Atomik ödeme işleme (TOCTOU fix)
      const { data: rpcResult } = await admin
        .rpc('apply_payment_success', {
          p_payment_id: payment.id,
          p_paid_price: paidPrice,
        })
        .maybeSingle()

      const applied = rpcResult as { applied: boolean; current_status: string } | null

      // Zaten uygulanmışsa finansal güncelleme atla
      if (applied && !applied.applied) {
        return buildResultRedirect()
      }

      // A-4: Sadece gerekli alanları provider_response'a yaz
      const safeResponse: Record<string, unknown> = {}
      if (typeof result.raw === 'object' && result.raw) {
        const allowedFields = ['paymentId', 'status', 'errorCode', 'paidPrice', 'paymentStatus', 'conversationId']
        for (const key of allowedFields) {
          if (key in result.raw) safeResponse[key] = result.raw[key]
        }
        safeResponse['token'] = result.raw['token']
      }

      // Provider_response'ı güncelle (PII alanları ayıklanmış)
      await admin
        .from('payments')
        .update({
          provider_payment_id: result.providerPaymentId,
          provider_response: safeResponse,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      // B: Ödeme sonrası fatura durumunu oku (gerçek değerler için)
      const { data: invoiceAfter } = await admin
        .from('invoices')
        .select('amount_paid, status')
        .eq('id', payment.invoice_id)
        .maybeSingle()

      // Webhook event'leri
      after(() => {
        const pId = payment.id as string
        const invId = payment.invoice_id as string
        const tId = payment.tenant_id as string

        dispatchEvent(tId, WEBHOOK_EVENTS.PAYMENT_SUCCEEDED, {
          id: pId,
          invoice_id: invId,
          amount: paidPrice,
          status: 'success',
        }).catch(() => {})

        // B: INVOICE_PAID'i yalnızca fatura tamamen ödendiyse gönder;
        // amount_paid ve status'u gerçek DB değerlerinden al
        if (invoiceAfter?.status === 'paid') {
          dispatchEvent(tId, WEBHOOK_EVENTS.INVOICE_PAID, {
            id: invId,
            invoice_number: invoice.invoice_number,
            client_name: invoice.client_name,
            amount_paid: Number(invoiceAfter.amount_paid || 0),
            total: invoice.total,
            status: 'paid',
          }).catch(() => {})
        }
      })

      // Tenant owner'a e-posta bildirimi
      await sendPaymentNotification({
        tenantId: payment.tenant_id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        amount: paidPrice,
        paymentId: payment.id,
      }).catch(() => {})
    } else {
      // A-4: Başarısız ödemede de sadece gerekli alanlar
      const safeResponse: Record<string, unknown> = {}
      if (typeof result.raw === 'object' && result.raw) {
        const allowedFields = ['paymentId', 'status', 'errorCode', 'paidPrice', 'errorMessage']
        for (const key of allowedFields) {
          if (key in result.raw) safeResponse[key] = result.raw[key]
        }
      }

      await admin
        .from('payments')
        .update({
          status: 'failed',
          provider_payment_id: result.providerPaymentId,
          error_message: 'Ödeme tamamlanamadı',
          provider_response: safeResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
    }
  } catch (e) {
    await admin
      .from('payments')
      .update({
        status: 'failed',
        error_message: e instanceof Error ? e.message : 'Callback hatası',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
  }

  return buildResultRedirect()
}

async function sendPaymentNotification(params: {
  tenantId: string
  invoiceNumber: string
  clientName: string
  amount: number
  paymentId: string
}): Promise<void> {
  const { Resend } = await import('resend')
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const admin = createAdminClient()

  // Tenant owner'ın e-posta adresini bul
  const { data: owner } = await admin
    .from('tenant_members')
    .select('user_id')
    .eq('tenant_id', params.tenantId)
    .eq('role', 'owner')
    .maybeSingle()

  if (!owner) return

  const { data: user } = await admin.auth.admin.getUserById(owner.user_id)
  const ownerEmail = user?.user?.email
  if (!ownerEmail) return

  const { data: profile } = await admin
    .from('profiles')
    .select('brand_name')
    .eq('id', owner.user_id)
    .maybeSingle()

  const resend = new Resend(apiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'bildirim@trevo-delta.vercel.app'
  const brandName = profile?.brand_name || 'Trevo'

  // F: escapeHtml
  const safeClientName = escapeHtml(params.clientName)
  const safeInvoiceNumber = escapeHtml(params.invoiceNumber)
  const safeBrandName = escapeHtml(brandName)

  await resend.emails.send({
    from: `Trevo <${fromEmail}>`,
    to: ownerEmail,
    subject: `Ödeme alındı — ${params.invoiceNumber}`,
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:20px;">✅ Ödeme Alındı</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#64748b;font-size:14px;">
            <strong style="color:#0f172a;">${safeClientName}</strong> tarafından
            <strong style="color:#0f172a;">${safeInvoiceNumber}</strong> numaralı fatura için
            <strong style="color:#0f172a;font-size:18px;">₺${params.amount.toFixed(2)}</strong> tutarında ödeme alındı.
          </p>
          <p style="margin:0;color:#94a3b8;font-size:12px;">${safeBrandName} — Otomatik ödeme bildirimi</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

// F: HTML escape yardımcısı
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
