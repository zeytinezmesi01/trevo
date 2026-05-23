import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('id')

  if (!profileId) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color')
    .eq('id', profileId)
    .maybeSingle()

  if (!data) {
    return NextResponse.json(null)
  }

  return NextResponse.json({
    brand_name: data.brand_name,
    brand_logo_url: data.brand_logo_url,
    brand_primary_color: data.brand_primary_color,
  })
}
