export interface LineItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  kdv_rate: number
}

export interface InvoiceTotals {
  subtotal: number
  kdvAmount: number
  tevkifatAmount: number
  total: number
}

export function calculateTotals(items: LineItem[], tevkifatRate = 0): InvoiceTotals {
  let subtotal = 0
  let kdvAmount = 0

  for (const item of items) {
    // D-18: Negatif/geçersiz değer kontrolü
    if (item.quantity <= 0 || item.unit_price < 0 || item.kdv_rate < 0 || item.kdv_rate > 100) {
      throw new Error('Geçersiz kalem değerleri')
    }
    const lineTotal = item.quantity * item.unit_price
    subtotal += lineTotal
    // O-54: KDV'yi kalem bazlı yuvarla — kuruş farkları birikmez
    kdvAmount += round(lineTotal * item.kdv_rate / 100)
  }

  const tevkifatAmount = kdvAmount * tevkifatRate / 100
  const total = subtotal + kdvAmount - tevkifatAmount

  return {
    subtotal: round(subtotal),
    kdvAmount: round(kdvAmount),
    tevkifatAmount: round(tevkifatAmount),
    total: round(total),
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatTRY(amount: number): string {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export function formatDate(date: string): string {
  // "2026-05-22" → "22 Mayıs 2026" — zaman diliminden bağımsız
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return date?.slice(0, 10) || ''
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  return `${parseInt(m[3])} ${months[parseInt(m[2]) - 1]} ${m[1]}`
}
