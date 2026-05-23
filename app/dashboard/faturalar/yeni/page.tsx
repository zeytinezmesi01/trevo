'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ClientOption = { id: string; name: string; company: string | null; email: string | null; tax_office: string | null; tax_number: string | null; address: string | null; city: string | null }

export default function YeniFaturaPage() {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [form, setForm] = useState({ invoice_date: new Date().toISOString().split('T')[0], due_date: '', notes: '' })
  const [items, setItems] = useState([{ description: '', quantity: 1, unit: 'adet', unit_price: 0, kdv_rate: 20 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: p } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
        if (!p?.tenant_id) return
        const { data } = await supabase.from('clients').select('id, name, company, email, tax_office, tax_number, address, city').eq('tenant_id', p.tenant_id).order('name')
        setClients(data || [])
      } catch {}
    }
    load()
  }, [supabase])

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit: 'adet', unit_price: 0, kdv_rate: 20 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string | number) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unit_price, 0)
  const kdvAmount = items.reduce((s, item) => s + item.quantity * item.unit_price * item.kdv_rate / 100, 0)
  const total = subtotal + kdvAmount

  const handleSave = async () => {
    if (!selectedClient) { setError('LÃ¼tfen mÃ¼ÅŸteri seÃ§in'); return }
    if (items.some(i => !i.description)) { setError('TÃ¼m kalemlere aÃ§Ä±klama girin'); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_company: selectedClient.company,
        client_email: selectedClient.email,
        client_tax_office: selectedClient.tax_office,
        client_tax_number: selectedClient.tax_number,
        client_address: selectedClient.address,
        client_city: selectedClient.city,
        invoice_date: form.invoice_date,
        due_date: form.due_date || null,
        notes: form.notes,
        items: items.map(i => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), kdv_rate: Number(i.kdv_rate) })),
      }),
    })

    if (res.ok) {
      router.push('/dashboard/faturalar')
      return
    }
    try {
      const data = await res.json()
      setError(data.error || 'KayÄ±t hatasÄ±')
    } catch {
      setError('Sunucu hatasÄ±, tekrar deneyin')
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#0f172a' }}>Yeni Fatura</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Main form */}
        <div className="space-y-5">
          {/* MÃ¼ÅŸteri SeÃ§imi */}
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <h2 className="font-semibold mb-4" style={{ fontSize: 15, color: '#0f172a' }}>MÃ¼ÅŸteri</h2>
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
              className="w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
            >
              <option value="">MÃ¼ÅŸteri seÃ§in...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` â€” ${c.company}` : ''}</option>
              ))}
            </select>
            {selectedClient && (
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm" style={{ color: '#64748b' }}>
                {selectedClient.email && <div>ðŸ“§ {selectedClient.email}</div>}
                {selectedClient.tax_number && <div>ðŸ¢ VN: {selectedClient.tax_number}</div>}
                {selectedClient.tax_office && <div>ðŸ“‹ {selectedClient.tax_office}</div>}
                {selectedClient.city && <div>ðŸ“ {selectedClient.city}</div>}
              </div>
            )}
          </div>

          {/* Kalemler */}
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <h2 className="font-semibold mb-4" style={{ fontSize: 15, color: '#0f172a' }}>Kalemler</h2>
            {items.map((item, i) => (
              <div key={i} className="flex gap-3 mb-3 items-start flex-wrap">
                <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="AÃ§Ä±klama"
                  className="flex-1 min-w-[160px] rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#e2e8f0' }} />
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} placeholder="Miktar"
                  className="w-20 rounded-lg px-3 py-2 text-sm border text-center" style={{ borderColor: '#e2e8f0' }} />
                <input value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} placeholder="Birim"
                  className="w-20 rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#e2e8f0' }} />
                <input type="number" value={item.unit_price || ''} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} placeholder="Birim Fiyat"
                  className="w-28 rounded-lg px-3 py-2 text-sm border text-right" style={{ borderColor: '#e2e8f0' }} />
                <input type="number" value={item.kdv_rate} onChange={(e) => updateItem(i, 'kdv_rate', e.target.value)} placeholder="KDV%"
                  className="w-20 rounded-lg px-3 py-2 text-sm border text-center" style={{ borderColor: '#e2e8f0' }} />
                {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 text-lg">Ã—</button>}
              </div>
            ))}
            <button onClick={addItem} className="text-sm font-medium mt-2" style={{ color: 'var(--brand-primary, #4f7dff)' }}>+ Kalem Ekle</button>
          </div>

          {/* Tarih & Not */}
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Fatura Tarihi</label>
                <input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm border" style={{ borderColor: '#e2e8f0' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Son Ã–deme</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm border" style={{ borderColor: '#e2e8f0' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Not</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} className="w-full rounded-xl px-4 py-2.5 text-sm border resize-none" style={{ borderColor: '#e2e8f0' }} placeholder="Fatura ile ilgili not..." />
            </div>
          </div>
        </div>

        {/* Sidebar - Ã–zet */}
        <div>
          <div className="rounded-2xl border p-6 sticky" style={{ top: 24, background: '#fff', borderColor: '#e8edf8' }}>
            <h2 className="font-semibold mb-4" style={{ fontSize: 15, color: '#0f172a' }}>Ã–zet</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between" style={{ color: '#64748b' }}>
                <span>Ara Toplam</span>
                <span>â‚º{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#64748b' }}>
                <span>KDV (%20)</span>
                <span>â‚º{kdvAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 mt-2" style={{ borderColor: '#e8edf8' }}>
                <div className="flex justify-between font-bold" style={{ fontSize: 16, color: '#0f172a' }}>
                  <span>Toplam</span>
                  <span>â‚º{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {error && <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#ef4444' }}>{error}</div>}

            <button onClick={handleSave} disabled={saving}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
              {saving ? 'Kaydediliyor...' : 'FaturayÄ± Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
