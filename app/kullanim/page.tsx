import Link from 'next/link'

export default function KullanimPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Kullanım Şartları</h1>
        <p style={{ color: '#8a9ab5', fontSize: 13, marginBottom: 40 }}>Son güncelleme: Mayıs 2026</p>

        <div style={{ lineHeight: 1.9, fontSize: 14, color: '#8a9ab5' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>1. Hizmet Kullanımı</h2>
          <p>Trevo&apos;yu kullanarak bu şartları kabul etmiş olursunuz. Hizmetlerimizi yasal amaçlar için kullanmayı taahhüt edersiniz.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>2. Hesap Sorumluluğu</h2>
          <p>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Hesabınız altında yapılan tüm işlemler sizin sorumluluğunuzdadır.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>3. İçerik</h2>
          <p>Yüklediğiniz dosyaların yasal sahibi olduğunuzu ve başkalarının fikri mülkiyet haklarını ihlal etmediğini beyan edersiniz.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>4. Hizmet Değişiklikleri</h2>
          <p>Trevo, hizmetlerini ve fiyatlandırmasını önceden bildirim yaparak değiştirme hakkını saklı tutar.</p>
        </div>
      </div>
    </div>
  )
}
