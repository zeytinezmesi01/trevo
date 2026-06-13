import { NextResponse } from 'next/server'
import { getTenantContextApi } from '@/lib/tenant/auth'

// GET /api/me — mevcut kullanıcının aktif tenant'taki rolünü döndür
export async function GET() {
  try {
    const ctx = await getTenantContextApi()
    return NextResponse.json({
      id: ctx.userId,
      role: ctx.role || 'member',
      tenantId: ctx.tenantId,
    })
  } catch (e) {
    const status = (e as Error & { status?: number }).status || 401
    return NextResponse.json({ error: 'Oturum bulunamadı' }, { status })
  }
}
