'use client'

import { useState } from 'react'

export default function PortalPaymentButton({
  invoiceId,
  portalToken,
}: {
  invoiceId: string
  portalToken: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [frameSrc, setFrameSrc] = useState<string | null>(null)

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken, invoiceId }),
      })
      const data = await res.json()
      if (res.ok && data.paymentId) {
        // Form, kendi gevşek CSP'sine sahip ayrı dokümandan yüklenir —
        // srcdoc üst sayfanın nonce CSP'sini miras aldığı için kullanılamaz
        setFrameSrc(
          `/api/payments/checkout-frame?paymentId=${encodeURIComponent(data.paymentId)}&token=${encodeURIComponent(portalToken)}`
        )
      } else {
        setError(data.error || 'Ödeme başlatılamadı')
      }
    } catch {
      setError('Bağlantı hatası')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setFrameSrc(null)
    setError('')
  }

  return (
    <>
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          background: loading ? '#94a3b8' : '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳' : 'Öde'}
      </button>

      {/* Modal */}
      {(frameSrc || error) && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', padding: 20,
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%',
              maxHeight: '90vh', overflow: 'auto', position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 1,
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                width: 32, height: 32, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b',
              }}
            >
              ✕
            </button>

            {error ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
                <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
              </div>
            ) : frameSrc ? (
              <iframe
                src={frameSrc}
                sandbox="allow-scripts allow-forms allow-top-navigation-by-user-activation"
                style={{ border: 'none', width: '100%', minHeight: 480 }}
                title="Ödeme Formu"
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
