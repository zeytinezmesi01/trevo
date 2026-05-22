import { NextResponse } from 'next/server'
import { authenticateApiRequestOrThrow } from './auth'
import { createAdminClient } from '@/lib/supabase/admin'

export type ApiHandler = (params: {
  tenantId: string
  apiKeyId: string
  role: string
  admin: ReturnType<typeof createAdminClient>
  request: Request
}) => Promise<Response>

/** Public API route'ları için sarmalayıcı — kimlik doğrulama + hata yönetimi */
export async function withApiAuth(request: Request, handler: ApiHandler): Promise<Response> {
  try {
    const auth = await authenticateApiRequestOrThrow(request)
    const admin = createAdminClient()
    return await handler({
      tenantId: auth.tenantId,
      apiKeyId: auth.apiKeyId,
      role: auth.role,
      admin,
      request,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Yetkisiz'
    const status = (e as Error & { status?: number }).status || 401
    return NextResponse.json({ error: msg }, { status })
  }
}

/** Sayfalama: ?limit (varsayılan 25, maks 100), ?offset (varsayılan 0) */
export function parsePagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 1), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)
  return { limit, offset }
}
