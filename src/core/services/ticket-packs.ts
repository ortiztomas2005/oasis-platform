/**
 * Paquetes de tickets prepago que una productora le compra a OASIS.
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
  { id: 'pack-100', quantity: 100, price: 50000, label: '100 tickets' },
  { id: 'pack-500', quantity: 500, price: 225000, label: '500 tickets' },
  { id: 'pack-1000', quantity: 1000, price: 400000, label: '1.000 tickets' },
];

export function getTicketPack(packId: string): TicketPack | undefined {
  return TICKET_PACKS.find((p) => p.id === packId);
}

/**
 * Datos de la cuenta de OASIS para que las productoras transfieran al
 * comprar tickets. Placeholder — reemplazar por los reales.
 */
export const OASIS_BANK_INFO = {
  alias: 'OASIS.PLATFORM.MP',
  cbu: '0000000000000000000000',
  holderName: 'OASIS Platform S.A.',
};
