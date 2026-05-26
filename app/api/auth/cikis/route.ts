import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (origin && appUrl && origin !== appUrl) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  const url = new URL('/giris', request.url)
  return NextResponse.redirect(url)
}
