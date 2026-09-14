import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { createClient as createServerClient } from '@/core/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { ticket_id, resale_price, seller_cbu_alias } = await req.json();

    if (!ticket_id || !resale_price || !seller_cbu_alias) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 0. Antes cualquiera que supiera el UUID de un ticket ajeno podía
    // congelarlo y publicarlo en reventa a su propio alias, sin verificar
    // que fuera el dueño. Ahora hace falta sesión, y que el email de esa
    // sesión coincida con el titular del ticket.
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Iniciá sesión para publicar una entrada en reventa.' }, { status: 401 });
    }

    // 1. Obtener ticket original
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const ticketOwnerEmail = (ticket.holder_email || ticket.customer_email || '').toLowerCase();
    if (!ticketOwnerEmail || ticketOwnerEmail !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Esta entrada no pertenece a tu cuenta.' }, { status: 403 });
    }

    if (ticket.status !== 'VALID') {
      return NextResponse.json(
        { error: 'El ticket no está disponible para reventa o ya fue publicado' },
        { status: 400 }
      );
    }

    // 2. Congelar ticket original para que no pueda usarse en el acceso
    const { error: updateErr } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'FROZEN_RESALE' })
      .eq('id', ticket_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Extraer datos del vendedor tolerando distintas columnas
    const sellerEmail = ticket.holder_email || ticket.customer_email || 'oasis_user@oasis.com';
    const sellerName = ticket.holder_name || ticket.customer_name || 'Vendedor Oficial';

    // 3. Insertar en ticket_resales incluyendo seller_email
    const { data: resale, error: resaleErr } = await supabaseAdmin
      .from('ticket_resales')
      .insert({
        ticket_id,
        event_id: ticket.event_id,
        resale_price: Number(resale_price),
        original_price: Number(ticket.purchase_price) || 0,
        seller_cbu_alias,
        seller_name: sellerName,
        seller_email: sellerEmail,
        status: 'AVAILABLE',
      })
      .select()
      .single();

    if (resaleErr) {
      // Revertir estado si falla la publicación
      await supabaseAdmin.from('tickets').update({ status: 'VALID' }).eq('id', ticket_id);
      return NextResponse.json({ error: resaleErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, resale });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
