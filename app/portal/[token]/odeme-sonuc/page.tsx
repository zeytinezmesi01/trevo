import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePortalBrand } from '@/lib/brand/server'
import { DEFAULT_BRAND } from '@/lib/types/brand'
import BrandStyle from '@/components/brand-style'
import BrandLogo from '@/components/brand-logo'
import { headers } from 'next/headers'

export default async function OdemeSonucPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { token } = await params
  const paymentId = (await searchParams).payment

  if (!paymentId) notFound()

  // RLS bypass: portal token ile anon erişim — admin client kullan
  const admin = createAdminClient()

  // Client kontrolü
  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!client) notFound()

  // Ödeme kaydı
  const { data: payment } = await admin
    .from('payments')
    .select('*, invoices!inner(invoice_number, status, total)')
    .eq('id', paymentId)
    .maybeSingle()

  if (!payment) notFound()

  // H-2: Ödemenin bu client'a ait olduğunu doğrula
  if (payment.client_id !== client.id) notFound()

  const invoice = payment.invoices as unknown as {
    invoice_number: string
    status: string
    total: number
  }

  const headersList = await headers()
  const host = headersList.get('host') || ''
  const brand = await generatePortalBrand(admin, host)
  const defaultedBrand = brand.brandName ? brand : DEFAULT_BRAND

  const isSuccess = payment.status === 'success'

  return (
    <>
      <BrandStyle brand={brand} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <BrandLogo brand={defaultedBrand} className="text-lg font-bold tracking-tight text-primary" />
              <div className="text-xs text-gray-400">Müşteri Portalı</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          {isSuccess ? (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı</h1>
              <p className="text-gray-500 text-sm mb-2">
                <strong>{invoice.invoice_number}</strong> numaralı fatura için
                {' '}<strong>₺{Number(payment.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>{' '}
                tutarında ödemeniz alınmıştır.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Ödeme Tarihi: {new Date(payment.paid_at || payment.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h1>
              <p className="text-gray-500 text-sm mb-2">
                <strong>{invoice.invoice_number}</strong> numaralı fatura için ödemeniz tamamlanamadı.
              </p>
              {payment.error_message && (
                <p className="text-red-500 text-xs mb-8">{payment.error_message}</p>
              )}
              {!payment.error_message && (
                <p className="text-gray-400 text-xs mb-8">Lütfen tekrar deneyin veya firmanızla iletişime geçin.</p>
              )}
            </>
          )}

          <Link
            href={`/portal/${token}`}
            style={{
              display: 'inline-block', marginTop: 16,
              background: '#4f7dff', color: '#fff', textDecoration: 'none',
              padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            }}
          >
            Portale Dön
          </Link>
        </div>
      </div>
    </>
  )
}
