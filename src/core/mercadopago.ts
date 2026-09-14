import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000',
  options: { timeout: 5000 },
});

export const preference = new Preference(client);
// Se usa en el webhook para consultarle a Mercado Pago el estado real de un
// pago por su ID, en vez de confiar en lo que venga en el body del webhook
// (cualquiera puede pegarle a un webhook con un body inventado).
export const payment = new Payment(client);
export default client;
