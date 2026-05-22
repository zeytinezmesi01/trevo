import type {
  CheckoutInitializeParams,
  CheckoutInitializeResult,
  CheckoutRetrieveResult,
  TestConnectionResult,
} from './types'

export interface PaymentProvider {
  readonly name: string

  /** Checkout Form başlat — iyzico'dan token + form içeriği al */
  initializeCheckout(params: CheckoutInitializeParams): Promise<CheckoutInitializeResult>

  /** Ödeme sonucunu token ile sorgula */
  retrieveCheckoutResult(token: string): Promise<CheckoutRetrieveResult>

  /** API anahtarlarının geçerliliğini test et */
  testConnection(): Promise<TestConnectionResult>

  /** Callback imzasını doğrula (mock her zaman true döner) */
  verifyCallbackSignature(body: string, signatureHeader: string | null): boolean
}
