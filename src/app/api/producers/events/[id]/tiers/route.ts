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
