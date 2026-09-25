import { NextRequest, NextResponse } from 'next/server';

// CORS solo para /api/*: se restringe a que las respuestas únicamente se
// puedan leer desde el propio dominio de la web. Los webhooks de
// MercadoPago/AstroPay y cualquier llamada servidor-a-servidor no mandan
// header "Origin" (eso es algo que solo hacen los navegadores), así que
// nunca se ven afectados por esto — lo que se bloquea es que OTRA página
// web, desde el navegador de un usuario, pueda pegarle a esta API.
function getAllowedOrigins(req: NextRequest): string[] {
  const configured = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_BASE_URL].filter(
    (v): v is string => Boolean(v)
  );
  return Array.from(new Set([...configured, req.nextUrl.origin]));
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = getAllowedOrigins(req);
  const isAllowed = !origin || allowedOrigins.includes(origin);

  if (req.method === 'OPTIONS') {
    if (!isAllowed) {
      return new NextResponse(null, { status: 403 });
    }
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin', origin as string);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Max-Age', '86400');
    res.headers.set('Vary', 'Origin');
    return res;
  }

  if (!isAllowed) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  }

  const res = NextResponse.next();
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
