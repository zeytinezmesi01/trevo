import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const ctx = await getTenantContext()

  const { fileName, fileType, fileSize, clientId, skipFileRecord } = await request.json()

  const ext = fileName.split('.').pop()
  const key = `${ctx.tenantId}/${Date.now()}-${fileName}`

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
    await supabase.from('files').insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      client_id: clientId || null,
      name: fileName,
      size: `${sizeMB} MB`,
      file_type: ext?.toUpperCase() || 'FILE',
      url: publicUrl,
    })
  }

  return NextResponse.json({ signedUrl, publicUrl })
}
