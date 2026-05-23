'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import { readBrandFromCookie, readBrandTenantIdFromCookie } from '@/lib/brand/client'

function KayitForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND)
  const [isCustomDomain, setIsCustomDomain] = useState(false)
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const inviteToken = searchParams.get('invite')

  useEffect(() => {
    if (!inviteToken) return
    // Fetch invitation to pre-fill email
    const loadInvite = async () => {
      const res = await fetch(`/api/invitations/lookup?token=${encodeURIComponent(inviteToken)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.email) setEmail(data.email)
      }
    }
    loadInvite()
  }, [inviteToken])

  useEffect(() => {
    const tenantId = readBrandTenantIdFromCookie()
    setIsCustomDomain(!!tenantId)

    const profileId = readBrandFromCookie()
    if (!profileId) return
    const loadBrand = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('brand_name, brand_logo_url, brand_primary_color')
        .eq('id', profileId)
        .maybeSingle()
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

  const handleKayit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error, data: signupData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/giris`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If this was an invite, accept it
    if (inviteToken && signupData.user) {
      await fetch('/api/tenant/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken }),
      }).catch(() => {})
    }

    // Custom domain'den kayit olan kullaniciyi domain sahibinin tenant'ina ekle
    const domainTenantId = readBrandTenantIdFromCookie()
    if (!inviteToken && domainTenantId && signupData.user) {
      await fetch('/api/brand/domain/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: domainTenantId }),
      }).catch(() => {})
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">E-postanı doğrula</h1>
          <p className="text-gray-500 text-sm">
            <strong>{email}</strong> adresine doğrulama maili gönderdik.
            Maildeki linke tıkla, hesabın aktif olsun.
          </p>
          <Link href="/giris" className="inline-block mt-6 text-sm text-primary font-medium hover:underline">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    )
  }

  const brandName = brand.brandName || 'Trevo'

  return (
    <>
      <style>{`:root{--brand-primary:${brand.brandPrimaryColor || '#111827'};--brand-primary-foreground:#fff;--brand-primary-hover:#1f2937}`}</style>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">{brandName}</Link>
            {isCustomDomain ? (
              <>
                <h1 className="text-xl font-semibold text-gray-900 mt-6 mb-1">{brandName} ekibine katıl</h1>
                <p className="text-gray-500 text-sm">Ekip arkadaşlarınla birlikte çalış</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-gray-900 mt-6 mb-1">Hesap oluştur</h1>
                <p className="text-gray-500 text-sm">7 gün ücretsiz, kart gerekmez</p>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <form onSubmit={handleKayit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ahmet Yılmaz"
                />
              </div>
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
                  minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="kvkk" checked={kvkkAccepted} onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-0.5" />
                <label htmlFor="kvkk" className="text-xs text-gray-500">
                  <Link href="/gizlilik" className="text-primary hover:underline" target="_blank">Gizlilik Politikası</Link> ve{' '}
                  <Link href="/kullanim" className="text-primary hover:underline" target="_blank">Kullanım Şartları</Link>&apos;nı okudum, kabul ediyorum.
                  Kişisel verilerimin <Link href="/kvkk" className="text-primary hover:underline" target="_blank">KVKK</Link> kapsamında işlenmesini onaylıyorum.
                </label>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !kvkkAccepted}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Hesap oluşturuluyor...' : 'Hesap oluştur'}
              </button>
            </form>
          </div>

          {!isCustomDomain && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Zaten hesabın var mı?{' '}
              <Link href="/giris" className="text-primary font-medium hover:underline">
                Giriş yap
              </Link>
            </p>
          )}
          {isCustomDomain && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Zaten {brandName} ekibinde misin?{' '}
              <Link href="/giris" className="text-primary font-medium hover:underline">
                Giriş yap
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default function KayitPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}><p style={{ color: '#94a3b8' }}>Yükleniyor...</p></div>}>
      <KayitForm />
    </Suspense>
  )
}
