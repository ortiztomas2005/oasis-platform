import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    let query = supabaseAdmin
      .from('issued_tickets')
      .select('ticket_code, attendee_first_name, attendee_last_name, attendee_dni, status, is_courtesy, created_at, ticket_types(name)');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cabeceras del archivo CSV
    const headers = ['Apellido', 'Nombre', 'DNI', 'Tanda', 'Codigo Ticket', 'Tipo', 'Estado'];
    
    const rows = (tickets || []).map((t: any) => {
      const typeName = t.ticket_types?.name || 'General';
      const ticketType = t.is_courtesy ? 'CORTESIA' : 'VENTA';
      const statusLabel = t.status === 'USED' ? 'INGRESADO' : 'VALIDO';

      return [
        `"${t.attendee_last_name || ''}"`,
        `"${t.attendee_first_name || ''}"`,
        `"${t.attendee_dni || ''}"`,
        `"${typeName}"`,
        `"${t.ticket_code || ''}"`,
        `"${ticketType}"`,
        `"${statusLabel}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="asistentes-oasis-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}