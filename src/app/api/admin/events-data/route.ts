import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Obtener todos los eventos ordenados por fecha de creación
    const { data: events, error: evError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (evError) throw evError;

    // 2. Obtener todas las tandas
    const { data: tiers, error: tierError } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*');

    if (tierError) throw tierError;

    // 3. Obtener tickets emitidos
    const { data: tickets, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*, events(name, title)');

    if (ticketError) {
      console.warn('Advertencia al traer tickets:', ticketError.message);
    }

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
    console.error('Error events-data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}