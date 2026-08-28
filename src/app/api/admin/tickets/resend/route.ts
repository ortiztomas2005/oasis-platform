import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { sendTicketConfirmationEmail } from '@/core/services/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { ticketId } = await req.json();

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const email = ticket.customer_email || ticket.holder_email;
    const name = ticket.customer_name || ticket.holder_name || 'Asistente';
    const dni = ticket.customer_dni || ticket.holder_dni || '-';
    const hash = ticket.auth_code || ticket.qr_hash || ticket.id;

    if (!email) {
      return NextResponse.json({ error: 'El ticket no tiene un email registrado' }, { status: 400 });
    }

    const emailRes = await sendTicketConfirmationEmail({
      toEmail: email,
      customerName: name,
      customerDni: dni,
      eventName: ticket.events?.name || 'Evento Oficial OASIS',
      eventDate: ticket.events?.date,
      eventVenue: ticket.events?.venue,
      tierName: ticket.tier_name || 'GENERAL',
      authCode: hash,
    });

    if (!emailRes.success) {
      return NextResponse.json({ error: 'Error enviando el correo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Ticket reenviado con éxito a ${email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}