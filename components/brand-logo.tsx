'use client'

import { useState } from 'react'
import { Brand } from '@/lib/types/brand'

export default function BrandLogo({ brand, className }: { brand: Brand; className?: string }) {
  const [imgError, setImgError] = useState(false)

  if (brand.brandLogoUrl && !imgError) {
    return (
      <img
        src={brand.brandLogoUrl}
        alt={brand.brandName || 'Logo'}
        className={className || 'h-8 w-auto'}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <span className={className || 'text-xl font-bold tracking-tight text-primary'}>
      {brand.brandName || 'Trevo'}
    </span>
  )
}
