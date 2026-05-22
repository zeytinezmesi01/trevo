import type { EInvoiceProvider } from './provider'
import type {
  TaxpayerInfo,
  EInvoicePayload,
  EInvoiceSendResult,
  EInvoiceStatusResult,
  ProvisionResult,
  EInvoiceStatus,
} from './types'

/**
 * MockEInvoiceProvider — çevrimdışı test için.
 * Hiçbir dış API'ye gitmez, sahte ETTN/durum üretir.
 * Varsayılan sağlayıcıdır.
 */
export class MockEInvoiceProvider implements EInvoiceProvider {
  readonly name = 'mock'
  private docStore = new Map<string, { status: EInvoiceStatus; ettn: string }>()
  private docCounter = 0

  async checkTaxpayer(vkn: string): Promise<TaxpayerInfo> {
    // 9 haneli ve 0 ile başlayan → TCKN (bireysel) → e-fatura mükellefi değil
    const isCorporate = vkn.length === 10
    return {
      isEInvoiceUser: isCorporate,
      name: isCorporate ? `Test Firma ${vkn}` : undefined,
      alias: `test${vkn.slice(0, 4)}`,
    }
  }

  async provisionTenant(): Promise<ProvisionResult> {
    return { accountId: `mock-acc-${Date.now()}`, alias: 'mock-tenant' }
  }

  async sendDocument(payload: EInvoicePayload): Promise<EInvoiceSendResult> {
    this.docCounter++
    const ettn = crypto.randomUUID()
    const documentNumber = this.generateDocumentNumber()
    this.docStore.set(ettn, { status: 'sent', ettn })

    return {
      ettn,
      integratorDocId: `mock-doc-${this.docCounter}`,
      status: 'sent',
      documentNumber,
    }
  }

  async getDocumentStatus(integratorDocId: string): Promise<EInvoiceStatusResult> {
    return {
      status: 'accepted',
      gibResponse: { mock: true, integratorDocId },
    }
  }

  async getDocumentPdf(): Promise<Buffer> {
    // Basit bir PDF yerine geçen metin buffer'ı
    return Buffer.from('Mock PDF content - e-Belge')
  }

  async cancelDocument(integratorDocId: string): Promise<EInvoiceStatus> {
    return 'cancelled'
  }

  private generateDocumentNumber(): string {
    const prefix = 'TRV'
    const year = new Date().getFullYear()
    const seq = String(++this.docCounter).padStart(9, '0')
    return `${prefix}${year}${seq}`
  }
}
