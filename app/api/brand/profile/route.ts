import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`brand-profile:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('id')

  if (!profileId) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  }

  // Yalnızca kendi profilini sorgulayabilir
  if (profileId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data } = await supabase
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
