import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cleanupAutoCreatedTenant } from '@/lib/tenant/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum acmaniz gerekiyor' }, { status: 401 })
  }

  if (!rateLimit(`regkey-consume:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const key = body?.key as string | undefined
  if (!key) {
    return NextResponse.json({ error: 'Key gerekli' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Y-16: DB'de hash saklanır; raw key gelir, hash'leyip karşılaştırırız
  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  // Key'i bul
  const { data: keyData } = await admin
    .from('registration_keys')
    .select('id, tenant_id, email, role, used_at, expires_at')
    .eq('key', keyHash)
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

  // Çoklu tenant: eski üyelikler korunur; KEY'in tenant'ı aktif yapılır
  const { data: profile } = await admin
    .from('profiles')
    .select('active_tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  const oldTenantId = profile?.active_tenant_id

  await admin
    .from('profiles')
    .update({ active_tenant_id: keyData.tenant_id })
    .eq('id', user.id)

  // Trigger'in auto-created BOŞ tenant'ini temizle (doluysa kalır)
  if (oldTenantId && oldTenantId !== keyData.tenant_id) {
    await cleanupAutoCreatedTenant(user.id, oldTenantId)
  }

  return NextResponse.json({ ok: true, role: keyData.role })
}
