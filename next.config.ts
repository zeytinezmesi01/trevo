import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fatura PDF'i için gömülü fontları serverless trace'e dahil et
  outputFileTracingIncludes: {
    '/api/invoices/**': ['./lib/pdf/fonts/**'],
  },
};

export default nextConfig;
