import Link from 'next/link'

const jobs = [
  { title: 'Senior Frontend Developer', type: 'Tam Zamanlı', loc: 'İstanbul / Uzaktan', dept: 'Mühendislik' },
  { title: 'UX/UI Tasarımcı', type: 'Tam Zamanlı', loc: 'İstanbul', dept: 'Tasarım' },
  { title: 'Büyüme Pazarlama Uzmanı', type: 'Tam Zamanlı', loc: 'Uzaktan', dept: 'Pazarlama' },
  { title: 'Backend Developer (Node.js)', type: 'Yarı Zamanlı', loc: 'Uzaktan', dept: 'Mühendislik' },
]

export default function KariyerPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#e2e8f4' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none' }}>&larr; Ana sayfaya dön</Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#fff' }}>Kariyer</h1>
        <p style={{ color: '#8a9ab5', marginBottom: 48 }}>Trevo&apos;da çalışmak ister misin? Aşağıdaki açık pozisyonlara göz at.</p>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236' }}>
            <p style={{ color: '#8a9ab5', fontSize: 15 }}>Şu anda açık pozisyonumuz bulunmuyor.</p>
            <p style={{ color: '#8a9ab5', fontSize: 13, marginTop: 8 }}>Yine de CV&apos;nizi <a href="mailto:ik@trevo-delta.vercel.app" style={{ color: '#7aa0ff' }}>ik@trevo-delta.vercel.app</a> adresine gönderebilirsiniz.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map((job) => (
              <div key={job.title} style={{ padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2236', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{job.title}</h2>
                  <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#8a9ab5' }}>
                    <span>{job.dept}</span>
                    <span>·</span>
                    <span>{job.type}</span>
                    <span>·</span>
                    <span>{job.loc}</span>
                  </div>
                </div>
                <a href="mailto:ik@trevo-delta.vercel.app" style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(79,125,255,0.15)', color: '#7aa0ff', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Başvur</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
