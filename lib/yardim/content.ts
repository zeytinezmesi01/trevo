import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'yardim')

export type ArticleMeta = {
  slug: string
  title: string
  description: string
  category: string
  order: number
}

export type Article = ArticleMeta & {
  content: string
}

export type CategoryGroup = {
  name: string
  articles: ArticleMeta[]
}

type IndexData = {
  categories: string[]
  articles: ArticleMeta[]
}

function loadIndex(): IndexData {
  const filePath = path.join(CONTENT_DIR, 'index.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as IndexData
}

export function getCategories(): CategoryGroup[] {
  const index = loadIndex()

  return index.categories.map((cat) => ({
    name: cat,
    articles: index.articles
      .filter((a) => a.category === cat)
      .sort((a, b) => a.order - b.order),
  }))
}

export function getArticles(): ArticleMeta[] {
  return loadIndex().articles
}

export function getArticle(slug: string): Article | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  const index = loadIndex()
  const meta = index.articles.find((a) => a.slug === slug)
  if (!meta) return null

  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const content = fs.readFileSync(filePath, 'utf-8')
  return { ...meta, content }
}

export function searchArticles(query: string): ArticleMeta[] {
  if (!query.trim()) return getArticles()
  const lower = query.toLowerCase()
  return getArticles().filter(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower)
  )
}
