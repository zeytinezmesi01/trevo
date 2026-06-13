'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import { readBrandFromCookie, readBrandTenantIdFromCookie } from '@/lib/brand/client'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND)
  const [isCustomDomain, setIsCustomDomain] = useState(false)
  const [tab, setTab] = useState<'isletme' | 'ekip'>('isletme')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const profileId = readBrandFromCookie()
    const tenantId = readBrandTenantIdFromCookie()
    setIsCustomDomain(!!tenantId)

    if (!profileId) return
    const loadBrand = async () => {
      const res = await fetch(`/api/brand/profile?id=${encodeURIComponent(profileId)}`)
      if (!res.ok) return
      const data = await res.json()
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

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    const domainTenantId = readBrandTenantIdFromCookie()

    if (error || (domainTenantId && data.user)) {
      // Custom domain'de: auth basarisiz da olsa tenant uyesi degilse de ayni hata
      if (domainTenantId) {
        let authorized = false
        if (data?.user) {
          // Çoklu tenant: üyelik kontrolü + domain'in tenant'ını aktif yap.
          // switch endpoint'i tenant_members üzerinden doğrular — üye değilse 403.
          try {
            const res = await fetch('/api/tenant/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantId: domainTenantId }),
            })
            authorized = res.ok
          } catch {
            authorized = false
          }
        }
        if (!authorized) {
          if (data?.user) await supabase.auth.signOut()
          setError('Bu portala erişim yetkiniz yok.')
          setLoading(false)
          return
        }
      } else {
        // Default domain: klasik hata mesaji
        setError('E-posta veya şifre hatalı.')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  const brandName = brand.brandName || 'Trevo'

  // Nonce CSP: client component'te <style> etiketi nonce alamaz — marka
  // değişkenleri wrapper'a style attribute olarak verilir (style-src-attr)
  const brandVars = {
    '--brand-primary': brand.brandPrimaryColor || '#111827',
    '--brand-primary-foreground': '#fff',
    '--brand-primary-hover': '#1f2937',
  } as React.CSSProperties

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={brandVars}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">{brandName}</Link>
            {isCustomDomain ? (
              <>
                <h1 className="text-xl font-semibold text-gray-900 mt-6 mb-1">{brandName} Portalı</h1>
                <p className="text-gray-500 text-sm">Bu portala erişim sadece {brandName} ekibi içindir</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-gray-900 mt-6 mb-1">Tekrar hoş geldin</h1>
                <p className="text-gray-500 text-sm">Hesabına giriş yap</p>
              </>
            )}
          </div>

          {isCustomDomain && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => setTab('isletme')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === 'isletme' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                İşletme Girişi
              </button>
              <button
                onClick={() => setTab('ekip')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === 'ekip' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ekip Girişi
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {isCustomDomain && tab === 'isletme' && (
              <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg mb-4">
                Yönetici yetkisi gerektirir. Sahip, müdür veya direktör hesabıyla giriş yapın.
              </div>
            )}
            {isCustomDomain && tab === 'ekip' && (
              <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg mb-4">
                Ekip üyesi hesabıyla giriş yapın. Davet aldıysanız e-posta adresinizi kullanın.
              </div>
            )}

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

          {!isCustomDomain && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Hesabın yok mu?{' '}
              <Link href="/kayit" className="text-primary font-medium hover:underline">
                Ücretsiz kaydol
              </Link>
            </p>
          )}

          {isCustomDomain && (
            <p className="text-center text-sm text-gray-500 mt-6">
              {brandName} ekibine katılmak için{' '}
              <Link href="/kayit" className="text-primary font-medium hover:underline">
                kayıt olun
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
