import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Obtener eventos
    const { data: events, error: evError } = await supabaseAdmin
      .from('events')
      .select('*');

    if (evError) {
      console.error('Error fetching events:', evError.message);
      return NextResponse.json({ events: [], tiers: [], tickets: [], error: evError.message }, { status: 200 });
    }

    // 2. Obtener tandas
    const { data: tiers, error: tierError } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*');

    if (tierError) {
      console.warn('Error fetching tiers:', tierError.message);
    }

    // 3. Obtener tickets sin joins complejos para evitar error 500
    let tickets: any[] = [];
    try {
      const { data: rawTickets } = await supabaseAdmin
        .from('tickets')
        .select('*');
      tickets = rawTickets || [];
    } catch (_) {}

    return NextResponse.json(
      {
        events: events || [],
        tiers: tiers || [],
        tickets: tickets || [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error general events-data:', error);
    return NextResponse.json({ events: [], tiers: [], tickets: [], error: error.message }, { status: 200 });
  }
}