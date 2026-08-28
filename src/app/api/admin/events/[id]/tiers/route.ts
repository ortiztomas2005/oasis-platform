import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

// GET: Obtener tandas del evento
export async function GET(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;

    if (!eventId || eventId === 'ALL') {
      return NextResponse.json({ tiers: [] });
    }

    const { data: tiers, error } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*')
      .eq('event_id', eventId)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error supabase ticket_tiers:', error);
      return NextResponse.json({ tiers: [] });
    }

    return NextResponse.json({ tiers: tiers || [] });
  } catch (err: any) {
    return NextResponse.json({ tiers: [], error: err.message }, { status: 500 });
  }
}

// POST: Crear nueva tanda para el evento
export async function POST(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const body = await req.json();
    const { name, price, total_capacity } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nombre y precio requeridos' }, { status: 400 });
    }

    const cap = parseInt(total_capacity) || 100;
    const numPrice = parseFloat(price) || 0;

    const { data: newTier, error } = await supabaseAdmin
      .from('ticket_tiers')
      .insert([
        {
          event_id: eventId,
          name: name.trim().toUpperCase(),
          price: numPrice,
          total_capacity: cap,
          available_capacity: cap,
          capacity: cap,
          status: 'ACTIVE',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, tier: newTier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Actualizar tanda o datos del evento
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const body = await req.json();
    const { tierId, price, total_capacity, status, updateEventDetails } = body;

    if (updateEventDetails) {
      const { venue, capacity, cbu_alias } = updateEventDetails;
      await supabaseAdmin
        .from('events')
        .update({
          venue,
          venue_name: venue,
          capacity: parseInt(capacity) || 1000,
          cbu_alias,
        })
        .eq('id', eventId);

      return NextResponse.json({ success: true });
    }

    if (tierId) {
      const updateData: any = {};
      if (price !== undefined) updateData.price = parseFloat(price);
      if (total_capacity !== undefined) {
        const cap = parseInt(total_capacity);
        updateData.total_capacity = cap;
        updateData.capacity = cap;
      }
      if (status) updateData.status = status;

      await supabaseAdmin
        .from('ticket_tiers')
        .update(updateData)
        .eq('id', tierId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}