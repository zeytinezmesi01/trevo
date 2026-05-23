import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/account/delete — hesabı + tüm verileri + auth kullanıcısını sil
// Daha önce istemci tarafında yapılıyordu; auth.users SİLİNMİYORDU,
// aynı e-postayla yeniden kayıt mümkün olmuyordu.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
  }

  // E-posta onayı: kazara silmeyi engelle
  const body = await request.json().catch(() => null)
  const confirmEmail = body?.email
  if (!confirmEmail || confirmEmail !== user.email) {
    return NextResponse.json({ error: 'E-posta onayı gerekli. Hesabınızı silmek için e-posta adresinizi girin.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Kullanıcının tenant'ını bul
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.tenant_id) {
    // Ekip üyesi varsa: başka kişilerin verisini silmemek için engelle
    const { count: memberCount } = await admin
      .from('tenant_members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)

    if ((memberCount || 0) > 1) {
      return NextResponse.json({
        error: 'Ekibinizde başka üyeler var. Hesabınızı silmeden önce ekip üyelerini kaldırın.',
      }, { status: 400 })
    }

    // FK güvenliği için profile.tenant_id'yi nullify et (NO ACTION FK olabilir)
    await admin.from('profiles').update({ tenant_id: null, role: null }).eq('id', user.id)
    // Kendi tenant_members kaydını sil (savunma amaçlı)
    await admin.from('tenant_members').delete().eq('user_id', user.id)
    // Tenant'ı sil — FK cascade ile clients/invoices/files/payments/webhook* siliner
    await admin.from('tenants').delete().eq('id', profile.tenant_id)
  }

  // 2. Profili sil
  await admin.from('profiles').delete().eq('id', user.id)

  // 3. KRİTİK: Auth kullanıcısını sil — aynı e-postayla yeniden kayıt için şart
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('Auth kullanıcısı silinemedi:', authError)
    return NextResponse.json({
      error: 'Hesap silinirken bir hata oluştu',
    }, { status: 500 })
  }

  // 4. Oturumu sonlandır (cookie/session temizliği)
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
