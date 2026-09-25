import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/core/supabase/server';
import { supabaseAdmin } from '@/core/supabase/admin';

/**
 * Control de acceso a /admin y a las rutas /api/admin, /api/scan y
 * /api/tickets/courtesy. Dos caminos posibles, ambos válidos:
 *
 * 1. Cuenta real: el usuario está logueado con Supabase Auth (el mismo
 *    login de /auth que usa cualquier cliente) Y su cuenta figura en la
 *    tabla admin_users (ver supabase/migrations/001_admin_users.sql). Esta
 *    tabla es la separación real entre "cuenta de cliente/productora" y
 *    "cuenta de staff de Live Experience" — team_members (OWNER/ADMIN/DOOR/BAR) es
 *    otra cosa, es el equipo de UNA productora puntual, no da acceso a
 *    /admin por sí solo.
 * 2. Contraseña compartida (ADMIN_PASSWORD): el mecanismo de arranque que
 *    ya existía. Se mantiene como respaldo para no quedar bloqueado antes
 *    de sembrar el primer admin_users, y para desarrollo local. Se trata
 *    como equivalente a SUPERADMIN.
 */

const COOKIE_NAME = 'oasis_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 horas

export type AdminRole = 'SUPERADMIN' | 'ADMIN';

export interface AdminContext {
  authenticated: boolean;
  /** 'PASSWORD' = entró con la contraseña compartida, no con una cuenta real. */
  role: AdminRole | 'PASSWORD' | null;
  email: string | null;
}

function getSecret(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    console.error(
      '⚠️ ADMIN_PASSWORD no está configurada: el login por contraseña compartida queda deshabilitado (podés usar una cuenta real dada de alta en admin_users en su lugar).'
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

/** Chequea si la request actual trae una cookie de sesión válida por contraseña compartida. */
export async function hasValidPasswordSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return verifyToken(token, process.env.ADMIN_PASSWORD || null);
  } catch {
    return false;
  }
}

/** Compatibilidad hacia atrás: alias del chequeo anterior. */
export async function hasValidAdminSession(): Promise<boolean> {
  return (await getAdminContext()).authenticated;
}

/**
 * Chequea si hay una cuenta de Supabase logueada Y esa cuenta figura en
 * admin_users. Si la tabla todavía no existe (no corriste la migración),
 * falla cerrado sin romper — simplemente no da acceso por esta vía.
 */
async function getRealAccountAdminContext(): Promise<AdminContext> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { authenticated: false, role: null, email: null };

    const { data } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) return { authenticated: false, role: null, email: user.email || null };

    return { authenticated: true, role: data.role as AdminRole, email: user.email || null };
  } catch {
    return { authenticated: false, role: null, email: null };
  }
}

/** Resuelve el contexto de admin completo, probando cuenta real primero y contraseña compartida después. */
export async function getAdminContext(): Promise<AdminContext> {
  const real = await getRealAccountAdminContext();
  if (real.authenticated) return real;

  if (await hasValidPasswordSession()) {
    return { authenticated: true, role: 'PASSWORD', email: null };
  }

  // Importante: se devuelve real.email (no null) acá. getRealAccountAdminContext
  // ya resolvió el email de la cuenta logueada aunque no sea admin de Live
  // Experience — si se pisa con null, cualquier código que confíe en este
  // email (como hasAnyPortalAccess/canManageEvent para no pedirlo de nuevo)
  // termina tratando a un productor real y logueado como si no tuviera sesión.
  return { authenticated: false, role: null, email: real.email };
}

/**
 * Guard para usar al principio de cada handler de ruta protegida:
 *
 *   const unauthorized = await requireAdminSession();
 *   if (unauthorized) return unauthorized;
 *
 * Devuelve `null` si hay acceso de admin válido (cuenta real o contraseña
 * compartida), o una respuesta 401 lista para retornar si no lo hay.
 */
export async function requireAdminSession(): Promise<NextResponse | null> {
  const ctx = await getAdminContext();
  if (ctx.authenticated) return null;
  return NextResponse.json(
    { error: 'No autorizado. Iniciá sesión como administrador para usar esta función.' },
    { status: 401 }
  );
}

/**
 * Igual que requireAdminSession pero exige rol SUPERADMIN (o la
 * contraseña compartida, tratada como equivalente). Usar en operaciones
 * sensibles como gestionar quién más es admin.
 */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
  const ctx = await getAdminContext();
  if (ctx.authenticated && (ctx.role === 'SUPERADMIN' || ctx.role === 'PASSWORD')) return null;
  return NextResponse.json(
    { error: 'Esta acción requiere una cuenta con rol SUPERADMIN.' },
    { status: 403 }
  );
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;
