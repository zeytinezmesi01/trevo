import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearBrandCache } from '@/lib/brand/server'

const ALLOWED_FIELDS = [
  'full_name',
  'company_name',
  'company_tax_number',
  'company_tax_office',
  'company_address',
  'company_city',
  'company_phone',
  'company_bank_iban',
  'brand_name',
  'brand_logo_url',
  'brand_primary_color',
] as const

type Field = typeof ALLOWED_FIELDS[number]

function validate(field: Field, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return `${field} bir metin olmalı`

  const v = value.trim()

  switch (field) {
    case 'company_tax_number':
      if (!/^\d{10,11}$/.test(v)) return 'Vergi numarası 10 veya 11 haneli olmalı'
      break
    case 'company_bank_iban': {
      const iban = v.replace(/\s+/g, '').toUpperCase()
      if (!/^TR\d{24}$/.test(iban)) return 'IBAN geçersiz (TR ile başlamalı, toplam 26 karakter)'
      break
    }
    case 'company_phone':
      if (v.length > 30) return 'Telefon çok uzun'
      if (!/^[\d\s+()-]{6,}$/.test(v)) return 'Telefon yalnızca rakam ve +, -, ( ) içermeli'
      break
    case 'brand_primary_color':
      if (!/^#[0-9a-fA-F]{6}$/.test(v)) return 'Ana renk geçerli bir hex olmalı (örn. #4f7dff)'
      break
    case 'brand_logo_url':
      if (v.length > 500) return 'Logo URL çok uzun'
      if (!/^https?:\/\//i.test(v)) return 'Logo URL http(s):// ile başlamalı'
      break
    case 'company_name':
    case 'company_tax_office':
    case 'company_address':
    case 'company_city':
    case 'brand_name':
    case 'full_name':
      if (v.length > 200) return `${field} çok uzun`
      break
  }
  return null
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const update: Record<string, string | null> = {}
  const errors: Record<string, string> = {}

  for (const field of ALLOWED_FIELDS) {
    if (!(field in body)) continue
    const raw = (body as Record<string, unknown>)[field]
    const err = validate(field, raw)
    if (err) {
      errors[field] = err
      continue
    }
    update[field] = raw === '' || raw === null || raw === undefined ? null : String(raw).trim()
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Doğrulama hatası', fields: errors }, { status: 400 })
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) {
    console.error('Profil güncelleme hatası:', error)
    return NextResponse.json({ error: 'Güncelleme sırasında bir hata oluştu' }, { status: 500 })
  }

  // Brand alanlari guncellendiyse cache'i temizle
  const brandFields = ['brand_name', 'brand_logo_url', 'brand_primary_color']
  if (Object.keys(update).some((k) => (brandFields as string[]).includes(k))) {
    // tenant_id'yi alip cache'i dogru sekilde temizle (Y8 fix)
    const { data: p } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle()
    if (p?.tenant_id) {
      clearBrandCache(p.tenant_id)
    } else {
      clearBrandCache()
    }
  }

  return NextResponse.json({ ok: true })
}
