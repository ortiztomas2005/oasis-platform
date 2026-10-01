import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { canManageEvent } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Configuración de stock de una tanda puntual: marcarla agotada a mano,
// mostrar/ocultar el stock restante al público, y a partir de cuántos
// lugares avisar "quedan pocos". Todo esto vive en ticket_tiers (ver
// migración 007), no hay tabla nueva.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;

    const access = await canManageEvent(eventId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const { tierId, status, showStockToClients, lowStockThreshold, description, entryCutoffTime } = await req.json();
    if (!tierId) return NextResponse.json({ error: 'Falta el id de la tanda' }, { status: 400 });

    const { data: tier } = await supabaseAdmin.from('ticket_tiers').select('event_id').eq('id', tierId).maybeSingle();
    if (!tier || tier.event_id !== eventId) {
      return NextResponse.json({ error: 'Tanda no encontrada en este evento' }, { status: 404 });
    }

    const update: Record<string, any> = {};
    if (status !== undefined) {
      if (!['ACTIVE', 'SOLD_OUT', 'PAUSED'].includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
      }
      update.status = status;
    }
    if (showStockToClients !== undefined) update.show_stock_to_clients = !!showStockToClients;
    if (lowStockThreshold !== undefined) update.low_stock_threshold = Math.max(0, Number(lowStockThreshold) || 0);
    if (description !== undefined) update.description = String(description).trim() || null;
    if (entryCutoffTime !== undefined) update.entry_cutoff_time = String(entryCutoffTime).trim() || null;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('ticket_tiers').update(update).eq('id', tierId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, tier: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Agrega una tanda nueva a un evento que ya existe (antes solo se podían
// cargar tandas al momento de crear el evento — si después necesitabas
// sumar una, no había forma de hacerlo sin tocar la base a mano).
export async function POST(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;

    const access = await canManageEvent(eventId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json();
    const name = String(body.name || '').trim();
    const price = Number(body.price) || 0;
    const capacity = Number(body.capacity) || 0;

    if (!name) return NextResponse.json({ error: 'Falta el nombre de la tanda' }, { status: 400 });
    if (price < 0) return NextResponse.json({ error: 'El precio no puede ser negativo' }, { status: 400 });
    if (capacity <= 0) return NextResponse.json({ error: 'La capacidad tiene que ser mayor a 0' }, { status: 400 });

    // El checkout busca la tanda por nombre (no por id) dentro de un mismo
    // evento, así que dos tandas con el mismo nombre rompen esa búsqueda
    // (quedaba ambigua y el pago fallaba con "la tanda no existe"). Se
    // valida acá en vez de solo confiar en que nadie repita un nombre.
    const { data: existing } = await supabaseAdmin
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', eventId)
      .ilike('name', name);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: `Ya existe una tanda llamada "${name}" en este evento. Usá otro nombre.` }, { status: 400 });
    }

    const { data: tier, error } = await supabaseAdmin
      .from('ticket_tiers')
      .insert({
        event_id: eventId,
        name,
        price,
        total_capacity: capacity,
        available_capacity: capacity,
        capacity,
        status: 'ACTIVE',
        show_stock_to_clients: body.showStockToClients !== false,
        low_stock_threshold: Math.max(0, Number(body.lowStockThreshold) || 10),
        description: String(body.description || '').trim() || null,
        entry_cutoff_time: String(body.entryCutoffTime || '').trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, tier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Saca una tanda, pero solo si nunca se vendió nada de ella (available_capacity
// todavía es igual a la capacidad total) — si ya tiene ventas reales, borrar
// la fila dejaría esos tickets sin ninguna tanda a la que pertenecer.
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;

    const access = await canManageEvent(eventId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const { tierId } = await req.json();
    if (!tierId) return NextResponse.json({ error: 'Falta el id de la tanda' }, { status: 400 });

    const { data: tier } = await supabaseAdmin
      .from('ticket_tiers')
      .select('event_id, available_capacity, total_capacity')
      .eq('id', tierId)
      .maybeSingle();

    if (!tier || tier.event_id !== eventId) {
      return NextResponse.json({ error: 'Tanda no encontrada en este evento' }, { status: 404 });
    }
    if (tier.available_capacity !== tier.total_capacity) {
      return NextResponse.json(
        { error: 'Esta tanda ya tiene ventas — no se puede eliminar. Marcala como agotada si querés dejar de venderla.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('ticket_tiers').delete().eq('id', tierId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
