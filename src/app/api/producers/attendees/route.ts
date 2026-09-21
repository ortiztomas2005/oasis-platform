import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// CRM de asistentes: lista los tickets emitidos para LOS EVENTOS DE MI
// PRODUCTORA, para poder buscar/filtrar quién compró qué. Reemplaza la
// sección local "CRM de Asistentes" de /admin (que leía de localStorage).
export async function GET(req: Request) {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN', 'DOOR']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');

  let query = supabaseAdmin
    .from('tickets')
    .select('id, event_id, tier_name, holder_name, holder_email, holder_dni, purchase_price, status, created_at, scanned_at, events!inner(name, title, producer_name)')
    .eq('events.producer_name', producerName)
    .order('created_at', { ascending: false });

  if (eventId) query = query.eq('event_id', eventId);

  const { data: tickets, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: tickets || [], producerName });
}
