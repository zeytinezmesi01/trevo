import { GetBucketCorsCommand, PutBucketCorsCommand, type CORSRule } from '@aws-sdk/client-s3'
import { getR2Client, getR2Bucket } from './client'

/**
 * R2 bucket CORS otomasyonu.
 *
 * Tarayıcı dosya yüklemeleri presigned PUT ile doğrudan R2'ye gider; bucket
 * CORS'unda sayfanın origin'i yoksa yükleme kırılır. Custom domain
 * doğrulandığında bu fonksiyon origin'i CORS AllowedOrigins'a ekler —
 * manuel R2 dashboard adımı gerekmez.
 *
 * Not: PutBucketCors, R2 API token'ında bucket düzeyinde Admin yetkisi ister.
 * Token yetkisizse hata yutulmaz; çağıran taraf sonucu kullanıcıya raporlar.
 */

// Yeni kurulan bucket'lar için varsayılan kural — mevcut kurallar korunur,
// origin'ler ilk kurala eklenir.
const DEFAULT_RULE: CORSRule = {
  AllowedMethods: ['GET', 'PUT', 'HEAD'],
  AllowedOrigins: [],
  AllowedHeaders: ['*'],
  ExposeHeaders: ['ETag'],
  MaxAgeSeconds: 3600,
}

export type EnsureCorsResult = {
  ok: boolean
  added: string[]
  error?: string
}

/** Verilen origin'lerin bucket CORS'unda bulunmasını garanti eder (idempotent). */
export async function ensureR2CorsOrigins(origins: string[]): Promise<EnsureCorsResult> {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    return { ok: false, added: [], error: 'R2 yapılandırılmamış (env eksik)' }
  }

  try {
    const client = getR2Client()
    const bucket = getR2Bucket()

    let rules: CORSRule[] = []
    try {
      const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }))
      rules = current.CORSRules || []
    } catch (e) {
      // CORS hiç yapılandırılmamışsa S3 API NoSuchCORSConfiguration döner — boş başla
      const name = (e as { name?: string }).name
      if (name !== 'NoSuchCORSConfiguration' && name !== 'NoSuchCorsConfiguration') throw e
    }

    const existing = new Set(rules.flatMap((r) => r.AllowedOrigins || []))
    const missing = origins.filter((o) => !existing.has(o) && !existing.has('*'))
    if (missing.length === 0) return { ok: true, added: [] }

    if (rules.length === 0) {
      rules = [{ ...DEFAULT_RULE, AllowedOrigins: [...missing] }]
    } else {
      rules[0] = {
        ...rules[0],
        AllowedOrigins: [...(rules[0].AllowedOrigins || []), ...missing],
      }
    }

    await client.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: rules },
    }))

    return { ok: true, added: missing }
  } catch (e) {
    console.error('R2 CORS güncellenemedi:', e)
    return { ok: false, added: [], error: e instanceof Error ? e.message : 'R2 CORS hatası' }
  }
}
