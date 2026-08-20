import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializamos el cliente con el Access Token de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN-PENDING',
  options: { timeout: 7000 },
});

interface CreatePreferenceParams {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  buyerEmail: string;
  eventTitle: string;
}

export async function createPaymentPreference({
  orderId,
  orderNumber,
  totalAmount,
  buyerEmail,
  eventTitle,
}: CreatePreferenceParams) {
  const preference = new Preference(client);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const response = await preference.create({
    body: {
      items: [
        {
          id: orderId,
          title: `Entradas: ${eventTitle} (Orden #${orderNumber})`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: buyerEmail,
      },
      external_reference: orderId,
      back_urls: {
        success: `${baseUrl}/checkout/success?order_id=${orderId}`,
        failure: `${baseUrl}/checkout/failure?order_id=${orderId}`,
        pending: `${baseUrl}/checkout/pending?order_id=${orderId}`,
      },
      auto_return: 'approved',
    },
  });

  return {
    preferenceId: response.id,
    initPoint: response.init_point || response.sandbox_init_point,
  };
}