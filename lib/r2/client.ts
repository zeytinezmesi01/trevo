import { S3Client } from '@aws-sdk/client-s3'

// Y-3: Lazy initialization — modül import edildiğinde throw etmesin
let _client: S3Client | null = null
let _bucket: string | null = null

export function getR2Client(): S3Client {
  if (_client) return _client
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required R2 environment variables')
  }
  _client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
  return _client
}

export function getR2Bucket(): string {
  if (_bucket) return _bucket
  const bucketName = process.env.R2_BUCKET_NAME
  if (!bucketName) throw new Error('R2_BUCKET_NAME is not set')
  _bucket = bucketName
  return _bucket
}

export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
