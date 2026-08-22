import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

// Guardar nuevo costo
export async function POST(req: Request) {
  try {
    const { eventId, category, concept, amount } = await req.json();

    if (!eventId || !category || !concept || amount === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : '00000000-0000-0000-0000-000000000001';

    const { data: cost, error } = await supabaseAdmin
      .from('event_costs')
      .insert({
        organization_id: organizationId,
        event_id: eventId,
        category: category.trim(),
        concept: concept.trim(),
        amount: Number(amount),
        is_paid: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Actualizar estado de pago (Pagado / Pendiente)
export async function PATCH(req: Request) {
  try {
    const { id, is_paid } = await req.json();

    if (!id || is_paid === undefined) {
      return NextResponse.json({ error: 'ID y estado de pago requeridos' }, { status: 400 });
    }

    const { data: cost, error } = await supabaseAdmin
      .from('event_costs')
      .update({ is_paid })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Eliminar un costo
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de costo requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('event_costs').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}