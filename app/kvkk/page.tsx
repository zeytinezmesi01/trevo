import Link from 'next/link'

export default function KvkkPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>KVKK Aydınlatma Metni</h1>
        <p style={{ color: '#8a9ab5', fontSize: 13, marginBottom: 40 }}>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında.</p>

        <div style={{ lineHeight: 1.9, fontSize: 14, color: '#8a9ab5' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>1. Veri Sorumlusu</h2>
          <p>Trevo Teknoloji A.Ş. olarak, kişisel verilerinizi KVKK&apos;ya uygun olarak işliyoruz.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>2. İşlenen Veriler</h2>
          <p>Ad, soyad, e-posta adresi, şirket bilgisi, IP adresi ve dosya yükleme kayıtları.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>3. İşleme Amacı</h2>
          <p>Hizmet sunumu, fatura düzenleme, müşteri iletişimi ve yasal yükümlülüklerin yerine getirilmesi.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>4. Veri Saklama</h2>
          <p>Verileriniz hesabınız aktif olduğu sürece saklanır. Hesap silindiğinde 30 gün içinde imha edilir.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>5. Haklarınız</h2>
          <p>KVKK Madde 11 kapsamında; verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Talepleriniz için: <a href="mailto:kvkk@trevo.app" style={{ color: '#7aa0ff' }}>kvkk@trevo.app</a></p>
        </div>
      </div>
    </div>
  )
}
