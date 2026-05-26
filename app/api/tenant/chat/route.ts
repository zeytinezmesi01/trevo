import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const ctx = await getTenantContext()
  // O-27: pagination
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  const supabase = await createClient()

  const { data } = await supabase
    .from('chat_messages')
    .select('id, sender_id, message, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Gonderen isimlerini cek
  if (data && data.length > 0) {
    const senderIds = [...new Set(data.map((m) => m.sender_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', senderIds)

    const nameMap = new Map<string, string>()
    profiles?.forEach((p) => nameMap.set(p.id, p.full_name || 'Bilinmiyor'))

    const messages = data.reverse().map((m) => ({
      ...m,
      sender_name: nameMap.get(m.sender_id) || 'Bilinmiyor',
    }))

    return NextResponse.json(messages)
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()

  const body = await request.json().catch(() => null)
  const message = (body?.message || '').trim()

  if (!message) {
    return NextResponse.json({ error: 'Mesaj bos olamaz' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Mesaj 2000 karakteri asamaz' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      tenant_id: ctx.tenantId,
      sender_id: ctx.userId,
      message,
    })
    .select('id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Mesaj gonderilemedi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, created_at: data.created_at })
}
