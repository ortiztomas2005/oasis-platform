import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { requireAdminSession } from '@/core/auth/admin-session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from('producer_ticket_purchases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ purchases: data || [] });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const { purchaseId, action } = await req.json();
    if (!purchaseId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { data: purchase, error: fetchErr } = await supabaseAdmin
      .from('producer_ticket_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (fetchErr || !purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 });
    }
    if (purchase.status !== 'PENDING') {
      return NextResponse.json({ error: `Esta compra ya está en estado ${purchase.status}.` }, { status: 400 });
    }

    if (action === 'APPROVE') {
      const { error: rpcErr } = await supabaseAdmin.rpc('add_producer_tickets', {
        p_producer_name: purchase.producer_name,
        p_quantity: purchase.quantity,
      });
      if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

      await supabaseAdmin
        .from('producer_ticket_purchases')
        .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', purchaseId);

      return NextResponse.json({
        success: true,
        message: `Se acreditaron ${purchase.quantity} tickets a ${purchase.producer_name}.`,
      });
    }

    await supabaseAdmin
      .from('producer_ticket_purchases')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', purchaseId);

    return NextResponse.json({ success: true, message: 'Compra rechazada.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
