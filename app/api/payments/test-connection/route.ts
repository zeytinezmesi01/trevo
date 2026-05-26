import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto'
import { IyzicoPaymentProvider } from '@/lib/payment/iyzico-provider'
import type { IyzicoMode } from '@/lib/payment/types'

export const runtime = 'nodejs'

// POST /api/payments/test-connection — iyzico bağlantısını test et
export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
  }

  const body = await request.json()
  const { testExisting } = body
  let { apiKey, secretKey, mode } = body as { apiKey?: string; secretKey?: string; mode?: string }

  if (testExisting || (!apiKey && !secretKey)) {
    // DB'deki şifreli anahtarları çöz ve test et
    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants')
      .select('iyzico_api_key, iyzico_secret_key, iyzico_mode')
      .eq('id', ctx.tenantId)
      .maybeSingle()

    if (!tenant?.iyzico_api_key || !tenant?.iyzico_secret_key) {
      return NextResponse.json({ success: false, message: 'Kayıtlı iyzico anahtarı bulunamadı' })
    }

    apiKey = decryptSecret(tenant.iyzico_api_key)
    secretKey = decryptSecret(tenant.iyzico_secret_key)
    mode = tenant.iyzico_mode || 'sandbox'
  }

  if (!apiKey || !secretKey) {
    return NextResponse.json({ success: false, message: 'API anahtarları eksik' })
  }

  try {
    const provider = new IyzicoPaymentProvider(apiKey, secretKey, (mode || 'sandbox') as IyzicoMode)
    const result = await provider.testConnection()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: e instanceof Error ? e.message : 'Test başarısız',
    })
  }
}
