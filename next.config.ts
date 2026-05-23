import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // Fatura PDF'i için gömülü fontları serverless trace'e dahil et
  outputFileTracingIncludes: {
    '/api/invoices/**': ['./lib/pdf/fonts/**'],
  },

  // X-Powered-By: Next.js sızıntısını kapat
  poweredByHeader: false,

  // Güvenlik header'ları
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    const scriptSrc = ["'self'", "'unsafe-inline'", 'https://*.iyzipay.com'];
    const connectSrc = ["'self'"];

    // Geliştirme modunda React eval() ve Turbopack HMR WebSocket'i kullanır.
    // Üretimde bunların hiçbiri gerekmez — CSP sıkı kalır.
    if (isDev) {
      scriptSrc.push("'unsafe-eval'");
      connectSrc.push('ws://localhost:*', 'http://localhost:*');
    }

    const directives: Record<string, string[]> = {
      'default-src': ["'self'"],
      'script-src': scriptSrc,
      // O-19: Tailwind CSS 4 runtime inline style üretir — nonce tabanlı CSP'ye
      // geçiş için Tailwind'in derleme moduna geçmek gerekir. Risk kabulü.
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': connectSrc,
      'frame-src': ['https://*.iyzipay.com'],
      'form-action': ["'self'", 'https://*.iyzipay.com'],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
    };

    if (supabaseUrl) {
      const origin = new URL(supabaseUrl).origin;
      directives['connect-src'].push(origin);
    }

    if (r2PublicUrl) {
      const origin = new URL(r2PublicUrl).origin;
      directives['img-src'].push(origin);
      directives['connect-src'].push(origin);
    }

    // R2 S3 API ucu — tarayıcı dosya yüklemelerini (PUT) buraya yapar.
    // Bucket adı alt-domain olarak eklendiği için wildcard de gerekir.
    const r2Endpoint = process.env.R2_ENDPOINT;
    if (r2Endpoint) {
      try {
        const host = new URL(r2Endpoint).host;
        directives['connect-src'].push(`https://${host}`, `https://*.${host}`);
      } catch {}
    }

    const csp = Object.entries(directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
          // Y-9: HTTPS zorunlu (production'da etkin)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // O-20: tarayıcı yeteneklerini kısıtla
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
