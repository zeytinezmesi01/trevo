'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SKIP_KEY = 'trevo_onboarding_skipped'

const COLOR_PRESETS = [
  '#4f7dff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#111827',
]

export default function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name: '',
    company_tax_number: '',
    company_tax_office: '',
    brand_name: '',
    brand_primary_color: '#4f7dff',
  })

  const supabase = createClient()
  const router = useRouter()
  // O-35: inline hata mesajı
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Bu oturum/kullanıcı için atlandıysa gösterme
      if (typeof window !== 'undefined' && localStorage.getItem(`${SKIP_KEY}_${user.id}`)) return

      // Profil bilgilerini al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_tax_number, company_tax_office, brand_name, brand_primary_color, full_name, role')
        .eq('id', user.id)
        .maybeSingle()

      // Sadece owner'a goster, ekip uyelerine asla
      if (!profile || profile.role !== 'owner') return
      if (profile.company_name && profile.company_name.trim()) return

      // Olabildiğince ön doldur
      setForm({
        company_name: profile.company_name || '',
        company_tax_number: profile.company_tax_number || '',
        company_tax_office: profile.company_tax_office || '',
        brand_name: profile.brand_name || profile.full_name || '',
        brand_primary_color: profile.brand_primary_color || '#4f7dff',
      })

      setShow(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSkip = () => {
    if (userId && typeof window !== 'undefined') {
      localStorage.setItem(`${SKIP_KEY}_${userId}`, '1')
    }
    setShow(false)
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name?.trim() || null,
          company_tax_number: form.company_tax_number?.trim() || null,
          company_tax_office: form.company_tax_office?.trim() || null,
          brand_name: form.brand_name?.trim() || null,
          brand_primary_color: form.brand_primary_color || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || 'Kaydetme hatası')
        setSaving(false)
        return
      }
    } catch {
      setErrorMsg('Bağlantı hatası')
      setSaving(false)
      return
    }
    setSaving(false)
    setShow(false)
    // O-38: window.location.reload() yerine router.refresh()
    router.refresh()
  }

  // O-41: Escape ile kapatma + erişilebilirlik
  useEffect(() => {
    if (!show) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleSkip() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!show) return null

  const totalSteps = 4
  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
  const step2Invalid = !form.company_name.trim() || !form.company_tax_number.trim()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <h2 id="onboarding-title" className="sr-only">Trevo Onboarding</h2>
        {/* Step indicator */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-primary' : 'bg-gray-100'}`}
              />
            ))}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 text-right">{step} / {totalSteps}</div>
        </div>

        <div className="px-6 pb-2 overflow-y-auto flex-1">
          {step === 1 && (
            <div>
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Trevo&apos;ya hoş geldin!</h2>
              <p className="text-sm text-gray-500 mb-2">
                Birkaç dakikada hazırız. Şirket bilgilerini ve markanı ayarlayalım — sonra
                müşterilerine markalı portalını paylaşmaya başlayabilirsin.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                İstediğin zaman <strong>Şimdilik atla</strong> diyebilirsin; bilgileri sonra
                Ayarlar&apos;dan girersin.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Şirket bilgileri</h2>
              <p className="text-sm text-gray-500 mb-4">Fatura ve e-Belge için gerekli.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Şirket / Ajans adı *</label>
                  <input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className={inputCls}
                    placeholder="Ajansım"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vergi numarası *</label>
                  <input
                    value={form.company_tax_number}
                    onChange={(e) => setForm({ ...form, company_tax_number: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    maxLength={11}
                    pattern="\d{10,11}"
                    inputMode="numeric"
                    className={inputCls}
                    placeholder="10 haneli VKN"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vergi dairesi</label>
                  <input
                    value={form.company_tax_office}
                    onChange={(e) => setForm({ ...form, company_tax_office: e.target.value })}
                    className={inputCls}
                    placeholder="Örn: Kadıköy VD (e-Belge için gerekli)"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Diğer detayları (adres, telefon, IBAN) sonra Ayarlar&apos;dan ekleyebilirsin.</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Markanı kur</h2>
              <p className="text-sm text-gray-500 mb-4">Müşterilerine senin markanla görüneceğiz.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Marka adı</label>
                  <input
                    value={form.brand_name}
                    onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                    className={inputCls}
                    placeholder="Şirket adıyla aynı bırakabilirsin"
                  />
                  <p className="text-xs text-gray-400 mt-1">Boş bırakırsan portalda &quot;Trevo&quot; görünür.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Ana renk</label>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="color"
                      value={form.brand_primary_color}
                      onChange={(e) => setForm({ ...form, brand_primary_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      value={form.brand_primary_color}
                      onChange={(e) => setForm({ ...form, brand_primary_color: e.target.value })}
                      className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono"
                    />
                    <div className="w-12 h-10 rounded-lg" style={{ backgroundColor: form.brand_primary_color }} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, brand_primary_color: c })}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: form.brand_primary_color.toLowerCase() === c.toLowerCase() ? '#0f172a' : 'transparent',
                        }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Logoyu daha sonra Ayarlar → Marka&apos;dan ekleyebilirsin.</p>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hazırsın!</h2>
              <p className="text-sm text-gray-500 mb-4">Artık şunları yapabilirsin:</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-2">
                <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Müşteri ekle ve portal linkini gönder</li>
                <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Dosya paylaş (paylaşılan / dahili)</li>
                <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Fatura kes; hazır olduğunda e-Fatura&apos;yı aktive et</li>
                <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Online ödeme için iyzico anahtarını <strong>Ödeme</strong> sayfasından gir</li>
              </ul>
              <p className="text-xs text-gray-400 mt-4">İlk müşterini eklemek için sol menüden <strong>Müşteriler</strong>&apos;e git.</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="px-6 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50">{errorMsg}</div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Şimdilik atla
          </button>
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Geri
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && step2Invalid}
                title={step === 2 && step2Invalid ? 'Şirket adı ve vergi numarası gerekli' : undefined}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {step === 1 ? 'Başlayalım' : 'İleri'}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Tamamla'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
