import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';

export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 5000 },
});

export const mpPreference = new Preference(mpClient);
export const mpPayment = new Payment(mpClient);