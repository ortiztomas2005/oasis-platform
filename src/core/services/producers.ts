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

/** Rol del usuario logueado dentro del equipo de una productora puntual (o null si no pertenece). */
export async function getSessionRoleForProducer(producerName: string): Promise<TeamRole | null> {
  const email = await getSessionEmail();
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
 * productora dueña del evento, o sos admin de OASIS (que puede operar
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

  const role = await getSessionRoleForProducer(producerName);
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
