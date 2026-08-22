import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();

    if (!identifier || identifier.trim() === '') {
      return NextResponse.json({ error: 'Ingresá un DNI o Email válido' }, { status: 400 });
    }

    const cleanId = identifier.trim();

    // Buscar coincidencia por DNI o por Email
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .or(`holder_dni.eq.${cleanId},holder_email.ilike.%${cleanId}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tickets: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}