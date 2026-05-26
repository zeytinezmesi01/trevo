const envDomain = process.env.NEXT_PUBLIC_DEFAULT_DOMAIN
export const DEFAULT_DOMAINS = [
  ...(envDomain ? [envDomain] : ['trevo-delta.vercel.app']),
  'localhost',
]
