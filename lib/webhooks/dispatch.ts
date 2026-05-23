import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto'
import type { WebhookEvent } from './events'

const MAX_BODY_SNAPLEN = 2000
const RETRY_DELAYS = [0, 2000, 5000] // milisaniye cinsinden

type WebhookPayload = Record<string, unknown>

// SSRF koruması: localhost, private IP'ler ve metadata endpoint'leri engelle
function isUrlSafe(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    if (!['https:', 'http:'].includes(url.protocol)) return false
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
    if (host === '0.0.0.0' || host.endsWith('.local') || host.endsWith('.internal')) return false
    const parts = host.split('.').map(Number)
    if (parts.length === 4 && parts.every((p) => Number.isFinite(p))) {
      if (parts[0] === 10) return false // 10.0.0.0/8
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false // 172.16.0.0/12
      if (parts[0] === 192 && parts[1] === 168) return false // 192.168.0.0/16
      if (parts[0] === 169 && parts[1] === 254) return false // 169.254.0.0/16 (metadata)
      if (parts[0] === 127) return false // 127.0.0.0/8
    }
    return true
  } catch {
    return false
  }
}

/**
 * dispatchEvent — tenant'ın aktif webhook'larına event gönder.
 * Tüm hataları yutar, ana akışı asla çökertmez.
 * after() içinde çağrılmalıdır.
 */
export async function dispatchEvent(
  tenantId: string,
  eventType: WebhookEvent,
  data: WebhookPayload,
): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: endpoints } = await admin
      .from('webhook_endpoints')
      .select('id, url, secret')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .contains('events', [eventType])

    if (!endpoints || endpoints.length === 0) return

    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: eventType,
      created_at: new Date().toISOString(),
      data,
    }

    const bodyStr = JSON.stringify(payload)

    for (const ep of endpoints) {
      // SSRF koruması: güvensiz URL'leri atla
      if (!isUrlSafe(ep.url)) continue

      // D-2: Secret şifreliyse çöz
      const deliverySecret = decryptSecret(ep.secret || '')
      const deliveryId = crypto.randomUUID()

      // Delivery kaydı oluştur
      await admin.from('webhook_deliveries').insert({
        id: deliveryId,
        tenant_id: tenantId,
        endpoint_id: ep.id,
        event_type: eventType,
        payload,
        status: 'pending',
        attempts: 0,
      })

      // Göndermeyi dene (en fazla 3 deneme)
      await sendWithRetry(admin, deliveryId, ep.url, deliverySecret, eventType, bodyStr)
    }
  } catch {
    // Tüm hatalar yutulur — ana akışı çökertme
  }
}

async function sendWithRetry(
  admin: ReturnType<typeof createAdminClient>,
  deliveryId: string,
  url: string,
  secret: string,
  eventType: WebhookEvent,
  bodyStr: string,
): Promise<void> {
  let lastStatus = 0
  let lastBody = ''
  let lastError = ''

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS[attempt])
    }

    try {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(bodyStr)
        .digest('hex')

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trevo-Event': eventType,
          'X-Trevo-Delivery': deliveryId,
          'X-Trevo-Signature': `sha256=${signature}`,
        },
        body: bodyStr,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      lastStatus = res.status
      lastBody = await res.text().catch(() => '')

      if (res.status >= 200 && res.status < 300) {
        // Başarılı
        await admin
          .from('webhook_deliveries')
          .update({
            status: 'success',
            attempts: attempt + 1,
            response_status: lastStatus,
            response_body: lastBody.slice(0, MAX_BODY_SNAPLEN),
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', deliveryId)
        return
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Bilinmeyen hata'
    }
  }

  // Tüm denemeler başarısız
  await admin
    .from('webhook_deliveries')
    .update({
      status: 'failed',
      attempts: RETRY_DELAYS.length,
      response_status: lastStatus || undefined,
      response_body: (lastBody || lastError).slice(0, MAX_BODY_SNAPLEN),
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
