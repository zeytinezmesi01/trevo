'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandSettingsForm from '@/components/brand-settings-form'

export default function AyarlarPage() {
  const [form, setForm] = useState({ full_name: '', company_name: '' })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setForm({ full_name: data.full_name || '', company_name: data.company_name || '' })
      setLoading(false)
    }
    fetchProfil()
  }, [])

  const handleKaydet = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: user!.id,
      full_name: form.full_name,
      company_name: form.company_name,
    })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-500 text-sm mt-1">Profil, şirket ve marka bilgilerini güncelle</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* PROFİL */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Profil Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ad Soyad</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Adın Soyadın"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">E-posta</label>
              <input
                value={email}
                disabled
                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ŞİRKET */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Şirket Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Şirket / Ajans Adı</label>
              <input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ajansın Adı"
              />
            </div>
          </div>
        </div>

        {/* KAYDET */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleKaydet}
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
          {success && <span className="text-green-600 text-sm">✓ Kaydedildi</span>}
        </div>

        {/* AYIRICI */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Marka / Beyaz Etiket</h2>
          <p className="text-gray-500 text-sm mb-6">Kendi markanı yansıt. Logo, renk ve özel alan adı.</p>
          <BrandSettingsForm />
        </div>

        {/* HESAP SİL */}
        <div className="border-t border-red-100 pt-6">
          <h2 className="text-lg font-semibold text-red-600 mb-1">Tehlike Bölgesi</h2>
          <p className="text-gray-500 text-sm mb-4">Hesabını ve tüm verilerini kalıcı olarak sil. Bu işlem geri alınamaz.</p>
          <button
            onClick={async () => {
              if (!confirm('Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ.')) return
              if (!confirm('Son bir kez daha soruyoruz: Tüm müşteriler, dosyalar, faturalar ve ayarlar silinecek. Emin misiniz?')) return
              setDeleting(true)
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                const { data: p } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
                if (p?.tenant_id) {
                  await supabase.from('profiles').update({ tenant_id: null, role: null }).eq('tenant_id', p.tenant_id)
                  await supabase.from('tenant_members').delete().eq('tenant_id', p.tenant_id)
                  await supabase.from('tenants').delete().eq('id', p.tenant_id)
                }
                await supabase.from('profiles').delete().eq('id', user.id)
                await supabase.auth.signOut()
              }
              window.location.href = '/'
            }}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
          </button>
        </div>
      </div>
    </div>
  )
}
