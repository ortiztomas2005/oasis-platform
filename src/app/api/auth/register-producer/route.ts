import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/core/supabase/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

// Convierte a un usuario recién registrado (ya autenticado con Supabase
// Auth) en dueño de una productora nueva, con su saldo prepago inicial.
// Requiere sesión real — antes esto se hacía escribiendo directo en
// localStorage sin que el servidor supiera que existía.
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Tenés que iniciar sesión primero.' }, { status: 401 });
    }

    const { producerName, producerType, dni, phone } = await req.json();
    const cleanName = String(producerName || '').trim().toUpperCase();

    if (!cleanName) {
      return NextResponse.json({ error: 'Falta el nombre de la productora.' }, { status: 400 });
    }

    const fullName =
      (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email;

    // 1. Crear la productora con su saldo prepago inicial. owner_email
    // tiene foreign key a profiles(email) — existe porque hay un trigger
    // que crea el profile al registrarse en Supabase Auth.
    const { error: producerErr } = await supabaseAdmin.from('producers').insert({
      name: cleanName,
      type: producerType || 'ENTERTAINMENT',
      owner_email: user.email.toLowerCase(),
    });

    if (producerErr) {
      return NextResponse.json({ error: `No se pudo crear la productora: ${producerErr.message}` }, { status: 500 });
    }

    // 2. Asignar al usuario actual como OWNER del equipo. team_members no
    // tiene columna user_id, solo email.
    const { error: teamErr } = await supabaseAdmin.from('team_members').insert({
      email: user.email.toLowerCase(),
      name: fullName,
      dni: dni || null,
      phone: phone || null,
      role: 'OWNER',
      producer_name: cleanName,
    });

    if (teamErr) {
      // Revertir la productora si no se pudo asignar el dueño
      await supabaseAdmin.from('producers').delete().eq('name', cleanName);
      return NextResponse.json({ error: `No se pudo asignar el equipo: ${teamErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, producerName: cleanName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al registrar la productora' }, { status: 500 });
  }
}
