/**
 * Paquetes de tickets prepago que una productora le compra a Live
 * Experience (la ticketería — OASIS es solo un ejemplo de productora
 * dentro de la plataforma, no la plataforma en sí).
 * Valores de ejemplo — cambialos por los precios reales, es el único
 * lugar que hay que tocar.
 */
export interface TicketPack {
  id: string;
  quantity: number;
  price: number;
  label: string;
}

export const TICKET_PACKS: TicketPack[] = [
  { id: 'pack-500', quantity: 500, price: 225000, label: '500 tickets' },
  { id: 'pack-1000', quantity: 1000, price: 400000, label: '1.000 tickets' },
  { id: 'pack-5000', quantity: 5000, price: 1750000, label: '5.000 tickets' },
];

export function getTicketPack(packId: string): TicketPack | undefined {
  return TICKET_PACKS.find((p) => p.id === packId);
}

/**
 * Precio por ticket para una cantidad elegida a mano (no uno de los packs
 * fijos), con descuento por volumen. Son tramos de ejemplo — el único
 * lugar que hay que tocar para ajustar la escala real:
 *   1-499     -> $500/ticket
 *   500-999   -> $450/ticket (precio del pack de 500)
 *   1000-4999 -> $400/ticket (precio del pack de 1000)
 *   5000+     -> $350/ticket (mejor que el pack de 5000)
 */
const CUSTOM_PRICE_TIERS: { minQuantity: number; pricePerTicket: number }[] = [
  { minQuantity: 5000, pricePerTicket: 350 },
  { minQuantity: 1000, pricePerTicket: 400 },
  { minQuantity: 500, pricePerTicket: 450 },
  { minQuantity: 1, pricePerTicket: 500 },
];

export function calculateCustomPackPrice(quantity: number): { pricePerTicket: number; total: number } {
  const tier = CUSTOM_PRICE_TIERS.find((t) => quantity >= t.minQuantity) || CUSTOM_PRICE_TIERS[CUSTOM_PRICE_TIERS.length - 1];
  return { pricePerTicket: tier.pricePerTicket, total: Math.round(quantity * tier.pricePerTicket) };
}

export const MIN_CUSTOM_QUANTITY = 50;
export const MAX_CUSTOM_QUANTITY = 20000;

/**
 * Datos de la cuenta de Live Experience para que las productoras
 * transfieran al comprar tickets. Placeholder — reemplazar por los reales.
 */
export const PLATFORM_BANK_INFO = {
  alias: 'LIVEEXPERIENCE.TICKETS',
  cbu: '0000000000000000000000',
  holderName: 'Live Experience S.A.',
};
