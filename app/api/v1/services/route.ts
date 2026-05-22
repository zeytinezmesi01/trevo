import { NextResponse } from 'next/server'
import { withApiAuth, parsePagination } from '@/lib/api/helpers'

export const runtime = 'nodejs'

// GET /api/v1/services
export async function GET(request: Request) {
  return withApiAuth(request, async ({ tenantId, admin }) => {
    const url = new URL(request.url)
    const { limit, offset } = parsePagination(url)

    const { data, error } = await admin
      .from('services')
      .select('id, name, price, delivery, description, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('v1 GET services error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }
    return NextResponse.json(data || [])
  })
}
