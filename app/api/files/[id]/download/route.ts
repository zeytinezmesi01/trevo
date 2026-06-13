import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantContextApi } from '@/lib/tenant/auth'
import { getPortalFile } from '@/lib/portal/server'
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

  // İzin verilen dosya: portal token (paylaşılmış + sahibi) ya da dashboard (aynı tenant)
  let file: { name: string; url: string | null } | null = null

  if (portalToken) {
    // K-3: token-scoped RPC — yalnızca client'a ait ve paylaşılmış dosya döner
    const pf = await getPortalFile(portalToken, id)
    if (pf) file = { name: pf.name, url: pf.url }
  } else {
    // Dashboard kullanıcısı — aktif tenant üyeliği doğrulanır (çoklu tenant)
    try {
      const ctx = await getTenantContextApi()
      const admin = createAdminClient()
      const { data: f } = await admin
        .from('files')
        .select('name, url')
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)
        .maybeSingle()
      if (f) file = { name: f.name as string, url: f.url as string | null }
    } catch {
      // oturum yok — file null kalır, aşağıda 404 döner
    }
  }

  if (!file) {
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
