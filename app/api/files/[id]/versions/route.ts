import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canUploadFiles } from '@/lib/tenant/permissions'

// GET /api/files/[id]/versions — dosyanın sürüm geçmişi (yeniden eskiye)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const supabase = await createClient()

  // Dosya bu tenant'a ait mi?
  const { data: file } = await supabase
    .from('files')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()
  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

  const { data: versions } = await supabase
    .from('file_versions')
    .select('id, version_number, name, size, file_type, url, created_at')
    .eq('file_id', id)
    .order('version_number', { ascending: false })

  return NextResponse.json(versions || [])
}

// POST /api/files/[id]/versions — yeni sürüm ekle
// Dosya R2'ye zaten yüklenmiş olmalı; burada sadece kayıt + files satırı güncellenir.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canUploadFiles(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()

  const { url, name, size, fileType } = await request.json()
  if (!url || !name) {
    return NextResponse.json({ error: 'Eksik sürüm bilgisi' }, { status: 400 })
  }

  // Dosya bu tenant'a ait mi?
  const { data: file } = await supabase
    .from('files')
    .select('id, current_version')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()
  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

  const nextVersion = (file.current_version || 1) + 1

  // Yeni sürüm kaydı
  const { error: versionError } = await supabase.from('file_versions').insert({
    file_id: id,
    tenant_id: ctx.tenantId,
    version_number: nextVersion,
    name,
    size: size || null,
    file_type: fileType || null,
    url,
    uploaded_by: ctx.userId,
  })
  if (versionError) {
    return NextResponse.json({ error: `Sürüm kaydedilemedi: ${versionError.message}` }, { status: 500 })
  }

  // files satırını güncel sürüme taşı (portal/güncel görünüm bunu gösterir)
  await supabase
    .from('files')
    .update({
      url,
      name,
      size: size || null,
      file_type: fileType || 'FILE',
      current_version: nextVersion,
    })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  return NextResponse.json({ ok: true, version_number: nextVersion })
}
