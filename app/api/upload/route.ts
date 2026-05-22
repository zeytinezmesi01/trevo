import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canUploadFiles } from '@/lib/tenant/permissions'
import { sendFileNotification } from '@/lib/email'
import { NextResponse, after } from 'next/server'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico',
  'mp4', 'mov', 'avi', 'mkv',
  'mp3', 'wav', 'ogg',
  'zip', 'rar', '7z', 'tar', 'gz',
  'txt', 'csv', 'json', 'xml', 'html', 'css', 'js',
  'psd', 'ai', 'eps', 'ttf', 'otf',
])

const ALLOWED_MIME_PREFIXES = [
  'image/', 'video/', 'audio/',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-',
  'application/vnd.ms-',
  'application/zip', 'application/x-rar',
  'application/x-7z-compressed', 'application/x-tar',
  'application/gzip', 'text/', 'application/json',
  'application/xml',
]

function isAllowedFileType(name: string, mimeType: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ALLOWED_EXTENSIONS.has(ext)) return true
  return ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p))
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canUploadFiles(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const clientId = formData.get('clientId') as string | null
  const sharedWithClient = formData.get('sharedWithClient') === 'true'

  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

  // E-2: Dosya tipi/uzantı doğrulaması
  if (!isAllowedFileType(file.name, file.type)) {
    return NextResponse.json({ error: 'Bu dosya türüne izin verilmiyor' }, { status: 400 })
  }

  // Sunucu tarafı boyut limiti: 50 MB
  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya boyutu 50 MB ile sınırlıdır' }, { status: 413 })
  }

  // fileName temizleme: yol ayracı ve .. içermesin
  const safeName = file.name.replace(/[/\\]/g, '_').replace(/\.\./g, '')

  const supabase = await createClient()

  // Cross-tenant kontrol: clientId varsa tenant'a ait olduğunu doğrula
  if (clientId) {
    const { data: clientCheck } = await supabase
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
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }))

  const publicUrl = `${R2_PUBLIC_URL}/${key}`
  const sizeMB = (file.size / 1024 / 1024).toFixed(1)
  const fileType = ext?.toUpperCase() || 'FILE'
  const tenantId = ctx.tenantId

  const { data: newFile } = await supabase.from('files').insert({
    tenant_id: tenantId,
    user_id: ctx.userId,
    client_id: clientId || null,
    shared_with_client: !!clientId && sharedWithClient,
    name: file.name,
    size: `${sizeMB} MB`,
    file_type: fileType,
    url: publicUrl,
  }).select('id').single()

  // v1 sürüm geçmişi kaydı
  if (newFile) {
    await supabase.from('file_versions').insert({
      file_id: newFile.id,
      tenant_id: tenantId,
      version_number: 1,
      name: file.name,
      size: `${sizeMB} MB`,
      file_type: fileType,
      url: publicUrl,
      uploaded_by: ctx.userId,
    })
  }

  if (clientId) {
    const { data: client } = await supabase
      .from('clients')
      .select('name, email, token')
      .eq('id', clientId)
      .single()

    if (client?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trevo.app'

      // Fetch brand for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('brand_name, brand_logo_url, brand_primary_color')
        .eq('id', ctx.userId)
        .single()

      await sendFileNotification({
        clientName: client.name,
        clientEmail: client.email,
        fileName: file.name,
        fileUrl: publicUrl,
        portalUrl: `${baseUrl}/portal/${client.token}`,
        brand: profile?.brand_name ? {
          brandName: profile.brand_name,
          brandLogoUrl: profile.brand_logo_url,
          brandPrimaryColor: profile.brand_primary_color,
          brandDomain: null,
        } : undefined,
      }).catch(() => {})
    }
  }

  after(() => {
    dispatchEvent(tenantId, WEBHOOK_EVENTS.FILE_UPLOADED, {
      name: file.name,
      size: sizeMB,
      file_type: fileType,
      url: publicUrl,
      client_id: clientId || null,
    }).catch(() => {})
  })

  return NextResponse.json({ url: publicUrl })
}
