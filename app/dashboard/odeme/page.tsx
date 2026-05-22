'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OdemePage() {
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [mode, setMode] = useState<'sandbox' | 'production'>('sandbox')
  const [aktif, setAktif] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/tenant/payments/keys')
      if (res.ok) {
        const data = await res.json()
        if (data.apiKey) { setApiKey(data.apiKey); setAktif(true) }
        // secretKey döndürülmez (güvenlik); yalnızca varlığı bildirilir
        if (data.mode) setMode(data.mode as 'sandbox' | 'production')
      }
    }
    load()
  }, [])

  const handleKaydet = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/tenant/payments/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secretKey, mode }),
      })
      if (res.ok) setAktif(!!apiKey)
    } catch {}
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/payments/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secretKey, mode }),
      })
      const data = await res.json()
      setTestResult({ ok: data.success, msg: data.message })
    } catch {
      setTestResult({ ok: false, msg: 'Bağlantı hatası' })
    }
    setTesting(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ödeme Sistemi</h1>
        <p className="text-gray-500 text-sm mt-1">iyzico entegrasyonu ile online ödeme al</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* DURUM */}
        <div className={`rounded-2xl border p-5 flex items-center gap-4 ${aktif ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
          <div className="text-2xl">{aktif ? '✅' : '⚠️'}</div>
          <div>
            <div className={`text-sm font-semibold ${aktif ? 'text-green-800' : 'text-yellow-800'}`}>
              {aktif ? 'Ödeme sistemi aktif' : 'Ödeme sistemi pasif'}
            </div>
            <div className={`text-xs mt-0.5 ${aktif ? 'text-green-600' : 'text-yellow-600'}`}>
              {aktif
                ? `iyzico ${mode === 'production' ? 'PROD' : 'sandbox'} anahtarları bağlı.`
                : 'iyzico API key girerek aktif et.'}
            </div>
          </div>
        </div>

        {/* iyzico AYARLARI */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">💳</div>
            <div>
              <div className="text-sm font-semibold text-gray-900">iyzico</div>
              <a href="https://merchant.iyzipay.com" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                merchant.iyzipay.com → API Anahtarları
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="sandbox-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Secret Key</label>
              <input
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="sandbox-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            {/* Mod seçici */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ortam</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('sandbox')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    mode === 'sandbox'
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🧪 Sandbox (Test)
                </button>
                <button
                  onClick={() => setMode('production')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    mode === 'production'
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🚀 Production (Gerçek)
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {mode === 'sandbox'
                  ? 'Sandbox modunda gerçek ödeme alınmaz, test amaçlıdır.'
                  : 'Production modunda gerçek ödeme alınır. Gerçek iyzico API anahtarlarınızı girin.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleKaydet}
              disabled={saving}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet & Aktif Et'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}
            </button>
            {success && <span className="text-green-600 text-sm">✓ Kaydedildi</span>}
            {testResult && (
              <span className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
              </span>
            )}
          </div>
        </div>

        {/* NASIL ÇALIŞIR */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Nasıl çalışır?</h2>
          <ol className="space-y-3">
            {[
              'iyzico\'da merchant hesabı aç (iyzipay.com)',
              'Dashboard → Ayarlar → API Anahtarları\'ndan key\'leri al',
              'Yukarıya gir, ortamı seç (sandbox/prod) ve kaydet',
              'Müşteri portalında faturaların yanında "Öde" butonu belirir',
              'Ödeme geldiğinde e-posta ile bildirim alırsın',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* DİĞER SEÇENEKLER */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Diğer ödeme sağlayıcıları</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'PayTR', desc: 'Türkiye\'nin önde gelen ödeme sistemi', status: 'Yakında' },
              { name: 'Param', desc: 'Kolay entegrasyon, düşük komisyon', status: 'Yakında' },
            ].map((p) => (
              <div key={p.name} className="border border-gray-100 rounded-xl p-4 opacity-60">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.status}</span>
                </div>
                <div className="text-xs text-gray-400">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
