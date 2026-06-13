import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitDb } from '@/lib/rate-limit'

// POST /api/account/delete — hesabı + tüm verileri + auth kullanıcısını sil
// Daha önce istemci tarafında yapılıyordu; auth.users SİLİNMİYORDU,
// aynı e-postayla yeniden kayıt mümkün olmuyordu.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
  }

  // O-1 + K-2: hesap silme abuse'unu önlemek için dağıtık rate limit
  if (!(await rateLimitDb(`account-delete:${user.id}`, 3, 60_000))) {
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
  }

  // E-posta onayı: kazara silmeyi engelle
  const body = await request.json().catch(() => null)
  if (!body?.confirmEmail || body.confirmEmail !== user.email) {
    return NextResponse.json({ error: 'Email onayi gerekli' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Kullanıcının SAHİBİ olduğu tenant'ı bul (üyelikler tenant_members'ta;
  //    başka tenantlardaki üyelikler sadece silinir, o tenantlara dokunulmaz)
  const { data: ownedTenant } = await admin
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedTenant?.id) {
    // Ekip üyesi varsa: başka kişilerin verisini silmemek için engelle
    const { count: memberCount } = await admin
      .from('tenant_members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ownedTenant.id)

    if ((memberCount || 0) > 1) {
      return NextResponse.json({
        error: 'Ekibinizde başka üyeler var. Hesabınızı silmeden önce ekip üyelerini kaldırın.',
      }, { status: 400 })
    }
  }

  // FK güvenliği: aktif tenant referansını sıfırla, tüm üyelikleri kaldır
  await admin.from('profiles').update({ active_tenant_id: null }).eq('id', user.id)
  await admin.from('tenant_members').delete().eq('user_id', user.id)

  if (ownedTenant?.id) {
    // Tenant'ı sil — FK cascade ile clients/invoices/files/payments/webhook* siliner
    await admin.from('tenants').delete().eq('id', ownedTenant.id)
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
