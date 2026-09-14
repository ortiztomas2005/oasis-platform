import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Datos básicos (incl. saldo prepago) de la productora que gestiona el
// usuario logueado.
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN', 'DOOR', 'BAR']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('producers')
    .select('name, type, prepaid_balance')
    .eq('name', producerName)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Productora no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ producer: data });
}
