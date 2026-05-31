import { describe, it, expect, beforeAll } from 'vitest'

// crypto.ts modül yüklenirken değil çağrı anında ENCRYPTION_KEY okur,
// yine de import öncesi set etmek en güvenlisi.
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64) // 64 hex karakter
})

describe('crypto encrypt/decrypt', () => {
  it('round-trip: şifrele → çöz aynı metni verir', async () => {
    const { encryptSecret, decryptSecret } = await import('./crypto')
    const secret = 'sandbox-iyzico-api-key-12345'
    const enc = encryptSecret(secret)
    expect(enc).not.toBe(secret)
    expect(enc.split(':')).toHaveLength(3) // iv:tag:ciphertext
    expect(decryptSecret(enc)).toBe(secret)
  })

  it('aynı girdi her seferinde farklı ciphertext üretir (rastgele IV)', async () => {
    const { encryptSecret } = await import('./crypto')
    expect(encryptSecret('x')).not.toBe(encryptSecret('x'))
  })

  it('boş string → boş string', async () => {
    const { encryptSecret, decryptSecret } = await import('./crypto')
    expect(encryptSecret('')).toBe('')
    expect(decryptSecret('')).toBe('')
  })

  it('legacy düz metin (":" içermeyen) olduğu gibi döner', async () => {
    const { decryptSecret } = await import('./crypto')
    expect(decryptSecret('plain-legacy-value')).toBe('plain-legacy-value')
  })

  it('kurcalanmış ciphertext (auth tag uyuşmazlığı) hata fırlatır', async () => {
    const { encryptSecret, decryptSecret } = await import('./crypto')
    const enc = encryptSecret('hassas')
    const parts = enc.split(':')
    // ciphertext'i boz
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'))}`
    expect(() => decryptSecret(tampered)).toThrow()
  })
})
