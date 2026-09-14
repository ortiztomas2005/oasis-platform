import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

// Listado público del marketplace de reventa oficial. Antes había tres
// implementaciones de "reventa" descoordinadas (esta leía de una tabla
// resale_listings que nadie más escribía, /resale leía de localStorage, y
// /events/[slug]/resale ni siquiera consultaba una tabla de reventas). Se
// unificaron todas en ticket_resales, que es la que sí llenan
// ResaleModal.tsx -> /api/resale/publish.
export async function GET() {
  try {
    const { data: resales, error } = await supabaseAdmin
      .from('ticket_resales')
      .select('*, events(*), tickets(*)')
      .eq('status', 'AVAILABLE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ resales: resales || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, resales: [] }, { status: 500 });
  }
}
