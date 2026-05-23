import type { EInvoiceProvider } from './provider'
import type { EInvoiceProviderName } from './types'
import { MockEInvoiceProvider } from './mock-provider'
import { NilveraEInvoiceProvider } from './nilvera-provider'

let cachedProvider: EInvoiceProvider | null = null

/**
 * getEInvoiceProvider — ortam değişkenlerine göre doğru sağlayıcıyı döndürür.
 *
 * Kural:
 * - EINVOICE_TEST_MODE=true VEYA EINVOICE_MASTER_API_KEY boş/undefined ise
 *   → MockEInvoiceProvider kullanılır.
 * - Aksi halde → NilveraEInvoiceProvider kullanılır.
 *
 * Bu sayede "tek eksik master credential" durumunda sistem çalışmaya devam eder.
 */
export function getEInvoiceProvider(): EInvoiceProvider {
  if (cachedProvider) return cachedProvider

  const testMode = process.env.EINVOICE_TEST_MODE === 'true'
  const apiKey = process.env.EINVOICE_MASTER_API_KEY
  const providerName = (process.env.EINVOICE_PROVIDER || 'mock') as EInvoiceProviderName

  const useMock = testMode || !apiKey || apiKey.trim() === ''

  if (useMock || providerName === 'mock') {
    cachedProvider = new MockEInvoiceProvider()
  } else {
    if (!process.env.EINVOICE_API_BASE_URL) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('EINVOICE_API_BASE_URL must be set in production')
      }
    }
    const baseUrl =
      process.env.EINVOICE_API_BASE_URL || 'https://apitest.nilvera.com'
    cachedProvider = new NilveraEInvoiceProvider(baseUrl, apiKey!)
  }

  return cachedProvider
}

/**
 * Provider'ı sıfırlar (testlerde veya env değişikliğinde kullanılır).
 */
export function resetEInvoiceProvider(): void {
  cachedProvider = null
}

/**
 * e-Belge numarası üretir: 3 harf + 4 hane yıl + 9 hane sıra
 * Örn: TRV202600000001
 */
export function generateDocumentNumber(sequence: number, prefix = 'TRV'): string {
  const year = new Date().getFullYear()
  return `${prefix}${year}${String(sequence).padStart(9, '0')}`
}

/**
 * Alıcının vergi kimlik numarasına göre e-fatura mükellefi olup olmadığını
 * ve belge tipini belirler.
 */
export async function determineDocumentType(
  provider: EInvoiceProvider,
  taxNumber?: string | null,
): Promise<{ type: 'e_fatura' | 'e_arsiv'; isEInvoiceUser: boolean }> {
  if (!taxNumber || (taxNumber.length !== 10 && taxNumber.length !== 11)) {
    // Ne VKN (10) ne TCKN (11) → e-Arşiv
    return { type: 'e_arsiv', isEInvoiceUser: false }
  }

  try {
    const info = await provider.checkTaxpayer(taxNumber)
    return {
      type: info.isEInvoiceUser ? 'e_fatura' : 'e_arsiv',
      isEInvoiceUser: info.isEInvoiceUser,
    }
  } catch {
    // Sorgu başarısız olursa güvenli taraf: e-Arşiv
    return { type: 'e_arsiv', isEInvoiceUser: false }
  }
}
