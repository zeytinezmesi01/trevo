import Link from 'next/link'

const posts = [
  { t: 'Freelancer\'lar İçin Müşteri Yönetimi: 2026 Rehberi', d: 'Müşterilerinizle profesyonel çalışmanın 5 altın kuralı.', date: '15 Mayıs 2026', tag: 'Rehber' },
  { t: 'Dosya Paylaşımında WhatsApp Dönemi Bitiyor mu?', d: 'Profesyonel portaller neden WhatsApp\'ın yerini alıyor.', date: '2 Mayıs 2026', tag: 'Trend' },
  { t: 'Ajanslar İçin Dijital Dönüşüm: Nereden Başlamalı?', d: 'Küçük ajanslar için adım adım dijitalleşme planı.', date: '18 Nisan 2026', tag: 'Strateji' },
  { t: 'Türkiye\'de Freelance Ekonomisi 2026', d: 'Rakamlar, trendler ve büyüyen fırsatlar.', date: '5 Nisan 2026', tag: 'Araştırma' },
  { t: 'Müşteri Portalı Seçerken Nelere Dikkat Etmeli?', d: 'White-label, güvenlik, entegrasyon — kapsamlı kontrol listesi.', date: '20 Mart 2026', tag: 'Rehber' },
  { t: 'Vergi ve Fatura Yönetimini Otomatikleştirme', d: 'Türk freelancer\'lar için fatura kesme ve takip ipuçları.', date: '8 Mart 2026', tag: 'Finans' },
]

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Blog</h1>
        <p style={{ color: '#8a9ab5', marginBottom: 48 }}>Ajans yönetimi, freelance ekonomi ve dijital dönüşüm üzerine içerikler.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map((post) => (
            <div key={post.t} style={{ padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, background: 'rgba(79,125,255,0.15)', color: '#7aa0ff', fontWeight: 600 }}>{post.tag}</span>
                <span style={{ fontSize: 12, color: '#8a9ab5' }}>{post.date}</span>
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{post.t}</h2>
              <p style={{ color: '#8a9ab5', fontSize: 14, margin: 0 }}>{post.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
