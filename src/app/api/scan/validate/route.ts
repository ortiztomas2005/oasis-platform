import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { code, eventId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Código o DNI no proporcionado' }, { status: 400 });
    }

    const cleanCode = code.trim();

    // 1. Buscar el ticket por auth_code, qr_hash, id o DNI
    let query = supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .or(`auth_code.eq.${cleanCode},qr_hash.eq.${cleanCode},id.eq.${cleanCode},customer_dni.eq.${cleanCode},holder_dni.eq.${cleanCode}`);

    if (eventId && eventId !== 'ALL') {
      query = query.eq('event_id', eventId);
    }

    const { data: tickets, error: findError } = await query;

    if (findError || !tickets || tickets.length === 0) {
      return NextResponse.json({
        valid: false,
        status: 'INVALID',
        message: 'Credencial no encontrada en la base de datos.',
      });
    }

    const ticket = tickets[0];

    // 2. Evaluar estado
    if (ticket.status === 'RESOLD_BURNED') {
      return NextResponse.json({
        valid: false,
        status: 'RESOLD_BURNED',
        ticket,
        message: '¡ACCESO RECHAZADO! Esta entrada fue revendida y su código QR fue anulado.',
      });
    }

    if (ticket.status === 'USED') {
      return NextResponse.json({
        valid: false,
        status: 'ALREADY_USED',
        ticket,
        scannedAt: ticket.scanned_at || ticket.updated_at,
        message: '¡ALERTA! Esta entrada ya fue utilizada para ingresar.',
      });
    }

    if (ticket.status !== 'AVAILABLE' && ticket.status !== 'VALID') {
      return NextResponse.json({
        valid: false,
        status: ticket.status,
        ticket,
        message: `Estado no habilitado: ${ticket.status}`,
      });
    }

    // 3. Quemar ticket para marcar INGRESO VÁLIDO
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('tickets')
      .update({
        status: 'USED',
        scanned_at: now,
        updated_at: now,
      })
      .eq('id', ticket.id);

    return NextResponse.json({
      valid: true,
      status: 'APPROVED',
      ticket: { ...ticket, status: 'USED' },
      scannedAt: now,
      message: 'ACCESO AUTORIZADO - Bienvenido a OASIS.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
