import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  createAdminSessionToken,
} from '@/core/auth/admin-session';
import { hasAnyPortalAccess } from '@/core/services/producers';
import { checkRateLimit, getClientIp } from '@/core/security/rate-limit';

export const dynamic = 'force-dynamic';

// Consulta si ya hay acceso al portal /admin (para que AdminGate decida si
// mostrar el login). Entra un admin de Live Experience (admin_users o la
// contraseña compartida) O cualquier miembro del equipo de una productora
// — /admin hospeda tanto herramientas de Live Experience como de
// autoservicio de productoras, y cada página/ruta puntual ya hace su
// propio chequeo más fino por encima de esto.
export async function GET() {
  const ctx = await hasAnyPortalAccess();
  return NextResponse.json(ctx);
}

// Login: valida la contraseña de administrador y abre sesión
export async function POST(req: Request) {
  try {
    // ADMIN_PASSWORD es un secreto único y compartido — sin límite de
    // intentos, cualquiera podía probar combinaciones sin parar hasta
    // adivinarla. 8 intentos cada 10 minutos por IP alcanza para un login
    // real (con typos incluidos) y frena la fuerza bruta.
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`admin-login:${ip}`, { limit: 8, windowSeconds: 600 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(rl.resetInSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    const { password } = await req.json();

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const token = createAdminSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: 'El servidor no tiene configurada ADMIN_PASSWORD.' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al iniciar sesión' }, { status: 500 });
  }
}

// Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
