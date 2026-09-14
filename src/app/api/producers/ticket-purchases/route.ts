import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName, getSessionEmail } from '@/core/services/producers';
import { getTicketPack, calculateCustomPackPrice, MIN_CUSTOM_QUANTITY, MAX_CUSTOM_QUANTITY } from '@/core/services/ticket-packs';

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

// Pedir un paquete (fijo o cantidad a elección con precio dinámico): crea
// la orden PENDING. El saldo recién se acredita cuando Live Experience
// confirma el pago (ver /api/admin/ticket-purchases).
export async function POST(req: Request) {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  try {
    const { packId, customQuantity, receiptUrl } = await req.json();

    let quantity: number;
    let amount: number;
    let resolvedPackId: string;

    if (packId === 'custom') {
      quantity = Number(customQuantity);
      if (!Number.isInteger(quantity) || quantity < MIN_CUSTOM_QUANTITY || quantity > MAX_CUSTOM_QUANTITY) {
        return NextResponse.json(
          { error: `La cantidad tiene que ser un entero entre ${MIN_CUSTOM_QUANTITY} y ${MAX_CUSTOM_QUANTITY}.` },
          { status: 400 }
        );
      }
      amount = calculateCustomPackPrice(quantity).total;
      resolvedPackId = 'custom';
    } else {
      const pack = getTicketPack(packId);
      if (!pack) return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 });
      quantity = pack.quantity;
      amount = pack.price;
      resolvedPackId = pack.id;
    }

    const email = await getSessionEmail();
    const referenceCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabaseAdmin
      .from('producer_ticket_purchases')
      .insert({
        producer_name: producerName,
        pack_id: resolvedPackId,
        quantity,
        amount,
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
