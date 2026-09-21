import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, canManageEvent } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Carta de bebidas por evento. Reemplaza el "barMenu" que antes se
// configuraba embebido en el viejo formulario local de crear evento (que ya
// no existe) por una tabla real, para que Escáner de Barra tenga de dónde
// vender.
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN', 'BAR']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: items, error } = await supabaseAdmin
    .from('bar_menu')
    .select('*, events!inner(name, title, producer_name)')
    .eq('events.producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: items || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { event_id, name, price, stock } = await req.json();
    if (!event_id || !name?.trim()) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const access = await canManageEvent(event_id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const { data: item, error } = await supabaseAdmin
      .from('bar_menu')
      .insert({ event_id, name: String(name).trim(), price: Number(price) || 0, stock: Number(stock) || 0 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });

    const { data: item, error: itemErr } = await supabaseAdmin.from('bar_menu').select('event_id').eq('id', id).single();
    if (itemErr || !item) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });

    const access = await canManageEvent(item.event_id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const { error } = await supabaseAdmin.from('bar_menu').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
