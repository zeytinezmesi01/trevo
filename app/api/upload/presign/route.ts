import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canUploadFiles } from '@/lib/tenant/permissions'
import { NextResponse } from 'next/server'

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico',
  'mp4', 'mov', 'avi', 'mkv',
  'mp3', 'wav', 'ogg',
  'zip', 'rar', '7z', 'tar', 'gz',
  'txt', 'csv', 'json', 'xml', 'html', 'css', 'js',
  'psd', 'ai', 'eps', 'ttf', 'otf',
])

function isAllowedFileType(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return ALLOWED_EXTENSIONS.has(ext)
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canUploadFiles(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { fileName, fileType, fileSize, clientId, sharedWithClient, skipFileRecord } = await request.json()

  // E-2: Dosya tipi/uzantı doğrulaması
  if (fileName && !isAllowedFileType(fileName)) {
    return NextResponse.json({ error: 'Bu dosya türüne izin verilmiyor' }, { status: 400 })
  }

  // fileName temizleme: yol ayracı ve .. içermesin
  const safeName = fileName ? fileName.replace(/[/\\]/g, '_').replace(/\.\./g, '') : ''


  if (!safeName) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }

  // Sunucu tarafı boyut limiti: 50 MB
  if (fileSize > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Dosya boyutu 50 MB ile sınırlıdır' }, { status: 413 })
  }

  // Cross-tenant kontrol: clientId varsa tenant'a ait olduğunu doğrula
  if (clientId) {
    const supabaseCheck = await createClient()
    const { data: clientCheck } = await supabaseCheck
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle()
    if (!clientCheck) return NextResponse.json({ error: 'Geçersiz müşteri' }, { status: 403 })
  }

  const ext = safeName.split('.').pop()
  // Müşteriye ait dosyalar R2'de o müşterinin klasöründe saklanır; diğerleri 'genel'de
  const folder = clientId || 'genel'
  const key = `${ctx.tenantId}/${folder}/${Date.now()}-${safeName}`

  const signedUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType,
    }),
    { expiresIn: 300 } // 5 dakika
  )

  const publicUrl = `${R2_PUBLIC_URL}/${key}`

  // Brand logo gibi varlıklar Dosyalar listesinde görünmemeli
  if (!skipFileRecord) {
    const supabase = await createClient()
    const sizeMB = (fileSize / 1024 / 1024).toFixed(1)
    const fileTypeU = ext?.toUpperCase() || 'FILE'
    const { data: newFile } = await supabase.from('files').insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      client_id: clientId || null,
      shared_with_client: !!clientId && !!sharedWithClient,
      name: fileName,
      size: `${sizeMB} MB`,
      file_type: fileTypeU,
      url: publicUrl,
    }).select('id').single()

    // v1 sürüm geçmişi kaydı
    if (newFile) {
      await supabase.from('file_versions').insert({
        file_id: newFile.id,
        tenant_id: ctx.tenantId,
        version_number: 1,
        name: fileName,
        size: `${sizeMB} MB`,
        file_type: fileTypeU,
        url: publicUrl,
        uploaded_by: ctx.userId,
      })
    }
  }

  return NextResponse.json({ signedUrl, publicUrl })
}
