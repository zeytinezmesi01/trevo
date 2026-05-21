'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import { readBrandFromCookie } from '@/lib/brand/client'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadBrand = async () => {
      const profileId = readBrandFromCookie()
      if (!profileId) return
      const { data } = await supabase
        .from('profiles')
        .select('brand_name, brand_logo_url, brand_primary_color')
        .eq('id', profileId)
        .single()
      if (data) {
        setBrand({
          brandName: data.brand_name || DEFAULT_BRAND.brandName,
          brandLogoUrl: data.brand_logo_url,
          brandPrimaryColor: data.brand_primary_color || DEFAULT_BRAND.brandPrimaryColor,
          brandDomain: null,
        })
      }
    }
    loadBrand()
  }, [])

  const handleGiris = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const brandName = brand.brandName || 'Trevo'

  return (
    <>
      <style>{`:root{--brand-primary:${brand.brandPrimaryColor || '#111827'};--brand-primary-foreground:#fff;--brand-primary-hover:#1f2937}`}</style>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">{brandName}</Link>
            <h1 className="text-xl font-semibold text-gray-900 mt-6 mb-1">Tekrar hoş geldin</h1>
            <p className="text-gray-500 text-sm">Hesabına giriş yap</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <form onSubmit={handleGiris} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="sen@sirket.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="text-right">
                <Link href="/sifre-sifirla" className="text-xs text-primary hover:underline">
                  Şifremi Unuttum
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabın yok mu?{' '}
            <Link href="/kayit" className="text-primary font-medium hover:underline">
              Ücretsiz kaydol
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
