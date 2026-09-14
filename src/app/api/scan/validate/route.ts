import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { requireAdminSession } from '@/core/auth/admin-session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const { code, eventId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Código o DNI no proporcionado' }, { status: 400 });
    }

    const cleanCode = String(code).trim();

    // El código/DNI se interpola crudo en un filtro .or() de PostgREST: sin
    // esta validación, un valor con comas/paréntesis puede inyectar
    // condiciones extra en el filtro. Solo se admiten los caracteres que un
    // auth_code, qr_hash, UUID o DNI legítimo puede tener.
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanCode)) {
      return NextResponse.json({
        valid: false,
        status: 'INVALID',
        message: 'Código con formato inválido.',
      });
    }

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
      // La tabla "tickets" no tiene una columna para guardar cuándo se
      // escaneó, así que no hay forma de reportar esa fecha acá.
      return NextResponse.json({
        valid: false,
        status: 'ALREADY_USED',
        ticket,
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

    // 3. Quemar ticket para marcar INGRESO VÁLIDO. "tickets" no tiene
    // columnas scanned_at ni updated_at (ver supabase/migrations si en
    // algún momento se quiere agregar un registro real de cuándo se
    // escaneó cada entrada) — hoy solo se puede persistir el status.
    const now = new Date().toISOString();
    await supabaseAdmin.from('tickets').update({ status: 'USED' }).eq('id', ticket.id);

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
