import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await getTenantContext()
  const supabase = await createClient()
  const { data } = await supabase
    .from('files')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
