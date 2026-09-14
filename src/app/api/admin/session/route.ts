import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  createAdminSessionToken,
  getAdminContext,
} from '@/core/auth/admin-session';

export const dynamic = 'force-dynamic';

// Consulta si ya hay una sesión de admin activa (para que el panel decida si
// mostrar el login). Si ya estás logueado con una cuenta real dada de alta
// en admin_users, esto ya da authenticated:true sin pedir la contraseña
// compartida.
export async function GET() {
  const ctx = await getAdminContext();
  return NextResponse.json(ctx);
}

// Login: valida la contraseña de administrador y abre sesión
export async function POST(req: Request) {
  try {
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
