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
    const lineTotal = item.quantity * item.unit_price
    subtotal += lineTotal
    kdvAmount += lineTotal * item.kdv_rate / 100
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
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
