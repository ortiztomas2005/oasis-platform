import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, ticketTypeId, quantity, attendee } = body;

    if (!eventId || !ticketTypeId || !attendee?.firstName || !attendee?.lastName || !attendee?.dni) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const qty = quantity || 1;

    // 1. Obtener datos de la tanda
    const { data: tier, error: tierError } = await supabaseAdmin
      .from('ticket_types')
      .select('*, events(organization_id)')
      .eq('id', ticketTypeId)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Tanda de tickets no encontrada' }, { status: 404 });
    }

    if (tier.available_quota < qty) {
      return NextResponse.json({ error: 'No hay cupo suficiente disponible' }, { status: 400 });
    }

    const orgId = tier.events?.organization_id || tier.organization_id;
    const unitPrice = Number(tier.price || 0);
    const unitFee = Number(tier.service_fee || 0);
    const totalAmount = (unitPrice + unitFee) * qty;
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Crear Orden en DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        organization_id: orgId,
        event_id: eventId,
        order_number: orderNumber,
        order_type: 'TICKETING',
        status: 'PAID',
        subtotal_amount: unitPrice * qty,
        discount_amount: 0,
        service_fee_amount: unitFee * qty,
        total_amount: totalAmount,
        currency: 'ARS',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: 'Error al crear orden: ' + orderError.message }, { status: 500 });
    }

    // 3. Crear Ítem de la Orden (Order Item)
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        organization_id: orgId,
        order_id: order.id,
        item_type: 'TICKET',
        ticket_type_id: ticketTypeId,
        item_title_snapshot: tier.name,
        unit_price_snapshot: unitPrice,
        unit_fee_snapshot: unitFee,
        quantity: qty,
        total_line_amount: totalAmount,
      })
      .select()
      .single();

    if (orderItemError) {
      return NextResponse.json({ error: 'Error al registrar ítem de orden: ' + orderItemError.message }, { status: 500 });
    }

    // 4. Generar Ticket con hashes y vincular a order_item_id
    const uniqueHash = crypto.randomBytes(4).toString('hex').toUpperCase();
    const ticketCode = `OASIS-${uniqueHash}`;
    const qrHash = crypto.createHash('sha256').update(ticketCode + (process.env.NEXT_PUBLIC_SUPABASE_URL || 'oasis-salt')).digest('hex');

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('issued_tickets')
      .insert({
        organization_id: orgId,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        order_id: order.id,
        order_item_id: orderItem.id,
        ticket_code: ticketCode,
        qr_hash: qrHash,
        attendee_first_name: attendee.firstName.trim(),
        attendee_last_name: attendee.lastName.trim(),
        attendee_dni: attendee.dni.trim(),
        status: 'ISSUED',
        is_courtesy: false,
      })
      .select()
      .single();

    if (ticketError) {
      return NextResponse.json({ error: 'Error al emitir ticket: ' + ticketError.message }, { status: 500 });
    }

    // 5. Descontar cupo
    await supabaseAdmin
      .from('ticket_types')
      .update({ available_quota: tier.available_quota - qty })
      .eq('id', tier.id);

    return NextResponse.json({
      success: true,
      ticketCode: ticket.ticket_code,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}