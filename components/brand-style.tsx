import { headers } from 'next/headers'
import { Brand, DEFAULT_PRIMARY_COLOR, DEFAULT_PRIMARY_FOREGROUND } from '@/lib/types/brand'

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0
  const hx = hex.replace('#', '')
  if (hx.length === 3) {
    r = parseInt(hx[0] + hx[0], 16)
    g = parseInt(hx[1] + hx[1], 16)
    b = parseInt(hx[2] + hx[2], 16)
  } else {
    r = parseInt(hx.substring(0, 2), 16)
    g = parseInt(hx.substring(2, 4), 16)
    b = parseInt(hx.substring(4, 6), 16)
  }
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount))
}

function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + amount))
}

function foregroundForBg(hex: string): string {
  const hsl = hexToHsl(hex)
  return hsl.l > 55 ? '#111827' : '#ffffff'
}

export default async function BrandStyle({ brand }: { brand: Brand }) {
  const primary = brand.brandPrimaryColor || DEFAULT_PRIMARY_COLOR
  const fg = foregroundForBg(primary)
  const hover = darken(primary, 10)
  const border = lighten(primary, 35)

  // Nonce tabanlı CSP: inline <style> ancak nonce taşırsa çalışır.
  // proxy.ts nonce'u x-nonce istek header'ına koyar (server component'ten okunur).
  const nonce = (await headers()).get('x-nonce') || undefined

  return (
    <style nonce={nonce}>{`
      :root {
        --brand-primary: ${primary};
        --brand-primary-foreground: ${fg};
        --brand-primary-hover: ${hover};
        --brand-primary-border: ${border};
      }
    `}</style>
  )
}
