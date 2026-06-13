import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { NilveraEInvoiceProvider } from '@/lib/einvoice/nilvera-provider'

export const runtime = 'nodejs'

// GET /api/tenant/einvoice/keys — Nilvera anahtar durumu (anahtarı DÖNDÜRMEZ)
export async function GET() {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('nilvera_api_key, nilvera_test_mode, einvoice_enabled')
    .eq('id', ctx.tenantId)
    .single()

  const apiKey = tenant ? decryptSecret(tenant.nilvera_api_key || '') : ''
  return NextResponse.json({
    apiKeySet: !!apiKey,
    testMode: tenant?.nilvera_test_mode ?? true,
    enabled: !!tenant?.einvoice_enabled,
  })
}

// POST /api/tenant/einvoice/keys — anahtarı şifreleyip kaydet + bağlantı testi
export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const { apiKey, testMode } = await request.json().catch(() => ({}))
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Boş anahtar → bağlantıyı kaldır
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    await supabase
      .from('tenants')
      .update({ nilvera_api_key: null, einvoice_enabled: false, updated_at: now })
      .eq('id', ctx.tenantId)
    return NextResponse.json({ ok: true, connected: false })
  }

  // Anahtarı doğrula (401/403 = geçersiz)
  const isTest = testMode !== false
  const provider = new NilveraEInvoiceProvider(apiKey.trim(), isTest)
  const connected = await provider.checkConnection()

  await supabase
    .from('tenants')
    .update({
      nilvera_api_key: encryptSecret(apiKey.trim()),
      nilvera_test_mode: isTest,
      einvoice_provider: 'nilvera',
      // Yalnızca anahtar doğrulanırsa e-fatura aktif sayılır
      einvoice_enabled: connected,
      einvoice_registered_at: connected ? now : null,
      updated_at: now,
    })
    .eq('id', ctx.tenantId)

  return NextResponse.json({ ok: true, connected })
}
