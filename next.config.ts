import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // Fatura PDF'i için gömülü fontları serverless trace'e dahil et
  outputFileTracingIncludes: {
    '/api/invoices/**': ['./lib/pdf/fonts/**'],
  },

  // X-Powered-By: Next.js sızıntısını kapat
  poweredByHeader: false,

  // Güvenlik header'ları.
  // CSP burada DEĞİL: nonce her istekte üretilmesi gerektiği için proxy.ts'te
  // kurulur (bkz. buildCsp). Burada yalnızca statik header'lar kalır.
  async headers() {
    const headers = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // O-20: tarayıcı yeteneklerini kısıtla
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    // Y-9: HTTPS zorunlu — yalnızca üretimde. includeSubDomains BİLEREK yok:
    // white-label custom domain'lerde müşterinin kendi alt-domenleri etkilenmemeli.
    if (!isDev) {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' });
    }

    return [
      {
        // checkout-frame hariç: o route iframe'lenebilir bir "CSP adası"dır ve
        // X-Frame-Options DENY kendi iframe'imizi de engellerdi. Route kendi
        // header'larını (SAMEORIGIN + gevşek CSP) kendisi kurar.
        source: '/((?!api/payments/checkout-frame).*)',
        headers,
      },
    ];
  },
};

export default nextConfig;
