'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatTRY, formatDate } from '@/lib/invoice/calculator'

type Invoice = {
  id: string
  invoice_number: string
  client_name: string
  status: string
  total: number
  invoice_date: string
  due_date: string | null
  created_at: string
  einvoice_status?: string
  einvoice_type?: string
}

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: '#f1f5f9', color: '#64748b', label: 'Taslak' },
  sent:     { bg: '#eef2ff', color: 'var(--brand-primary, #4f7dff)', label: 'GÃ¶nderildi' },
  paid:     { bg: '#ecfdf5', color: '#10b981', label: 'Ã–dendi' },
  overdue:  { bg: '#fef2f2', color: '#ef4444', label: 'Gecikti' },
  cancelled:{ bg: '#f1f5f9', color: '#94a3b8', label: 'Ä°ptal' },
}

const einvoiceStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fef3c7', color: '#d97706', label: 'E-Bekliyor' },
  sent:      { bg: '#eef2ff', color: 'var(--brand-primary, #4f7dff)', label: 'E-GÃ¶nderildi' },
  accepted:  { bg: '#ecfdf5', color: '#10b981', label: 'E-Kabul' },
  rejected:  { bg: '#fef2f2', color: '#ef4444', label: 'E-Red' },
  error:     { bg: '#fef2f2', color: '#dc2626', label: 'E-Hata' },
}

function EinvoiceBadge({ status, type }: { status: string; type?: string }) {
  const s = einvoiceStyle[status] || { bg: '#f1f5f9', color: '#64748b', label: status }
  const t = type === 'e_fatura' ? 'e-Fatura' : type === 'e_arsiv' ? 'e-ArÅŸiv' : ''
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: s.bg, color: s.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}{t ? ` (${t})` : ''}
    </span>
  )
}

export default function FaturalarPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => setUserRole(d.role || '')).catch(() => {})
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/invoices')
      if (res.ok) setInvoices(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/invoices')
        if (res.ok) setInvoices(await res.json())
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu faturayÄ± silmek istediÄŸine emin misin?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    fetchData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Faturalar</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>TÃ¼m faturalarÄ±nÄ± tek yerden yÃ¶net</p>
        </div>
        <Link href="/dashboard/faturalar/yeni" className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--brand-primary, var(--brand-primary, #4f7dff)), var(--brand-primary-hover, var(--brand-primary-hover, #6a96ff)))', textDecoration: 'none', boxShadow: '0 2px 8px rgba(79,125,255,0.3)' }}>
          + Yeni Fatura
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#94a3b8', fontSize: 14 }}>YÃ¼kleniyor...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ§¾</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>HenÃ¼z fatura yok</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Ä°lk faturanÄ± oluÅŸturmaya baÅŸla</div>
          <Link href="/dashboard/faturalar/yeni" style={{ fontSize: 13, color: 'var(--brand-primary, var(--brand-primary, #4f7dff))', fontWeight: 600 }}>Yeni Fatura OluÅŸtur</Link>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <table className="w-full">
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf8' }}>
              <tr>
                {['No', 'MÃ¼ÅŸteri', 'Tarih', 'Tutar', 'Durum', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: h === 'Tutar' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const s = statusStyle[inv.status] || statusStyle.draft
                return (
                  <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{inv.invoice_number}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{inv.client_name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>{formatDate(inv.invoice_date)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{formatTRY(inv.total)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                        {inv.einvoice_status && inv.einvoice_status !== 'none' && (
                          <EinvoiceBadge status={inv.einvoice_status} type={inv.einvoice_type} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => router.push(`/dashboard/faturalar/${inv.id}`)} style={{ fontSize: 12, color: 'var(--brand-primary, #4f7dff)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>GÃ¶rÃ¼ntÃ¼le</button>
                        {userRole !== 'viewer' && inv.status === 'draft' && (
                          <button onClick={async () => {
                            await fetch(`/api/invoices/${inv.id}/send`, { method: 'POST' })
                            fetchData()
                          }} style={{ fontSize: 12, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>E-posta GÃ¶nder</button>
                        )}
                        {userRole !== 'viewer' && inv.status === 'sent' && (
                          <button onClick={() => handleStatus(inv.id, 'paid')} style={{ fontSize: 12, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Ã–dendi</button>
                        )}
                        {userRole !== 'viewer' && (
                          <button onClick={() => handleDelete(inv.id)} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Sil</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
