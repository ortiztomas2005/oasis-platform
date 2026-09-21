import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, canManageEvent, getSessionEmail } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Ventas de barra ya registradas (para el historial/total del Escáner de
// Barra) y el registro de una venta nueva, con descuento atómico de stock
// vía la función record_bar_sale (ver migración 006).
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN', 'BAR']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: sales, error } = await supabaseAdmin
    .from('bar_sales')
    .select('*, events!inner(name, title, producer_name)')
    .eq('events.producer_name', producerName)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sales: sales || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { bar_menu_id, quantity } = await req.json();
    if (!bar_menu_id || !quantity || Number(quantity) <= 0) {
      return NextResponse.json({ error: 'Faltan datos válidos de la venta' }, { status: 400 });
    }

    const { data: item, error: itemErr } = await supabaseAdmin
      .from('bar_menu')
      .select('event_id')
      .eq('id', bar_menu_id)
      .single();
    if (itemErr || !item) return NextResponse.json({ error: 'Item de barra no encontrado' }, { status: 404 });

    const access = await canManageEvent(item.event_id, ['OWNER', 'ADMIN', 'BAR']);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const email = await getSessionEmail();

    const { data, error } = await supabaseAdmin.rpc('record_bar_sale', {
      p_bar_menu_id: bar_menu_id,
      p_quantity: Number(quantity),
      p_sold_by_email: email,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, sale: data?.[0] || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
