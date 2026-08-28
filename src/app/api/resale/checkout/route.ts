import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { preference } from '@/core/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { resale_id, buyer_name, buyer_email, buyer_dni } = await req.json();

    if (!resale_id || !buyer_name || !buyer_email || !buyer_dni) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Obtener la publicación
    const { data: resale, error: resaleErr } = await supabaseAdmin
      .from('ticket_resales')
      .select('*, events(*)')
      .eq('id', resale_id)
      .eq('status', 'AVAILABLE')
      .single();

    if (resaleErr || !resale) {
      return NextResponse.json({ error: 'Esta entrada ya no está disponible' }, { status: 404 });
    }

    const price = Number(resale.resale_price);

    // 2. Si Mercado Pago tiene credenciales activas, generar la preferencia
    if (process.env.MP_ACCESS_TOKEN) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      const response = await preference.create({
        body: {
          items: [
            {
              id: resale.id,
              title: `Reventa Oficial: ${resale.events?.name || 'OASIS Pass'}`,
              quantity: 1,
              unit_price: price,
              currency_id: 'ARS',
            },
          ],
          payer: {
            name: buyer_name,
            email: buyer_email,
          },
          metadata: {
            type: 'RESALE_PURCHASE',
            resale_id: resale.id,
            event_id: resale.event_id,
            buyer_name,
            buyer_email,
            buyer_dni,
          },
          back_urls: {
            success: `${baseUrl}/resale/success?resale_id=${resale.id}`,
            failure: `${baseUrl}/resale`,
            pending: `${baseUrl}/resale`,
          },
          auto_return: 'approved',
        },
      });

      return NextResponse.json({
        success: true,
        init_point: response.init_point || response.sandbox_init_point,
      });
    }

    // Modo local / simulación si no hay credencial cargada
    return NextResponse.json({
      success: true,
      simulation: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}