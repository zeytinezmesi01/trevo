export interface Brand {
  brandName: string | null
  brandLogoUrl: string | null
  brandPrimaryColor: string | null
  brandDomain: string | null
}

export const DEFAULT_BRAND: Brand = {
  brandName: 'Trevo',
  brandLogoUrl: null,
  brandPrimaryColor: '#111827',
  brandDomain: null,
}

export const DEFAULT_PRIMARY_COLOR = '#111827'
export const DEFAULT_PRIMARY_FOREGROUND = '#ffffff'
