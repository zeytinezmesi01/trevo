import type { PaymentProvider } from './provider'
import type {
  CheckoutInitializeParams,
  CheckoutInitializeResult,
  CheckoutRetrieveResult,
  TestConnectionResult,
} from './types'
import { escapeHtml } from '@/lib/escape-html'

/**
 * MockPaymentProvider — hiçbir API'ye gitmez.
 * Tenant anahtarları boşken varsayılandır.
 * Sahte bir onay ekranı gösterir, callback'i tetikler.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock'

  async initializeCheckout(params: CheckoutInitializeParams): Promise<CheckoutInitializeResult> {
    const token = `mock-token-${params.paymentId}`

    const checkoutFormContent = `
<div id="iyzipay-checkout-form" style="text-align:center;padding:40px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
  <div style="font-size:48px;margin-bottom:16px;">🧪</div>
  <h3 style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:600;">Test Ödemesi</h3>
  <p style="margin:0 0 4px;color:#6b7280;font-size:14px;">
    ₺${escapeHtml(String(params.amount.toFixed(2)))} — ${params.basketItems.map(i => escapeHtml(i.name)).join(', ')}
  </p>
  <p style="margin:0 0 24px;color:#9ca3af;font-size:12px;">
    Bu bir test ekranıdır. Gerçek ödeme alınmaz.
  </p>
  <div style="display:flex;gap:12px;justify-content:center;">
    <form method="POST" action="${escapeHtml(params.callbackUrl)}" style="display:inline;">
      <input type="hidden" name="token" value="${token}" />
      <button type="submit" style="background:#10b981;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">
        Ödemeyi Onayla
      </button>
    </form>
    <button onclick="history.back()" style="background:#e5e7eb;color:#374151;border:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;">
      İptal
    </button>
  </div>
</div>`

    return {
      token,
      checkoutFormContent,
      paymentPageUrl: `${params.callbackUrl}?token=${token}`,
    }
  }

  async retrieveCheckoutResult(token: string): Promise<CheckoutRetrieveResult> {
    if (token.startsWith('mock-token-')) {
      return {
        status: 'success',
        providerPaymentId: `mock-payment-${Date.now()}`,
        paidPrice: null,
        raw: { mock: true, token },
      }
    }

    return {
      status: 'failed',
      providerPaymentId: null,
      paidPrice: null,
      raw: { error: 'Geçersiz token', token },
    }
  }

  verifyCallbackSignature(_body: string, _signatureHeader: string | null): boolean {
    return true // Mock her zaman doğrular
  }

  async testConnection(): Promise<TestConnectionResult> {
    return { success: true, message: 'Mock sağlayıcı çalışıyor.' }
  }
}
