import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { createAdminClient } from '@/lib/supabase/admin'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import BrandStyle from '@/components/brand-style'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
})

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo-delta.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )

  let brand: Brand = DEFAULT_BRAND
  if (!isDefaultDomain) {
    try {
      // RLS bypass: layout anon çalışabilir, admin client kullan
      const admin = createAdminClient()
      const { data } = await admin
        .from('profiles')
        .select('brand_name, brand_primary_color')
        .eq('brand_domain', domain)
        .eq('brand_domain_status', 'active')
        .single()
      if (data) {
        brand = {
          brandName: data.brand_name || DEFAULT_BRAND.brandName,
          brandLogoUrl: null,
          brandPrimaryColor: data.brand_primary_color || DEFAULT_BRAND.brandPrimaryColor,
          brandDomain: null,
        }
      }
    } catch { /* use defaults */ }
  }

  const brandName = brand.brandName || 'Trevo'
  return {
    title: `${brandName} — Ajanslar için Müşteri Portalı`,
    description: 'Dosya paylaş, hizmet sat, ekibini yönet. Hepsi senin markan altında.',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo-delta.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )

  let brand: Brand = DEFAULT_BRAND
  if (!isDefaultDomain) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('profiles')
        .select('brand_name, brand_logo_url, brand_primary_color, brand_domain')
        .eq('brand_domain', domain)
        .eq('brand_domain_status', 'active')
        .maybeSingle()
      if (data) {
        brand = {
          brandName: data.brand_name || DEFAULT_BRAND.brandName,
          brandLogoUrl: data.brand_logo_url,
          brandPrimaryColor: data.brand_primary_color || DEFAULT_BRAND.brandPrimaryColor,
          brandDomain: data.brand_domain,
        }
      }
    } catch { /* use defaults */ }
  }

  return (
    <html lang="tr" className={`${jakartaSans.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <BrandStyle brand={brand} />
        {children}
      </body>
    </html>
  )
}
