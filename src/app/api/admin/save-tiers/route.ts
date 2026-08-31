import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { eventId, tiers } = await req.json();

    if (!eventId || !Array.isArray(tiers)) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Eliminar tandas previas del evento
    await supabaseAdmin
      .from('ticket_tiers')
      .delete()
      .eq('event_id', eventId);

    // 2. Insertar solo los campos nativos de la tabla ticket_tiers
    const rows = tiers.map((t: any) => ({
      event_id: eventId,
      name: t.name.trim(),
      price: Number(t.price),
      total_capacity: Number(t.capacity || t.total_capacity || 100),
      status: t.status || (t.visible === false ? 'PAUSED' : t.isSoldOut ? 'SOLD_OUT' : 'ACTIVE'),
    }));

    const { data, error } = await supabaseAdmin
      .from('ticket_tiers')
      .insert(rows)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, tiers: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}