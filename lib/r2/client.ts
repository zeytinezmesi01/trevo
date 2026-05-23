import { S3Client } from '@aws-sdk/client-s3'

const r2Endpoint = process.env.R2_ENDPOINT
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const r2BucketName = process.env.R2_BUCKET_NAME
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

if (!r2Endpoint) throw new Error('R2_ENDPOINT env var is required')
if (!r2AccessKeyId) throw new Error('R2_ACCESS_KEY_ID env var is required')
if (!r2SecretAccessKey) throw new Error('R2_SECRET_ACCESS_KEY env var is required')
if (!r2BucketName) throw new Error('R2_BUCKET_NAME env var is required')
if (!r2PublicUrl) throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL env var is required')

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
})

export const R2_BUCKET = r2BucketName
export const R2_PUBLIC_URL = r2PublicUrl
