'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatTRY, formatDate } from '@/lib/invoice/calculator'
import { createClient } from '@/lib/supabase/client'

export default function FaturaDetayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [msg, setMsg] = useState('')
  const [eDoc, setEDoc] = useState<Record<string, string | undefined> | null>(null)
  const [eLoading, setELoading] = useState(false)
  const [eSending, setESending] = useState(false)
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(data => {
      if (data.error) router.push('/dashboard/faturalar')
      else { setInvoice(data); setLoading(false) }
    }).catch(() => router.push('/dashboard/faturalar'))
  }, [id])

  // e-Belge durumunu yükle
  useEffect(() => {
    if (!id) return
    fetch(`/api/invoices/${id}/einvoice`).then(r => r.json()).then(data => {
      if (data && data.status && data.status !== 'none') setEDoc(data)
    }).catch(() => {})
  }, [id])

  // Ödemeleri yükle
  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase.from('payments').select('*').eq('invoice_id', id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setPayments(data)
    })
  }, [id])

  const handleSend = async () => {
    setSending(true)
    const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
    if (res.ok) setMsg('Fatura gönderildi!')
    else { const d = await res.json(); setMsg(d.error || 'Hata') }
    setSending(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const handlePDF = async () => {
    setDownloading(true)
    setMsg('PDF hazırlanıyor...')
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`)
      // Route PDF'i binary (application/pdf) stream eder; redirect etmez.
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setMsg(d.error || 'PDF oluşturulamadı')
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fatura-${String(it.invoice_number || id)}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        setMsg('')
      }
    } catch { setMsg('PDF hatası') }
    setDownloading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleEInvoiceSend = async () => {
    setESending(true)
    setMsg('e-Belge gönderiliyor...')
    try {
      const res = await fetch(`/api/invoices/${id}/einvoice`, { method: 'POST' })
      const data = await res.json()
      if (data.status && data.status !== 'error') {
        setMsg('e-Belge gönderildi!')
        setEDoc(data)
        setInvoice((i: Record<string, unknown> | null) => i ? { ...i, einvoice_status: data.status, einvoice_type: data.document_type } : null)
      } else {
        setMsg(data.error || 'Gönderim hatası')
      }
    } catch {
      setMsg('e-Belge hatası')
    }
    setESending(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const handleEInvoiceRefresh = async () => {
    setELoading(true)
    try {
      const res = await fetch(`/api/invoices/${id}/einvoice/status`)
      const data = await res.json()
      setEDoc(data)
      if (data.status && data.status !== 'none') {
        setInvoice((i: Record<string, unknown> | null) => i ? { ...i, einvoice_status: data.status } : null)
      }
    } catch {}
    setELoading(false)
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

  // e-Belge gönder butonu: henüz gönderilmemiş veya hata almışsa görünür.
  // Yetkiyi API enforce eder (owner/admin); Faturalar menüsü de admin+ görür.
  const canSendEInvoice = !eDoc || eDoc.status === 'error'
  const EInvoiceButton = () => (
    <button onClick={handleEInvoiceSend} disabled={eSending} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#8b5cf6' }}>
      {eSending ? '⏳' : 'e-Fatura Oluştur'}
    </button>
  )

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
              <button onClick={() => handleStatus('sent')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--brand-primary, #4f7dff)' }}>Gönderildi İşaretle</button>
              <button onClick={handlePDF} disabled={downloading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
                {downloading ? '⏳' : 'PDF İndir'}
              </button>
              <button onClick={handleSend} disabled={sending} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#10b981' }}>
                {sending ? '⏳' : 'E-posta ile Gönder'}
              </button>
              {canSendEInvoice && <EInvoiceButton />}
            </>
          )}
          {stat === 'sent' && (
            <>
              <button onClick={handlePDF} disabled={downloading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--brand-primary, #4f7dff)' }}>PDF İndir</button>
              <button onClick={() => handleStatus('paid')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#10b981' }}>Ödendi İşaretle</button>
              {canSendEInvoice && <EInvoiceButton />}
            </>
          )}
          {stat === 'paid' && (
            <>
              <button onClick={handlePDF} disabled={downloading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--brand-primary, #4f7dff)' }}>PDF İndir</button>
              {canSendEInvoice && <EInvoiceButton />}
            </>
          )}
        </div>
      </div>

      {/* Status + Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Durum</div>
          <span style={{ fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: stat === 'paid' ? '#ecfdf5' : stat === 'sent' ? '#eef2ff' : '#f1f5f9', color: stat === 'paid' ? '#10b981' : stat === 'sent' ? 'var(--brand-primary, #4f7dff)' : '#64748b' }}>
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

      {/* e-Belge Kartı */}
      {eDoc && eDoc.status && eDoc.status !== 'none' && (
        <div className="rounded-2xl border p-5 mb-8" style={{ background: '#fafbff', borderColor: '#dce5ff' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, color: 'var(--brand-primary, #4f7dff)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>e-Belge</span>
              <EBadge status={String(eDoc.status)} />
            </div>
            <div className="flex items-center gap-2">
              {(eDoc.status === 'sent' || eDoc.status === 'pending') && (
                <button onClick={handleEInvoiceRefresh} disabled={eLoading} style={{ fontSize: 12, color: 'var(--brand-primary, #4f7dff)', background: '#eef2ff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}>
                  {eLoading ? '⏳' : 'Durumu Yenile'}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Belge Türü</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{String(eDoc.document_type === 'e_fatura' ? 'e-Fatura' : 'e-Arşiv')}</div>
            </div>
            {eDoc.document_number && (
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Belge No</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0f172a', fontSize: 13 }}>{String(eDoc.document_number)}</div>
              </div>
            )}
            {eDoc.ettn && (
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>ETTN</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0f172a', fontSize: 12, wordBreak: 'break-all' }}>{String(eDoc.ettn)}</div>
              </div>
            )}
            {eDoc.error_message && (
              <div>
                <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 2 }}>Hata</div>
                <div style={{ fontSize: 12, color: '#dc2626' }}>{String(eDoc.error_message)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* e-Belge henüz gönderilmemiş — bilgilendirme */}
      {(!eDoc || eDoc.status === 'none' || eDoc.status === 'error') && (stat === 'sent' || stat === 'paid') && (
        <div className="rounded-2xl border p-4 mb-8" style={{ background: '#f8fafc', borderColor: '#e8edf8' }}>
          <div className="flex items-center gap-2" style={{ color: '#64748b', fontSize: 13 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Bu fatura henüz e-Belge olarak gönderilmedi. Yasal e-Fatura veya e-Arşiv olarak iletmek için &quot;e-Fatura Oluştur&quot; butonunu kullanın.
          </div>
        </div>
      )}

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

      {/* Ödemeler */}
      {payments.length > 0 && (
        <div className="rounded-2xl border p-6 mb-8" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: 15, color: '#0f172a' }}>Ödemeler</h2>
          <div className="space-y-3">
            {payments.map((p) => {
              const pStatus = String(p.status)
              const isSuccess = pStatus === 'success'
              return (
                <div key={String(p.id)} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: isSuccess ? '#ecfdf5' : '#f8fafc' }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 18 }}>{isSuccess ? '✅' : pStatus === 'failed' ? '❌' : '⏳'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        ₺{Number(p.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(p.created_at as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: isSuccess ? '#ecfdf5' : '#f1f5f9', color: isSuccess ? '#10b981' : '#64748b', fontWeight: 600 }}>
                      {isSuccess ? 'Başarılı' : pStatus === 'failed' ? 'Başarısız' : 'Bekliyor'}
                    </span>
                    {!!(p.provider_payment_id) && (
                      <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                        ID: {String(p.provider_payment_id).slice(0, 12)}...
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

const eBadgeStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fef3c7', color: '#d97706', label: 'Bekliyor' },
  queued:    { bg: '#fef3c7', color: '#d97706', label: 'Sırada' },
  sent:      { bg: '#eef2ff', color: '#4f7dff', label: 'Gönderildi' },
  accepted:  { bg: '#ecfdf5', color: '#10b981', label: 'Kabul Edildi' },
  rejected:  { bg: '#fef2f2', color: '#ef4444', label: 'Reddedildi' },
  error:     { bg: '#fef2f2', color: '#dc2626', label: 'Hata' },
  cancelled: { bg: '#f1f5f9', color: '#94a3b8', label: 'İptal Edildi' },
}

function EBadge({ status }: { status: string }) {
  const s = eBadgeStyle[status] || { bg: '#f1f5f9', color: '#64748b', label: status }
  return (
    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: s.bg, color: s.color, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}
