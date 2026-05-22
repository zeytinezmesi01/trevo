import { NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canUploadFiles } from '@/lib/tenant/permissions'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canUploadFiles(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()

  // R2 nesnelerini sil — güncel dosya + tüm sürümler
  const { data: file } = await supabase
    .from('files')
    .select('url')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  const { data: versions } = await supabase
    .from('file_versions')
    .select('url')
    .eq('file_id', id)
    .eq('tenant_id', ctx.tenantId)

  const urls = new Set<string>()
  if (file?.url) urls.add(file.url)
  for (const v of versions || []) {
    if (v.url) urls.add(v.url as string)
  }

  for (const url of urls) {
    const key = url.replace(`${R2_PUBLIC_URL}/`, '')
    if (key && !key.includes('..')) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })).catch(() => {})
    }
  }

  // file_versions satırları ON DELETE CASCADE ile silinir
  await supabase.from('files').delete().eq('id', id).eq('tenant_id', ctx.tenantId)
  return NextResponse.json({ ok: true })
}
