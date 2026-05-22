'use client'

import { useState, useEffect } from 'react'
import { WEBHOOK_EVENT_LABELS, WEBHOOK_EVENTS } from '@/lib/webhooks/events'

type ApiKey = {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

type WebhookEndpoint = {
  id: string
  url: string
  events: string[]
  active: boolean
  description: string | null
  last_delivery_status?: string
  created_at: string
}

type WebhookDelivery = {
  id: string
  event_type: string
  status: string
  response_status: number | null
  response_body: string | null
  attempts: number
  created_at: string
  last_attempt_at: string | null
}

const ALL_EVENTS = Object.values(WEBHOOK_EVENTS)
const eventLabels = WEBHOOK_EVENT_LABELS as Record<string, string>

export default function ApiWebhookPage() {
  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyResult, setNewKeyResult] = useState<{ fullKey: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [showWebhookForm, setShowWebhookForm] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookDesc, setWebhookDesc] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])

  // Deliveries (son 5)
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({})
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  const loadData = async () => {
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch('/api/tenant/api-keys'),
        fetch('/api/tenant/webhooks'),
      ])
      if (keysRes.ok) setApiKeys(await keysRes.json())
      if (webhooksRes.ok) setWebhooks(await webhooksRes.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      try {
        const [keysRes, webhooksRes] = await Promise.all([
          fetch('/api/tenant/api-keys'),
          fetch('/api/tenant/webhooks'),
        ])
        if (keysRes.ok) setApiKeys(await keysRes.json())
        if (webhooksRes.ok) setWebhooks(await webhooksRes.json())
      } catch {}
      setLoading(false)
    })()
  }, [])

  // Load deliveries when a webhook row is expanded
  useEffect(() => {
    if (!expandedWebhook) return
    const loadDeliveries = async () => {
      try {
        const res = await fetch(`/api/tenant/webhooks`)
        // Deliveries are embedded in a separate API or loaded here
        // For now we load from a direct query
        // Actually we need a separate endpoint or we'll just show what we have
      } catch {}
    }
    loadDeliveries()
  }, [expandedWebhook])

  // --- API Keys ---
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return
    setNewKeyResult(null)
    const res = await fetch('/api/tenant/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setNewKeyResult({ fullKey: data.fullKey, name: data.name })
      setShowNewKeyForm(false)
      setNewKeyName('')
      await loadData()
    } else {
      const err = await res.json()
      showMsg(err.error || 'Hata', 'error')
    }
  }

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Bu anahtarı iptal etmek istediğine emin misin?')) return
    const res = await fetch(`/api/tenant/api-keys/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showMsg('Anahtar iptal edildi')
      await loadData()
    } else {
      showMsg('İptal başarısız', 'error')
    }
  }

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // --- Webhooks ---
  const toggleEvent = (evt: string) => {
    setWebhookEvents(prev =>
      prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt]
    )
  }

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim() || webhookEvents.length === 0) return
    const res = await fetch('/api/tenant/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        events: webhookEvents,
        description: webhookDesc.trim() || null,
      }),
    })
    if (res.ok) {
      setShowWebhookForm(false)
      setWebhookUrl('')
      setWebhookDesc('')
      setWebhookEvents([])
      showMsg('Webhook eklendi')
      await loadData()
    } else {
      const err = await res.json()
      showMsg(err.error || 'Hata', 'error')
    }
  }

  const handleToggleWebhook = async (wh: WebhookEndpoint) => {
    const res = await fetch(`/api/tenant/webhooks/${wh.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !wh.active }),
    })
    if (res.ok) {
      showMsg(wh.active ? 'Webhook devre dışı' : 'Webhook aktif')
      await loadData()
    } else {
      showMsg('Güncelleme başarısız', 'error')
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Bu webhook aboneliğini silmek istediğine emin misin?')) return
    const res = await fetch(`/api/tenant/webhooks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showMsg('Webhook silindi')
      await loadData()
    } else {
      showMsg('Silme başarısız', 'error')
    }
  }

  const handleTestWebhook = async (id: string) => {
    const res = await fetch(`/api/tenant/webhooks/${id}/test`, { method: 'POST' })
    if (res.ok) {
      showMsg('Test event\'i gönderildi')
    } else {
      showMsg('Test başarısız', 'error')
    }
  }

  const handleRetry = async (deliveryId: string) => {
    const res = await fetch(`/api/tenant/webhook-deliveries/${deliveryId}/retry`, { method: 'POST' })
    if (res.ok) {
      showMsg('Tekrar gönderiliyor')
    } else {
      showMsg('Tekrar gönderme başarısız', 'error')
    }
  }

  // Load deliveries for a webhook
  const loadDeliveries = async (webhookId: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { data } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('endpoint_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setDeliveries(prev => ({ ...prev, [webhookId]: data as WebhookDelivery[] }))
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedWebhook === id) {
      setExpandedWebhook(null)
    } else {
      setExpandedWebhook(id)
      loadDeliveries(id)
    }
  }

  // --- Render ---
  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>
  }

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_APP_URL || 'https://trevo.app'

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API & Webhook</h1>
        <p className="text-gray-500 text-sm mt-1">Harici araçlarla entegrasyon için API anahtarları ve webhook bildirimleri</p>
      </div>

      {/* Mesaj */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          msgType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {msg}
        </div>
      )}

      {/* ============ API KEYS ============ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">API Anahtarları</h2>
            <p className="text-xs text-gray-400 mt-0.5">REST API&apos;ye erişim için kullanılan anahtarlar</p>
          </div>
          <button
            onClick={() => { setShowNewKeyForm(true); setNewKeyResult(null) }}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            + Yeni Anahtar
          </button>
        </div>

        {showNewKeyForm && !newKeyResult && (
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50">
            <div className="flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Anahtar adı (örn: Zapier)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
              />
              <button onClick={handleCreateKey} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium">
                Oluştur
              </button>
              <button onClick={() => setShowNewKeyForm(false)} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100">
                İptal
              </button>
            </div>
          </div>
        )}

        {newKeyResult && (
          <div className="px-6 py-5 border-b border-gray-50 bg-yellow-50">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-yellow-700 text-sm font-semibold">⚠️ Anahtarınızı kopyalayın</span>
            </div>
            <p className="text-xs text-yellow-600 mb-3">
              Bu anahtar bir daha gösterilmeyecek. Güvenli bir yere kaydedin.
            </p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-white border border-yellow-200 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-900 break-all select-all">
                {newKeyResult.fullKey}
              </code>
              <button
                onClick={() => copyKey(newKeyResult.fullKey)}
                className="bg-yellow-100 text-yellow-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
              >
                {copied ? '✓ Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <button
              onClick={() => setNewKeyResult(null)}
              className="mt-2 text-xs text-yellow-700 hover:underline"
            >
              Kapat
            </button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Henüz API anahtarı oluşturulmamış</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ön Ek</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Son Kullanım</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{key.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{key.key_prefix}...</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {key.revoked_at ? (
                      <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-full font-medium">İptal</span>
                    ) : (
                      <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">Aktif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!key.revoked_at && (
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        İptal Et
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ============ WEBHOOKS ============ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Webhook Bildirimleri</h2>
            <p className="text-xs text-gray-400 mt-0.5">Olay gerçekleşince HTTP POST ile dışarı bildirim gönder</p>
          </div>
          <button
            onClick={() => setShowWebhookForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            + Webhook Ekle
          </button>
        </div>

        {showWebhookForm && (
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hedef URL *</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
              <input
                type="text"
                value={webhookDesc}
                onChange={(e) => setWebhookDesc(e.target.value)}
                placeholder="Zapier entegrasyonu"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Abone Olunacak Event&apos;ler *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((evt) => (
                  <button
                    key={evt}
                    type="button"
                    onClick={() => toggleEvent(evt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      webhookEvents.includes(evt)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {eventLabels[evt] || evt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateWebhook}
                disabled={!webhookUrl.trim() || webhookEvents.length === 0}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Kaydet
              </button>
              <button
                onClick={() => setShowWebhookForm(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {webhooks.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Henüz webhook tanımlanmamış</div>
        ) : (
          <div>
            {webhooks.map((wh) => (
              <div key={wh.id} className="border-b border-gray-50 last:border-b-0">
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(wh.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${wh.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-900 truncate">{wh.url}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{wh.description || '—'}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{wh.events.length} event</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTestWebhook(wh.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                      title="Test Et"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleToggleWebhook(wh)}
                      className={`text-xs px-2 py-1 rounded ${
                        wh.active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {wh.active ? 'Pasif' : 'Aktif'}
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {/* Expanded: son teslimatlar */}
                {expandedWebhook === wh.id && (
                  <div className="px-6 pb-4 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Son Teslimatlar</h4>
                    {deliveries[wh.id]?.length ? (
                      <div className="space-y-1">
                        {deliveries[wh.id].map((d) => (
                          <div key={d.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 text-xs border border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${
                                d.status === 'success' ? 'text-green-600' : d.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                              }`}>
                                {d.status === 'success' ? '✓' : d.status === 'failed' ? '✗' : '⏳'}
                              </span>
                              <span className="text-gray-600">{eventLabels[d.event_type] || d.event_type}</span>
                              {d.response_status && <span className="text-gray-400">HTTP {d.response_status}</span>}
                              <span className="text-gray-400">{d.attempts} deneme</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">
                                {new Date(d.created_at).toLocaleString('tr-TR')}
                              </span>
                              {d.status !== 'success' && (
                                <button
                                  onClick={() => handleRetry(d.id)}
                                  className="text-indigo-500 hover:text-indigo-700 font-medium"
                                >
                                  Tekrar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Henüz teslimat yok</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ KULLANIM ÖZETİ ============ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Kullanım Kılavuzu</h2>

        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Temel URL</h3>
            <code className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-mono">{baseUrl}/api/v1</code>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-1">Kimlik Doğrulama</h3>
            <p className="text-xs text-gray-500 mb-1">Tüm isteklerde Authorization başlığı gönderilmelidir:</p>
            <code className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-mono">Authorization: Bearer trv_xxxxxxxxxxxx...</code>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-1">Endpoint&apos;ler</h3>
            <div className="space-y-1 text-xs">
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">GET /api/v1/me</code> — Bağlantı testi</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">GET /api/v1/clients</code> — Müşteri listesi</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">POST /api/v1/clients</code> — Müşteri oluştur</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">GET /api/v1/clients/:id</code> — Müşteri detay</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">GET /api/v1/invoices</code> — Fatura listesi</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">POST /api/v1/invoices</code> — Fatura oluştur</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">GET /api/v1/invoices/:id</code> — Fatura detay</div>
              <div><code className="bg-gray-50 px-2 py-0.5 rounded font-mono">GET /api/v1/services</code> — Hizmet listesi</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-1">Webhook İmza Doğrulama</h3>
            <p className="text-xs text-gray-500">
              Gelen webhook isteklerinin <code className="bg-gray-50 px-1 py-0.5 rounded font-mono">X-Trevo-Signature</code> başlığını,
              endpoint secret&apos;ı ile HMAC-SHA256 kullanarak doğrulayın.
              İmza formatı: <code className="bg-gray-50 px-1 py-0.5 rounded font-mono">sha256=HMAC-SHA256(secret, request_body)</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
