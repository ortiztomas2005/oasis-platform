'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EventResaleMarketplace() {
  const params = useParams();
  const slug = params?.slug as string;

  const [resales, setResales] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResale, setSelectedResale] = useState<any | null>(null);

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchResales();
    }
  }, [slug]);

  const fetchResales = async () => {
    try {
      const res = await fetch(`/api/events/${slug}/resale`);
      const data = await res.json();
      if (res.ok) {
        setResales(data.resales || []);
        setEvent(data.event || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyResale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResale) return;

    setPurchasing(true);
    try {
      const res = await fetch('/api/resale/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resale_id: selectedResale.id,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_dni: buyerDni,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al comprar reventa');

      alert('¡Entrada adquirida con éxito! Se reemitió un nuevo QR intransferible.');
      window.location.href = data.redirect_url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-wider">
              Marketplace Oficial
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase mt-1">
              Reventa de Tickets: {event?.name || 'Evento OASIS'}
            </h1>
          </div>
          <Link
            href={`/events/${slug}`}
            className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl text-xs font-mono hover:bg-yellow-300"
          >
            ← Ir a Venta Oficial
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-neutral-500">Cargando entradas disponibles...</div>
        ) : resales.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center bg-neutral-900/20">
            <p className="text-sm font-mono text-neutral-400">No hay tickets publicados en reventa para este evento.</p>
            <p className="text-xs font-mono text-neutral-500 mt-2">
              Podés adquirir entradas oficiales directamente en la fiesta:
            </p>
            <Link
              href={`/events/${slug}`}
              className="inline-block mt-4 px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono"
            >
              Comprar Entrada Oficial
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resales.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900/70 border border-neutral-800 hover:border-yellow-400/50 transition-all rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold uppercase rounded-full">
                      {item.tickets?.tier_name || 'GENERAL'}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">✓ Verificado</span>
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white mb-1">
                    ${Number(item.resale_price).toLocaleString('es-AR')}
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">Vendedor: {item.seller_name || 'Asistente'}</p>
                </div>

                <button
                  onClick={() => setSelectedResale(item)}
                  className="mt-6 w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase font-mono rounded-xl transition-all"
                >
                  Comprar Entrada de Reventa
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedResale && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl">
              <h3 className="text-lg font-bold">Comprar Entrada de Reventa</h3>
              <p className="text-xs text-neutral-400 font-mono mb-4">
                El código original será destruido y recibirás un QR nuevo a tu nombre.
              </p>

              <form onSubmit={handleBuyResale} className="space-y-3 font-mono">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Lucas Rossi"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">DNI / Documento</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: 40123456"
                    value={buyerDni}
                    onChange={(e) => setBuyerDni(e.target.value)}
                    className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Email de Destino</label>
                  <input
                    type="email"
                    required
                    placeholder="ej: lucas@email.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="p-3 bg-black/50 border border-neutral-800 rounded-xl flex justify-between items-center mt-2">
                  <span className="text-xs text-neutral-400">Total a pagar:</span>
                  <span className="text-base font-bold text-yellow-400">
                    ${Number(selectedResale.resale_price).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedResale(null)}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={purchasing}
                    className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase rounded-xl disabled:opacity-50"
                  >
                    {purchasing ? 'Procesando...' : 'Confirmar Compra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}