'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandPreview from '@/components/brand-preview'

interface DomainVerifyResponse {
  domain: string
  token: string
  cname: { name: string; value: string }
  txt: { name: string; value: string }
  vercel: { ok: boolean; error?: string }
}

interface DomainCheckResponse {
  status: string
  error: string | null
  checkedAt: string
  vercelConfigured: boolean
}

export default function BrandSettingsForm() {
  const [form, setForm] = useState({
    brand_name: '',
    brand_logo_url: '',
    brand_primary_color: '#111827',
    brand_domain: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Domain dogrulama state
  const [domainStatus, setDomainStatus] = useState<string | null>(null)
  const [domainToken, setDomainToken] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [checking, setChecking] = useState(false)
  const [showVerifyCard, setShowVerifyCard] = useState(false)
  const [vercelMsg, setVercelMsg] = useState<string | null>(null)
  const [vercelConfigured, setVercelConfigured] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('brand_name, brand_logo_url, brand_primary_color, brand_domain, brand_domain_status, brand_domain_verification_token, brand_domain_error')
        .eq('id', user.id)
        .single()
      if (data) {
        setForm({
          brand_name: data.brand_name || '',
          brand_logo_url: data.brand_logo_url || '',
          brand_primary_color: data.brand_primary_color || '#111827',
          brand_domain: data.brand_domain || '',
        })
        setDomainStatus(data.brand_domain_status || null)
        setDomainToken(data.brand_domain_verification_token || null)
        setDomainError(data.brand_domain_error || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress('Hazırlanıyor...')

    const res = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, skipFileRecord: true, purpose: 'brand' }),
    })

    const { signedUrl, publicUrl, error } = await res.json()
    if (error || !signedUrl) {
      alert('Logo yükleme hatası: ' + (error || 'Bilinmeyen hata'))
      setUploading(false)
      setUploadProgress('')
      return
    }

    setUploadProgress('Yükleniyor...')
    const uploadRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

    if (!uploadRes.ok) {
      alert('Logo yükleme hatası')
      setUploading(false)
      setUploadProgress('')
      return
    }

    setForm({ ...form, brand_logo_url: publicUrl })
    setUploadProgress('✓ Logo yüklendi!')
    setTimeout(() => setUploadProgress(''), 2000)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: form.brand_name || null,
          brand_logo_url: form.brand_logo_url || null,
          brand_primary_color: form.brand_primary_color || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.fields) {
          alert('Doğrulama hatası:\n\n' + Object.values(data.fields).join('\n'))
        } else {
          alert(data.error || 'Kaydetme hatası')
        }
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      alert('Bağlantı hatası — kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const handleStartVerify = async () => {
    if (!form.brand_domain) {
      alert('Lütfen önce bir domain girin.')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/brand/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: form.brand_domain }),
      })
      const data: DomainVerifyResponse & { error?: string } = await res.json()
      if (!res.ok) {
        alert(data.error || 'Doğrulama başlatılamadı')
        return
      }
      setDomainStatus('pending')
      setDomainToken(data.token)
      setDomainError(null)
      setShowVerifyCard(true)
      setVercelMsg(data.vercel?.ok ? null : data.vercel?.error || 'Vercel API yapılandırılmamış')
      setVercelConfigured(false)
    } catch {
      alert('Bağlantı hatası — doğrulama başlatılamadı.')
    } finally {
      setVerifying(false)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/brand/domain/check', { method: 'POST' })
      const data: DomainCheckResponse & { error?: string } = await res.json()
      if (!res.ok) {
        alert(data.error || 'Kontrol yapılamadı')
        return
      }
      setDomainStatus(data.status)
      setDomainError(data.error)
      setVercelConfigured(data.vercelConfigured)
    } catch {
      alert('Bağlantı hatası — kontrol yapılamadı.')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
  }

  const primaryColor = form.brand_primary_color || '#111827'

  const statusBadge = () => {
    if (!domainStatus) return null
    switch (domainStatus) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap">Doğrulama bekleniyor</span>
      case 'verified':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">Sahiplik onaylandı, CNAME bekleniyor</span>
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">Yayında ✓</span>
      default:
        return null
    }
  }

  const domainChanged = form.brand_domain !== '' && (domainStatus === null || domainStatus === 'pending')

  return (
    <div className="space-y-6">
      <BrandPreview
        brandName={form.brand_name}
        logoUrl={form.brand_logo_url}
        primaryColor={form.brand_primary_color}
      />

      {/* Marka Adı */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Marka Adı</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Platformda gösterilecek ad</label>
          <input
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ajansın Adı (boş bırakılırsa Trevo)"
          />
          <p className="text-xs text-gray-400 mt-1.5">Boş bırakırsan varsayılan &quot;Trevo&quot; kullanılır.</p>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Logo</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Logo URL</label>
            <input
              value={form.brand_logo_url}
              onChange={(e) => setForm({ ...form, brand_logo_url: e.target.value })}
              className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://ornek.com/logo.png"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">veya</span>
            <input type="file" ref={fileRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {uploading ? '⏳ Yükleniyor...' : 'Logo Yükle'}
            </button>
            {uploadProgress && (
              <span className={`text-xs font-medium ${uploadProgress.startsWith('✓') ? 'text-green-600' : 'text-gray-500'}`}>
                {uploadProgress}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">PNG veya SVG önerilir. Maksimum 2 MB.</p>
        </div>
      </div>

      {/* Ana Renk */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Ana Renk</h2>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setForm({ ...form, brand_primary_color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          />
          <input
            value={form.brand_primary_color}
            onChange={(e) => setForm({ ...form, brand_primary_color: e.target.value })}
            className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="#111827"
          />
          <div className="w-20 h-10 rounded-lg" style={{ backgroundColor: primaryColor }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">Buton, link ve vurgu rengi. Varsayılan: #111827 (koyu gri).</p>
      </div>

      {/* Özel Alan Adı */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Özel Alan Adı</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Domain</label>
          <div className="flex items-center gap-3 max-w-md">
            <input
              value={form.brand_domain}
              onChange={(e) => {
                setForm({ ...form, brand_domain: e.target.value })
                if (e.target.value !== form.brand_domain) {
                  setShowVerifyCard(false)
                }
              }}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="portal.seninajans.com"
            />
            {statusBadge()}
          </div>

          {domainError && (
            <p className="text-xs text-yellow-600 mt-1.5">{domainError}</p>
          )}

          {/* Doğrulamayı Başlat Butonu */}
          {domainChanged && (
            <button
              onClick={handleStartVerify}
              disabled={verifying}
              className="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {verifying ? 'Başlatılıyor...' : 'Doğrulamayı Başlat'}
            </button>
          )}

          {(domainStatus === 'pending' || domainStatus === 'verified') && !showVerifyCard && (
            <button
              onClick={() => setShowVerifyCard(true)}
              className="mt-3 ml-3 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              DNS Kayıtlarını Göster
            </button>
          )}

          {/* Doğrulama Kartı */}
          {showVerifyCard && domainToken && (
            <div className="mt-4 border border-gray-200 rounded-xl bg-gray-50 p-5 max-w-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Domain Doğrulama</h3>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Adım 1 — DNS sağlayıcına şu kayıtları ekle:</p>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">TXT kaydı</div>
                    <div className="text-sm font-mono text-gray-900 break-all">
                      <span className="text-gray-500">_trevo-verify.{form.brand_domain}</span>
                      <span className="text-gray-300 mx-2">→</span>
                      <span className="text-primary font-medium">{domainToken}</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">CNAME kaydı</div>
                    <div className="text-sm font-mono text-gray-900 break-all">
                      <span className="text-gray-500">{form.brand_domain}</span>
                      <span className="text-gray-300 mx-2">→</span>
                      <span className="text-primary font-medium">cname.vercel-dns.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Adım 2 — Kayıtları ekledikten sonra kontrol et:</p>
                <button
                  onClick={handleCheck}
                  disabled={checking}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {checking ? 'Kontrol ediliyor...' : 'Şimdi Kontrol Et'}
                </button>
                <p className="text-xs text-gray-400 mt-2">DNS yayılması 5-60 dakika sürebilir.</p>
              </div>

              {vercelMsg && (
                <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  ⚠ Vercel: {vercelMsg}
                </p>
              )}
              {!vercelMsg && vercelConfigured && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  ✓ Vercel domain onaylandı — SSL aktif
                </p>
              )}
              {!vercelMsg && !vercelConfigured && domainStatus === 'active' && (
                <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  Vercel SSL hazırlanıyor, birkaç dakika içinde aktif olur...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kaydet */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Marka Ayarlarını Kaydet'}
        </button>
        {success && <span className="text-green-600 text-sm">✓ Kaydedildi</span>}
      </div>
    </div>
  )
}
