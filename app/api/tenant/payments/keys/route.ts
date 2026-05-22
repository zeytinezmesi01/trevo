import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/crypto'

export const runtime = 'nodejs'

// GET /api/tenant/payments/keys — iyzico anahtarlarının varlığını döndür (secret key'i döndürme!)
export async function GET() {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('iyzico_api_key, iyzico_secret_key, iyzico_mode')
    .eq('id', ctx.tenantId)
    .single()

  const apiKey = tenant ? decryptSecret(tenant.iyzico_api_key || '') : ''
  const secretKey = tenant ? tenant.iyzico_secret_key || '' : ''

  return NextResponse.json({
    apiKey,
    secretKeySet: !!secretKey,
    mode: tenant?.iyzico_mode || 'sandbox',
  })
}

// POST /api/tenant/payments/keys — iyzico anahtarlarını şifreleyip kaydet
export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const { apiKey, secretKey, mode } = await request.json()

  if (mode && !['sandbox', 'production'].includes(mode)) {
    return NextResponse.json({ error: 'Geçersiz ortam. sandbox veya production olmalıdır' }, { status: 400 })
  }

  const supabase = await createClient()
  await supabase
    .from('tenants')
    .update({
      iyzico_api_key: apiKey ? encryptSecret(apiKey) : null,
      iyzico_secret_key: secretKey ? encryptSecret(secretKey) : null,
      iyzico_mode: mode || 'sandbox',
      payments_enabled: !!apiKey,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.tenantId)

  return NextResponse.json({ ok: true })
}
