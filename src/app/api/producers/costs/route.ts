import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, canManageEvent } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Costos/gastos de LOS EVENTOS DE MI PRODUCTORA. Reemplaza la sección local
// "Cobros & Gastos" de /admin (que guardaba en localStorage) por la tabla
// real event_costs.
export async function GET() {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: costs, error } = await supabaseAdmin
    .from('event_costs')
    .select('*, events!inner(name, title, producer_name)')
    .eq('events.producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ costs: costs || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { event_id, category, concept, amount } = await req.json();
    if (!event_id || !concept || !amount) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const access = await canManageEvent(event_id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: cost, error } = await supabaseAdmin
      .from('event_costs')
      .insert({
        event_id,
        category: category || 'General',
        concept: String(concept).trim(),
        amount: Number(amount) || 0,
        is_paid: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, cost });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, is_paid } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });

    const { data: cost, error: costErr } = await supabaseAdmin
      .from('event_costs')
      .select('event_id')
      .eq('id', id)
      .single();
    if (costErr || !cost) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });

    const access = await canManageEvent(cost.event_id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { error } = await supabaseAdmin.from('event_costs').update({ is_paid: !!is_paid }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });

    const { data: cost, error: costErr } = await supabaseAdmin
      .from('event_costs')
      .select('event_id')
      .eq('id', id)
      .single();
    if (costErr || !cost) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });

    const access = await canManageEvent(cost.event_id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { error } = await supabaseAdmin.from('event_costs').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
