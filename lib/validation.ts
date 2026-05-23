// O-15: Ortak input validasyon yardimcilari
export const isValidEmail = (e: string): boolean =>
  typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

export const isValidVkn = (v: string): boolean =>
  typeof v === 'string' && /^\d{10,11}$/.test(v.trim())

export const isValidPhone = (p: string): boolean => {
  if (typeof p !== 'string') return false
  return /^(\+90|0)?[1-9]\d{9}$/.test(p.replace(/\s/g, ''))
}
