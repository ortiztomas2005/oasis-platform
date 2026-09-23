'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TICKET_PACKS,
  PLATFORM_BANK_INFO,
  calculateCustomPackPrice,
  MIN_CUSTOM_QUANTITY,
  MAX_CUSTOM_QUANTITY,
} from '@/core/services/ticket-packs';

interface Purchase {
  id: string;
  pack_id: string;
  quantity: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reference_code: string;
  receipt_url: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pendiente', APPROVED: 'Acreditado', REJECTED: 'Rechazado' };

export default function BuyTicketsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [customQuantity, setCustomQuantity] = useState<string>('750');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const customPricing = useMemo(() => {
    const qty = Number(customQuantity);
    if (!Number.isInteger(qty) || qty <= 0) return null;
    return { quantity: qty, ...calculateCustomPackPrice(qty) };
  }, [customQuantity]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/ticket-purchases');
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

  const handleBuy = async () => {
    if (!selectedPack) return;
    if (selectedPack === 'custom') {
      const qty = Number(customQuantity);
      if (!Number.isInteger(qty) || qty < MIN_CUSTOM_QUANTITY || qty > MAX_CUSTOM_QUANTITY) {
        alert(`Ingresá una cantidad entre ${MIN_CUSTOM_QUANTITY} y ${MAX_CUSTOM_QUANTITY}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        const uploadRes = await fetch('/api/checkout/upload-receipt', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) receiptUrl = uploadData.url;
      }

      const res = await fetch('/api/producers/ticket-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: selectedPack,
          customQuantity: selectedPack === 'custom' ? Number(customQuantity) : undefined,
          receiptUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pedir el paquete');

      alert(`Pedido registrado (ref ${data.purchase.reference_code}). Transferí y esperá la confirmación de Live Experience.`);
      setSelectedPack(null);
      setReceiptFile(null);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase text-white">Comprar Tickets</h1>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">← Volver al panel</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {TICKET_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack.id)}
              className={`p-5 rounded-2xl border text-left transition cursor-pointer ${
                selectedPack === pack.id ? 'bg-blue-500/10 border-blue-500' : 'bg-[#0c0f16] border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-2xl font-black text-white block">{pack.quantity.toLocaleString('es-AR')}</span>
              <span className="text-[11px] text-neutral-400 uppercase block mb-2">tickets</span>
              <span className="text-emerald-400 font-bold text-sm">${pack.price.toLocaleString('es-AR')}</span>
              <span className="text-[10px] text-neutral-500 block">
                ${Math.round(pack.price / pack.quantity).toLocaleString('es-AR')}/ticket
              </span>
            </button>
          ))}

          <button
            onClick={() => setSelectedPack('custom')}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer ${
              selectedPack === 'custom' ? 'bg-blue-500/10 border-blue-500' : 'bg-[#0c0f16] border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-2xl font-black text-white block">✏️</span>
            <span className="text-[11px] text-neutral-400 uppercase block mb-2">Elegir cantidad</span>
            <span className="text-[10px] text-neutral-500 block">Precio según volumen</span>
          </button>
        </div>

        {selectedPack === 'custom' && (
          <div className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 space-y-3">
            <label className="text-[10px] text-neutral-400 uppercase font-bold block">
              Cantidad de tickets ({MIN_CUSTOM_QUANTITY.toLocaleString('es-AR')}–{MAX_CUSTOM_QUANTITY.toLocaleString('es-AR')})
            </label>
            <input
              type="number"
              min={MIN_CUSTOM_QUANTITY}
              max={MAX_CUSTOM_QUANTITY}
              value={customQuantity}
              onChange={(e) => setCustomQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500"
            />
            {customPricing && (
              <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                <span className="text-neutral-400">${customPricing.pricePerTicket.toLocaleString('es-AR')}/ticket</span>
                <span className="text-emerald-400 font-black text-base">${customPricing.total.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
        )}

        {selectedPack && (
          <div className="bg-[#0c0f16] border border-blue-500/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase text-blue-400">Transferí a Live Experience</h2>
            <div className="text-xs space-y-1 text-neutral-300">
              <p>Alias: <span className="text-white font-bold select-all">{PLATFORM_BANK_INFO.alias}</span></p>
              <p>CBU/CVU: <span className="text-white font-bold select-all">{PLATFORM_BANK_INFO.cbu}</span></p>
              <p>Titular: <span className="text-white font-bold">{PLATFORM_BANK_INFO.holderName}</span></p>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Comprobante (opcional pero recomendado)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-neutral-800 file:text-white cursor-pointer"
              />
            </div>

            <button
              onClick={handleBuy}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Enviando...' : 'Ya transferí, registrar pedido →'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase text-neutral-400">Tus pedidos</h2>
          {loading ? (
            <p className="text-xs text-neutral-500">Cargando...</p>
          ) : error ? (
            <p className="text-xs text-amber-400">{error}</p>
          ) : purchases.length === 0 ? (
            <p className="text-xs text-neutral-500">Todavía no pediste ningún paquete.</p>
          ) : (
            purchases.map((p) => (
              <div key={p.id} className="bg-[#0c0f16] border border-white/10 rounded-xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-bold block">{p.quantity.toLocaleString('es-AR')} tickets · ${Number(p.amount).toLocaleString('es-AR')}</span>
                  <span className="text-neutral-500">Ref: {p.reference_code}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    p.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : p.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
