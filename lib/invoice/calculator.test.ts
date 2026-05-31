import { describe, it, expect } from 'vitest'
import { calculateTotals, formatDate, type LineItem } from './calculator'

const item = (over: Partial<LineItem> = {}): LineItem => ({
  description: 'Test',
  quantity: 1,
  unit: 'adet',
  unit_price: 100,
  kdv_rate: 20,
  ...over,
})

describe('calculateTotals', () => {
  it('tek kalem: KDV ve toplam doğru hesaplanır', () => {
    const r = calculateTotals([item({ quantity: 2, unit_price: 100, kdv_rate: 20 })])
    expect(r.subtotal).toBe(200)
    expect(r.kdvAmount).toBe(40)
    expect(r.tevkifatAmount).toBe(0)
    expect(r.total).toBe(240)
  })

  it('farklı KDV oranlı kalemleri kalem bazlı yuvarlar (kuruş farkı birikmez)', () => {
    // 33.33 * %18 = 5.9994 → 6.00 ; iki kalem → 12.00
    const r = calculateTotals([
      item({ quantity: 1, unit_price: 33.33, kdv_rate: 18 }),
      item({ quantity: 1, unit_price: 33.33, kdv_rate: 18 }),
    ])
    expect(r.subtotal).toBe(66.66)
    expect(r.kdvAmount).toBe(12) // 6 + 6
    expect(r.total).toBe(78.66)
  })

  it('tevkifat KDV üzerinden düşülür', () => {
    // subtotal 1000, kdv 200, tevkifat %50 → 100 düş → total 1100
    const r = calculateTotals([item({ quantity: 1, unit_price: 1000, kdv_rate: 20 })], 50)
    expect(r.kdvAmount).toBe(200)
    expect(r.tevkifatAmount).toBe(100)
    expect(r.total).toBe(1100)
  })

  it('KDV muafiyeti (rate=0) → KDV sıfır', () => {
    const r = calculateTotals([item({ quantity: 3, unit_price: 50, kdv_rate: 0 })])
    expect(r.subtotal).toBe(150)
    expect(r.kdvAmount).toBe(0)
    expect(r.total).toBe(150)
  })

  it('geçersiz değerlerde hata fırlatır', () => {
    expect(() => calculateTotals([item({ quantity: 0 })])).toThrow()
    expect(() => calculateTotals([item({ unit_price: -1 })])).toThrow()
    expect(() => calculateTotals([item({ kdv_rate: -5 })])).toThrow()
    expect(() => calculateTotals([item({ kdv_rate: 101 })])).toThrow()
  })

  it('boş kalem listesi → tüm değerler sıfır', () => {
    const r = calculateTotals([])
    expect(r).toEqual({ subtotal: 0, kdvAmount: 0, tevkifatAmount: 0, total: 0 })
  })
})

describe('formatDate', () => {
  it('ISO tarihi Türkçe formatına çevirir (zaman diliminden bağımsız)', () => {
    expect(formatDate('2026-05-22')).toBe('22 Mayıs 2026')
    expect(formatDate('2026-01-01')).toBe('1 Ocak 2026')
    expect(formatDate('2026-12-31')).toBe('31 Aralık 2026')
  })

  it('geçersiz girdide çökmeden makul değer döndürür', () => {
    expect(formatDate('')).toBe('')
  })
})
