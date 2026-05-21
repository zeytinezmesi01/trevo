import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import BrandStyle from '@/components/brand-style'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '')
  const isDefaultDomain = ['localhost', 'trevo.app', 'trevo.vercel.app'].some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )

  let brand: Brand = DEFAULT_BRAND
  if (!isDefaultDomain) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('profiles')
        .select('brand_name, brand_primary_color')
        .eq('brand_domain', domain)
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`${jakartaSans.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
