export type EInvoiceDocumentType = 'e_fatura' | 'e_arsiv'

export type EInvoiceStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'error'
  | 'cancelled'

export type InvoiceEInvoiceStatus = 'none' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'error'

export type EInvoiceProviderName = 'mock' | 'nilvera'

export type TaxpayerInfo = {
  isEInvoiceUser: boolean
  name?: string
  alias?: string
}

export type EInvoiceAddress = {
  street?: string
  city?: string
  country?: string
}

export type EInvoiceLineItem = {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  kdvRate: number
  kdvAmount: number
  lineTotal: number
}

export type EInvoicePayload = {
  // Satıcı (seller)
  sellerTaxNumber: string
  sellerTaxOffice: string
  sellerName: string
  sellerAddress: EInvoiceAddress
  sellerPhone?: string
  sellerAlias?: string

  // Alıcı (buyer)
  buyerTaxNumber?: string
  buyerName: string
  buyerAddress?: EInvoiceAddress
  /** Alıcının GİB e-fatura etiketi (mükellef sorgusundan gelir) — e-Fatura'da
   *  CustomerAlias olarak gönderilir; e-Arşiv'de kullanılmaz */
  buyerAlias?: string

  // Fatura bilgileri
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  currency: string
  documentType: EInvoiceDocumentType

  // Mali bilgiler
  subtotal: number
  kdvAmount: number
  tevkifatRate?: number
  tevkifatAmount?: number
  total: number

  // Kalemler
  items: EInvoiceLineItem[]

  // Not
  notes?: string
}

export type EInvoiceSendResult = {
  ettn: string
  integratorDocId: string
  status: EInvoiceStatus
  documentNumber?: string
}

export type EInvoiceStatusResult = {
  status: EInvoiceStatus
  gibResponse?: Record<string, unknown>
  pdfUrl?: string
  xmlUrl?: string
}

export type ProvisionResult = {
  accountId: string
  alias?: string
}

export function parseEInvoiceStatus(s: string): EInvoiceStatus {
  const valid: EInvoiceStatus[] = ['pending', 'queued', 'sent', 'accepted', 'rejected', 'error', 'cancelled']
  return valid.includes(s as EInvoiceStatus) ? (s as EInvoiceStatus) : 'error'
}
