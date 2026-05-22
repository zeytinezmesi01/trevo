import type { IyzicoMode } from './types'
import type { PaymentProvider } from './provider'
import { MockPaymentProvider } from './mock-provider'
import { IyzicoPaymentProvider } from './iyzico-provider'
import { decryptSecret } from '@/lib/crypto'

/**
 * getPaymentProvider — tenant'ın iyzico anahtar/mode durumuna göre
 * doğru sağlayıcıyı döndürür.
 *
 * Anahtarlar DB'de şifrelenmiş olabilir (AES-256-GCM); otomatik çözer.
 * Çözülemezse (eski düz metin kayıt) olduğu gibi kullanır.
 *
 * Kural:
 * - iyzico_api_key boşsa → MockPaymentProvider (varsayılan)
 * - iyzico_mode=sandbox → sandbox base URL
 * - iyzico_mode=production → production base URL
 */
export function getPaymentProvider(tenant: {
  iyzico_api_key?: string | null
  iyzico_secret_key?: string | null
  iyzico_mode?: string | null
}): PaymentProvider {
  const apiKey = decryptSecret(tenant?.iyzico_api_key?.trim() || '')
  const secretKey = decryptSecret(tenant?.iyzico_secret_key?.trim() || '')
  const mode = (tenant?.iyzico_mode || 'sandbox') as IyzicoMode

  if (!apiKey || !secretKey) {
    return new MockPaymentProvider()
  }

  return new IyzicoPaymentProvider(apiKey, secretKey, mode)
}
