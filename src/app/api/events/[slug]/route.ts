import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

// Ruta pública que le faltaba a /events/[slug]: esa página mostraba una
// lista de eventos hardcodeados en el código (DEFAULT_EVENTS) en vez de
// consultar la base real — cualquiera que entrara ahí veía datos de mentira
// sin importar qué evento se haya creado de verdad desde /admin.
const PUBLIC_EVENT_STATUSES = ['PUBLISHED', 'ACTIVE'];

export async function GET(req: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const params = await context.params;
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq(isUuid ? 'id' : 'slug', slug)
      .maybeSingle();

    // No dejamos comprar (ni ver) un evento que no esté publicado, aunque
    // alguien adivine o filtre el slug/id directo.
    if (eventError || !event || !PUBLIC_EVENT_STATUSES.includes(event.status)) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const { data: tiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*')
      .eq('event_id', event.id)
      .order('price', { ascending: true });

    return NextResponse.json({ event, tiers: tiers || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
