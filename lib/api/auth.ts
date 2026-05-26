import crypto from 'node:crypto'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const KEY_PREFIX = 'trv_'

export type ApiKeyResult = {
  fullKey: string
  hash: string
  prefix: string
}

export type AuthResult = {
  tenantId: string
  apiKeyId: string
  role: string
} | null

/** Yeni API anahtarı üret: trv_ + 48 karakter hex */
export function generateApiKey(): ApiKeyResult {
  const raw = crypto.randomBytes(24).toString('hex')
  const fullKey = `${KEY_PREFIX}${raw}`
  const hash = crypto.createHash('sha256').update(fullKey).digest('hex')
  const prefix = fullKey.slice(0, 12)
  return { fullKey, hash, prefix }
}

/** Request'ten Bearer token oku, hash'le, api_keys'te ara */
export async function authenticateApiRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) return null

  const token = match[1]
  const hash = crypto.createHash('sha256').update(token).digest('hex')

  const admin = createAdminClient()
  const { data } = await admin
    .from('api_keys')
    .select('id, tenant_id, role')
    .eq('key_hash', hash)
    .is('revoked_at', null)
    .maybeSingle()

  if (!data) return null

  after(async () => {
    try {
      await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    } catch {}
  })

  return { tenantId: data.tenant_id as string, apiKeyId: data.id as string, role: data.role as string }
}

/** Admin client döndür + tenantId'yi doğrula. Public API route'larında kullan. */
export async function authenticateApiRequestOrThrow(request: Request): Promise<{ tenantId: string; apiKeyId: string; role: string }> {
  const result = await authenticateApiRequest(request)
  if (!result) {
    const err = new Error('Geçersiz veya eksik API anahtarı') as Error & { status: number }
    err.status = 401
    throw err
  }
  return result
}
