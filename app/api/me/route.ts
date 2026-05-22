import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/me — mevcut kullanıcının rolünü döndür
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: (profile?.role as string) || 'member',
  })
}
