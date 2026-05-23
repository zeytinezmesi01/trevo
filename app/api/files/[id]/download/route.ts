import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getR2Client, getR2Bucket, R2_PUBLIC_URL } from '@/lib/r2/client'

export const runtime = 'nodejs'

// GET /api/files/[id]/download — dosyayı R2'den stream eder, erişim kontrolü yapar
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const portalToken = searchParams.get('token')

  // Admin client ile dosyayı bul (tenant bağımsız sorgu)
  const admin = createAdminClient()
  const { data: file } = await admin
    .from('files')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!file) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  // Erişim kontrolü: ya dashboard kullanıcısı (aynı tenant) ya da portal token (dosyanın sahibi)
  let authorized = false

  if (portalToken) {
    // Portal token ile erişim — client'in dosyası mı kontrol et
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('token', portalToken)
      .maybeSingle()

    if (client && file.client_id === client.id) {
      authorized = true
    }
  } else {
    // Dashboard kullanıcısı — aynı tenant üyesi mi kontrol et
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.tenant_id === file.tenant_id) {
        authorized = true
      }
    }
  }

  if (!authorized) {
    // Y-6: ID enumerasyonunu engellemek için 404 dön
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  // R2'den stream et
  const key = file.url?.replace(`${R2_PUBLIC_URL}/`, '')
  if (!key) {
    return NextResponse.json({ error: 'Dosya kaynağı bulunamadı' }, { status: 404 })
  }

  try {
    const obj = await getR2Client().send(new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }))
    if (!obj.Body) {
      return NextResponse.json({ error: 'Dosya içeriği bulunamadı' }, { status: 404 })
    }

    const bytes = await obj.Body.transformToByteArray()

    const contentType = obj.ContentType || 'application/octet-stream'
    // E-3: RFC 5987 encoding for Turkish characters
    const safeFilename = file.name.replace(/"/g, "'")
    const disposition = file.name
      ? `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
      : 'attachment'

    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Dosya okunamadı' }, { status: 500 })
  }
}
