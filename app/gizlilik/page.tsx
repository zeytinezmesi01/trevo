import Link from 'next/link'

export default function GizlilikPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Gizlilik Politikası</h1>
        <p style={{ color: '#8a9ab5', fontSize: 13, marginBottom: 40 }}>Son güncelleme: Mayıs 2026</p>

        <div style={{ lineHeight: 1.9, fontSize: 14, color: '#8a9ab5' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>1. Toplanan Bilgiler</h2>
          <p>Hizmetlerimizi sunmak için ad, soyad, e-posta adresi ve şirket bilgilerinizi topluyoruz. Dosya yüklemeleriniz güvenli bir şekilde saklanır.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>2. Bilgilerin Kullanımı</h2>
          <p>Bilgileriniz yalnızca hizmetlerimizi sunmak, hesabınızı yönetmek ve sizinle iletişim kurmak için kullanılır. Üçüncü taraflarla paylaşılmaz.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>3. Veri Güvenliği</h2>
          <p>Verileriniz endüstri standardı şifreleme ile korunur. Supabase ve Cloudflare R2 altyapısı kullanılmaktadır.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>4. İletişim</h2>
          <p>Sorularınız için: <a href="mailto:bilgi@trevo-delta.vercel.app" style={{ color: '#7aa0ff' }}>bilgi@trevo-delta.vercel.app</a></p>
        </div>
      </div>
    </div>
  )
}
