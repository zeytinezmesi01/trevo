'use client'

import { useState } from 'react'

export default function PortalFaturaTalep({ token }: { token: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', note: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.amount) { setError('Tutar giriniz'); return }
    setSending(true)
    setError('')
    const res = await fetch('/api/invoices/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, description: form.description, amount: form.amount, note: form.note }),
    })
    if (res.ok) {
      setDone(true)
      setOpen(false)
    } else {
      const data = await res.json()
      setError(data.error || 'Hata oluştu')
    }
    setSending(false)
  }

  if (done) {
    return (
      <div style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>
        ✓ Fatura talebiniz iletildi
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
      >
        Fatura Talep Et
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fatura Talep Et</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Logo Tasarımı, Web Sitesi..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="2500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Eklemek istediğiniz bir şey..." />
              </div>
            </div>
            {error && <div className="mt-3 p-2 rounded-lg text-xs" style={{ background: '#fef2f2', color: '#ef4444' }}>{error}</div>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium">İptal</button>
              <button onClick={handleSubmit} disabled={sending}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {sending ? 'Gönderiliyor...' : 'Talep Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
