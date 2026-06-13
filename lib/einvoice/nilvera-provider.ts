import crypto from 'node:crypto'
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
 * Kaynak: https://developer.nilvera.com (v1). Endpoint'ler resmi dokümandan
 * alındı. Alan adı/enum gibi GİB'e duyarlı ayrıntılar (birim kodu, fatura
 * profili, KDV kırılımı, zarf durum kodları) test ortamında (apitest) son
 * doğrulamayı gerektirir — ilgili yerler `// SANDBOX-DOĞRULA` ile işaretli.
 *
 * Base:  https://apitest.nilvera.com  (test)  |  https://api.nilvera.com (prod)
 * Auth:  Authorization: Bearer {api_key}   (Portal'dan alınan kalıcı token)
 *
 * Mükellef sorgu:   GET  /general/GlobalCompany/Check/TaxNumber/{vkn}
 * e-Fatura gönder:  POST /einvoice/Send/Model      → { UUID, InvoiceNumber }
 * e-Arşiv gönder:   POST /earchive/Send/Model      → { UUID, InvoiceNumber }
 * Durum (zarf):     GET  /einvoice/Sale/{UUID}/EnvelopeInfo
 * PDF:              GET  /einvoice/Sale/{UUID}/pdf  |  /earchive/Sale/{UUID}/pdf
 * İptal:            POST /einvoice/Sale/{UUID}/Cancel
 */

const TEST_BASE = 'https://apitest.nilvera.com'
const PROD_BASE = 'https://api.nilvera.com'

// GİB birim kodu eşlemesi (UN/ECE Rec 20). SANDBOX-DOĞRULA: liste genişletilebilir.
const UNIT_CODE: Record<string, string> = {
  adet: 'C62', tane: 'C62', ad: 'C62',
  saat: 'HUR', gün: 'DAY', ay: 'MON', yıl: 'ANN',
  kg: 'KGM', gr: 'GRM', lt: 'LTR', m: 'MTR', m2: 'MTK', m3: 'MTQ',
  paket: 'PR', kutu: 'BX',
}

export class NilveraEInvoiceProvider implements EInvoiceProvider {
  readonly name = 'nilvera'
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, testMode = true) {
    this.baseUrl = (testMode ? TEST_BASE : PROD_BASE)
    this.apiKey = apiKey
  }

  // O-9: path injection korumaları
  private validateVkn(vkn: string): string {
    if (!/^\d{10,11}$/.test(vkn)) throw new Error('Geçersiz VKN formatı')
    return vkn
  }
  private validateDocId(id: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Geçersiz belge ID formatı')
    return id
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
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
      console.error(`Nilvera API yanıtı (${res.status}) ${path}:`, text)
      throw new Error(`Nilvera API hatası (${res.status})`)
    }

    // Bazı uçlar boş gövde döndürebilir
    const text = await res.text()
    return (text ? JSON.parse(text) : {}) as T
  }

  private async requestBuffer(method: string, path: string): Promise<Buffer> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/pdf' },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`Nilvera binary yanıtı (${res.status}) ${path}:`, text)
      throw new Error(`Nilvera binary hatası (${res.status})`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  /** Bağlantı/anahtar doğrulama — hafif bir uca istek atar. 401/403 = geçersiz
   *  anahtar; diğer her yanıt (200/404 vb.) anahtarın kimlik doğruladığı
   *  anlamına gelir (endpoint yolu yanlış olsa bile anahtar geçerlidir). */
  async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/general/Company`, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
      })
      return res.status !== 401 && res.status !== 403
    } catch {
      return false
    }
  }

  async checkTaxpayer(vkn: string): Promise<TaxpayerInfo> {
    // GET /general/GlobalCompany/Check/TaxNumber/{vkn}
    // Mükellef ise firma + Aliases döner; değilse 404/boş → e-Arşiv'e düşeriz.
    try {
      type GlobalCompany = {
        TaxNumber?: string
        Title?: string
        Name?: string
        Aliases?: Array<{ Name?: string }>
      }
      const data = await this.request<GlobalCompany | GlobalCompany[]>(
        'GET',
        `/general/GlobalCompany/Check/TaxNumber/${this.validateVkn(vkn)}`,
      )

      const rec: GlobalCompany | undefined = Array.isArray(data) ? data[0] : data
      if (!rec || (!rec.TaxNumber && !rec.Aliases?.length)) {
        return { isEInvoiceUser: false }
      }
      // Gönderim için alıcının GİB etiketi (PostaKutusu) — ilk alias
      const alias = rec.Aliases?.[0]?.Name
      return {
        isEInvoiceUser: true,
        name: rec.Title || rec.Name || undefined,
        alias,
      }
    } catch {
      // 404 = mükellef değil → e-Arşiv
      return { isEInvoiceUser: false }
    }
  }

  /**
   * BYOK'ta provision YOK: tenant'ın kendi anahtarı zaten kendi Nilvera
   * firmasını temsil eder. accountId olarak tenant alias'ı döndürülür.
   * (Bayi modeline geçilirse burada /general/Company alt-hesap açma yapılır.)
   */
  async provisionTenant(seller: {
    taxNumber: string
    taxOffice: string
    name: string
    alias?: string
  }): Promise<ProvisionResult> {
    return { accountId: seller.taxNumber, alias: seller.alias }
  }

  async sendDocument(payload: EInvoicePayload): Promise<EInvoiceSendResult> {
    const uuid = crypto.randomUUID()
    const isEFatura = payload.documentType === 'e_fatura'
    const invoiceDto = this.mapInvoiceDto(payload, uuid, isEFatura)

    const body = isEFatura
      ? { EInvoice: invoiceDto, CustomerAlias: payload.buyerAlias }
      : { ArchiveInvoice: invoiceDto }

    const path = isEFatura ? '/einvoice/Send/Model' : '/earchive/Send/Model'
    const data = await this.request<{ UUID?: string; InvoiceNumber?: string }>('POST', path, body)

    const docId = data.UUID || uuid
    return {
      ettn: docId,
      integratorDocId: docId,
      // Gönderim kabul edildi; GİB'e iletim asenkron → 'sent'
      status: 'sent',
      documentNumber: data.InvoiceNumber,
    }
  }

  async getDocumentStatus(integratorDocId: string): Promise<EInvoiceStatusResult> {
    // GET /einvoice/Sale/{UUID}/EnvelopeInfo → { GIBCode, GIBDescription }
    // SANDBOX-DOĞRULA: e-Arşiv için ayrı durum ucu vardır; burada e-Fatura zarfı.
    const data = await this.request<{
      GIBCode?: string
      GIBDescription?: string
      EnvelopeUUID?: string
    }>('GET', `/einvoice/Sale/${this.validateDocId(integratorDocId)}/EnvelopeInfo`)

    return {
      status: this.mapGibStatus(data.GIBCode),
      gibResponse: { code: data.GIBCode, description: data.GIBDescription, envelopeUUID: data.EnvelopeUUID },
    }
  }

  async getDocumentPdf(integratorDocId: string): Promise<Buffer> {
    // SANDBOX-DOĞRULA: tam yol test anahtarıyla teyit edilecek
    return this.requestBuffer('GET', `/einvoice/Sale/${this.validateDocId(integratorDocId)}/pdf`)
  }

  async cancelDocument(integratorDocId: string, reason?: string): Promise<EInvoiceStatus> {
    // SANDBOX-DOĞRULA: iptal yalnızca e-Arşiv'de mümkün; e-Fatura iadesi farklıdır
    await this.request('POST', `/einvoice/Sale/${this.validateDocId(integratorDocId)}/Cancel`, {
      Reason: reason || '',
    })
    return 'cancelled'
  }

  // ── eşleme yardımcıları ──────────────────────────────────────────────

  /** EInvoicePayload → Nilvera EInvoiceDto / ArchiveInvoiceDto */
  private mapInvoiceDto(p: EInvoicePayload, uuid: string, isEFatura: boolean): Record<string, unknown> {
    const kdvBuckets = this.bucketKdvByRate(p)
    return {
      InvoiceInfo: {
        UUID: uuid,
        InvoiceType: 'SATIS',
        // Seri Nilvera tarafında tanımlıysa numarayı entegratör atar; biz kendi no'muzu öneririz
        InvoiceSerieOrNumber: p.invoiceNumber,
        IssueDate: this.dateOnly(p.invoiceDate),
        // SANDBOX-DOĞRULA: e-Fatura TEMELFATURA/TICARIFATURA; e-Arşiv EARSIVFATURA
        InvoiceProfile: isEFatura ? 'TICARIFATURA' : 'EARSIVFATURA',
        CurrencyCode: p.currency || 'TRY',
        ExchangeRate: 1,
        LineExtensionAmount: round2(p.subtotal),
        ...kdvBuckets,
        KdvTotal: round2(p.kdvAmount),
        PayableAmount: round2(p.total),
      },
      CompanyInfo: {
        TaxNumber: p.sellerTaxNumber,
        Name: p.sellerName,
        TaxOffice: p.sellerTaxOffice,
        Address: p.sellerAddress?.street,
        City: p.sellerAddress?.city,
        Country: p.sellerAddress?.country || 'Türkiye',
        Phone: p.sellerPhone,
      },
      CustomerInfo: {
        TaxNumber: p.buyerTaxNumber,
        Name: p.buyerName,
        Address: p.buyerAddress?.street,
        City: p.buyerAddress?.city,
        Country: p.buyerAddress?.country || 'Türkiye',
      },
      InvoiceLines: p.items.map((item) => ({
        Name: item.description,
        Quantity: item.quantity,
        UnitType: UNIT_CODE[(item.unit || 'adet').toLowerCase()] || 'C62',
        Price: round2(item.unitPrice),
        KDVPercent: item.kdvRate,
        KDVTotal: round2(item.kdvAmount),
        LineExtensionAmount: round2(item.lineTotal),
      })),
      Notes: p.notes ? [p.notes] : [],
    }
  }

  /** KDV tutarını orana göre GeneralKDV{oran}Total kovalarına böl */
  private bucketKdvByRate(p: EInvoicePayload): Record<string, number> {
    const buckets: Record<number, number> = { 1: 0, 8: 0, 10: 0, 18: 0, 20: 0 }
    for (const item of p.items) {
      const rate = item.kdvRate
      if (buckets[rate] === undefined) buckets[rate] = 0
      buckets[rate] += item.kdvAmount
    }
    return {
      GeneralKDV1Total: round2(buckets[1] || 0),
      GeneralKDV8Total: round2(buckets[8] || 0),
      GeneralKDV10Total: round2(buckets[10] || 0),
      GeneralKDV18Total: round2(buckets[18] || 0),
      GeneralKDV20Total: round2(buckets[20] || 0),
    }
  }

  /** "YYYY-MM-DD..." → "YYYY-MM-DD" (zaman dilimi kaymasız) */
  private dateOnly(d: string): string {
    return (d || '').slice(0, 10)
  }

  /** GİB zarf durum kodu → iç durum. SANDBOX-DOĞRULA: kod tablosu test ile netleşir. */
  private mapGibStatus(gibCode?: string): EInvoiceStatus {
    if (!gibCode) return 'sent'
    // 1300 grubu = başarıyla işlendi/kabul; 1xxx işleniyor
    if (gibCode === '1300' || gibCode.startsWith('13')) return 'accepted'
    if (gibCode.startsWith('11') || gibCode.startsWith('12')) return 'sent'
    return 'error'
  }
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}
