'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function MusteriDetayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Record<string, unknown> | null>(null)
  const [files, setFiles] = useState<Array<Record<string, unknown>>>([])
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${id}`)
        if (!res.ok) { router.push('/dashboard/musteriler'); return }
        const data = await res.json()
        const c = data.client
        setClient(c)
        setForm({
          name: c.name || '', company: c.company || '', email: c.email || '',
          tax_office: c.tax_office || '', tax_number: c.tax_number || '',
          address: c.address || '', city: c.city || '', phone: c.phone || '',
        })
        setFiles(data.files || [])
        setInvoices(data.invoices || [])
        setLoading(false)
      } catch {
        router.push('/dashboard/musteriler')
      }
    }
    load()
  }, [id, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setClient({ ...client!, ...form })
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>YÃ¼kleniyor...</div>
  if (!client) return null

  const portalUrl = `${window.location.origin}/portal/${client.token}`

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>{String(client.name)}</h1>
          {!!client.company && <p className="text-sm mt-1" style={{ color: '#64748b' }}>{String(client.company)}</p>}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(portalUrl); alert('Portal linki kopyalandÄ±!') }}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--brand-primary, #4f7dff)' }}>
          ðŸ“‹ Portal Linkini Kopyala
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Info */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ fontSize: 15, color: '#0f172a' }}>Bilgiler</h2>
            <button onClick={() => setEditing(!editing)} className="text-sm font-medium" style={{ color: 'var(--brand-primary, #4f7dff)' }}>
              {editing ? 'Ä°ptal' : 'DÃ¼zenle'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              {['name', 'company', 'email', 'phone', 'tax_office', 'tax_number', 'address', 'city'].map(f => (
                <div key={f}>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>{f === 'name' ? 'Ad Soyad' : f === 'company' ? 'Åžirket' : f === 'email' ? 'E-posta' : f === 'phone' ? 'Telefon' : f === 'tax_office' ? 'Vergi Dairesi' : f === 'tax_number' ? 'Vergi No' : f === 'address' ? 'Adres' : 'Åžehir'}</label>
                  <input value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#e2e8f0' }} />
                </div>
              ))}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--brand-primary, #4f7dff)' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-sm" style={{ color: '#64748b' }}>
              {!!client.email && <div>ðŸ“§ {String(client.email)}</div>}
              {!!client.phone && <div>ðŸ“ž {String(client.phone)}</div>}
              {!!client.tax_number && <div>ðŸ¢ Vergi No: {String(client.tax_number)}</div>}
              {!!client.tax_office && <div>ðŸ“‹ Vergi Dairesi: {String(client.tax_office)}</div>}
              {!!client.address && <div>ðŸ“ {String(client.address)}{client.city ? `, ${String(client.city)}` : ''}</div>}
              <div>ðŸ”— <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{portalUrl}</code></div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <h2 className="font-semibold mb-3" style={{ fontSize: 15, color: '#0f172a' }}>Ã–zet</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{files.length}</div><div style={{ fontSize: 12, color: '#64748b' }}>Dosya</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{invoices.length}</div><div style={{ fontSize: 12, color: '#64748b' }}>Fatura</div></div>
            </div>
          </div>

          {/* Recent Files */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8edf8', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Son Dosyalar</div>
            {files.slice(0, 5).map(f => (
              <div key={f.id as string} style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1 }}>ðŸ“„ {f.name as string} Â· {f.size as string} Â· {new Date(f.created_at as string).toLocaleDateString('tr-TR')}</span>
                {f.shared_with_client ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: '#ecfdf5', color: '#10b981' }}>PaylaÅŸÄ±ldÄ±</span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: '#fffbeb', color: '#d97706' }}>Dahili</span>
                )}
              </div>
            ))}
            {files.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>HenÃ¼z dosya yok</div>}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8edf8', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Faturalar</div>
        {invoices.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>HenÃ¼z fatura yok</div>
        ) : (
          <table className="w-full">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['No', 'Tarih', 'Tutar', 'Durum'].map(h => <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id as string} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/faturalar/${inv.id}`)}>
                  <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{inv.invoice_number as string}</td>
                  <td style={{ padding: '10px 20px', fontSize: 13, color: '#64748b' }}>{new Date(inv.invoice_date as string).toLocaleDateString('tr-TR')}</td>
                  <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{formatTRY(Number(inv.total))}</td>
                  <td style={{ padding: '10px 20px' }}><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: inv.status === 'paid' ? '#ecfdf5' : '#eef2ff', color: inv.status === 'paid' ? '#10b981' : 'var(--brand-primary, #4f7dff)' }}>{inv.status === 'paid' ? 'Ã–dendi' : inv.status === 'sent' ? 'GÃ¶nderildi' : 'Taslak'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function formatTRY(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' â‚º' }
