import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

interface CheckoutItem {
  ticketTypeId: string;
  quantity: number;
}

interface CheckoutBody {
  eventId: string;
  items: CheckoutItem[];
}

export async function POST(req: Request) {
  try {
    const body: CheckoutBody = await req.json();
    const { eventId, items } = body;

    const activeItems = items.filter((item) => item.quantity > 0);
    if (activeItems.length === 0) {
      return NextResponse.json(
        { error: 'No se seleccionaron entradas válidas' },
        { status: 400 }
      );
    }

    // 1. Consultamos los tipos de tickets seleccionados desde la base de datos
    const ticketIds = activeItems.map((i) => i.ticketTypeId);
    const { data: tickets, error: ticketError } = await supabaseAdmin
      .from('ticket_types')
      .select('*')
      .in('id', ticketIds)
      .eq('event_id', eventId);

    if (ticketError || !tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Error al consultar disponibilidad de tickets' },
        { status: 400 }
      );
    }

    // 2. Validamos disponibilidad de stock y calculamos montos reales en el servidor
    let subtotal = 0;
    let serviceFee = 0;

    for (const item of activeItems) {
      const ticket = tickets.find((t) => t.id === item.ticketTypeId);
      if (!ticket) {
        return NextResponse.json(
          { error: `Tipo de entrada no encontrado` },
          { status: 400 }
        );
      }

      if (ticket.available_quota < item.quantity) {
        return NextResponse.json(
          { error: `No hay stock suficiente para ${ticket.name}` },
          { status: 409 }
        );
      }

      subtotal += Number(ticket.price) * item.quantity;
      serviceFee += Number(ticket.service_fee) * item.quantity;
    }

    const total = subtotal + serviceFee;
    const orderNumber = `OASIS-${Date.now().toString(36).toUpperCase()}`;

    // 3. Obtenemos la organización del evento
    const organizationId = tickets[0].organization_id;

    // 4. Creamos la orden en estado PENDING con expiración en 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        organization_id: organizationId,
        event_id: eventId,
        order_number: orderNumber,
        order_type: 'TICKETING',
        status: 'PENDING',
        subtotal_amount: subtotal,
        discount_amount: 0,
        service_fee_amount: serviceFee,
        total_amount: total,
        currency: 'ARS',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'No se pudo crear la orden' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: total,
      expiresAt: order.expires_at,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error interno en el procesamiento' },
      { status: 500 }
    );
  }
}