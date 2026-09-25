import 'server-only';
import { createClient as createServerClient } from '@/core/supabase/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getAdminContext } from '@/core/auth/admin-session';

export type TeamRole = 'OWNER' | 'ADMIN' | 'DOOR' | 'BAR';

/**
 * Resuelve de qué productora es dueño (role OWNER en team_members) el
 * usuario logueado actualmente. Devuelve null si no está logueado o no
 * tiene ninguna.
 */
export async function getOwnedProducerName(): Promise<string | null> {
  const email = await getSessionEmail();
  if (!email) return null;

  const { data } = await supabaseAdmin
    .from('team_members')
    .select('producer_name')
    .eq('email', email)
    .eq('role', 'OWNER')
    .maybeSingle();

  return data?.producer_name || null;
}

export async function getSessionEmail(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() || null;
}

/** Productora que el usuario logueado gestiona (OWNER o ADMIN de su equipo), o null. */
export async function getManagedProducerName(
  allowedRoles: TeamRole[] = ['OWNER', 'ADMIN']
): Promise<string | null> {
  const email = await getSessionEmail();
  if (!email) return null;

  const { data } = await supabaseAdmin
    .from('team_members')
    .select('producer_name')
    .eq('email', email)
    .in('role', allowedRoles)
    .limit(1)
    .maybeSingle();

  return data?.producer_name || null;
}

/**
 * Rol del usuario logueado dentro del equipo de una productora puntual (o
 * null si no pertenece). Si ya se tiene el email resuelto de antes en el
 * mismo request (p. ej. de getAdminContext), pasalo en `knownEmail` para no
 * pagar dos veces la ida y vuelta a Supabase Auth que hace getSessionEmail().
 */
export async function getSessionRoleForProducer(
  producerName: string,
  knownEmail?: string | null
): Promise<TeamRole | null> {
  const email = knownEmail !== undefined ? knownEmail : await getSessionEmail();
  if (!email) return null;

  const { data } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('email', email)
    .eq('producer_name', producerName)
    .maybeSingle();

  return (data?.role as TeamRole) || null;
}

/** A qué productora pertenece un evento (null si no tiene ninguna asignada). */
export async function getProducerNameForEvent(eventId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('events').select('producer_name').eq('id', eventId).maybeSingle();
  return data?.producer_name || null;
}

/**
 * Chequeo de permiso para operaciones sobre un evento puntual (confirmar
 * ventas, enviar cortesías): o sos staff de rango suficiente en la
 * productora dueña del evento, o sos admin de Live Experience (que puede operar
 * sobre cualquier evento como respaldo/soporte).
 */
export async function canManageEvent(
  eventId: string,
  allowedRoles: TeamRole[] = ['OWNER', 'ADMIN']
): Promise<{ ok: true; producerName: string | null } | { ok: false; error: string; status: number }> {
  const adminCtx = await getAdminContext();
  if (adminCtx.authenticated) {
    const producerName = await getProducerNameForEvent(eventId);
    return { ok: true, producerName };
  }

  const producerName = await getProducerNameForEvent(eventId);
  if (!producerName) {
    return { ok: false, error: 'Este evento no tiene una productora asignada.', status: 400 };
  }

  // adminCtx ya resolvió el usuario logueado (getRealAccountAdminContext
  // llama a supabase.auth.getUser() puertas adentro); reusamos ese email en
  // vez de pedirlo de nuevo, que antes eran dos idas y vueltas a Supabase
  // Auth por request para cualquier request de una productora.
  const role = await getSessionRoleForProducer(producerName, adminCtx.email);
  if (!role || !allowedRoles.includes(role)) {
    return { ok: false, error: 'No tenés permiso para operar sobre este evento.', status: 403 };
  }

  return { ok: true, producerName };
}

/**
 * Descuenta 1 ticket del saldo prepago de la productora, de forma atómica
 * (ver supabase/migrations/004_producer_ticket_balance.sql). Si no tiene
 * saldo, devuelve false y no descuenta nada — la venta/cortesía no debe
 * seguir adelante.
 */
export async function consumeProducerTicket(producerName: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('consume_producer_ticket', {
    p_producer_name: producerName,
  });
  if (error) {
    console.error('Error al descontar ticket del saldo de la productora:', error);
    return false;
  }
  return !!data;
}

/** Devuelve un ticket al saldo si la emisión falló después de haberlo descontado. */
export async function refundProducerTicket(producerName: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('refund_producer_ticket', { p_producer_name: producerName });
  if (error) console.error('Error al devolver ticket al saldo de la productora:', error);
}

/**
 * Crea la productora + la fila de team_members (OWNER) para una cuenta ya
 * autenticada. La usan tanto /api/auth/register-producer (cuando el signup
 * abre sesión al toque) como /auth/callback (cuando Supabase exige
 * confirmar el email primero: ahí no hay sesión en el momento del signup,
 * así que esto se termina de hacer recién cuando la persona confirma y
 * vuelve).
 */
export async function createProducerForUser(
  user: { email: string; user_metadata?: Record<string, any> },
  {
    producerName,
    producerType,
    dni,
    phone,
    fullName: fullNameOverride,
  }: { producerName: string; producerType?: string; dni?: string; phone?: string; fullName?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleanName = String(producerName || '').trim().toUpperCase();
  if (!cleanName) return { ok: false, error: 'Falta el nombre de la productora.' };

  const email = user.email.toLowerCase();
  const fullName =
    fullNameOverride || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || email;

  const { error: producerErr } = await supabaseAdmin.from('producers').insert({
    name: cleanName,
    type: producerType || 'ENTERTAINMENT',
    owner_email: email,
  });

  if (producerErr) {
    return { ok: false, error: `No se pudo crear la productora: ${producerErr.message}` };
  }

  const { error: teamErr } = await supabaseAdmin.from('team_members').insert({
    email,
    name: fullName,
    dni: dni || null,
    phone: phone || null,
    role: 'OWNER',
    producer_name: cleanName,
  });

  if (teamErr) {
    await supabaseAdmin.from('producers').delete().eq('name', cleanName);
    return { ok: false, error: `No se pudo asignar el equipo: ${teamErr.message}` };
  }

  return { ok: true };
}

/**
 * Chequeo de acceso al portal /admin (la sombrilla que usa AdminGate):
 * entra un admin de Live Experience (admin_users o la contraseña
 * compartida) O cualquier miembro del equipo de una productora, sea cual
 * sea su rol — /admin hoy hospeda tanto herramientas exclusivas de Live
 * Experience como herramientas de autoservicio de productoras
 * (/admin/eventos, /admin/pedidos, etc.), y cada página/ruta ya hace su
 * propio chequeo más fino (canManageEvent, requireSuperAdmin, etc.). Este
 * gate es solo la puerta de entrada, no el control de acceso real.
 */
export async function hasAnyPortalAccess(): Promise<{ authenticated: boolean; role: string | null; email: string | null }> {
  const adminCtx = await getAdminContext();
  if (adminCtx.authenticated) return adminCtx;

  // Mismo motivo que en canManageEvent: getAdminContext ya resolvió (o
  // intentó resolver) el usuario vía getUser(), así que reusamos ese email
  // en vez de volver a pegarle a Supabase Auth.
  const email = adminCtx.email;
  if (!email) return { authenticated: false, role: null, email: null };

  const { data } = await supabaseAdmin.from('team_members').select('role').eq('email', email).limit(1).maybeSingle();

  if (data) return { authenticated: true, role: data.role, email };
  return { authenticated: false, role: null, email };
}
