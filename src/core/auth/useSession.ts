'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/core/supabase/client';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  dni: string;
}

function mapUser(u: User | null | undefined): SessionUser | null {
  if (!u) return null;
  return {
    id: u.id,
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Usuario',
    email: u.email || '',
    dni: u.user_metadata?.dni || '',
  };
}

/**
 * Única fuente de verdad de "quién está logueado" en toda la app, sobre la
 * sesión real de Supabase Auth. Reemplaza los distintos getActiveSession()
 * copiados y pegados por página que leían localStorage directo (una prueba
 * de que el "login" era 100% del lado del cliente, sin nada real detrás).
 */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // getSession() lee la sesión ya guardada en el browser sin red; getUser()
    // en cambio siempre pega contra el servidor de Auth para revalidar el
    // token, lo cual suma una ida y vuelta de red completa en cada carga de
    // página solo para saber "quién sos" en la UI. Esta pantalla no usa el
    // resultado para autorizar nada sensible — eso lo sigue verificando cada
    // ruta /api server-side con su propio getUser() — así que acá alcanza
    // con la versión rápida y local.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(mapUser(data.session?.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(mapUser(session?.user));
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, isAuthenticated: !!user, loading };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
