import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { createClient as createServerClient } from '@/core/supabase/server';

export const dynamic = 'force-dynamic';

// Contraparte de /api/resale/publish: saca una entrada del marketplace y
// descongela el ticket original para que vuelva a ser válido en puerta.
export async function POST(req: Request) {
  try {
    const { resale_id } = await req.json();
    if (!resale_id) {
      return NextResponse.json({ error: 'Falta el ID de la publicación' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Iniciá sesión para gestionar tus publicaciones.' }, { status: 401 });
    }

    const { data: resale, error: resaleErr } = await supabaseAdmin
      .from('ticket_resales')
      .select('*')
      .eq('id', resale_id)
      .eq('status', 'AVAILABLE')
      .single();

    if (resaleErr || !resale) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    if ((resale.seller_email || '').toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Esta publicación no te pertenece.' }, { status: 403 });
    }

    await supabaseAdmin
      .from('ticket_resales')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', resale_id);

    if (resale.ticket_id) {
      await supabaseAdmin.from('tickets').update({ status: 'VALID' }).eq('id', resale.ticket_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
