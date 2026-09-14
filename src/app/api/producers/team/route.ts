import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, getSessionRoleForProducer } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['OWNER', 'ADMIN', 'DOOR', 'BAR'];

// Cualquiera del equipo puede ver quién más está.
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN', 'DOOR', 'BAR']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select('id, email, name, dni, phone, role, created_at')
    .eq('producer_name', producerName)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const myRole = await getSessionRoleForProducer(producerName);
  return NextResponse.json({ team: data || [], producerName, myRole });
}

// Sumar (o cambiarle el rol a) alguien del equipo. Solo el OWNER puede
// gestionar el equipo. No hace falta que la persona ya tenga cuenta: en
// cuanto se registre en /auth con ese mismo email, va a tener acceso
// automáticamente (los permisos se resuelven por email, no por invitación
// aceptada).
export async function POST(req: Request) {
  const producerName = await getManagedProducerName(['OWNER']);
  if (!producerName) {
    return NextResponse.json({ error: 'Solo el dueño de la productora puede gestionar el equipo.' }, { status: 403 });
  }

  try {
    const { email, name, dni, phone, role } = await req.json();
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanRole = String(role || '').toUpperCase();

    if (!cleanEmail || !name) {
      return NextResponse.json({ error: 'Faltan email y nombre' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(cleanRole)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('producer_name', producerName)
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      // Ya está en el equipo: actualiza el rol en vez de duplicar la fila
      // (duplicar rompería las consultas que esperan un solo resultado).
      const { error } = await supabaseAdmin
        .from('team_members')
        .update({ name, dni: dni || null, phone: phone || null, role: cleanRole })
        .eq('id', existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, updated: true });
    }

    const { error } = await supabaseAdmin.from('team_members').insert({
      producer_name: producerName,
      email: cleanEmail,
      name,
      dni: dni || null,
      phone: phone || null,
      role: cleanRole,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const producerName = await getManagedProducerName(['OWNER']);
  if (!producerName) {
    return NextResponse.json({ error: 'Solo el dueño de la productora puede gestionar el equipo.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const { data: target } = await supabaseAdmin
    .from('team_members')
    .select('role, producer_name')
    .eq('id', id)
    .maybeSingle();

  if (!target || target.producer_name !== producerName) {
    return NextResponse.json({ error: 'No encontrado en tu equipo' }, { status: 404 });
  }

  if (target.role === 'OWNER') {
    const { count } = await supabaseAdmin
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('producer_name', producerName)
      .eq('role', 'OWNER');

    if ((count || 0) <= 1) {
      return NextResponse.json({ error: 'No podés sacar al último OWNER de la productora.' }, { status: 400 });
    }
  }

  // Evitar que el OWNER se saque a sí mismo por error si es el único —
  // ya cubierto arriba; si hay más de un OWNER, esto sí se permite.
  const { error } = await supabaseAdmin.from('team_members').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
