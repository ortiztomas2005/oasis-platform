'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Purchase {
  id: string;
  producer_name: string;
  quantity: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reference_code: string;
  receipt_url: string | null;
  created_at: string;
}

// Pantalla de OASIS (no de la productora) para confirmar las compras de
// paquetes de tickets y acreditar el saldo.
export default function ProducerPurchasesAdminPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ticket-purchases');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setPurchases(data.purchases || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (purchaseId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'APPROVE' && !confirm('¿Confirmar que recibiste la transferencia? Se le va a acreditar el saldo a la productora.')) return;
    setProcessingId(purchaseId);
    try {
      const res = await fetch('/api/admin/ticket-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filter === 'PENDING' ? purchases.filter((p) => p.status === 'PENDING') : purchases;

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase text-white">Compras de Productoras</h1>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">← Panel</Link>
        </div>

        <div className="flex gap-2 text-xs">
          {(['PENDING', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl border uppercase font-bold transition cursor-pointer ${
                filter === f ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-[#0c0f16] border-white/10 text-neutral-400'
              }`}
            >
              {f === 'PENDING' ? `Pendientes (${purchases.filter((p) => p.status === 'PENDING').length})` : `Todas (${purchases.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-neutral-500">No hay pedidos en este filtro.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-sm font-bold text-white block">{p.producer_name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {p.quantity} tickets · ${Number(p.amount).toLocaleString('es-AR')} · Ref: {p.reference_code}
                  </span>
                  {p.receipt_url && (
                    <a href={p.receipt_url} target="_blank" rel="noreferrer" className="block text-[11px] text-amber-400 underline">
                      Ver comprobante →
                    </a>
                  )}
                </div>
                {p.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(p.id, 'APPROVE')}
                      disabled={processingId === p.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleAction(p.id, 'REJECT')}
                      disabled={processingId === p.id}
                      className="px-4 py-2 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
                    {p.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
