import Link from 'next/link'

export default function CerezPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Çerez Politikası</h1>
        <p style={{ color: '#8a9ab5', fontSize: 13, marginBottom: 40 }}>Son güncelleme: Mayıs 2026</p>

        <div style={{ lineHeight: 1.9, fontSize: 14, color: '#8a9ab5' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>1. Çerez Nedir?</h2>
          <p>Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>2. Hangi Çerezleri Kullanıyoruz?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'sb-access-token / sb-refresh-token', desc: 'Oturum yönetimi için Supabase kimlik doğrulama çerezleri. Zorunludur.', type: 'Zorunlu' },
              { name: 'brand_profile_id', desc: 'Beyaz etiket marka tespiti için domain bazlı kimlik çerezi. 24 saat geçerli.', type: 'Fonksiyonel' },
            ].map((c) => (
              <div key={c.name} style={{ padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <code style={{ color: '#7aa0ff', fontSize: 13 }}>{c.name}</code>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(79,125,255,0.15)', color: '#7aa0ff' }}>{c.type}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13 }}>{c.desc}</p>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>3. Çerezleri Nasıl Yönetirsiniz?</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezler engellendiğinde platform düzgün çalışmayabilir.</p>

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', margin: '28px 0 12px' }}>4. İletişim</h2>
          <p>Sorularınız için: <a href="mailto:kvkk@trevo-delta.vercel.app" style={{ color: '#7aa0ff' }}>kvkk@trevo-delta.vercel.app</a></p>
        </div>
      </div>
    </div>
  )
}
