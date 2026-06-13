'use client'

import { useState, useEffect } from 'react'

/**
 * e-Fatura Entegratörü (Nilvera) — BYOK kartı.
 * Owner kendi Nilvera API anahtarını girer; anahtar şifreli saklanır ve
 * kaydederken bağlantı doğrulanır. Ödeme (iyzico) BYOK kartının e-fatura eşi.
 */
export default function EInvoiceIntegratorCard({
  companyTaxNumber,
}: {
  companyTaxNumber?: string
}) {
  const [apiKey, setApiKey] = useState('')
  const [testMode, setTestMode] = useState(true)
  const [apiKeySet, setApiKeySet] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/einvoice/keys')
        if (res.ok) {
          const d = await res.json()
          setApiKeySet(!!d.apiKeySet)
          setEnabled(!!d.enabled)
          setTestMode(d.testMode ?? true)
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/tenant/einvoice/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, testMode }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ text: d.error || 'Kaydedilemedi', ok: false })
      } else if (d.connected) {
        setApiKeySet(true)
        setEnabled(true)
        setApiKey('')
        setMsg({ text: 'Bağlantı doğrulandı, e-Fatura aktif ✓', ok: true })
      } else {
        setEnabled(false)
        setMsg({
          text: apiKey.trim()
            ? 'Anahtar kaydedildi ama doğrulanamadı — anahtarı ve test/canlı seçimini kontrol edin.'
            : 'Anahtar kaldırıldı.',
          ok: false,
        })
        if (!apiKey.trim()) setApiKeySet(false)
      }
    } catch {
      setMsg({ text: 'Bağlantı hatası', ok: false })
    }
    setSaving(false)
  }

  if (loading) return null

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900">e-Fatura / e-Arşiv (Nilvera)</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${enabled ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
          {enabled ? '✓ Bağlı' : 'Bağlı değil'}
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        Kendi Nilvera hesabınızın API anahtarını bağlayın. Faturalarınız sizin Nilvera
        hesabınız üzerinden GİB&apos;e e-Fatura / e-Arşiv olarak iletilir.
      </p>

      {!companyTaxNumber && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
          Önce yukarıdaki <strong>Şirket Bilgileri</strong> bölümünden vergi numaranızı girip kaydedin.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Nilvera API Anahtarı {apiKeySet && <span className="text-gray-400">(kayıtlı — değiştirmek için yenisini girin)</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={inputCls}
            placeholder={apiKeySet ? '•••••••• (kayıtlı)' : 'Nilvera Portal → API Tanımları → Yeni Anahtar'}
            autoComplete="off"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="text-sm text-gray-700">Test ortamı (apitest.nilvera.com)</span>
        </label>
        <p className="text-xs text-gray-400 -mt-1">
          Gerçek GİB gönderimi için bu işareti kaldırıp canlı (api.nilvera.com) anahtarınızı kullanın.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Kontrol ediliyor...' : apiKeySet && !apiKey ? 'Test ortamını kaydet' : 'Bağla ve doğrula'}
          </button>
          {msg && <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-amber-600'}`}>{msg.text}</span>}
        </div>
      </div>
    </div>
  )
}
