import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { preference as platformPreference } from '@/core/mercadopago';
import { getPreferenceClientForProducer } from '@/core/services/mercadopago-connect';
import { checkRateLimit, getClientIp } from '@/core/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`checkout:${ip}`, { limit: 15, windowSeconds: 300 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos de compra. Esperá unos minutos.' }, { status: 429 });
    }

    const { eventId, ticketTier, customerName, customerEmail, customerDni, userId } = await req.json();

    if (!eventId || !ticketTier || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // El precio se resuelve acá, contra la tanda real — antes se tomaba
    // "amount" tal cual lo mandaba el cliente, así que cualquiera podía
    // armar el request a mano y pedir un link de pago por $1 (o $0) para
    // una entrada de cualquier precio; Mercado Pago de verdad cobraba eso,
    // y el webhook emitía el ticket igual porque el pago "aprobado" era
    // legítimo para ese monto manipulado.
    const { data: tier } = await supabaseAdmin
      .from('ticket_tiers')
      .select('price, available_capacity')
      .eq('event_id', eventId)
      .eq('name', ticketTier)
      .maybeSingle();

    if (!tier) {
      return NextResponse.json({ error: 'La tanda seleccionada no existe para este evento.' }, { status: 400 });
    }
    if (tier.available_capacity !== undefined && tier.available_capacity !== null && tier.available_capacity <= 0) {
      return NextResponse.json({ error: 'Esa tanda ya está agotada.' }, { status: 400 });
    }
    const amount = Number(tier.price);

    const referenceCode = `MP-${Math.floor(100000 + Math.random() * 900000)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 1. Guardar la orden en base de datos
    await supabaseAdmin.from('orders').insert([
      {
        event_id: eventId,
        user_id: userId || null,
        ticket_tier: ticketTier,
        amount,
        payment_method: 'MERCADOPAGO',
        status: 'PENDING',
        customer_name: customerName,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_dni: customerDni.trim(),
        reference_code: referenceCode,
      },
    ]);

    // 2. Resolver con qué cuenta de Mercado Pago cobrar. Si el evento es de
    // una productora que conectó su cuenta (ver /admin/mercadopago), el
    // cobro se crea con SU token — el dinero le entra directo a ella, no
    // pasa por Live Experience. Si el evento no tiene productora asignada, se usa el
    // token de plataforma (MP_ACCESS_TOKEN) como respaldo.
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('producer_name')
      .eq('id', eventId)
      .maybeSingle();

    let preferenceClient: typeof platformPreference | null = null;

    if (event?.producer_name) {
      preferenceClient = await getPreferenceClientForProducer(event.producer_name);
      if (!preferenceClient) {
        return NextResponse.json(
          {
            error:
              'La productora de este evento todavía no conectó su Mercado Pago. Probá con otro método de pago.',
          },
          { status: 400 }
        );
      }
    } else if (process.env.MP_ACCESS_TOKEN) {
      preferenceClient = platformPreference;
    }

    if (preferenceClient) {
      const response = await preferenceClient.create({
        body: {
          items: [
            {
              id: `${eventId}-${ticketTier}`,
              title: `Entrada: ${ticketTier}`,
              quantity: 1,
              unit_price: Number(amount),
              currency_id: 'ARS',
            },
          ],
          payer: {
            name: customerName,
            email: customerEmail,
          },
          metadata: {
            order_reference: referenceCode,
            event_id: eventId,
            user_id: userId,
          },
          back_urls: {
            success: `${baseUrl}/my-tickets?status=success`,
            failure: `${baseUrl}/events`,
            pending: `${baseUrl}/my-tickets`,
          },
          auto_return: 'approved',
        },
      });

      return NextResponse.json({
        success: true,
        redirectUrl: response.init_point || response.sandbox_init_point,
      });
    }

    // Modo simulación local (ni la productora ni la plataforma tienen MP configurado)
    return NextResponse.json({
      success: true,
      simulation: true,
      referenceCode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
