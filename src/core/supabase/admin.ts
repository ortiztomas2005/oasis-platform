import { createClient } from '@supabase/supabase-js';

// Usar EXCLUSIVAMENTE en rutas de API seguras y Webhooks del servidor
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);