import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, canManageEvent } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Avisos de UNA productora a los compradores de sus eventos. Reemplaza la
// sección local "Broadcast & Alertas" de /admin (que solo guardaba en
// localStorage y nunca le llegaba nada a nadie).
export async function GET() {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: alerts, error } = await supabaseAdmin
    .from('broadcast_alerts')
    .select('*, events(name, title)')
    .eq('producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: alerts || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { event_id, title, message } = await req.json();
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Faltan el título o el mensaje' }, { status: 400 });
    }

    const producerName = await getManagedProducerName();
    if (!producerName) {
      return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
    }

    // Si se manda a un evento puntual, chequeamos que sea de esta productora.
    if (event_id) {
      const access = await canManageEvent(event_id);
      if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: alert, error } = await supabaseAdmin
      .from('broadcast_alerts')
      .insert({
        producer_name: producerName,
        event_id: event_id || null,
        title: String(title).trim(),
        message: String(message).trim(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, alert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
