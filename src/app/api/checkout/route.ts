import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { randomBytes, createHash } from 'crypto';
import { requireAdminSession } from '@/core/auth/admin-session';

export const dynamic = 'force-dynamic';

// Esta ruta emite un ticket "VALID" directo a la base de datos usando el
// precio que manda el propio request, sin pasar por ninguna pasarela de
// pago. Ningún flujo del sitio la llama hoy (la compra real usa
// /api/checkout/transfer, /api/checkout/mercadopago o /api/checkout/astropay),
// pero seguía expuesta y cualquiera podía generar entradas gratis con ella.
// La dejamos como herramienta manual de staff detrás del login de admin en
// vez de borrarla, por si se usa para altas manuales.
export async function POST(req: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();

    // Normalizar nombres de campos para que acepte cualquier formato
    const rawName = body.customer_name || body.holder_name || `${body.name || ''} ${body.lastName || ''}`.trim() || 'Asistente Live Experience';
    const rawEmail = body.customer_email || body.holder_email || body.email;
    const rawDni = body.customer_dni || body.holder_dni || body.dni;
    const tierName = body.tier_name || body.tier || 'GENERAL';
    const price = Number(body.unit_price || body.price || 15000);

    if (!rawEmail || !rawDni) {
      return NextResponse.json(
        { error: 'Por favor completá Email y DNI' },
        { status: 400 }
      );
    }

    // Resolver event_id si no vino en el body
    let eventId = body.event_id || body.eventId;
    if (!eventId) {
      const { data: firstEvent } = await supabaseAdmin.from('events').select('id').limit(1).single();
      eventId = firstEvent?.id;
    }

    // Generar hash criptográfico único
    const entropy = randomBytes(16).toString('hex');
    const qr_hash = createHash('sha256')
      .update(`${eventId}-${rawDni}-${Date.now()}-${entropy}`)
      .digest('hex');

    // Insertar ticket
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from('tickets')
      .insert({
        event_id: eventId,
        holder_name: rawName,
        holder_email: rawEmail,
        holder_dni: String(rawDni),
        tier_name: tierName,
        purchase_price: price,
        qr_hash: qr_hash,
        status: 'VALID',
      })
      .select()
      .single();

    if (ticketErr) {
      return NextResponse.json({ error: ticketErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticket_code: ticket.qr_hash,
      init_point: `/ticket/${ticket.qr_hash}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
