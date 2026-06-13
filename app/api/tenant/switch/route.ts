import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/tenant/switch — aktif tenant'ı değiştir.
// Üyelik doğrulaması RLS altında yapılır: tenant_members yalnızca kullanıcının
// kendi üyeliklerini döndürür; üyesi olmadığı tenant'a geçemez.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const tenantId = body?.tenantId as string | undefined
  if (!tenantId) return NextResponse.json({ error: 'tenantId gerekli' }, { status: 400 })

  const { data: membership } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Bu işletmeye üye değilsiniz' }, { status: 403 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ active_tenant_id: tenantId })
    .eq('id', user.id)

  if (error) {
    console.error('Tenant switch error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tenantId })
}
