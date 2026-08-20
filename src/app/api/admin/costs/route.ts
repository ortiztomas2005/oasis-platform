import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export async function POST(req: Request) {
  try {
    const { eventId, category, concept, amount } = await req.json();

    if (!eventId || !category || !concept || amount === undefined) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabaseAdmin
      .from('event_costs')
      .insert({
        organization_id: organizationId,
        event_id: eventId,
        category,
        concept,
        amount: Number(amount),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cost: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
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