import Link from 'next/link'
import { getCategories, searchArticles } from '@/lib/yardim/content'

export default async function YardimPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const query = (await searchParams).q || ''
  const categories = getCategories()

  const results = query ? searchArticles(query) : null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '60px 24px 48px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#7aa0ff', fontSize: '14px', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>&larr; Ana sayfaya dön</Link>
          <h1 style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>
            Yardım Merkezi
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: 28, lineHeight: 1.5 }}>
            Trevo ile ilgili sorularınız için yardım makalelerine göz atın
          </p>

          {/* Search */}
          <form action="/yardim" method="GET" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Makale ara..."
                style={{
                  width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {query ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              &ldquo;{query}&rdquo; için sonuçlar ({results!.length})
            </h2>
            {results!.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
                <p style={{ fontSize: '15px' }}>Aramanızla eşleşen makale bulunamadı.</p>
                <Link href="/yardim" style={{ color: '#4f7dff', fontSize: '14px', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Tüm makalelere göz atın</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results!.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Featured: İlk Adımlar */}
            <div style={{ marginBottom: 44 }}>
              <div style={{
                background: 'linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%)',
                border: '1px solid #dce5ff',
                borderRadius: '16px', padding: '28px 32px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: '24px' }}>🚀</span>
                  <h3 style={{ fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Trevo&apos;ya Hoş Geldiniz
                  </h3>
                </div>
                <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: 16 }}>
                  Yeni misiniz? Domain bağlama, müşteri ekleme ve fatura kesme adımlarını içeren başlangıç rehberimize göz atın.
                </p>
                <Link
                  href="/yardim/ilk-adimlar"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: '10px',
                    background: '#4f7dff', color: '#fff', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  İlk Adımlar Rehberi
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              {categories.map((cat) => (
                <div key={cat.name}>
                  <h2 style={{
                    fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
                    fontSize: '15px', fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
                  }}>
                    {cat.name}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cat.articles.map((article) => (
                      <ArticleCard key={article.slug} article={article} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ArticleCard({ article }: { article: { slug: string; title: string; description: string } }) {
  return (
    <Link
      href={`/yardim/${article.slug}`}
      style={{
        display: 'block', padding: '16px 20px', borderRadius: '12px',
        background: '#fff', border: '1px solid #e8edf8',
        textDecoration: 'none', transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
        e.currentTarget.style.borderColor = '#c8d6ff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#e8edf8'
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginBottom: 4 }}>
        {article.title}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
        {article.description}
      </div>
    </Link>
  )
}
