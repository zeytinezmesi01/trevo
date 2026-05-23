import Link from 'next/link'

export default function IletisimPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>İletişim</h1>
        <p style={{ color: '#8a9ab5', marginBottom: 48 }}>Bizimle iletişime geçmekten çekinme.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
          {[
            { icon: '📧', label: 'E-posta', value: 'bilgi@trevo-delta.vercel.app', href: 'mailto:bilgi@trevo-delta.vercel.app' },
            { icon: '📍', label: 'Adres', value: 'Levent, Beşiktaş, İstanbul', href: null },
            { icon: '📞', label: 'Telefon', value: '+90 (212) 555 00 00', href: 'tel:+902125550000' },
          ].map((item) => (
            <div key={item.label} style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 24 }}>{item.icon}</div>
              <div>
                <div style={{ color: '#8a9ab5', fontSize: 12 }}>{item.label}</div>
                {item.href ? (
                  <a href={item.href} style={{ color: '#7aa0ff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{item.value}</a>
                ) : (
                  <div style={{ color: '#fff', fontSize: 15 }}>{item.value}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 28, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Mesaj Bırak</h2>
          <p style={{ color: '#8a9ab5', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Sorularınız için doğrudan e-posta gönderebilirsiniz. Genelde 24 saat içinde yanıtlıyoruz.
          </p>
          <a
            href="mailto:bilgi@trevo-delta.vercel.app?subject=İletişim%20Formu"
            style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #4f7dff, #6a96ff)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
          >
            E-posta Gönder
          </a>
        </div>
      </div>
    </div>
  )
}
