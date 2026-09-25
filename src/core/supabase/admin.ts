import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      // Antes esto caía silenciosamente a la anon key o a un JWT placeholder
      // hardcodeado, lo que dejaba pasar una mala configuración de producción
      // sin que nadie se diera cuenta (las queries de "admin" corrían con
      // permisos de anon, o directamente contra un backend inexistente).
      // Mejor romper fuerte y explícito acá.
      throw new Error(
        'Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. Configurálas en .env.local antes de usar el cliente de administración de Supabase.'
      );
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
