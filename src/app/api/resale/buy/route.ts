import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import crypto from 'crypto';
import { sendTicketConfirmationEmail } from '@/core/services/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { listingId, buyerName, buyerEmail, buyerDni } = await req.json();

    if (!listingId || !buyerName || !buyerEmail || !buyerDni) {
      return NextResponse.json({ error: 'Datos del comprador incompletos' }, { status: 400 });
    }

    // 1. Obtener publicación
    const { data: listing, error: lError } = await supabaseAdmin
      .from('resale_listings')
      .select('*, tickets(*), events(*)')
      .eq('id', listingId)
      .eq('status', 'LISTED')
      .single();

    if (lError || !listing) {
      return NextResponse.json({ error: 'La entrada ya no está disponible en reventa' }, { status: 404 });
    }

    const oldTicket = listing.tickets;

    // 2. Quemar el ticket anterior
    if (oldTicket?.id) {
      await supabaseAdmin
        .from('tickets')
        .update({
          status: 'RESOLD_BURNED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', oldTicket.id);
    }

    // 3. Generar nuevo hash único
    const newHash = 'OASIS-REV-' + crypto.randomBytes(6).toString('hex').toUpperCase();

    // 4. Emitir nuevo ticket para el comprador
    const { data: newTicket, error: newTicketError } = await supabaseAdmin
      .from('tickets')
      .insert([
        {
          event_id: listing.event_id,
          customer_name: buyerName,
          customer_email: buyerEmail,
          customer_dni: buyerDni,
          holder_name: buyerName,
          holder_email: buyerEmail,
          holder_dni: buyerDni,
          tier_name: listing.tier_name,
          auth_code: newHash,
          qr_hash: newHash,
          status: 'AVAILABLE',
          price_paid: listing.price,
        },
      ])
      .select()
      .single();

    if (newTicketError) throw newTicketError;

    // 5. Marcar publicación como vendida
    await supabaseAdmin
      .from('resale_listings')
      .update({ status: 'SOLD', updated_at: new Date().toISOString() })
      .eq('id', listing.id);

    // 6. Enviar confirmación por email
    try {
      await sendTicketConfirmationEmail({
        toEmail: buyerEmail,
        customerName: buyerName,
        customerDni: buyerDni,
        eventName: listing.events?.name || listing.events?.title || 'Evento Oficial OASIS',
        eventDate: listing.events?.date,
        eventVenue: listing.events?.venue,
        tierName: listing.tier_name,
        authCode: newHash,
      });
    } catch (mailErr) {
      console.error('Email error:', mailErr);
    }

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      authCode: newHash,
      message: 'Reventa completada exitosamente',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}