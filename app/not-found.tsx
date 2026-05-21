import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#4f7dff', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>404</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Sayfa Bulunamadı</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Aradığınız sayfa taşınmış veya silinmiş olabilir.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/" style={{ padding: '10px 24px', borderRadius: 10, background: '#4f7dff', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Ana Sayfa</Link>
          <Link href="/giris" style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Giriş Yap</Link>
        </div>
      </div>
    </div>
  )
}
