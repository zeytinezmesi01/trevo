import type {
  TaxpayerInfo,
  EInvoicePayload,
  EInvoiceSendResult,
  EInvoiceStatusResult,
  ProvisionResult,
  EInvoiceStatus,
} from './types'

/**
 * EInvoiceProvider — tüm entegratörlerin uyması gereken arayüz.
 * Trevo tek bir bayi (çözüm ortağı) ile çalışır, bu arayüz soyutlama
 * katmanı test edilebilirlik ve gelecekte entegratör değişikliği içindir.
 */
export interface EInvoiceProvider {
  readonly name: string

  /** Alıcının GİB e-fatura mükellefi olup olmadığını sorgular */
  checkTaxpayer(vkn: string): Promise<TaxpayerInfo>

  /** Master hesap altında tenant için alt hesap (mükellef) açar.
   *  Provision daha önce yapılmışsa mevcut account_id döner (idempotent). */
  provisionTenant(seller: {
    taxNumber: string
    taxOffice: string
    name: string
    alias?: string
    address?: string
    city?: string
    phone?: string
  }): Promise<ProvisionResult>

  /** e-Belgeyi entegratöre gönderir */
  sendDocument(payload: EInvoicePayload): Promise<EInvoiceSendResult>

  /** Gönderilmiş belgenin güncel durumunu sorgular */
  getDocumentStatus(integratorDocId: string): Promise<EInvoiceStatusResult>

  /** Resmi PDF'i entegratörden çeker */
  getDocumentPdf(integratorDocId: string): Promise<Buffer>

  /** Gönderilmiş belgeyi iptal eder */
  cancelDocument(integratorDocId: string, reason?: string): Promise<EInvoiceStatus>
}
