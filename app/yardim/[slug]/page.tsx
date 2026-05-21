import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getArticle, getArticles } from '@/lib/yardim/content'
import { renderMarkdown } from '@/lib/yardim/markdown'

const contentStyles = `
.yardim-content h2 { font-family: var(--font-display), 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; margin: 32px 0 12px; letter-spacing: -0.02em; }
.yardim-content h3 { font-family: var(--font-display), 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0f172a; margin: 28px 0 10px; }
.yardim-content p { margin-bottom: 16px; line-height: 1.8; }
.yardim-content ul { margin: 0 0 16px; padding-left: 24px; list-style: disc; }
.yardim-content ol { margin: 0 0 16px; padding-left: 24px; list-style: decimal; }
.yardim-content li { margin-bottom: 6px; line-height: 1.7; }
.yardim-content li > ul { margin: 4px 0 0; }
.yardim-content pre { background: #0f172a; color: #e2e8f0; border-radius: 10px; padding: 16px 20px; overflow-x: auto; font-size: 13px; line-height: 1.6; margin-bottom: 16px; }
.yardim-content pre code { background: none; color: inherit; padding: 0; font-size: 13px; }
.yardim-content code { background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.yardim-content blockquote { border-left: 3px solid #4f7dff; background: #eef2ff; padding: 12px 16px; margin: 0 0 16px; border-radius: 8px; color: #334155; font-size: 14px; }
.yardim-content blockquote p { margin-bottom: 0; }
.yardim-content table { width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14px; }
.yardim-content th { background: #f8fafc; text-align: left; padding: 10px 14px; font-weight: 600; color: #0f172a; border: 1px solid #e8edf8; }
.yardim-content td { padding: 10px 14px; border: 1px solid #e8edf8; color: #475569; }
.yardim-content hr { border: none; border-top: 1px solid #e8edf8; margin: 32px 0; }
.yardim-content a { color: #4f7dff; text-decoration: none; }
.yardim-content a:hover { text-decoration: underline; }
.yardim-content strong { color: #0f172a; }
`

export async function generateStaticParams() {
  const articles = getArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return { title: 'Makale Bulunamadı - Yardım Merkezi' }
  return {
    title: `${article.title} - Trevo Yardım Merkezi`,
    description: article.description,
  }
}

export default async function YardimMakalePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const contentHtml = renderMarkdown(article.content)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8edf8' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/yardim" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Yardım Merkezi
          </Link>
          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>/</span>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{article.category}</span>
        </div>
      </div>

      {/* Article */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
          fontSize: '28px', fontWeight: 800, color: '#0f172a',
          letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 8,
        }}>
          {article.title}
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: 32 }}>
          {article.description}
        </p>

        <div style={{ borderTop: '1px solid #e8edf8', paddingTop: 32 }}>
          <style dangerouslySetInnerHTML={{ __html: contentStyles }} />
          <div
            className="yardim-content"
            style={{ lineHeight: 1.8, fontSize: '15px', color: '#334155' }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e8edf8', background: '#fff', padding: '24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>
            Sorunuz mu var?{' '}
            <a href="mailto:destek@trevo.app" style={{ color: '#4f7dff', textDecoration: 'none' }}>destek@trevo.app</a>
          </p>
        </div>
      </div>
    </div>
  )
}
