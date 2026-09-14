import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, getSessionEmail } from '@/core/services/producers';
import { getTicketPack } from '@/core/services/ticket-packs';

export const dynamic = 'force-dynamic';

// Historial de compras de saldo de mi productora
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('producer_ticket_purchases')
    .select('*')
    .eq('producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message, purchases: [] });
  return NextResponse.json({ purchases: data || [], producerName });
}

// Pedir un paquete: crea la orden PENDING. El saldo recién se acredita
// cuando OASIS confirma el pago (ver /api/admin/ticket-purchases).
export async function POST(req: Request) {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  try {
    const { packId, receiptUrl } = await req.json();
    const pack = getTicketPack(packId);
    if (!pack) {
      return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 });
    }

    const email = await getSessionEmail();
    const referenceCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabaseAdmin
      .from('producer_ticket_purchases')
      .insert({
        producer_name: producerName,
        pack_id: pack.id,
        quantity: pack.quantity,
        amount: pack.price,
        status: 'PENDING',
        reference_code: referenceCode,
        receipt_url: receiptUrl || null,
        requested_by_email: email,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, purchase: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
