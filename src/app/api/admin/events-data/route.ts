import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: events, error: evError } = await supabaseAdmin
      .from('events')
      .select('*, ticket_tiers(*)')
      .order('created_at', { ascending: false });

    if (evError) throw evError;

    // Traer tandas respetando su orden de creación/inserción secuencial
    const { data: tiers, error: trError } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*')
      .order('created_at', { ascending: true });

    if (trError) throw trError;

    const { data: tickets, error: tkError } = await supabaseAdmin
      .from('tickets')
      .select('*, events(name, title, venue)')
      .order('created_at', { ascending: false });

    if (tkError) throw tkError;

    return NextResponse.json({
      events: events || [],
      tiers: tiers || [],
      tickets: tickets || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}