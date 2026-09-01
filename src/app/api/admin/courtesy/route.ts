import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { randomBytes, createHash } from 'crypto';

export async function POST(req: Request) {
  try {
    const { eventId, ticketTypeId, firstName, lastName, dni } = await req.json();

    if (!eventId || !ticketTypeId || !firstName || !lastName || !dni) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // 1. Obtener Organización y Usuario admin de respaldo
    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : '00000000-0000-0000-0000-000000000001';

    const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
    const fallbackUserId = users && users.length > 0 ? users[0].id : null;

    const { data: ticketType } = await supabaseAdmin
      .from('ticket_types')
      .select('name')
      .eq('id', ticketTypeId)
      .single();

    const itemTitle = ticketType?.name || 'Cortesía VIP';
    const orderNumber = `FREE-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // 2. Insertar en orders
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        organization_id: organizationId,
        user_id: fallbackUserId,
        event_id: eventId,
        order_number: orderNumber,
        order_type: 'TICKETING',
        status: 'PAID',
        subtotal_amount: 0,
        discount_amount: 0,
        service_fee_amount: 0,
        total_amount: 0,
        currency: 'ARS',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 3. Insertar en order_items
    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        organization_id: organizationId,
        order_id: order.id,
        item_type: 'TICKET',
        ticket_type_id: ticketTypeId,
        item_title_snapshot: itemTitle,
        unit_price_snapshot: 0,
        unit_fee_snapshot: 0,
        quantity: 1,
        total_line_amount: 0,
      })
      .select()
      .single();

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    // 4. Generar Ticket y qr_hash
    const ticketCode = `OASIS-${randomBytes(4).toString('hex').toUpperCase()}`;
    const qrRaw = `${ticketCode}:${eventId}:${dni}:FREE`;
    const qrHash = createHash('sha256').update(qrRaw).digest('hex');

    // 5. Insertar en issued_tickets
    const ticketPayload: any = {
      organization_id: organizationId,
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      order_id: order.id,
      order_item_id: orderItem.id,
      ticket_code: ticketCode,
      qr_hash: qrHash,
      attendee_first_name: firstName,
      attendee_last_name: lastName,
      attendee_dni: dni,
      is_courtesy: true,
      status: 'ISSUED',
    };

    if (fallbackUserId) {
      ticketPayload.owner_user_id = fallbackUserId;
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('issued_tickets')
      .insert(ticketPayload)
      .select()
      .single();

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
