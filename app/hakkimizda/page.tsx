import Link from 'next/link'

export default function HakkimizdaPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Hakkımızda</h1>
        <p style={{ color: '#8a9ab5', fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
          Trevo, Türkiye&apos;deki ajansların ve freelancer&apos;ların müşterileriyle profesyonel çalışmasını sağlayan bir müşteri portalı platformudur.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 48 }}>
          {[
            { n: '1.400+', d: 'Aktif işletme' },
            { n: '45.000+', d: 'Paylaşılan dosya' },
            { n: '₺12M+', d: 'İşlem hacmi' },
            { n: '99.9%', d: 'Uptime' },
          ].map((stat) => (
            <div key={stat.d} style={{ textAlign: 'center', padding: 28, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff' }}>{stat.n}</div>
              <div style={{ color: '#8a9ab5', fontSize: 13, marginTop: 4 }}>{stat.d}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Misyonumuz</h2>
        <p style={{ color: '#8a9ab5', lineHeight: 1.8, marginBottom: 32 }}>
          WhatsApp&apos;ta dosya paylaşan, ödemelerini elden takip eden ve müşterilerini e-postalarda kaybeden ajanslar için —
          hepsini tek bir profesyonel portalda toplamak. Kendi markanız altında, kendi domain&apos;inizde.
        </p>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>İletişim</h2>
        <p style={{ color: '#8a9ab5', lineHeight: 1.8 }}>
          📧 <a href="mailto:bilgi@trevo.app" style={{ color: '#7aa0ff' }}>bilgi@trevo.app</a><br />
          📍 İstanbul, Türkiye
        </p>
      </div>
    </div>
  )
}
