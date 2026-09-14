import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOwnedProducerName } from '@/core/services/producers';
import { exchangeCodeForTokens, saveProducerMpTokens } from '@/core/services/mercadopago-connect';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'oasis_mp_oauth_state';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const mpError = url.searchParams.get('error');

  const redirectBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const statusPage = (status: string) => NextResponse.redirect(`${redirectBase}/admin/mercadopago?status=${status}`);

  if (mpError) return statusPage('denied');
  if (!code || !state) return statusPage('invalid');

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!savedState || savedState !== state) {
    return statusPage('invalid_state');
  }

  // Se vuelve a resolver la productora desde la sesión actual (no desde el
  // state): así no importa qué viaje en la URL, los tokens quedan
  // atados a la cuenta que realmente inició este flujo.
  const producerName = await getOwnedProducerName();
  if (!producerName) return statusPage('no_session');

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveProducerMpTokens(producerName, tokens);
  } catch (err: any) {
    console.error('Error conectando Mercado Pago:', err);
    return statusPage('error');
  }

  return statusPage('connected');
}
