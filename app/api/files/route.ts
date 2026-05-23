import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const ctx = await getTenantContext()
  // O-27: pagination
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  const supabase = await createClient()
  const { data } = await supabase
    .from('files')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return NextResponse.json(data || [])
}
