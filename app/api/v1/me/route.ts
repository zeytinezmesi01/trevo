import { NextResponse } from 'next/server'
import { authenticateApiRequestOrThrow } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// GET /api/v1/me — Zapier bağlantı testi
export async function GET(request: Request) {
  try {
    const auth = await authenticateApiRequestOrThrow(request)
    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .maybeSingle()

    return NextResponse.json({
      tenantId: auth.tenantId,
      tenantName: tenant?.name || 'İşletmem',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Yetkisiz'
    const status = (e as Error & { status?: number }).status || 401
    return NextResponse.json({ error: msg }, { status })
  }
}
