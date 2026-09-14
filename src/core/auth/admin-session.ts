import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Gate de administrador basado en una contraseña compartida (ADMIN_PASSWORD).
 *
 * Es una mitigación rápida: hoy ninguna ruta bajo /api/admin, /api/scan ni
 * /api/tickets/courtesy verifica quién llama, así que cualquiera con la URL
 * puede crear eventos, emitir tickets gratis o marcar entradas como usadas.
 * Este módulo cierra ese hueco con una sesión firmada (cookie httpOnly) sin
 * depender de un esquema de roles en la base de datos.
 *
 * TODO: reemplazar por sesiones de Supabase Auth + un rol real (org_members)
 * cuando el modelo de usuarios/roles esté definido.
 */

const COOKIE_NAME = 'oasis_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 horas

function getSecret(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    console.error(
      '⚠️ ADMIN_PASSWORD no está configurada: las rutas de administración quedarán bloqueadas hasta definirla en .env.local'
    );
    return null;
  }
  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Valida la contraseña enviada en el login del panel de admin. */
export function checkAdminPassword(candidate: string): boolean {
  const secret = getSecret();
  if (!secret || !candidate) return false;
  return safeEqual(candidate, secret);
}

/** Genera un token de sesión firmado (HMAC) con expiración embebida. */
export function createAdminSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const nonce = randomBytes(8).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token: string | undefined, secret: string | null): boolean {
  if (!token || !secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiresAtStr, nonce, signature] = parts;

  const expectedSignature = sign(`${expiresAtStr}.${nonce}`, secret);
  if (!safeEqual(signature, expectedSignature)) return false;

  const expiresAt = Number(expiresAtStr);
  return Number.isFinite(expiresAt) && Date.now() <= expiresAt;
}

/** Chequea si la request actual trae una cookie de sesión de admin válida. */
export async function hasValidAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return verifyToken(token, process.env.ADMIN_PASSWORD || null);
  } catch {
    return false;
  }
}

/**
 * Guard para usar al principio de cada handler de ruta protegida:
 *
 *   const unauthorized = await requireAdminSession();
 *   if (unauthorized) return unauthorized;
 *
 * Devuelve `null` si la sesión es válida, o una respuesta 401 lista para
 * retornar si no lo es.
 */
export async function requireAdminSession(): Promise<NextResponse | null> {
  const ok = await hasValidAdminSession();
  if (ok) return null;
  return NextResponse.json(
    { error: 'No autorizado. Iniciá sesión como administrador para usar esta función.' },
    { status: 401 }
  );
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;
