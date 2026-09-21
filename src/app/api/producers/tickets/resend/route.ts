import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { sendTicketConfirmationEmail } from '@/core/services/email';
import { canManageEvent } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Reenvía el pase real (mismo email con el QR que ya se manda al comprar)
// de un ticket de MI productora. Reemplaza la sección local "Pases PDF &
// App (APK)" de /admin, que mandaba un email de prueba con datos
// inventados a través de formsubmit.co.
export async function POST(req: Request) {
  try {
    const { ticketId } = await req.json();
    if (!ticketId) return NextResponse.json({ error: 'Falta el ticket' }, { status: 400 });

    const { data: ticket, error } = await supabaseAdmin.from('tickets').select('*, events(*)').eq('id', ticketId).single();
    if (error || !ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

    const access = await canManageEvent(ticket.event_id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const email = ticket.customer_email || ticket.holder_email;
    const name = ticket.customer_name || ticket.holder_name || 'Asistente';
    const dni = ticket.customer_dni || ticket.holder_dni || '-';
    const hash = ticket.auth_code || ticket.qr_hash || ticket.id;

    if (!email) return NextResponse.json({ error: 'El ticket no tiene un email registrado' }, { status: 400 });

    const emailRes = await sendTicketConfirmationEmail({
      toEmail: email,
      customerName: name,
      customerDni: dni,
      eventName: ticket.events?.name || ticket.events?.title || 'Evento',
      eventDate: ticket.events?.date,
      eventVenue: ticket.events?.venue,
      tierName: ticket.tier_name || 'GENERAL',
      authCode: hash,
    });

    if (!emailRes.success) return NextResponse.json({ error: 'Error enviando el correo' }, { status: 500 });
    return NextResponse.json({ success: true, message: `Pase reenviado a ${email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
