import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const ticketId = params.id;

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Respuesta JSON estructurada para compatibilidad con pases digitales
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        eventName: ticket.events?.name || ticket.events?.title || 'OASIS Event',
        attendee: ticket.customer_name || ticket.holder_name,
        dni: ticket.customer_dni || ticket.holder_dni,
        tier: ticket.tier_name,
        authCode: ticket.auth_code || ticket.qr_hash,
        date: ticket.events?.date,
        venue: ticket.events?.venue,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}