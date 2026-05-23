import type { EInvoiceProvider } from './provider'
import type {
  TaxpayerInfo,
  EInvoicePayload,
  EInvoiceSendResult,
  EInvoiceStatusResult,
  ProvisionResult,
  EInvoiceStatus,
} from './types'

/*
 * Nilvera E-Fatura / E-Arşiv REST API Adapter
 *
 * ENDPOINT LAYOUT (TODO: bayi dokümanından doğrula):
 *
 *   Base:      {EINVOICE_API_BASE_URL}  (örn. https://apitest.nilvera.com)
 *   Auth:      Authorization: Bearer {api_key}
 *
 *   Mükellef sorgulama:
 *     GET /v1/taxpayers/{vkn}  → { isEInvoiceUser, name, alias }
 *
 *   Alt hesap (mükellef) açma:
 *     POST /v1/accounts  → { accountId, alias }
 *
 *   Belge gönderme:
 *     POST /v1/documents  → { ettn, integratorDocId, status, documentNumber }
 *
 *   Durum sorgulama:
 *     GET /v1/documents/{id}/status  → { status, gibResponse, pdfUrl, xmlUrl }
 *
 *   PDF çekme:
 *     GET /v1/documents/{id}/pdf  → binary (application/pdf)
 *
 *   İptal:
 *     POST /v1/documents/{id}/cancel  → { status }
 */

export class NilveraEInvoiceProvider implements EInvoiceProvider {
  readonly name = 'nilvera'
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`Nilvera API yanıtı (${res.status}):`, text)
      throw new Error(`Nilvera API hatası (${res.status})`)
    }

    return res.json() as Promise<T>
  }

  private async requestBuffer(method: string, path: string): Promise<Buffer> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`Nilvera binary yanıtı (${res.status}):`, text)
      throw new Error(`Nilvera binary hatası (${res.status})`)
    }

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async checkTaxpayer(vkn: string): Promise<TaxpayerInfo> {
    // TODO: bayi dokümanından endpoint'i doğrula
    const data = await this.request<{
      isEInvoiceUser?: boolean
      name?: string
      alias?: string
    }>('GET', `/v1/taxpayers/${vkn}`)

    return {
      isEInvoiceUser: data.isEInvoiceUser ?? false,
      name: data.name,
      alias: data.alias,
    }
  }

  async provisionTenant(seller: {
    taxNumber: string
    taxOffice: string
    name: string
    alias?: string
    address?: string
    city?: string
    phone?: string
  }): Promise<ProvisionResult> {
    // TODO: bayi dokümanından request/response modelini doğrula
    const data = await this.request<{ accountId: string; alias?: string }>(
      'POST',
      '/v1/accounts',
      {
        taxNumber: seller.taxNumber,
        taxOffice: seller.taxOffice,
        name: seller.name,
        alias: seller.alias || `trevo-${seller.taxNumber}`,
        address: seller.address,
        city: seller.city,
        phone: seller.phone,
      },
    )

    return { accountId: data.accountId, alias: data.alias }
  }

  async sendDocument(payload: EInvoicePayload): Promise<EInvoiceSendResult> {
    // TODO: bayi dokümanından request/response modelini doğrula
    const data = await this.request<{
      id: string
      ettn: string
      integratorDocId?: string
      status: string
      documentNumber?: string
    }>('POST', '/v1/documents', this.mapPayload(payload))

    return {
      ettn: data.ettn,
      integratorDocId: data.integratorDocId || data.id,
      status: this.mapStatus(data.status),
      documentNumber: data.documentNumber,
    }
  }

  async getDocumentStatus(integratorDocId: string): Promise<EInvoiceStatusResult> {
    // TODO: bayi dokümanından endpoint'i doğrula
    const data = await this.request<{
      status: string
      gibResponse?: Record<string, unknown>
      pdfUrl?: string
      xmlUrl?: string
    }>('GET', `/v1/documents/${integratorDocId}/status`)

    return {
      status: this.mapStatus(data.status),
      gibResponse: data.gibResponse,
      pdfUrl: data.pdfUrl,
      xmlUrl: data.xmlUrl,
    }
  }

  async getDocumentPdf(integratorDocId: string): Promise<Buffer> {
    // TODO: bayi dokümanından endpoint'i doğrula
    return this.requestBuffer('GET', `/v1/documents/${integratorDocId}/pdf`)
  }

  async cancelDocument(integratorDocId: string, reason?: string): Promise<EInvoiceStatus> {
    // TODO: bayi dokümanından endpoint'i doğrula
    const data = await this.request<{ status: string }>(
      'POST',
      `/v1/documents/${integratorDocId}/cancel`,
      { reason: reason || '' },
    )

    return this.mapStatus(data.status)
  }

  private mapPayload(p: EInvoicePayload): Record<string, unknown> {
    return {
      // e-Arşiv tipi: TODO: bayi dokümanından doğrula
      documentType: p.documentType === 'e_fatura' ? 'INVOICE' : 'EARCHIVE_INVOICE',
      seller: {
        vkn: p.sellerTaxNumber,
        taxOffice: p.sellerTaxOffice,
        name: p.sellerName,
        address: {
          street: p.sellerAddress?.street,
          city: p.sellerAddress?.city,
          country: p.sellerAddress?.country || 'Türkiye',
        },
        phone: p.sellerPhone,
        alias: p.sellerAlias,
      },
      buyer: {
        vkn: p.buyerTaxNumber,
        name: p.buyerName,
        address: {
          street: p.buyerAddress?.street,
          city: p.buyerAddress?.city,
          country: p.buyerAddress?.country || 'Türkiye',
        },
      },
      invoice: {
        number: p.invoiceNumber,
        date: p.invoiceDate,
        dueDate: p.dueDate,
        currency: p.currency || 'TRY',
      },
      financials: {
        subtotal: p.subtotal,
        kdvAmount: p.kdvAmount,
        tevkifatRate: p.tevkifatRate,
        tevkifatAmount: p.tevkifatAmount,
        total: p.total,
      },
      items: p.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        kdvRate: item.kdvRate,
        kdvAmount: item.kdvAmount,
        lineTotal: item.lineTotal,
      })),
      notes: p.notes,
    }
  }

  private mapStatus(status: string): EInvoiceStatus {
    const map: Record<string, EInvoiceStatus> = {
      PENDING: 'pending',
      QUEUED: 'queued',
      SENT: 'sent',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      ERROR: 'error',
      CANCELLED: 'cancelled',
    }
    return map[status] || 'error'
  }
}
