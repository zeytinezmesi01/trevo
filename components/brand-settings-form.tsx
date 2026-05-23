'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandPreview from '@/components/brand-preview'

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

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('brand_name, brand_logo_url, brand_primary_color, brand_domain').eq('id', user.id).single()
      if (data) {
        setForm({
          brand_name: data.brand_name || '',
          brand_logo_url: data.brand_logo_url || '',
          brand_primary_color: data.brand_primary_color || '#111827',
          brand_domain: data.brand_domain || '',
        })
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
          brand_domain: form.brand_domain || null,
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

  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
  }

  const primaryColor = form.brand_primary_color || '#111827'

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
          <input
            value={form.brand_domain}
            onChange={(e) => setForm({ ...form, brand_domain: e.target.value })}
            className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="portal.seninajans.com"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Bu domain&apos;i DNS&apos;inden Trevo sunucusuna CNAME olarak yönlendirmelisin.
            Müşteri portalin bu domain&apos;de görünecek.
          </p>
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
