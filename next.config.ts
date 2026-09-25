import type { NextConfig } from "next";

// Dominios externos que la app realmente usa (imágenes, fuentes, llamadas de
// red del lado del cliente, o redirecciones de pago). Se listan acá para
// armar el Content-Security-Policy sin tener que abrirlo a "cualquier cosa".
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const csp = [
  "default-src 'self'",
  // Next.js inyecta scripts inline chicos para hidratar la página (datos de
  // RSC/streaming); sin 'unsafe-inline' acá el sitio no arranca.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  `connect-src 'self' ${SUPABASE_URL} https://api.mercadopago.com https://api.qrserver.com`,
  "frame-src 'self' https://www.mercadopago.com.ar https://www.mercadopago.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.mercadopago.com.ar https://auth.mercadopago.com",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
