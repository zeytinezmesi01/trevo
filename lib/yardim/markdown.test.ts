import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('başlıkları render eder', () => {
    expect(renderMarkdown('# Başlık')).toBe('<h1>Başlık</h1>')
    expect(renderMarkdown('### Alt')).toBe('<h3>Alt</h3>')
  })

  it('kalın ve italik metni dönüştürür', () => {
    expect(renderMarkdown('**kalın**')).toContain('<strong>kalın</strong>')
    expect(renderMarkdown('*italik*')).toContain('<em>italik</em>')
  })

  it('liste öğelerini render eder', () => {
    const out = renderMarkdown('- bir\n- iki')
    expect(out).toBe('<ul><li>bir</li><li>iki</li></ul>')
  })

  it('güvenli linkleri href olarak render eder', () => {
    const out = renderMarkdown('[tıkla](https://example.com)')
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('XSS: javascript: ve data: URL’lerini engeller (yalnızca metin döner)', () => {
    const js = renderMarkdown('[tıkla](javascript:alert(1))')
    expect(js).not.toContain('href="javascript')
    expect(js).toContain('tıkla')

    const data = renderMarkdown('[x](data:text/html,<script>1</script>)')
    expect(data).not.toContain('href="data:')
  })

  it('XSS: ham HTML kaçışlanır', () => {
    const out = renderMarkdown('<img src=x onerror=alert(1)>')
    expect(out).toContain('&lt;img')
    expect(out).not.toContain('<img')
  })

  it('kod bloğu içeriğini kaçışlar', () => {
    const out = renderMarkdown('```\n<b>x</b>\n```')
    expect(out).toContain('<pre><code>')
    expect(out).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})
