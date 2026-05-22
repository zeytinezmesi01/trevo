import { createAdminClient } from '@/lib/supabase/admin'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'

function buildBrandFromProfile(profile: Record<string, unknown> | null): Brand {
  if (!profile) return { ...DEFAULT_BRAND }
  return {
    brandName: (profile.brand_name as string) || DEFAULT_BRAND.brandName,
    brandLogoUrl: (profile.brand_logo_url as string) || DEFAULT_BRAND.brandLogoUrl,
    brandPrimaryColor: (profile.brand_primary_color as string) || DEFAULT_BRAND.brandPrimaryColor,
    brandDomain: (profile.brand_domain as string) || DEFAULT_BRAND.brandDomain,
  }
}

const brandCache = new Map<string, { brand: Brand; expiresAt: number }>()
const CACHE_TTL = 60_000 // 1 minute

export async function getBrandByDomain(host: string): Promise<Brand> {
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo.app', 'trevo.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )
  if (isDefaultDomain) return { ...DEFAULT_BRAND }

  const cached = brandCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) return cached.brand

  // RLS bypass: anon ziyaretçiler için admin client
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain')
    .eq('brand_domain', domain)
    .maybeSingle()

  const brand = buildBrandFromProfile(data)
  brandCache.set(domain, { brand, expiresAt: Date.now() + CACHE_TTL })
  return brand
}

export async function getBrandByUserId(userId: string): Promise<Brand> {
  const cached = brandCache.get(`user:${userId}`)
  if (cached && cached.expiresAt > Date.now()) return cached.brand

  // Dashboard içi kullanım — RLS kullanıcının kendi profilini okumasına izin verir
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain')
    .eq('id', userId)
    .maybeSingle()

  const brand = buildBrandFromProfile(data)
  brandCache.set(`user:${userId}`, { brand, expiresAt: Date.now() + CACHE_TTL })
  return brand
}

import type { SupabaseClient } from '@supabase/supabase-js'

export async function generatePortalBrand(
  supabase: SupabaseClient,
  host: string
): Promise<Brand> {
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo.app', 'trevo.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )
  if (isDefaultDomain) return { ...DEFAULT_BRAND }

  const cached = brandCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) return cached.brand

  const { data } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain')
    .eq('brand_domain', domain)
    .maybeSingle()

  const brand = buildBrandFromProfile(data)
  brandCache.set(domain, { brand, expiresAt: Date.now() + CACHE_TTL })
  return brand
}
