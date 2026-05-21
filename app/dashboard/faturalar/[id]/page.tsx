'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatTRY, formatDate } from '@/lib/invoice/calculator'

export default function FaturaDetayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(data => {
      if (data.error) router.push('/dashboard/faturalar')
      else { setInvoice(data); setLoading(false) }
    }).catch(() => router.push('/dashboard/faturalar'))
  }, [id])

  const handleSend = async () => {
    setSending(true)
    const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
    if (res.ok) setMsg('Fatura gönderildi!')
    else { const d = await res.json(); setMsg(d.error || 'Hata') }
    setSending(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const handlePDF = () => {
    setDownloading(true)
    setMsg('PDF hazırlanıyor...')
    window.open(`/api/invoices/${id}/pdf`, '_blank')
    setTimeout(() => { setDownloading(false); setMsg('') }, 3000)
  }

  const handleStatus = async (status: string) => {
    await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setInvoice(i => i ? { ...i, status } : null)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Yükleniyor...</div>
  if (!invoice) return null

  const items = (invoice.items || []) as Array<Record<string, React.ReactNode>>
  const stat = invoice.status as string
  const it = (invoice as Record<string, unknown>)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>{it.invoice_number as string}</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{formatDate(it.invoice_date as string)}</p>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm font-medium" style={{ color: msg.includes('hata') || msg.includes('Hata') ? '#ef4444' : '#10b981' }}>{msg}</span>}
          {stat === 'draft' && (
            <>
              <button onClick={() => handleStatus('sent')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#4f7dff' }}>Gönderildi İşaretle</button>
              <button onClick={handlePDF} disabled={downloading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #4f7dff, #6a96ff)' }}>
                {downloading ? '⏳' : 'PDF İndir'}
              </button>
              <button onClick={handleSend} disabled={sending} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#10b981' }}>
                {sending ? '⏳' : 'E-posta ile Gönder'}
              </button>
            </>
          )}
          {stat === 'sent' && (
            <>
              <button onClick={handlePDF} disabled={downloading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#4f7dff' }}>PDF İndir</button>
              <button onClick={() => handleStatus('paid')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#10b981' }}>Ödendi İşaretle</button>
            </>
          )}
          {stat === 'paid' && (
            <button onClick={handlePDF} disabled={downloading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#4f7dff' }}>PDF İndir</button>
          )}
        </div>
      </div>

      {/* Status + Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Durum</div>
          <span style={{ fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: stat === 'paid' ? '#ecfdf5' : stat === 'sent' ? '#eef2ff' : '#f1f5f9', color: stat === 'paid' ? '#10b981' : stat === 'sent' ? '#4f7dff' : '#64748b' }}>
            {stat === 'paid' ? 'Ödendi' : stat === 'sent' ? 'Gönderildi' : stat === 'draft' ? 'Taslak' : stat}
          </span>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Toplam</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatTRY(Number(it.total))}</div>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>KDV</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatTRY(Number(it.kdv_amount))}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: '#fff', borderColor: '#e8edf8' }}>
        <table className="w-full">
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf8' }}>
            <tr>
              {['Açıklama', 'Miktar', 'Birim Fiyat', 'KDV', 'Tutar'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: h === 'Açıklama' ? 'left' : 'right', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: 14, color: '#0f172a' }}>{item.description as string}</td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 14, color: '#64748b' }}>{String(item.quantity)} {item.unit as string}</td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 14, color: '#64748b' }}>{formatTRY(Number(item.unit_price))}</td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 13, color: '#94a3b8' }}>%{String(item.kdv_rate)}</td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{formatTRY(Number(item.line_total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Client Info */}
      <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e8edf8' }}>
        <h2 className="font-semibold mb-3" style={{ fontSize: 15, color: '#0f172a' }}>Müşteri Bilgileri</h2>
        <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: '#64748b' }}>
          <div>👤 {String(it.client_name)}{String(it.client_company || '')}</div>
          {String(it.client_email) && <div>📧 {String(it.client_email)}</div>}
          {String(it.client_tax_number) && <div>🏢 Vergi No: {String(it.client_tax_number)}</div>}
          {String(it.client_tax_office) && <div>📋 {String(it.client_tax_office)}</div>}
        </div>
      </div>
    </div>
  )
}
