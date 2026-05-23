'use client'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Bir şeyler yanlış gitti</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, maxWidth: 400 }}>
        {error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'}
      </p>
      <button
        onClick={reset}
        style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--brand-primary, #4f7dff)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        Tekrar Dene
      </button>
    </div>
  )
}
