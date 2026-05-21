import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { sendFileNotification } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const clientId = formData.get('clientId') as string | null

  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const key = `${user.id}/${Date.now()}-${file.name}`
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

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
  const tenantId = profile?.tenant_id || user.id

  await supabase.from('files').insert({
    tenant_id: tenantId,
    user_id: user.id,
    client_id: clientId || null,
    name: file.name,
    size: `${sizeMB} MB`,
    file_type: fileType,
    url: publicUrl,
  })

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
        .eq('id', user.id)
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

  return NextResponse.json({ url: publicUrl })
}
