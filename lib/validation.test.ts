import { describe, it, expect } from 'vitest'
import { isValidEmail, isValidVkn, isValidPhone } from './validation'

describe('isValidEmail', () => {
  it('geçerli e-postaları kabul eder', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail('  user@example.co.uk  ')).toBe(true)
  })
  it('geçersiz e-postaları reddeder', () => {
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('no-at-sign')).toBe(false)
    expect(isValidEmail('a b@c.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidVkn', () => {
  it('10 veya 11 haneyi kabul eder', () => {
    expect(isValidVkn('1234567890')).toBe(true)
    expect(isValidVkn('12345678901')).toBe(true)
  })
  it('hatalı uzunluk/karakteri reddeder', () => {
    expect(isValidVkn('123')).toBe(false)
    expect(isValidVkn('123456789012')).toBe(false)
    expect(isValidVkn('12345abcde')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('TR telefon formatlarını kabul eder', () => {
    expect(isValidPhone('5551234567')).toBe(true)
    expect(isValidPhone('05551234567')).toBe(true)
    expect(isValidPhone('+905551234567')).toBe(true)
    expect(isValidPhone('0555 123 45 67')).toBe(true)
  })
  it('geçersiz numaraları reddeder', () => {
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('abcdefghij')).toBe(false)
    expect(isValidPhone('0055512345')).toBe(false)
  })
})
