'use client';

import { useState } from 'react';

export default function ResaleModal({
  ticketId,
  originalPrice,
  onSuccess,
}: {
  ticketId: string;
  originalPrice?: number;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(originalPrice || 15000);
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/resale/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          resale_price: price,
          seller_cbu_alias: alias,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');

      alert('¡Ticket publicado en el Marketplace oficial de OASIS!');
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-3 py-3 px-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
      >
        <span>🔄</span> Revender este ticket en OASIS
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold mb-1">Publicar en Marketplace Oficial</h3>
            <p className="text-xs text-neutral-400 mb-4 font-mono">
              Tu QR original se congelará y, al concretarse la compra, se reemitirá un pase nuevo e intransferible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Precio de Venta ($ ARS)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase">CBU / Alias para recibir tu cobro</label>
                <input
                  type="text"
                  placeholder="ej: oasis.fiesta.mp"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-bold font-mono disabled:opacity-50"
                >
                  {loading ? 'Publicando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
