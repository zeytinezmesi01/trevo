'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandSettingsForm from '@/components/brand-settings-form'

export default function AyarlarPage() {
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    company_tax_number: '',
    company_tax_office: '',
    company_address: '',
    company_city: '',
    company_phone: '',
    company_bank_iban: '',
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [einvoiceEnabled, setEinvoiceEnabled] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionMsg, setProvisionMsg] = useState('')
  const [userRole, setUserRole] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchProfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUserRole(data.role || '')
        setForm({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          company_tax_number: data.company_tax_number || '',
          company_tax_office: data.company_tax_office || '',
          company_address: data.company_address || '',
          company_city: data.company_city || '',
          company_phone: data.company_phone || '',
          company_bank_iban: data.company_bank_iban || '',
        })
      }
      // e-Fatura durumu
      const { data: p } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
      if (p?.tenant_id) {
        const { data: t } = await supabase.from('tenants').select('einvoice_enabled').eq('id', p.tenant_id).single()
        if (t?.einvoice_enabled) setEinvoiceEnabled(true)
      }
      setLoading(false)
    }
    fetchProfil()
  }, [])

  const handleKaydet = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.fields) {
          const messages = Object.values(data.fields).join('\n')
          setError('Doğrulama hatası:\n\n' + messages)
        } else {
          setError(data.error || 'Bir hata oluştu')
        }
        setSaving(false)
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Bağlantı hatası')
    }
    setSaving(false)
  }

  const handleEInvoiceProvision = async () => {
    setProvisioning(true)
    setProvisionMsg('')
    try {
      const res = await fetch('/api/tenant/einvoice/provision', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setEinvoiceEnabled(true)
        setProvisionMsg('e-Fatura başarıyla etkinleştirildi!')
      } else {
        setProvisionMsg(data.error || 'Hata')
      }
    } catch {
      setProvisionMsg('Bağlantı hatası')
    }
    setProvisioning(false)
    setTimeout(() => setProvisionMsg(''), 5000)
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Yükleniyor...</div>

  // e-Fatura için gerekli alanlar (provisioning + ilk e-belge gönderimi düşünülerek)
  const eInvoiceRequired = [
    { label: 'Şirket / Unvan', value: form.company_name },
    { label: 'Vergi Numarası', value: form.company_tax_number },
    { label: 'Vergi Dairesi', value: form.company_tax_office },
  ]
  const eInvoiceMissing = eInvoiceRequired.filter(f => !(f.value ?? '').trim()).map(f => f.label)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-500 text-sm mt-1">Profil, şirket ve marka bilgilerini güncelle</p>
      </div>

      {/* Hata mesaji */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-line">
          {error}
        </div>
      )}

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

        {/* ŞİRKET — sadece owner ve admin */}
        {(userRole === 'owner' || userRole === 'admin') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Şirket Bilgileri</h2>
          <p className="text-xs text-gray-500 mb-4">Fatura ve e-Belge için yasal şirket bilgileri.</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vergi Numarası</label>
                <input
                  value={form.company_tax_number}
                  onChange={(e) => setForm({ ...form, company_tax_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="10 haneli VKN"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vergi Dairesi</label>
                <input
                  value={form.company_tax_office}
                  onChange={(e) => setForm({ ...form, company_tax_office: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Örn: Kadıköy VD"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Adres</label>
                <input
                  value={form.company_address}
                  onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Şirket adresi"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Şehir</label>
                <input
                  value={form.company_city}
                  onChange={(e) => setForm({ ...form, company_city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="İstanbul"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon</label>
                <input
                  value={form.company_phone}
                  onChange={(e) => setForm({ ...form, company_phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+90 5XX XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">IBAN</label>
                <input
                  value={form.company_bank_iban}
                  onChange={(e) => setForm({ ...form, company_bank_iban: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="TR12 3456 7890 ..."
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* E-FATURA ETKİNLEŞTİRME API */}

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

        {/* MARKA — sadece owner */}
        {userRole === 'owner' && (
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Marka / Beyaz Etiket</h2>
          <p className="text-gray-500 text-sm mb-6">Kendi markanı yansıt. Logo, renk ve özel alan adı.</p>
          <BrandSettingsForm />
        </div>
        )}

        {/* E-FATURA — sadece owner */}
        {userRole === 'owner' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">e-Fatura / e-Arşiv</h2>
          <p className="text-gray-500 text-sm mb-4">Faturalarını GİB nezdinde resmi e-Belge olarak ilet.</p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Vergi Numarası</span>
              <span className="text-sm font-semibold text-gray-900">{form.company_tax_number || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Vergi Dairesi</span>
              <span className="text-sm font-semibold text-gray-900">{form.company_tax_office || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Şirket / Unvan</span>
              <span className="text-sm font-semibold text-gray-900">{form.company_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">e-Fatura Durumu</span>
              <span className={`text-sm font-semibold ${einvoiceEnabled ? 'text-green-600' : 'text-amber-600'}`}>
                {einvoiceEnabled ? '✓ Aktif' : '— Aktif Değil'}
              </span>
            </div>
          </div>

          {!einvoiceEnabled && eInvoiceMissing.length > 0 && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              <strong>Eksik alanlar:</strong> {eInvoiceMissing.join(', ')}. Yukarıdaki <em>Şirket Bilgileri</em> bölümünden doldurup <strong>kaydet</strong>tikten sonra etkinleştirebilirsin.
            </div>
          )}

          <div className="flex items-center gap-3">
            {!einvoiceEnabled && (
              <button
                onClick={handleEInvoiceProvision}
                disabled={provisioning || eInvoiceMissing.length > 0}
                title={eInvoiceMissing.length > 0 ? 'Önce şirket bilgilerini tamamlayıp kaydedin' : undefined}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {provisioning ? 'Etkinleştiriliyor...' : "e-Fatura'yı Etkinleştir"}
              </button>
            )}
            {provisionMsg && (
              <span className={`text-sm ${provisionMsg.toLowerCase().includes('hata') ? 'text-red-500' : 'text-green-600'}`}>
                {provisionMsg}
              </span>
            )}
          </div>
        </div>
        )}

        {/* HESAP SİL — sadece owner */}
        {userRole === 'owner' && (
        <div className="border-t border-red-100 pt-6">
          <h2 className="text-lg font-semibold text-red-600 mb-1">Tehlike Bölgesi</h2>
          <p className="text-gray-500 text-sm mb-4">Hesabını ve tüm verilerini kalıcı olarak sil. Bu işlem geri alınamaz.</p>
          <button
            onClick={async () => {
              if (!confirm('Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ.')) return
              if (!confirm('Son bir kez daha soruyoruz: Tüm müşteriler, dosyalar, faturalar ve ayarlar silinecek. Emin misiniz?')) return
              setDeleting(true)
              setError('')
              try {
                const res = await fetch('/api/account/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}))
                  setError(data.error || 'Hesap silinemedi.')
                  setDeleting(false)
                  return
                }
              } catch {
                setError('Bağlantı hatası — hesap silinemedi.')
                setDeleting(false)
                return
              }
              window.location.href = '/'
            }}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
