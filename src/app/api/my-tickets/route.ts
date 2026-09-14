import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // 1. Obtener usuario de la sesión activa
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, tickets: [] }, { status: 401 });
    }

    // 2. Buscar tickets vinculados a este user_id o a su email.
    // user.id/email vienen de una sesión de Supabase ya autenticada, pero
    // igual se valida antes de interpolarlos en el filtro .or() de
    // PostgREST — una coma o paréntesis ahí inyectaría condiciones extra.
    const email = (user.email || '').toLowerCase();
    if (/[,()]/.test(user.id) || /[,()]/.test(email)) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
    }

    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .or(`user_id.eq.${user.id},customer_email.eq.${email}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
      },
      tickets: tickets || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
