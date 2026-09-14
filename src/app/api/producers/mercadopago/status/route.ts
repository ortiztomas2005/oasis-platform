import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getOwnedProducerName } from '@/core/services/producers';
import { disconnectProducerMp } from '@/core/services/mercadopago-connect';

export const dynamic = 'force-dynamic';

export async function GET() {
  const producerName = await getOwnedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos dueño de ninguna productora.' }, { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from('producers')
    .select('mp_connected_at, mp_public_key')
    .eq('name', producerName)
    .maybeSingle();

  return NextResponse.json({
    producerName,
    connected: !!data?.mp_connected_at,
    connectedAt: data?.mp_connected_at || null,
  });
}

export async function DELETE() {
  const producerName = await getOwnedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos dueño de ninguna productora.' }, { status: 403 });
  }

  await disconnectProducerMp(producerName);
  return NextResponse.json({ success: true });
}
