import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { fileName, fileType, fileSize, clientId } = await request.json()

  const ext = fileName.split('.').pop()
  const key = `${user.id}/${Date.now()}-${fileName}`

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
  const sizeMB = (fileSize / 1024 / 1024).toFixed(1)
  const fileTypeName = ext?.toUpperCase() || 'FILE'

  // Get tenant_id from profile
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
  const tenantId = profile?.tenant_id || user.id // fallback to user.id

  // Metadata'yı Supabase'e kaydet
  await supabase.from('files').insert({
    tenant_id: tenantId,
    user_id: user.id,
    client_id: clientId || null,
    name: fileName,
    size: `${sizeMB} MB`,
    file_type: fileTypeName,
    url: publicUrl,
  })

  return NextResponse.json({ signedUrl, publicUrl })
}
