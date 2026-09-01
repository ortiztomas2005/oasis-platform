'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/core/supabase/client';

export interface TicketType {
  name: string;
  price: number;
  description: string;
}

export default function TicketSelector({
  event,
  ticketTypes,
}: {
  event: any;
  ticketTypes: TicketType[];
}) {
  const [selectedTier, setSelectedTier] = useState<TicketType>(
    ticketTypes?.[0] || { name: 'General', price: 20000, description: 'Ingreso al evento' }
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'MP' | 'CARD_ASTROPAY'>('TRANSFER');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setEmail(data.user.email || '');
        setName(data.user.user_metadata?.full_name || data.user.user_metadata?.name || '');
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (paymentMethod === 'TRANSFER') {
        let uploadedReceiptUrl = null;

        // Si adjuntó comprobante, subirlo primero
        if (receiptFile) {
          const formData = new FormData();
          formData.append('file', receiptFile);

          const uploadRes = await fetch('/api/checkout/upload-receipt', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.url) {
            uploadedReceiptUrl = uploadData.url;
          }
        }

        const res = await fetch('/api/checkout/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            ticketTier: selectedTier.name,
            amount: selectedTier.price,
            customerName: name,
            customerEmail: email,
            customerDni: dni,
            userId: user?.id || null,
            receiptUrl: uploadedReceiptUrl,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar transferencia');
        setOrderSuccess(data);

      } else if (paymentMethod === 'MP') {
        const res = await fetch('/api/checkout/mercadopago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            ticketTier: selectedTier.name,
            amount: selectedTier.price,
            customerName: name,
            customerEmail: email,
            customerDni: dni,
            userId: user?.id || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con Mercado Pago');

        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          alert(`Orden de Mercado Pago #${data.referenceCode} registrada.`);
          window.location.href = '/my-tickets';
        }

      } else if (paymentMethod === 'CARD_ASTROPAY') {
        const res = await fetch('/api/checkout/astropay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            ticketTier: selectedTier.name,
            amount: selectedTier.price,
            customerName: name,
            customerEmail: email,
            customerDni: dni,
            userId: user?.id || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con pasarela');

        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          alert(`Orden #${data.referenceCode} iniciada. En producción deriva al popup de Apple Pay.`);
          window.location.href = '/my-tickets';
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="bg-neutral-900 border border-yellow-400/40 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        <div className="w-12 h-12 bg-yellow-400/20 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>

        <div>
          <span className="text-[10px] font-mono tracking-widest text-yellow-400 uppercase font-bold">
            Orden #{orderSuccess.referenceCode} Registrada
          </span>
          <h2 className="text-2xl font-black uppercase text-white mt-1">
            Comprobante Enviado
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-2">
            Tu transferencia está en cola de verificación. Al ser confirmada, tu entrada con QR estará disponible inmediatamente.
          </p>
        </div>

        <div className="bg-black/60 border border-neutral-800 rounded-2xl p-4 text-left font-mono space-y-2 text-xs">
          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-neutral-400">Monto:</span>
            <span className="text-yellow-400 font-bold text-sm">${selectedTier.price.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-neutral-400">Alias CBU/CVU:</span>
            <span className="text-white font-bold select-all">{event?.bank_alias || 'OASIS.OFICIAL.PROD'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Código Ref:</span>
            <span className="text-amber-400 font-bold">{orderSuccess.referenceCode}</span>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/my-tickets')}
          className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold font-mono text-xs uppercase rounded-xl transition-all"
        >
          Ir a Mis Entradas →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div>
        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
          Paso 1: Seleccioná tu Tanda
        </span>
        <h2 className="text-xl sm:text-2xl font-black uppercase text-white mt-1">
          Comprar Entradas
        </h2>
      </div>

      <div className="space-y-2">
        {ticketTypes.map((tier) => (
          <div
            key={tier.name}
            onClick={() => setSelectedTier(tier)}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex justify-between items-center ${
              selectedTier.name === tier.name
                ? 'bg-yellow-400/10 border-yellow-400 text-white shadow-lg'
                : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <div>
              <p className="font-black uppercase text-sm text-white">{tier.name}</p>
              <p className="text-[11px] font-mono text-neutral-400">{tier.description}</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-sm text-yellow-400">
                ${tier.price.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold block mb-2">
          Paso 2: Método de Pago
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('TRANSFER')}
            className={`p-3 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
              paymentMethod === 'TRANSFER'
                ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <span className="text-base">🏦</span>
            <span>Transferencia</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('MP')}
            className={`p-3 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
              paymentMethod === 'MP'
                ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <span className="text-base">🟢</span>
            <span>Mercado Pago</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('CARD_ASTROPAY')}
            className={`p-3 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
              paymentMethod === 'CARD_ASTROPAY'
                ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <span className="text-base">🍎</span>
            <span>Tarjetas/Apple</span>
          </button>
        </div>
      </div>

      {paymentMethod === 'TRANSFER' && (
        <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-2xl font-mono text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-400">Alias CBU/CVU:</span>
            <span className="text-yellow-400 font-bold select-all">{event?.bank_alias || 'OASIS.OFICIAL.PROD'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Titular:</span>
            <span className="text-white">{event?.bank_holder_name || 'OASIS Producciones S.A.'}</span>
          </div>
        </div>
      )}

      <form onSubmit={handlePurchase} className="space-y-3 font-mono">
        <div>
          <label className="text-[10px] text-neutral-400 uppercase">Nombre Completo (en DNI)</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej: Lucas Rossi"
            className="w-full mt-1 bg-black/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-[10px] text-neutral-400 uppercase">DNI / Documento</label>
          <input
            type="text"
            required
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="ej: 40123456"
            className="w-full mt-1 bg-black/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-[10px] text-neutral-400 uppercase">Email de Entrega</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ej: lucas@email.com"
            className="w-full mt-1 bg-black/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-400"
          />
        </div>

        {paymentMethod === 'TRANSFER' && (
          <div>
            <label className="text-[10px] text-neutral-400 uppercase block mb-1">
              Adjuntar Comprobante de Transferencia (Captura / PDF)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
            />
            {receiptPreview && (
              <div className="mt-2 text-[10px] text-yellow-400 font-mono">
                ✓ Comprobante listo para enviar ({receiptFile?.name})
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black font-mono text-xs uppercase rounded-xl transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50"
        >
          {loading ? 'Subiendo y Procesando...' : `Confirmar Pase — $${selectedTier.price.toLocaleString('es-AR')}`}
        </button>
      </form>
    </div>
  );
}
