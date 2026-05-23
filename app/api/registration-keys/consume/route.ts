import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum acmaniz gerekiyor' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const key = body?.key as string | undefined
  if (!key) {
    return NextResponse.json({ error: 'Key gerekli' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Key'i bul
  const { data: keyData } = await admin
    .from('registration_keys')
    .select('id, tenant_id, email, role, used_at, expires_at')
    .eq('key', key)
    .maybeSingle()

  if (!keyData) {
    return NextResponse.json({ error: 'Gecersiz kayit anahtari' }, { status: 400 })
  }

  if (keyData.used_at) {
    return NextResponse.json({ error: 'Bu anahtar zaten kullanilmis' }, { status: 400 })
  }

  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Kayit anahtarinin suresi dolmus' }, { status: 400 })
  }

  if (keyData.email !== user.email) {
    return NextResponse.json({ error: 'Bu anahtar farkli bir e-posta icin olusturulmus' }, { status: 400 })
  }

  // Key'i tuket
  await admin
    .from('registration_keys')
    .update({ used_at: new Date().toISOString() })
    .eq('id', keyData.id)

  // Tenant'a ekle
  const { data: existingMember } = await admin
    .from('tenant_members')
    .select('id, status')
    .eq('tenant_id', keyData.tenant_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    if (existingMember.status !== 'active') {
      await admin
        .from('tenant_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('id', existingMember.id)
    }
  } else {
    await admin
      .from('tenant_members')
      .insert({
        tenant_id: keyData.tenant_id,
        user_id: user.id,
        role: keyData.role,
        status: 'active',
        joined_at: new Date().toISOString(),
      })
  }

  // Profili guncelle (eger tenant'i yoksa)
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.tenant_id) {
    await admin
      .from('profiles')
      .update({ tenant_id: keyData.tenant_id, role: keyData.role })
      .eq('id', user.id)
  }

  return NextResponse.json({ ok: true, role: keyData.role })
}
