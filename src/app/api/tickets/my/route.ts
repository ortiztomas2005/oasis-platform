import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { dni, email } = await req.json();

    if (!dni || !email) {
      return NextResponse.json(
        { error: 'Por seguridad, ingresá tu DNI y el Email con el que compraste.' },
        { status: 400 }
      );
    }

    const cleanDni = dni.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Verificación estricta de doble coincidencia (DNI + Email)
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .eq('holder_dni', cleanDni)
      .ilike('holder_email', cleanEmail)
      .neq('status', 'RESOLD_BURNED') // No mostrar tickets que ya fueron revendidos y quemados
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tickets: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
