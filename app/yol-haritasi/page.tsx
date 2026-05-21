import Link from 'next/link'

export default function RoadmapPage() {
  const phases = [
    { label: 'Tamamlandı', color: '#34d399', items: ['Müşteri portalı', 'Dosya paylaşımı (R2)', 'E-posta bildirimleri', 'Dashboard ve istatistikler', 'Hizmet paketi yönetimi', 'Ekip üye yönetimi', 'White-label altyapısı'] },
    { label: 'Geliştiriliyor', color: '#7aa0ff', items: ['Fatura oluşturma ve PDF çıktı', 'iyzico ile online ödeme akışı', 'Müşteri portalı özelleştirme', 'Takvim ve randevu sistemi'] },
    { label: 'Planlandı', color: '#8a9ab5', items: ['Mobil uygulama (iOS & Android)', 'API erişimi', 'Zapier / Make entegrasyonu', 'Çoklu dil desteği (EN, AR)', 'Slack / Discord bildirimleri', 'Gelişmiş raporlama ve analitik'] },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Yol Haritası</h1>
        <p style={{ color: '#8a9ab5', marginBottom: 48 }}>Trevo&apos;nun geleceği. Öneriniz varsa bize iletin.</p>

        {phases.map((phase) => (
          <div key={phase.label} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: phase.color, display: 'inline-block' }} />
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{phase.label}</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {phase.items.map((item) => (
                <span key={item} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2236', color: '#8a9ab5' }}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
