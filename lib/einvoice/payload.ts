import type {
  EInvoicePayload,
  EInvoiceDocumentType,
  EInvoiceLineItem,
} from './types'

/**
 * buildEInvoicePayload — fatura + kalemler + satıcı + alıcı verisini
 * entegratörün beklediği EInvoicePayload modeline çevirir.
 */
export function buildEInvoicePayload(params: {
  invoice: {
    id: string
    invoice_number: string
    invoice_date: string
    due_date?: string | null
    currency?: string
    subtotal: number
    kdv_amount: number
    kdv_rate: number
    tevkifat_rate?: number | null
    tevkifat_amount?: number | null
    total: number
    notes?: string | null
  }
  items: Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
    kdv_rate: number
    kdv_amount: number
    line_total: number
  }>
  seller: {
    company_name?: string | null
    company_tax_office?: string | null
    company_tax_number?: string | null
    company_address?: string | null
    company_city?: string | null
    company_phone?: string | null
    brand_name?: string | null
  }
  client: {
    name: string
    company?: string | null
    tax_number?: string | null
    tax_office?: string | null
    address?: string | null
    city?: string | null
  }
  documentType: EInvoiceDocumentType
}): EInvoicePayload {
  // D-19: Zorunlu satici alanlari icin erken hata
  if (!params.seller.company_tax_number) {
    throw new Error('Satıcı vergi numarası zorunludur')
  }
  if (!params.seller.company_name && !params.seller.brand_name) {
    throw new Error('Satıcı adı zorunludur')
  }

  const items: EInvoiceLineItem[] = params.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit || 'adet',
    unitPrice: item.unit_price,
    kdvRate: item.kdv_rate,
    kdvAmount: item.kdv_amount,
    lineTotal: item.line_total,
  }))

  return {
    sellerTaxNumber: params.seller.company_tax_number,
    sellerTaxOffice: params.seller.company_tax_office || '',
    sellerName: params.seller.company_name || params.seller.brand_name || '',
    sellerAddress: {
      street: params.seller.company_address || undefined,
      city: params.seller.company_city || undefined,
      country: 'Türkiye',
    },
    sellerPhone: params.seller.company_phone || undefined,

    buyerTaxNumber: params.client.tax_number || undefined,
    buyerName: params.client.company || params.client.name,
    buyerAddress: {
      street: params.client.address || undefined,
      city: params.client.city || undefined,
      country: 'Türkiye',
    },

    invoiceNumber: params.invoice.invoice_number,
    invoiceDate: params.invoice.invoice_date,
    dueDate: params.invoice.due_date || undefined,
    currency: params.invoice.currency || 'TRY',
    documentType: params.documentType,

    subtotal: params.invoice.subtotal,
    kdvAmount: params.invoice.kdv_amount,
    tevkifatRate: params.invoice.tevkifat_rate || undefined,
    tevkifatAmount: params.invoice.tevkifat_amount || undefined,
    total: params.invoice.total,

    items,
    notes: params.invoice.notes || undefined,
  }
}
