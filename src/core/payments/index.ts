export type PaymentProvider = 'MERCADOPAGO' | 'ASTROPAY' | 'TRANSFER_MANUAL';

export interface PaymentInitRequest {
  provider: PaymentProvider;
  eventId: string;
  ticketTypeId: string;
  amount: number;
  buyer: {
    userId?: string;
    name: string;
    email: string;
    dni: string;
  };
}

export interface PaymentInitResponse {
  success: boolean;
  provider: PaymentProvider;
  redirectUrl?: string; // Para MP / AstroPay Checkout
  transferInstructions?: {
    alias: string;
    cbu: string;
    holder: string;
    amount: number;
    referenceCode: string;
  };
}