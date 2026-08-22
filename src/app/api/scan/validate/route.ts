import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawValue = body.rawValue || body.ticketCode || body.qrPayload || body.id || body.code;

    if (!rawValue) {
      return NextResponse.json({ success: false, error: 'Código o DNI requerido' }, { status: 400 });
    }

    const cleanInput = String(rawValue).trim();

    // Buscar en issued_tickets
    const { data: tickets, error } = await supabaseAdmin
      .from('issued_tickets')
      .select('*, ticket_types(name)')
      .or(`ticket_code.eq.${cleanInput},qr_hash.eq.${cleanInput},attendee_dni.eq.${cleanInput}`)
      .limit(1);

    if (error || !tickets || tickets.length === 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          status: 'NOT_FOUND',
          message: 'Pase no encontrado',
        },
        { status: 404 }
      );
    }

    const ticket = tickets[0];
    const ticketTypeName = ticket.ticket_types?.name || 'General';

    // Si ya fue utilizado
    if (ticket.status === 'USED') {
      return NextResponse.json({
        success: false,
        valid: false,
        status: 'ALREADY_USED',
        message: '¡PASE YA INGRESADO ANTERIORMENTE!',
        attendee: {
          name: `${ticket.attendee_first_name} ${ticket.attendee_last_name}`,
          dni: ticket.attendee_dni,
          tier: ticketTypeName,
          usedAt: ticket.updated_at,
        },
      });
    }

    // Si no está en estado ISSUED
    if (ticket.status !== 'ISSUED') {
      return NextResponse.json({
        success: false,
        valid: false,
        status: 'INVALID_STATUS',
        message: `Estado inválido: ${ticket.status}`,
      });
    }

    // Marcar como USED
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('issued_tickets')
      .update({
        status: 'USED',
        updated_at: now,
      })
      .eq('id', ticket.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      status: 'APPROVED',
      message: 'ACCESO AUTORIZADO',
      ticket: {
        id: ticket.id,
        code: ticket.ticket_code,
        name: `${ticket.attendee_first_name} ${ticket.attendee_last_name}`,
        dni: ticket.attendee_dni,
        type: ticketTypeName,
        isCourtesy: ticket.is_courtesy,
      },
      attendee: {
        name: `${ticket.attendee_first_name} ${ticket.attendee_last_name}`,
        dni: ticket.attendee_dni,
        tier: ticketTypeName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}