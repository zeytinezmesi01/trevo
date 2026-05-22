import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw || raw.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('ENCRYPTION_KEY ortam değişkeni 64 karakterlik bir hex değer olmalıdır')
  }
  return Buffer.from(raw, 'hex')
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return ''
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  // iv:tag:ciphertext
  return `${iv.toString('hex')}:${tag}:${encrypted}`
}

export function decryptSecret(stored: string): string {
  if (!stored) return ''
  // Şifrelenmemiş (eski kayıt) → düz metin kabul et
  if (!stored.includes(':')) return stored
  const parts = stored.split(':')
  if (parts.length !== 3) return stored
  try {
    const key = getKey()
    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return stored // fallback: düz metin
  }
}
