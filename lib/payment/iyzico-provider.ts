import crypto from 'node:crypto'
import type { PaymentProvider } from './provider'
import type {
  CheckoutInitializeParams,
  CheckoutInitializeResult,
  CheckoutRetrieveResult,
  TestConnectionResult,
  IyzicoMode,
} from './types'

const BASE_URLS: Record<IyzicoMode, string> = {
  sandbox: 'https://sandbox-api.iyzipay.com',
  production: 'https://api.iyzipay.com',
}

/**
 * IYZWSv2 imzası oluştur:
 * 1. randomKey = rastgele UUID
 * 2. payload = randomKey + uriPath + requestBody
 * 3. signature = HMAC-SHA256(secretKey, payload) → hex (küçük harf)
 * 4. authParams = "apiKey:{apiKey}&randomKey:{randomKey}&signature:{signature}"
 * 5. Authorization = "IYZWSv2 " + base64(authParams)
 */
function createAuthHeader(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  body: Record<string, unknown>,
): string {
  const randomKey = crypto.randomUUID()
  const bodyStr = JSON.stringify(body)
  const payload = randomKey + uriPath + bodyStr
  const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
  const authParams = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
  return `IYZWSv2 ${Buffer.from(authParams).toString('base64')}`
}

export class IyzicoPaymentProvider implements PaymentProvider {
  readonly name = 'iyzico'
  private apiKey: string
  private secretKey: string
  private baseUrl: string
  private mode: IyzicoMode

  constructor(apiKey: string, secretKey: string, mode: IyzicoMode = 'sandbox') {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.mode = mode
    this.baseUrl = BASE_URLS[mode]
  }

  private async request<T>(
    method: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const authorization = createAuthHeader(this.apiKey, this.secretKey, path, body)

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok || data.status === 'failure') {
      const errMsg = data.errorMessage || data.errorCode || `iyzico hatası (${res.status})`
      throw new Error(errMsg)
    }

    return data as T
  }

  async initializeCheckout(params: CheckoutInitializeParams): Promise<CheckoutInitializeResult> {
    const [name, ...surnameParts] = params.buyer.name.trim().split(/\s+/)
    const surname = surnameParts.join(' ') || '—'

    const body = {
      locale: 'tr',
      conversationId: params.paymentId,
      price: params.amount,
      paidPrice: params.amount,
      currency: params.currency || 'TRY',
      basketId: params.invoiceId,
      paymentGroup: 'PRODUCT',
      callbackUrl: params.callbackUrl,
      buyer: {
        id: params.buyer.id,
        name,
        surname,
        email: params.buyer.email,
        identityNumber: params.buyer.identityNumber || params.buyer.id,
        registrationAddress: params.buyer.address,
        city: params.buyer.city,
        country: params.buyer.country || 'Turkey',
        ip: params.buyerIp,
      },
      shippingAddress: {
        address: params.buyer.address,
        city: params.buyer.city,
        country: params.buyer.country || 'Turkey',
      },
      billingAddress: {
        address: params.buyer.address,
        city: params.buyer.city,
        country: params.buyer.country || 'Turkey',
      },
      basketItems: params.basketItems.map((item) => ({
        id: item.id,
        name: item.name,
        category1: item.category1,
        itemType: item.itemType,
        price: item.price,
      })),
    }

    const data = await this.request<{
      token: string
      checkoutFormContent: string
      paymentPageUrl: string
      status: string
      errorMessage?: string
    }>('POST', '/payment/checkoutform/initialize/auth', body)

    if (data.status === 'failure') {
      throw new Error(data.errorMessage || 'Checkout form başlatılamadı')
    }

    return {
      token: data.token,
      checkoutFormContent: data.checkoutFormContent,
      paymentPageUrl: data.paymentPageUrl,
    }
  }

  async retrieveCheckoutResult(token: string): Promise<CheckoutRetrieveResult> {
    const body = {
      locale: 'tr',
      token,
    }

    const data = await this.request<{
      status: string
      paymentId: string
      paidPrice: number
      errorMessage?: string
      [key: string]: unknown
    }>('POST', '/payment/checkoutform/auth/ecom/retrieve', body)

    const isSuccess = data.status === 'success'

    return {
      status: isSuccess ? 'success' : 'failed',
      providerPaymentId: data.paymentId || null,
      paidPrice: data.paidPrice ?? null,
      raw: data as Record<string, unknown>,
    }
  }

  /**
   * iyzico callback imzasını doğrula.
   * iyzico, callback POST gövdesini HMAC-SHA256(secretKey, body) ile imzalar,
   * imzayı `X-Iyz-Signature` header'ında gönderir.
   */
  verifyCallbackSignature(body: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false
    const expected = crypto
      .createHmac('sha256', this.secretKey)
      .update(body)
      .digest('base64')
    return signatureHeader === expected
  }

  async testConnection(): Promise<TestConnectionResult> {
    // API'ye gerçek istek atmadan credential format'ını doğrula.
    // iyzico sandbox/production anahtarları belirli pattern'lara sahiptir;
    // format uyumsuzluğu gerçek API hatalarını çok önceden yakalar.
    if (!this.apiKey || this.apiKey.length < 10) {
      return { success: false, message: 'API anahtarı çok kısa veya eksik.' }
    }
    if (!this.secretKey || this.secretKey.length < 10) {
      return { success: false, message: 'Secret anahtar çok kısa veya eksik.' }
    }
    // Format kontrolü: iyzico anahtarları sandbox- veya production- prefix'i içerebilir
    const sandboxPattern = /^sandbox-/i
    const productionPattern = /^[a-zA-Z0-9_\-]{10,}$/
    if (this.mode === 'sandbox' && !sandboxPattern.test(this.apiKey) && !productionPattern.test(this.apiKey)) {
      return { success: false, message: 'Sandbox API anahtarı geçersiz formatta.' }
    }
    return { success: true, message: `Anahtar formatı geçerli (${this.mode} modu). Gerçek işlem sırasında doğrulanacak.` }
  }
}
