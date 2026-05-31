import { describe, it, expect } from 'vitest'
import { escapeHtml } from './escape-html'

describe('escapeHtml', () => {
  it('tehlikeli HTML karakterlerini kaçışlar', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('tırnak ve & karakterlerini kaçışlar', () => {
    expect(escapeHtml(`"&'`)).toBe('&quot;&amp;&#039;')
  })

  it('& karakterini diğerlerinden önce kaçışlar (çift kaçış olmaz)', () => {
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('a & b < c')).toBe('a &amp; b &lt; c')
  })

  it('boş/falsy girdide boş string döndürür', () => {
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml(undefined as unknown as string)).toBe('')
  })

  it('zararsız metni değiştirmez', () => {
    expect(escapeHtml('Merhaba Dünya')).toBe('Merhaba Dünya')
  })
})
