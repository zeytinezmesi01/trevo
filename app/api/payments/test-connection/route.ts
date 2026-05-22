import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { IyzicoPaymentProvider } from '@/lib/payment/iyzico-provider'
import type { IyzicoMode } from '@/lib/payment/types'

export const runtime = 'nodejs'

// POST /api/payments/test-connection — iyzico bağlantısını test et
export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
  }

  const { apiKey, secretKey, mode } = await request.json()

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
