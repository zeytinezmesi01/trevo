import Link from 'next/link'

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Değişiklik Günlüğü</h1>
        <p style={{ color: '#8a9ab5', marginBottom: 48 }}>Trevo&apos;daki son güncellemeler ve yenilikler.</p>

        {[
          { v: '2.1', date: 'Mayıs 2026', changes: ['Yeni karanlık tema tasarımı', 'White-label marka özelleştirme altyapısı', 'Logo yükleme ve renk seçici', 'Özel domain desteği', 'Performans iyileştirmeleri'] },
          { v: '2.0', date: 'Nisan 2026', changes: ['Müşteri portalı yayında', 'Dosya paylaşım sistemi (R2 entegrasyonu)', 'E-posta bildirimleri (Resend)', 'iyzico ödeme entegrasyonu', 'Ekip yönetimi modülü'] },
          { v: '1.0', date: 'Mart 2026', changes: ['İlk sürüm yayında', 'Kullanıcı kaydı ve giriş', 'Dashboard ve proje yönetimi', 'Hizmet paketi oluşturma', 'Müşteri yönetimi'] },
        ].map((release) => (
          <div key={release.v} style={{ borderBottom: '1px solid #1a2236', paddingBottom: 28, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>v{release.v}</span>
              <span style={{ fontSize: 13, color: '#8a9ab5' }}>{release.date}</span>
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {release.changes.map((c, i) => (
                <li key={i} style={{ color: '#8a9ab5', fontSize: 14, lineHeight: 1.8 }}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
