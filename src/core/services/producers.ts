import { createClient as createServerClient } from '@/core/supabase/server';
import { supabaseAdmin } from '@/core/supabase/admin';

/**
 * Resuelve de qué productora es dueño (role OWNER en team_members) el
 * usuario logueado actualmente. Devuelve null si no está logueado o no
 * tiene ninguna.
 */
export async function getOwnedProducerName(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data } = await supabaseAdmin
    .from('team_members')
    .select('producer_name')
    .eq('email', user.email.toLowerCase())
    .eq('role', 'OWNER')
    .maybeSingle();

  return data?.producer_name || null;
}
