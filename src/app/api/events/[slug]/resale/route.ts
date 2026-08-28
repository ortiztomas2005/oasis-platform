import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const params = await context.params;
    const slug = params.slug;

    // 1. Buscar el evento por slug o ID
    let query = supabaseAdmin.from('events').select('*');
    if (slug.includes('-')) {
      query = query.eq('slug', slug);
    } else {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    }

    const { data: event, error: eventError } = await query.single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // 2. Buscar tandas activas del evento
    const { data: tiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*')
      .eq('event_id', event.id)
      .order('price', { ascending: true });

    return NextResponse.json({
      event,
      tiers: tiers || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}