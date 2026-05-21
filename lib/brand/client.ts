'use client'

import { createClient } from '@/lib/supabase/client'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'

let cachedBrand: Brand | null = null

export async function getBrandForDashboard(): Promise<Brand> {
  if (cachedBrand) return cachedBrand

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ...DEFAULT_BRAND }

  const { data } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_primary_color, brand_domain')
    .eq('id', user.id)
    .single()

  cachedBrand = {
    brandName: data?.brand_name || DEFAULT_BRAND.brandName,
    brandLogoUrl: data?.brand_logo_url || DEFAULT_BRAND.brandLogoUrl,
    brandPrimaryColor: data?.brand_primary_color || DEFAULT_BRAND.brandPrimaryColor,
    brandDomain: data?.brand_domain || DEFAULT_BRAND.brandDomain,
  }
  return cachedBrand
}

export function readBrandFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)brand_profile_id=([^;]*)/)
  return match ? match[1] : null
}
