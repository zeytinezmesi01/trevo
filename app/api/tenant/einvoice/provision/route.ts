import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { getEInvoiceProvider } from '@/lib/einvoice'

export async function POST() {
  const ctx = await getTenantContext()

  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const supabase = await createClient()

  // Satıcı bilgilerini HER ZAMAN tenant sahibinden oku
  const { data: tenantRec } = await supabase
    .from('tenants')
    .select('owner_id')
    .eq('id', ctx.tenantId)
    .single()

  const sellerUserId = tenantRec?.owner_id || ctx.userId

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, company_tax_office, company_tax_number, company_address, company_city, company_phone, brand_name')
    .eq('id', sellerUserId)
    .maybeSingle()

  if (!profile?.company_tax_number) {
    return NextResponse.json({
      error: 'Vergi numarası girilmemiş. Lütfen önce profil sayfasından şirket bilgilerinizi güncelleyin.',
    }, { status: 400 })
  }

  if (!profile?.company_name && !profile?.brand_name) {
    return NextResponse.json({
      error: 'Şirket adı girilmemiş. Lütfen önce profil sayfasından şirket bilgilerinizi güncelleyin.',
    }, { status: 400 })
  }

  try {
    const provider = getEInvoiceProvider()
    const result = await provider.provisionTenant({
      taxNumber: profile.company_tax_number,
      taxOffice: profile.company_tax_office || '',
      name: profile.company_name || profile.brand_name || '',
      alias: `trevo-${ctx.tenantId.slice(0, 8)}`,
      address: profile.company_address || undefined,
      city: profile.company_city || undefined,
      phone: profile.company_phone || undefined,
    })

    await supabase
      .from('tenants')
      .update({
        einvoice_enabled: true,
        einvoice_provider: provider.name,
        einvoice_account_id: result.accountId,
        einvoice_alias: result.alias,
        einvoice_registered_at: new Date().toISOString(),
      })
      .eq('id', ctx.tenantId)

    return NextResponse.json({ ok: true, accountId: result.accountId })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Provision hatası',
    }, { status: 500 })
  }
}
