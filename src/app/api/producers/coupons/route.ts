import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Cupones de descuento reales de la productora (reemplaza la sección local
// "Cupones & RRPP" de /admin en su mitad de cupones). Ojo: todavía no se
// aplican automáticamente en el checkout — esta parte es solo el
// alta/baja real de los códigos.
export async function GET() {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: coupons, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: coupons || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { code, discount_pct } = await req.json();
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode || !discount_pct) {
      return NextResponse.json({ error: 'Faltan el código o el porcentaje' }, { status: 400 });
    }

    const producerName = await getManagedProducerName();
    if (!producerName) {
      return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({ producer_name: producerName, code: cleanCode, discount_pct: Number(discount_pct) })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe un cupón con ese código' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });

    const producerName = await getManagedProducerName();
    if (!producerName) {
      return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id).eq('producer_name', producerName);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
