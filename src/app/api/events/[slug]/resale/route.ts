import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Obtener el evento por slug
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // 2. Traer publicaciones activas con datos del ticket
    const { data: resales, error: resaleErr } = await supabaseAdmin
      .from('ticket_resales')
      .select('id, resale_price, platform_fee, seller_name, created_at, tickets(tier_name)')
      .eq('event_id', event.id)
      .eq('status', 'AVAILABLE')
      .order('created_at', { ascending: false });

    if (resaleErr) {
      return NextResponse.json({ error: resaleErr.message }, { status: 500 });
    }

    return NextResponse.json({ event, resales });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}