'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface ResaleItem {
  id: string;
  resale_price: number;
  platform_fee: number;
  seller_name: string;
  tickets: {
    tier_name: string;
  };
}

export default function ResaleMarketplacePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [resales, setResales] = useState<ResaleItem[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Form states
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/events/${resolvedParams.slug}`);
        const data = await res.json();
        setEvent(data.event);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.slug]);

  const handleBuy = async (resaleId: string) => {
    if (!buyerName || !buyerEmail || !buyerDni) {
      alert('Por favor completá tus datos antes de comprar.');
      return;
    }

    try {
      const res = await fetch('/api/resale/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resale_id: resaleId,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_dni: buyerDni,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la compra');

      alert('¡Compra exitosa! Tu nuevo pase oficial e intransferible fue emitido.');
      window.location.href = `/ticket/${data.new_ticket_code}`;
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href={`/events/${resolvedParams.slug}`} className="text-xs font-mono text-neutral-400 hover:text-white mb-6 inline-block">
          ← Volver al Evento Oficial
        </Link>

        <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-3xl p-6 mb-8 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
            <span className="text-[10px] font-mono tracking-widest text-yellow-400 uppercase">
              OASIS VERIFIED RESALE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            Marketplace Secundario Seguro
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Cada compra destruye automáticamente el QR del vendedor y emite uno nuevo a tu nombre. Garantía 100% antifraude.
          </p>
        </div>

        {/* Formulario de Comprador */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-bold tracking-wide uppercase mb-3">Tus Datos para la Emisión del Nuevo Pase</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nombre y Apellido"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
            />
            <input
              type="email"
              placeholder="Email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
            />
            <input
              type="text"
              placeholder="DNI"
              value={buyerDni}
              onChange={(e) => setBuyerDni(e.target.value)}
              className="bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
            />
          </div>
        </div>

        {/* Lista de Tickets en Reventa */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-neutral-400 tracking-wider uppercase">Tickets Disponibles</h2>
          <div className="border border-dashed border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs font-mono">
            No hay tickets en reventa para este evento en este momento. Las publicaciones aparecen aquí al instante en cuanto un usuario las pone a la venta.
          </div>
        </div>
      </div>
    </main>
  );
}