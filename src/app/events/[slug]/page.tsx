'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicEventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const refCode = searchParams.get('ref') || '';

  const [event, setEvent] = useState<any | null>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario Comprador
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDni, setCustomerDni] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  useEffect(() => {
    if (slug) {
      fetchEventData();
    }
  }, [slug]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${slug}`);
      const data = await res.json();
      if (res.ok && data.event) {
        setEvent(data.event);
        setTiers(data.tiers || []);
        if (data.tiers && data.tiers.length > 0) {
          setSelectedTier(data.tiers[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier || !event) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/checkout/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ticketTier: selectedTier.name,
          amount: selectedTier.price,
          customerName,
          customerEmail,
          customerDni,
          receiptBase64,
          promoterCode: refCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar compra');

      setOrderCompleted(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs text-neutral-500">
        Cargando evento oficial OASIS...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono gap-4">
        <p className="text-neutral-400">Evento no encontrado o finalizado.</p>
        <Link href="/" className="px-4 py-2 bg-yellow-400 text-black font-bold text-xs rounded-xl uppercase">
          Volver al Inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-yellow-400 selection:text-black">
      {/* HEADER */}
      <header className="border-b border-neutral-900 bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-black text-sm tracking-wider text-yellow-400">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            OASIS TICKETING
          </Link>
          <Link href="/my-tickets" className="font-mono text-xs text-neutral-400 hover:text-white uppercase font-bold">
            Mis Entradas ↗
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {orderCompleted ? (
          /* PANTALLA DE ÉXITO */
          <div className="max-w-md mx-auto bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-yellow-400 text-black rounded-2xl flex items-center justify-center mx-auto text-2xl font-black shadow-lg shadow-yellow-400/20">
              ✓
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-widest">
                Transferencia Registrada
              </span>
              <h2 className="text-2xl font-black uppercase text-white">¡Orden en Verificación!</h2>
              <p className="text-xs text-neutral-400 font-mono">
                Revisaremos tu comprobante a la brevedad. Al confirmarse, recibirás tu entrada oficial con QR por mail y WhatsApp.
              </p>
            </div>

            <div className="bg-black/60 border border-neutral-800 p-4 rounded-2xl text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Referencia:</span>
                <span className="font-bold text-white uppercase">{orderCompleted.referenceCode || 'TR-OASIS'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Monto:</span>
                <span className="font-bold text-yellow-400">${Number(selectedTier?.price).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Titular:</span>
                <span className="font-bold text-white">{customerName}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/my-tickets"
                className="block w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs uppercase rounded-xl transition-all shadow-lg"
              >
                Ir a Mis Entradas
              </Link>
            </div>
          </div>
        ) : (
          /* DETALLE DE VENTA Y CHECKOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* COLUMNA IZQUIERDA: INFORMACIÓN DEL EVENTO */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-video">
                <img
                  src={event.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'}
                  alt={event.name || event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 space-y-1">
                  {refCode && (
                    <span className="inline-block bg-yellow-400 text-black font-mono font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full mb-2">
                      Acceso RRPP: {refCode}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
                    {event.name || event.title}
                  </h1>
                  <p className="text-xs font-mono text-neutral-300 flex items-center gap-3">
                    <span>📍 {event.venue || event.venue_name || 'Buenos Aires'}</span>
                    <span>•</span>
                    <span>📅 {event.date ? new Date(event.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Próximamente'}</span>
                  </p>
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 font-mono text-xs space-y-3">
                <h3 className="font-bold uppercase text-yellow-400 text-xs">Información del Evento</h3>
                <p className="text-neutral-400 leading-relaxed">
                  {event.description || 'Ingreso exclusivo con acreditación digital OASIS. Sistema anticopia y trazabilidad nominal.'}
                </p>
              </div>

              {/* SELECCIÓN DE TANDAS */}
              <div className="space-y-3 font-mono">
                <h3 className="text-xs uppercase font-bold text-yellow-400">Seleccionar Entrada</h3>
                {tiers.length === 0 ? (
                  <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900/40 text-neutral-500 text-xs">
                    No hay tandas activas en este momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {tiers.map((t) => {
                      const isSelected = selectedTier?.id === t.id;
                      const isSoldOut = t.status === 'SOLD_OUT';
                      return (
                        <div
                          key={t.id}
                          onClick={() => !isSoldOut && setSelectedTier(t)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-400/10 shadow-lg'
                              : isSoldOut
                              ? 'border-neutral-800/40 bg-neutral-900/20 opacity-50 cursor-not-allowed'
                              : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold uppercase text-white text-sm">{t.name}</span>
                              {isSoldOut && (
                                <span className="bg-neutral-800 text-neutral-400 text-[9px] uppercase px-2 py-0.5 rounded-full font-bold">
                                  Agotado
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500">Acceso oficial garantizado</span>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-yellow-400">${Number(t.price).toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: CHECKOUT / TRANSFERENCIA */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl sticky top-24 font-mono">
                <div>
                  <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest block">Checkout Directo</span>
                  <h3 className="text-xl font-black uppercase text-white">Datos de Acreditación</h3>
                </div>

                {/* DATOS BANCARIOS */}
                <div className="bg-black/80 border border-yellow-400/30 rounded-2xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Transferir a CBU / Alias Oficial:</span>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-yellow-400 text-sm">{event.cbu_alias || 'OASIS.OFICIAL'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(event.cbu_alias || 'OASIS.OFICIAL');
                        alert('¡Alias CBU copiado!');
                      }}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-bold rounded-lg uppercase"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="border-t border-neutral-800/80 pt-2 flex justify-between text-neutral-400 text-[11px]">
                    <span>Monto a transferir:</span>
                    <strong className="text-white font-bold">${Number(selectedTier?.price || 0).toLocaleString('es-AR')}</strong>
                  </div>
                </div>

                {/* FORMULARIO */}
                <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Tomás Ortiz"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-yellow-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">DNI / Documento *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 42123456"
                      value={customerDni}
                      onChange={(e) => setCustomerDni(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-yellow-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Email para recibir el Ticket *</label>
                    <input
                      type="email"
                      required
                      placeholder="nombre@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-yellow-400"
                    />
                  </div>

                  {/* ADJUNTAR COMPROBANTE */}
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Adjuntar Comprobante (Opcional pero recomendado)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-[11px] text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-neutral-800 file:text-yellow-400 hover:file:bg-neutral-700 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedTier}
                    className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-xl transition-all shadow-lg shadow-yellow-400/10 disabled:opacity-50 text-xs"
                  >
                    {submitting ? 'Enviando Comprobante...' : `Confirmar Transferencia ($${Number(selectedTier?.price || 0).toLocaleString('es-AR')})`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}