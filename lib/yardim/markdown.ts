import { escapeHtml } from '@/lib/escape-html'

function parseInline(text: string): string {
  // text should already be HTML-escaped
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
      // O-7: javascript:, data:, vbscript: URL'lerini engelle — sadece metni döndür
      if (/^\s*(javascript|data|vbscript):/i.test(u)) return t
      return `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`
    })
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]))
        i++
      }
      i++ // skip closing ```
      const langAttr = lang ? ` class="lang-${lang}"` : ''
      blocks.push(`<pre${langAttr}><code>${codeLines.join('\n')}</code></pre>`)
      continue
    }

    // Empty line - skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = parseInline(escapeHtml(headingMatch[2].trim()))
      blocks.push(`<h${level}>${content}</h${level}>`)
      i++
      continue
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      blocks.push('<hr />')
      i++
      continue
    }

    // Blockquote
    if (line.trimStart().startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        quoteLines.push(parseInline(escapeHtml(lines[i].trimStart().slice(2).trim())))
        i++
      }
      blocks.push(`<blockquote>${quoteLines.join('<br />')}</blockquote>`)
      continue
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trimStart())) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trimStart())) {
        items.push(parseInline(escapeHtml(lines[i].trimStart().replace(/^[-*]\s+/, ''))))
        i++
      }
      blocks.push(`<ul>${items.map((li) => `<li>${li}</li>`).join('')}</ul>`)
      continue
    }

    // Paragraph - collect consecutive text lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('#') &&
      !/^---+\s*$/.test(lines[i]) &&
      !lines[i].trimStart().startsWith('> ') &&
      !/^[-*]\s/.test(lines[i].trimStart())
    ) {
      paraLines.push(parseInline(escapeHtml(lines[i].trim())))
      i++
    }
    if (paraLines.length) {
      blocks.push(`<p>${paraLines.join('<br />')}</p>`)
    }
  }

  return blocks.join('\n')
}
