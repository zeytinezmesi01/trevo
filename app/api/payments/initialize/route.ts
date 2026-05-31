import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalClient, getPortalPayableInvoice } from '@/lib/portal/server'
import { getPaymentProvider } from '@/lib/payment'
import { rateLimitDb } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// POST /api/payments/initialize — portal token ile ödeme başlat
export async function POST(request: Request) {
  const body = await request.json()
  const portalToken = body.portalToken
  const invoiceId = body.invoiceId

  if (!portalToken || typeof portalToken !== 'string') {
    return NextResponse.json({ error: 'Geçersiz portal token' }, { status: 400 })
  }

  // O-1 + K-2: portal token başına ödeme başlatma — dağıtık rate limit
  if (!(await rateLimitDb(`payments-init:${portalToken}`, 10, 60_000))) {
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
  }
  if (!invoiceId || typeof invoiceId !== 'string') {
    return NextResponse.json({ error: 'Geçersiz fatura kimliği' }, { status: 400 })
  }

  // K-3: token-scoped RPC'ler — client ve fatura sahipliği SQL'de doğrulanır
  const client = await getPortalClient(portalToken)
  if (!client) {
    return NextResponse.json({ error: 'Geçersiz portal' }, { status: 404 })
  }

  // Fatura yalnızca bu token'ın client'ına aitse döner
  const invoice = await getPortalPayableInvoice(portalToken, invoiceId)
  if (!invoice) {
    return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
  }

  // Zaten ödenmiş mi?
  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Bu fatura zaten ödenmiş' }, { status: 400 })
  }

  // Yazma işlemleri için admin client (değerler RPC'lerle doğrulandı)
  const admin = createAdminClient()

  // Kalan tutar
  const remainingAmount = Number(invoice.total) - Number(invoice.amount_paid || 0)
  if (remainingAmount <= 0) {
    return NextResponse.json({ error: 'Ödenecek tutar kalmamış' }, { status: 400 })
  }

  // Tenant'ı ve provider'ı al
  const { data: tenant } = await admin
    .from('tenants')
    .select('iyzico_api_key, iyzico_secret_key, iyzico_mode')
    .eq('id', invoice.tenant_id)
    .maybeSingle()

  const provider = getPaymentProvider(tenant || {})

  // Payments kaydı oluştur
  const { data: payment } = await admin
    .from('payments')
    .insert({
      tenant_id: invoice.tenant_id,
      invoice_id: invoice.id,
      client_id: client.id,
      amount: remainingAmount,
      currency: 'TRY',
      status: 'pending',
      conversation_id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    })
    .select('id')
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Ödeme kaydı oluşturulamadı' }, { status: 500 })
  }

  // Callback URL — host header injection fix: env'den sabit base URL kullan
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackUrl = `${appUrl}/api/payments/callback`

  // Client IP
  const buyerIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  const nameParts = client.name.trim().split(/\s+/)
  const firstName = nameParts[0] || client.name
  const lastName = nameParts.slice(1).join(' ') || '—'

  // iyzico'yu başlat
  try {
    const result = await provider.initializeCheckout({
      paymentId: payment.id,
      invoiceId: invoice.id,
      amount: remainingAmount,
      currency: 'TRY',
      buyerIp,
      buyer: {
        id: client.id,
        name: firstName,
        surname: lastName,
        email: client.email || `${client.id}@client.trevo.local`,
        // O-17: client.id UUID; iyzico TCKN bekliyor. Sabit test TCKN'si kullan.
        identityNumber: client.tax_number || '11111111111',
        address: client.address || 'Belirtilmemiş',
        city: client.city || 'İstanbul',
        country: 'Turkey',
      },
      basketItems: [
        {
          id: invoice.id,
          name: `${invoice.invoice_number} - ${client.name}`,
          category1: 'Fatura',
          itemType: 'VIRTUAL',
          price: remainingAmount,
        },
      ],
      callbackUrl,
    })

    // Token'ı payments satırına yaz
    await admin
      .from('payments')
      .update({ payment_token: result.token })
      .eq('id', payment.id)

    return NextResponse.json({
      token: result.token,
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
      paymentId: payment.id,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ödeme başlatılamadı'

    await admin
      .from('payments')
      .update({ status: 'failed', error_message: msg })
      .eq('id', payment.id)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
