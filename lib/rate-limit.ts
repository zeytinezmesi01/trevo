import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Bellek-içi limiter (tek-instance / fallback).
// Serverless'ta instance'lar arası paylaşılmaz — bu yüzden güvenlik-kritik
// uçlar rateLimitDb() (Postgres tabanlı) kullanmalıdır. Bu sürüm yalnızca
// RPC erişilemediğinde devreye giren fail-safe katmandır.
// ---------------------------------------------------------------------------
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }
  if (entry.count >= maxRequests) return false // blocked
  entry.count++
  return true // allowed
}

// Cleanup every 5 minutes (Node runtime'da çalışır; serverless'ta best-effort)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 300_000)

// ---------------------------------------------------------------------------
// K-2: Dağıtık rate limit — Postgres `check_rate_limit` RPC'si üzerinden.
// Tüm instance'lar aynı sayacı paylaşır; serverless'ta tutarlı çalışır.
// RPC hata verirse (ör. migration henüz uygulanmamış) bellek-içi limiter'a
// düşer — böylece koruma tamamen kaybolmaz ve istek akışı kesilmez.
// ---------------------------------------------------------------------------
export async function rateLimitDb(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_max: maxRequests,
      p_window_ms: windowMs,
    })
    if (error) {
      // RPC yok/erişilemiyor → bellek-içi limiter'a düş
      return rateLimit(key, maxRequests, windowMs)
    }
    return data === true
  } catch {
    return rateLimit(key, maxRequests, windowMs)
  }
}
