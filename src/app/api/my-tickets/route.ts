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

    // Avisos reales de las productoras de los eventos a los que este
    // usuario tiene entrada — un aviso puede apuntar a un evento puntual
    // (event_id) o a "todos los eventos" de esa productora (event_id null).
    // Antes esto se armaba en /admin/broadcast pero nunca llegaba a
    // mostrarse en ningún lado que un asistente pudiera ver.
    //
    // Se hacen dos consultas con .in() (en vez de armar un .or() a mano con
    // el nombre de la productora, que es texto libre que el producer eligió
    // al registrarse) para no repetir el mismo riesgo de inyección de
    // filtro que ya se evitó en otras rutas — .in() no tiene ese problema
    // porque el array lo arma el cliente de Supabase, no un string crudo.
    let alerts: any[] = [];
    const eventIds = Array.from(new Set((tickets || []).map((t: any) => t.event_id).filter(Boolean)));
    const producerNames = Array.from(
      new Set((tickets || []).map((t: any) => t.events?.producer_name).filter(Boolean))
    );

    const [byEvent, byProducer] = await Promise.all([
      eventIds.length > 0
        ? supabaseAdmin
            .from('broadcast_alerts')
            .select('id, producer_name, event_id, title, message, created_at')
            .in('event_id', eventIds)
        : Promise.resolve({ data: [] as any[] }),
      producerNames.length > 0
        ? supabaseAdmin
            .from('broadcast_alerts')
            .select('id, producer_name, event_id, title, message, created_at')
            .is('event_id', null)
            .in('producer_name', producerNames)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    alerts = [...(byEvent.data || []), ...(byProducer.data || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
      },
      tickets: tickets || [],
      alerts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
