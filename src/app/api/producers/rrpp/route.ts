import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Embajadores/RRPP reales de la productora (reemplaza la otra mitad de la
// sección local "Cupones & RRPP"). Igual que con los cupones: esto es el
// alta/baja real, todavía no hay atribución automática de ventas por
// código RRPP en el checkout.
export async function GET() {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: members, error } = await supabaseAdmin
    .from('rrpp_members')
    .select('*')
    .eq('producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: members || [], producerName });
}

export async function POST(req: Request) {
  try {
    const { name, code, commission_per_ticket } = await req.json();
    const cleanCode = String(code || '').trim().toLowerCase();
    if (!name?.trim() || !cleanCode) {
      return NextResponse.json({ error: 'Faltan el nombre o el código' }, { status: 400 });
    }

    const producerName = await getManagedProducerName();
    if (!producerName) {
      return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
    }

    const { data: member, error } = await supabaseAdmin
      .from('rrpp_members')
      .insert({
        producer_name: producerName,
        name: String(name).trim(),
        code: cleanCode,
        commission_per_ticket: Number(commission_per_ticket) || 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe un RRPP con ese código' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, member });
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

    const { error } = await supabaseAdmin.from('rrpp_members').delete().eq('id', id).eq('producer_name', producerName);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
