import { NextResponse, after } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { getEInvoiceProvider, generateDocumentNumber, determineDocumentType } from '@/lib/einvoice'
import { buildEInvoicePayload } from '@/lib/einvoice/payload'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

async function getNextDocumentSequence(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string): Promise<number> {
  const { data } = await supabase
    .rpc('next_einvoice_number', { p_tenant_id: tenantId })
    .maybeSingle()
  const row = data as { seq_year: number; seq_number: number } | null
  return row?.seq_number || 1
}

async function loadTenantOwnerProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
) {
  // Tenant sahibini tenants.owner_id üzerinden bul
  const { data: tenant } = await supabase
    .from('tenants')
    .select('owner_id')
    .eq('id', tenantId)
    .single()

  if (!tenant?.owner_id) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, company_tax_office, company_tax_number, company_address, company_city, company_phone, brand_name')
    .eq('id', tenant.owner_id)
    .maybeSingle()

  return profile
}

async function ensureTenantProvisioned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  profile: Record<string, unknown> | null,
): Promise<string> {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('einvoice_enabled, einvoice_account_id, einvoice_alias')
    .eq('id', tenantId)
    .single()

  if (tenant?.einvoice_enabled && tenant?.einvoice_account_id) {
    return tenant.einvoice_account_id
  }

  const provider = getEInvoiceProvider()
  const result = await provider.provisionTenant({
    taxNumber: (profile?.company_tax_number as string) || '',
    taxOffice: (profile?.company_tax_office as string) || '',
    name: (profile?.company_name as string) || (profile?.brand_name as string) || 'İşletmem',
    alias: `trevo-${tenantId.slice(0, 8)}`,
    address: (profile?.company_address as string) || undefined,
    city: (profile?.company_city as string) || undefined,
    phone: (profile?.company_phone as string) || undefined,
  })

  await supabase
    .from('tenants')
    .update({
      einvoice_enabled: true,
      einvoice_account_id: result.accountId,
      einvoice_alias: result.alias,
      einvoice_provider: provider.name,
      einvoice_registered_at: new Date().toISOString(),
    })
    .eq('id', tenantId)

  return result.accountId
}

// POST /api/invoices/[id]/einvoice — e-Belge gönder
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTenantContext()
  const { id } = await params

  // Sadece owner/admin gönderebilir
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const supabase = await createClient()

  // 1. Faturayı yükle
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
  }

  // Zaten gönderilmiş mi?
  if (invoice.einvoice_status && invoice.einvoice_status !== 'none' && invoice.einvoice_status !== 'error') {
    return NextResponse.json({ error: 'Bu fatura zaten e-Belge olarak gönderilmiş' }, { status: 400 })
  }

  // 2. Kalemleri yükle
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order')

  // 3. Satıcı bilgisi — HER ZAMAN tenant sahibinden oku
  const profile = await loadTenantOwnerProfile(supabase, ctx.tenantId)

  if (!profile?.company_tax_number) {
    return NextResponse.json({
      error: 'Satıcı vergi bilgileri eksik. Lütfen önce profil sayfasından şirket bilgilerinizi güncelleyin.',
    }, { status: 400 })
  }

  // 4. Alıcı bilgisi
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', invoice.client_id)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
  }

  // 5. Belge tipini belirle (e-Fatura / e-Arşiv)
  const provider = getEInvoiceProvider()
  const { type: documentType, isEInvoiceUser } = await determineDocumentType(provider, client.tax_number)

  // Mükellef bilgisini cache'le
  await supabase
    .from('clients')
    .update({ einvoice_user: isEInvoiceUser, einvoice_checked_at: new Date().toISOString() })
    .eq('id', client.id)

  // 6. Tenant provision (tenant sahibi profili ile)
  await ensureTenantProvisioned(supabase, ctx.tenantId, profile)

  // 7. Belge numarası üret
  const seq = await getNextDocumentSequence(supabase, ctx.tenantId)
  const documentNumber = generateDocumentNumber(seq)

  // 8. Payload'u oluştur
  const payload = buildEInvoicePayload({
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      currency: invoice.currency || 'TRY',
      subtotal: invoice.subtotal,
      kdv_amount: invoice.kdv_amount,
      kdv_rate: invoice.kdv_rate,
      tevkifat_rate: invoice.tevkifat_rate,
      tevkifat_amount: invoice.tevkifat_amount,
      total: invoice.total,
      notes: invoice.notes,
    },
    items: items || [],
    seller: {
      company_name: profile.company_name,
      company_tax_office: profile.company_tax_office,
      company_tax_number: profile.company_tax_number,
      company_address: profile.company_address,
      company_city: profile.company_city,
      company_phone: profile.company_phone,
      brand_name: profile.brand_name,
    },
    client: {
      name: client.name,
      company: client.company,
      tax_number: client.tax_number,
      tax_office: client.tax_office,
      address: client.address,
      city: client.city,
    },
    documentType,
  })

  // 9. Gönder
  let sendResult
  try {
    sendResult = await provider.sendDocument(payload)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gönderim hatası'

    await supabase.from('einvoice_documents').insert({
      tenant_id: ctx.tenantId,
      invoice_id: id,
      document_type: documentType,
      document_number: documentNumber,
      status: 'error',
      error_message: msg,
    })

    await supabase
      .from('invoices')
      .update({ einvoice_status: 'error', einvoice_type: documentType, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 10. Başarılı kayıt oluştur
  await supabase.from('einvoice_documents').insert({
    tenant_id: ctx.tenantId,
    invoice_id: id,
    document_type: documentType,
    document_number: documentNumber,
    ettn: sendResult.ettn,
    integrator_doc_id: sendResult.integratorDocId,
    status: sendResult.status,
    sent_at: new Date().toISOString(),
  })

  await supabase
    .from('invoices')
    .update({
      einvoice_status: sendResult.status === 'sent' ? 'sent' : 'pending',
      einvoice_type: documentType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  after(() => {
    dispatchEvent(ctx.tenantId, WEBHOOK_EVENTS.EINVOICE_SENT, {
      id,
      invoice_number: invoice.invoice_number,
      document_type: documentType,
      document_number: documentNumber,
      ettn: sendResult.ettn,
      status: sendResult.status,
    }).catch(() => {})
  })

  return NextResponse.json({
    status: sendResult.status,
    document_type: documentType,
    document_number: documentNumber,
    ettn: sendResult.ettn,
    integrator_doc_id: sendResult.integratorDocId,
  })
}

// GET /api/invoices/[id]/einvoice — en son belge durumunu döndür (sorgulamaz, sadece okur)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTenantContext()
  const { id } = await params

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('einvoice_documents')
    .select('*')
    .eq('invoice_id', id)
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json(doc || { status: 'none' })
}
