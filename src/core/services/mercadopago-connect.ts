import 'server-only';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabaseAdmin } from '@/core/supabase/admin';

/**
 * "Conectar con Mercado Pago" por productora (OAuth), para que cada venta
 * primaria se cobre directo a la cuenta de la productora dueña del
 * evento — Live Experience no se queda con nada del pago en sí (ver
 * supabase/migrations/003_mercadopago_connect.sql).
 *
 * Requiere que la app de Live Experience esté dada de alta en el panel de
 * desarrolladores de Mercado Pago con OAuth habilitado: MP_CLIENT_ID y
 * MP_CLIENT_SECRET (distintos del MP_ACCESS_TOKEN de una integración
 * simple de una sola cuenta).
 */

const OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';
const OAUTH_AUTHORIZE_URL = 'https://auth.mercadopago.com/authorization';

interface MpTokenResponse {
  access_token: string;
  expires_in: number;
  user_id: number;
  refresh_token: string;
  public_key: string;
}

/**
 * El flujo OAuth ("Conectar con Mercado Pago" en un click) requiere que
 * Live Experience tenga su propia aplicación dada de alta en el panel de
 * desarrolladores de Mercado Pago (MP_CLIENT_ID/MP_CLIENT_SECRET). Mientras
 * eso no esté configurado, cada productora puede conectar su cuenta a mano
 * pegando su propio Access Token (ver saveProducerManualMpCredentials) —
 * ese token lo sacan de SU PROPIA cuenta de Mercado Pago, en "Tus
 * integraciones" > Credenciales, algo que ya tiene cualquier cuenta de MP
 * sin necesidad de registrar ninguna app ni "ser developer".
 */
export function isMpOAuthConfigured(): boolean {
  return !!process.env.MP_CLIENT_ID && !!process.env.MP_CLIENT_SECRET;
}

/**
 * Las credenciales de Mercado Pago (tanto el Access Token como la Public
 * Key) arrancan con "TEST-" si son de prueba o "APP_USR-" si son de
 * producción — mismo prefijo en ambos campos. Pegar la de prueba es el
 * error más común al conectar a mano: el pago "funciona" en el sentido de
 * que no tira error de token inválido, pero el dinero nunca es real ni
 * llega a ningún lado.
 */
export function classifyMpCredential(value: string): 'production' | 'test' | 'unknown' {
  const v = value.trim();
  if (v.startsWith('TEST-')) return 'test';
  if (v.startsWith('APP_USR-')) return 'production';
  return 'unknown';
}

export function getMercadoPagoRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/api/producers/mercadopago/callback`;
}

export function getMercadoPagoAuthorizeUrl(state: string): string {
  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) throw new Error('Falta configurar MP_CLIENT_ID en el servidor.');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: getMercadoPagoRedirectUri(),
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function requestTokens(body: Record<string, string>): Promise<MpTokenResponse> {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Faltan MP_CLIENT_ID/MP_CLIENT_SECRET en el servidor.');
  }

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, ...body }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error_description || 'Error al comunicarse con Mercado Pago');
  }
  return data as MpTokenResponse;
}

export async function exchangeCodeForTokens(code: string): Promise<MpTokenResponse> {
  return requestTokens({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getMercadoPagoRedirectUri(),
  });
}

async function refreshTokens(refreshToken: string): Promise<MpTokenResponse> {
  return requestTokens({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

export async function saveProducerMpTokens(producerName: string, tokens: MpTokenResponse) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const { error } = await supabaseAdmin
    .from('producers')
    .update({
      mp_access_token: tokens.access_token,
      mp_refresh_token: tokens.refresh_token,
      mp_user_id: String(tokens.user_id),
      mp_public_key: tokens.public_key,
      mp_token_expires_at: expiresAt,
      mp_connected_at: new Date().toISOString(),
    })
    .eq('name', producerName);

  if (error) throw error;
}

/**
 * Valida un Access Token de Mercado Pago pegado a mano (sin pasar por
 * OAuth) consultando /users/me — así nos aseguramos de que es un token
 * real y de paso conseguimos el user_id de esa cuenta.
 */
export async function validateMpAccessToken(accessToken: string): Promise<{ userId: string } | null> {
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.id) return null;
    return { userId: String(data.id) };
  } catch {
    return null;
  }
}

/**
 * Guarda credenciales pegadas a mano por la productora (sin refresh_token
 * ni vencimiento — a diferencia del access_token que da el flujo OAuth,
 * este es el token "de producción" fijo que ya tiene cualquier cuenta de
 * Mercado Pago, y no hay que renovarlo).
 */
export async function saveProducerManualMpCredentials(
  producerName: string,
  { accessToken, publicKey, userId }: { accessToken: string; publicKey: string; userId: string }
) {
  const { error } = await supabaseAdmin
    .from('producers')
    .update({
      mp_access_token: accessToken,
      mp_refresh_token: null,
      mp_user_id: userId,
      mp_public_key: publicKey,
      mp_token_expires_at: null,
      mp_connected_at: new Date().toISOString(),
    })
    .eq('name', producerName);

  if (error) throw error;
}

export async function disconnectProducerMp(producerName: string) {
  await supabaseAdmin
    .from('producers')
    .update({
      mp_access_token: null,
      mp_refresh_token: null,
      mp_user_id: null,
      mp_public_key: null,
      mp_token_expires_at: null,
      mp_connected_at: null,
    })
    .eq('name', producerName);
}

/**
 * Devuelve un access token vigente para la productora, renovándolo antes
 * si está por vencer. Devuelve null si nunca conectó Mercado Pago.
 */
export async function getValidProducerAccessToken(producerName: string): Promise<string | null> {
  const { data: producer } = await supabaseAdmin
    .from('producers')
    .select('mp_access_token, mp_refresh_token, mp_token_expires_at')
    .eq('name', producerName)
    .maybeSingle();

  if (!producer?.mp_access_token) return null;

  // Token pegado a mano (sin OAuth): no tiene refresh_token ni vencimiento
  // conocido, así que se usa directo tal cual está guardado.
  if (!producer.mp_refresh_token) return producer.mp_access_token;

  const expiresAt = producer.mp_token_expires_at ? new Date(producer.mp_token_expires_at).getTime() : 0;
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return producer.mp_access_token;
  }

  const refreshed = await refreshTokens(producer.mp_refresh_token);
  await saveProducerMpTokens(producerName, refreshed);
  return refreshed.access_token;
}

/** Cliente de Preference de MP listo para crear un cobro a nombre de esa productora. */
export async function getPreferenceClientForProducer(producerName: string): Promise<Preference | null> {
  const accessToken = await getValidProducerAccessToken(producerName);
  if (!accessToken) return null;
  return new Preference(new MercadoPagoConfig({ accessToken, options: { timeout: 7000 } }));
}
