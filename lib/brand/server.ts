import { createAdminClient } from '@/lib/supabase/admin'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import type { SupabaseClient } from '@supabase/supabase-js'

function buildBrandFromProfile(profile: Record<string, unknown> | null): Brand {
  if (!profile) return { ...DEFAULT_BRAND }
  return {
    brandName: (profile.brand_name as string) || DEFAULT_BRAND.brandName,
    brandLogoUrl: (profile.brand_logo_url as string) || DEFAULT_BRAND.brandLogoUrl,
    brandPrimaryColor: (profile.brand_primary_color as string) || DEFAULT_BRAND.brandPrimaryColor,
    brandDomain: (profile.brand_domain as string) || DEFAULT_BRAND.brandDomain,
  }
}

function isDomainActive(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false
  // brand_domain_status null ise domain hic ayarlanmamis — DEFAULT_BRAND doner
  // Sadece 'active' olan domain'ler portalda gosterilir
  return profile.brand_domain_status === 'active'
}

const brandCache = new Map<string, { brand: Brand; expiresAt: number }>()
const CACHE_TTL = 60_000 // 1 minute

export async function getBrandByDomain(host: string): Promise<Brand> {
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo-delta.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )
  if (isDefaultDomain) return { ...DEFAULT_BRAND }

  const cached = brandCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) return cached.brand

  // RLS bypass: anon ziyaretçiler için admin client
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain, brand_domain_status')
    .eq('brand_domain', domain)
    .maybeSingle()

  if (!isDomainActive(data)) {
    brandCache.set(domain, { brand: { ...DEFAULT_BRAND }, expiresAt: Date.now() + CACHE_TTL })
    return { ...DEFAULT_BRAND }
  }

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

export async function getBrandByTenantId(tenantId: string): Promise<Brand> {
  const cached = brandCache.get(`tenant:${tenantId}`)
  if (cached && cached.expiresAt > Date.now()) return cached.brand

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain')
    .eq('tenant_id', tenantId)
    .eq('role', 'owner')
    .maybeSingle()

  const brand = buildBrandFromProfile(data)
  brandCache.set(`tenant:${tenantId}`, { brand, expiresAt: Date.now() + CACHE_TTL })
  return brand
}

export function clearBrandCache(userId?: string, domain?: string, tenantId?: string): void {
  if (userId) brandCache.delete(`user:${userId}`)
  if (domain) brandCache.delete(domain)
  if (tenantId) brandCache.delete(`tenant:${tenantId}`)
}

export async function generatePortalBrand(
  supabase: SupabaseClient,
  host: string
): Promise<Brand> {
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo-delta.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )
  if (isDefaultDomain) return { ...DEFAULT_BRAND }

  const cached = brandCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) return cached.brand

  const { data } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain, brand_domain_status')
    .eq('brand_domain', domain)
    .maybeSingle()

  if (!isDomainActive(data)) {
    brandCache.set(domain, { brand: { ...DEFAULT_BRAND }, expiresAt: Date.now() + CACHE_TTL })
    return { ...DEFAULT_BRAND }
  }

  const brand = buildBrandFromProfile(data)
  brandCache.set(domain, { brand, expiresAt: Date.now() + CACHE_TTL })
  return brand
}
