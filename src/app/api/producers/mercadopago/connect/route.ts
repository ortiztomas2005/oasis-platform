import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getOwnedProducerName } from '@/core/services/producers';
import { getMercadoPagoAuthorizeUrl } from '@/core/services/mercadopago-connect';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'oasis_mp_oauth_state';

// Arranca el flujo "Conectar con Mercado Pago": redirige a MP para que el
// dueño de la productora autorice con SU cuenta. El callback vuelve a
// resolver la productora desde la sesión (no confía en nada que viaje en
// el state salvo para el chequeo anti-CSRF).
export async function GET() {
  const producerName = await getOwnedProducerName();
  if (!producerName) {
    return NextResponse.json(
      { error: 'Tenés que estar logueado y ser dueño de una productora para conectar Mercado Pago.' },
      { status: 403 }
    );
  }

  let authorizeUrl: string;
  try {
    const state = randomBytes(16).toString('hex');
    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutos, alcanza para completar el login de MP
    });
    authorizeUrl = getMercadoPagoAuthorizeUrl(state);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.redirect(authorizeUrl);
}
