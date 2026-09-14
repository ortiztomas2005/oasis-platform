'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  event_id: string;
  ticket_tier: string;
  amount: number;
  payment_method: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  customer_name: string;
  customer_email: string;
  customer_dni: string;
  receipt_url: string | null;
  reference_code: string;
  created_at: string;
  events?: { name?: string; title?: string };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export default function ProducerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [producerName, setProducerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, meRes] = await Promise.all([fetch('/api/producers/orders'), fetch('/api/producers/me')]);

      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.error || 'Error al cargar órdenes');
      setOrders(ordersData.orders || []);
      setProducerName(ordersData.producerName || null);

      const meData = await meRes.json();
      if (meRes.ok) setBalance(meData.producer?.prepaid_balance ?? null);

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

  const handleAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'APPROVE' && !confirm('¿Confirmar que recibiste esta transferencia? Se le va a mandar el QR al comprador por email.')) return;
    if (action === 'REJECT' && !confirm('¿Rechazar esta orden?')) return;

    setProcessingId(orderId);
    try {
      const res = await fetch('/api/producers/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = filter === 'PENDING' ? orders.filter((o) => o.status === 'PENDING') : orders;

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              {producerName || 'Tu Productora'}
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Confirmar Ventas</h1>
          </div>
          <div className="flex items-center gap-3">
            {balance !== null && (
              <Link
                href="/admin/comprar-tickets"
                className="px-4 py-2 rounded-xl bg-[#0c0f16] border border-white/10 text-xs hover:border-amber-500/50 transition"
              >
                <span className="text-neutral-500 uppercase">Saldo: </span>
                <span className={`font-black ${balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {balance} tickets
                </span>
                <span className="text-amber-400 ml-1.5">· Comprar más →</span>
              </Link>
            )}
            <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
              ← Volver al panel
            </Link>
          </div>
        </div>

        {balance !== null && balance <= 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
            ⚠️ No te quedan tickets disponibles. Aunque confirmes una transferencia, la emisión va a fallar hasta que recargues saldo.
          </div>
        )}

        <div className="flex gap-2 text-xs">
          {(['PENDING', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl border uppercase font-bold transition cursor-pointer ${
                filter === f ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-[#0c0f16] border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {f === 'PENDING' ? `Pendientes (${orders.filter((o) => o.status === 'PENDING').length})` : `Todas (${orders.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            No hay órdenes en este filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((o) => (
              <div key={o.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {o.events?.name || o.events?.title} · {o.ticket_tier}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {o.customer_name} · DNI {o.customer_dni} · {o.customer_email}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      o.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : o.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">
                    {o.payment_method} · Ref: <span className="text-white font-bold">{o.reference_code}</span>
                  </span>
                  <span className="text-emerald-400 font-black">${Number(o.amount).toLocaleString('es-AR')}</span>
                </div>

                {o.receipt_url && (
                  <a
                    href={o.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[11px] text-amber-400 underline"
                  >
                    Ver comprobante adjunto →
                  </a>
                )}

                {o.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleAction(o.id, 'APPROVE')}
                      disabled={processingId === o.id}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
                    >
                      {processingId === o.id ? 'Procesando...' : 'Confirmar pago →'}
                    </button>
                    <button
                      onClick={() => handleAction(o.id, 'REJECT')}
                      disabled={processingId === o.id}
                      className="px-5 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 text-xs font-bold hover:bg-rose-950/50 transition disabled:opacity-50 cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
