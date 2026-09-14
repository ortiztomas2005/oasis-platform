import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Endpoint público (lo consume la cartelera en /events): solo debe devolver
// datos de eventos y tandas, nunca filas de "tickets" — esa tabla trae
// nombre/DNI/email/precio pagado de cada comprador y no debe exponerse sin
// autenticación. Si en algún momento hace falta info de tickets acá, tiene
// que salir de una ruta protegida por requireAdminSession, no de esta.
export async function GET() {
  try {
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: tiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*');

    return NextResponse.json({
      events: events || [],
      tiers: tiers || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      events: [],
      tiers: [],
    });
  }
}
