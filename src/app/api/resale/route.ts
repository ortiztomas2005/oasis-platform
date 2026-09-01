import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

// GET: Obtener publicaciones activas de reventa
export async function GET() {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('resale_listings')
      .select('*, events(*)')
      .eq('status', 'LISTED')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ listings: listings || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, listings: [] }, { status: 500 });
  }
}

// POST: Publicar una entrada para reventa
export async function POST(req: Request) {
  try {
    const { authCode, dni, email, price } = await req.json();

    if (!authCode || !dni || !email) {
      return NextResponse.json({ error: 'Faltan datos de autenticación del ticket' }, { status: 400 });
    }

    // 1. Buscar el ticket existente
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .or(`auth_code.eq.${authCode},qr_hash.eq.${authCode},id.eq.${authCode}`)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado con ese código' }, { status: 404 });
    }

    // 2. Validar que el DNI/Email coincidan
    const ticketDni = ticket.customer_dni || ticket.holder_dni;
    const ticketEmail = ticket.customer_email || ticket.holder_email;

    if (ticketDni !== dni || (ticketEmail && ticketEmail.toLowerCase() !== email.toLowerCase())) {
      return NextResponse.json({ error: 'El DNI o Email no coinciden con el titular de este ticket' }, { status: 403 });
    }

    // 3. Validar estado del ticket
    if (ticket.status !== 'AVAILABLE' && ticket.status !== 'VALID') {
      return NextResponse.json({ error: `El ticket no está disponible para reventa (Estado: ${ticket.status})` }, { status: 400 });
    }

    // 4. Crear la publicación de reventa
    const resalePrice = parseFloat(price) || ticket.price_paid || 15000;

    const { data: listing, error: listError } = await supabaseAdmin
      .from('resale_listings')
      .insert([
        {
          ticket_id: ticket.id,
          event_id: ticket.event_id,
          seller_email: email,
          seller_name: ticket.customer_name || ticket.holder_name || 'Titular',
          tier_name: ticket.tier_name || 'GENERAL',
          price: resalePrice,
          status: 'LISTED',
        },
      ])
      .select()
      .single();

    if (listError) throw listError;

    return NextResponse.json({ success: true, listing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
