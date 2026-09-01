import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { createPaymentPreference } from '@/core/services/payments';

interface PayRequestBody {
  orderId: string;
  buyerEmail: string;
}

export async function POST(req: Request) {
  try {
    const { orderId, buyerEmail }: PayRequestBody = await req.json();

    if (!orderId || !buyerEmail) {
      return NextResponse.json(
        { error: 'Datos incompletos para generar el pago' },
        { status: 400 }
      );
    }

    // 1. Buscamos los datos de la orden y su evento
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, events(title)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    const eventTitle = (order as any).events?.title || 'OASIS Evento';

    // 2. Generamos la preferencia de pago en Mercado Pago
    const { initPoint, preferenceId } = await createPaymentPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
      buyerEmail,
      eventTitle,
    });

    return NextResponse.json({
      success: true,
      preferenceId,
      paymentUrl: initPoint,
    });
  } catch (error: any) {
    console.error('Error generating payment preference:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al iniciar pasarela de pagos' },
      { status: 500 }
    );
  }
}
