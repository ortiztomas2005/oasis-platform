'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tier {
  id?: string;
  name: string;
  price: number;
  capacity: number;
  showStockToClients: boolean;
  lowStockThreshold: number;
  description: string;
  entryCutoffTime: string;
}

interface ExistingTier {
  id: string;
  name: string;
  price: number;
  total_capacity?: number;
  available_capacity?: number;
  status?: string;
  show_stock_to_clients?: boolean;
  low_stock_threshold?: number;
  description?: string;
  entry_cutoff_time?: string;
}

interface EventRow {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  venue?: string;
  date?: string;
  status: string;
  image_url?: string;
  ticket_tiers?: ExistingTier[];
}

const EMPTY_TIER: Tier = {
  name: '',
  price: 0,
  capacity: 100,
  showStockToClients: true,
  lowStockThreshold: 10,
  description: '',
  entryCutoffTime: '',
};

export default function ProducerEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [producerName, setProducerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [doorTime, setDoorTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [capacity, setCapacity] = useState('500');
  const [bankAlias, setBankAlias] = useState('');
  const [bankCbu, setBankCbu] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [publish, setPublish] = useState(true);
  const [tiers, setTiers] = useState<Tier[]>([{ ...EMPTY_TIER }]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/events');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar eventos');
      setEvents(data.events || []);
      setProducerName(data.producerName || null);
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVenue('');
    setAddress('');
    setCity('');
    setDate('');
    setDoorTime('');
    setImageUrl('');
    setCapacity('500');
    setBankAlias('');
    setBankCbu('');
    setBankHolderName('');
    setPublish(true);
    setTiers([{ ...EMPTY_TIER }]);
    setFormError(null);
  };

  const handleTierToggle = (idx: number, field: 'showStockToClients') => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: !t[field] } : t)));
  };

  const TEXT_TIER_FIELDS: (keyof Tier)[] = ['name', 'description', 'entryCutoffTime'];

  const handleTierChange = (idx: number, field: keyof Tier, value: string) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: TEXT_TIER_FIELDS.includes(field) ? value : Number(value) } : t))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (tiers.some((t) => !t.name.trim() || t.price < 0 || t.capacity <= 0)) {
      setFormError('Revisá las tandas: todas necesitan nombre, precio válido y capacidad mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/producers/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          venue,
          address,
          city,
          date,
          doorTime,
          imageUrl,
          capacity,
          bankAlias,
          bankCbu,
          bankHolderName,
          publish,
          tiers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el evento');

      resetForm();
      setShowForm(false);
      await load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [savingTierId, setSavingTierId] = useState<string | null>(null);

  const updateTierConfig = async (eventId: string, tierId: string, patch: Record<string, any>) => {
    setSavingTierId(tierId);
    try {
      const res = await fetch(`/api/producers/events/${eventId}/tiers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTierId(null);
    }
  };

  const setEventStatus = async (ev: EventRow, newStatus: string) => {
    if (newStatus === 'CANCELLED' && !confirm(`¿Suspender "${ev.name || ev.title}"? Va a desaparecer de la cartelera pública hasta que lo reactivés.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/producers/events/${ev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleStatus = (ev: EventRow) =>
    setEventStatus(ev, ev.status === 'PUBLISHED' || ev.status === 'ACTIVE' ? 'DRAFT' : 'PUBLISHED');

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">
              {producerName || 'Tu Productora'}
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Mis Eventos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
            >
              {showForm ? 'Cancelar' : '+ Crear Evento'}
            </button>
            <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
              ← Panel
            </Link>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-6 space-y-5">
            {formError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl">
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Nombre del evento *</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Fecha y hora *</label>
                <input
                  required
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={`${new Date().getFullYear() - 1}-01-01T00:00`}
                  max={`${new Date().getFullYear() + 10}-12-31T23:59`}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Hora límite de ingreso</label>
                <input type="time" value={doorTime} onChange={(e) => setDoorTime(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Venue *</label>
                <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Ciudad</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Dirección</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Imagen (URL)</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Capacidad total</label>
                <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[10px] text-blue-400 uppercase font-bold block">Datos para pago por transferencia</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={bankAlias} onChange={(e) => setBankAlias(e.target.value)} placeholder="Alias" className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
                <input value={bankCbu} onChange={(e) => setBankCbu(e.target.value)} placeholder="CBU/CVU" className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
                <input value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} placeholder="Titular" className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-400 uppercase font-bold block">Tandas de entradas *</span>
                <button
                  type="button"
                  onClick={() => setTiers((prev) => [...prev, { ...EMPTY_TIER }])}
                  className="text-[10px] text-blue-400 underline cursor-pointer"
                >
                  + Agregar tanda
                </button>
              </div>

              {tiers.map((t, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-2 items-center">
                  <input
                    placeholder="Nombre (ej: General T1)"
                    value={t.name}
                    onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                    className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Precio"
                    value={t.price}
                    onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                    className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Capacidad"
                    value={t.capacity}
                    onChange={(e) => handleTierChange(idx, 'capacity', e.target.value)}
                    className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                  />
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTiers((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-rose-400 text-xs cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}

                  <div className="sm:col-span-4 grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                    <input
                      placeholder="Descripción breve (ej: incluye acceso a pista y guardarropa)"
                      value={t.description}
                      onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                      className="px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-[11px] text-neutral-300 outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-neutral-500 whitespace-nowrap">Hora límite:</label>
                      <input
                        type="time"
                        value={t.entryCutoffTime}
                        onChange={(e) => handleTierChange(idx, 'entryCutoffTime', e.target.value)}
                        className="flex-1 px-2 py-2 bg-black/60 border border-white/10 rounded-xl text-[11px] text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-4 pl-1 pb-1">
                    <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.showStockToClients}
                        onChange={() => handleTierToggle(idx, 'showStockToClients')}
                      />
                      Avisar stock bajo al público
                    </label>
                    {t.showStockToClients && (
                      <label className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                        Avisar cuando queden
                        <input
                          type="number"
                          min={0}
                          value={t.lowStockThreshold}
                          onChange={(e) => handleTierChange(idx, 'lowStockThreshold', e.target.value)}
                          className="w-14 px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-center"
                        />
                        o menos
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
              Publicar ahora (si lo desmarcás, queda en borrador)
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-white font-black text-xs uppercase rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creando...' : 'Crear Evento →'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-blue-400">{error}</p>
        ) : events.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Todavía no creaste ningún evento.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              return (
                <div key={ev.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <span className="text-sm font-bold text-white block">{ev.name || ev.title}</span>
                      <span className="text-[11px] text-neutral-400">
                        {ev.venue} · {ev.date ? new Date(ev.date).toLocaleString('es-AR') : ''} ·{' '}
                        {(ev.ticket_tiers || []).length} tanda(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          ev.status === 'PUBLISHED' || ev.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : ev.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {ev.status === 'CANCELLED' ? 'SUSPENDIDO' : ev.status}
                      </span>
                      <Link href={`/events/${ev.slug}`} target="_blank" className="text-[11px] text-blue-400 underline">
                        Ver página →
                      </Link>
                      {ev.status === 'CANCELLED' ? (
                        <button
                          onClick={() => setEventStatus(ev, 'DRAFT')}
                          className="text-[11px] px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                        >
                          Reactivar (a borrador)
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleStatus(ev)}
                            className="text-[11px] px-3 py-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
                          >
                            {ev.status === 'PUBLISHED' || ev.status === 'ACTIVE' ? 'Pasar a borrador' : 'Publicar'}
                          </button>
                          <button
                            onClick={() => setEventStatus(ev, 'CANCELLED')}
                            className="text-[11px] px-3 py-1.5 rounded-lg border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 transition cursor-pointer"
                          >
                            Suspender
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition cursor-pointer"
                      >
                        {isExpanded ? 'Cerrar tandas ▲' : 'Gestionar tandas ▾'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10 p-5 space-y-2.5 bg-black/20">
                      {(ev.ticket_tiers || []).length === 0 ? (
                        <p className="text-[11px] text-neutral-500">Este evento no tiene tandas.</p>
                      ) : (
                        (ev.ticket_tiers || []).map((t) => {
                          const isSoldOut = t.status === 'SOLD_OUT';
                          const busy = savingTierId === t.id;
                          return (
                            <div key={t.id} className="p-3.5 rounded-xl bg-[#05070d] border border-white/10 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                <div>
                                  <span className="text-xs font-bold text-white block">{t.name}</span>
                                  <span className="text-[11px] text-neutral-400">
                                    ${Number(t.price).toLocaleString('es-AR')} · Quedan {t.available_capacity ?? '—'} de {t.total_capacity ?? '—'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-2">
                                <input
                                  defaultValue={t.description || ''}
                                  placeholder="Descripción breve..."
                                  disabled={busy}
                                  onBlur={(e) => updateTierConfig(ev.id, t.id, { description: e.target.value })}
                                  className="px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-neutral-300 outline-none focus:border-blue-500"
                                />
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] text-neutral-500 whitespace-nowrap">Hora límite:</label>
                                  <input
                                    type="time"
                                    defaultValue={t.entry_cutoff_time || ''}
                                    disabled={busy}
                                    onBlur={(e) => updateTierConfig(ev.id, t.id, { entryCutoffTime: e.target.value })}
                                    className="flex-1 px-2 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-white outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-400">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={t.show_stock_to_clients !== false}
                                    disabled={busy}
                                    onChange={(e) => updateTierConfig(ev.id, t.id, { showStockToClients: e.target.checked })}
                                  />
                                  Avisar stock bajo
                                </label>
                                {t.show_stock_to_clients !== false && (
                                  <label className="flex items-center gap-1.5">
                                    Con
                                    <input
                                      type="number"
                                      min={0}
                                      defaultValue={t.low_stock_threshold ?? 10}
                                      disabled={busy}
                                      onBlur={(e) => updateTierConfig(ev.id, t.id, { lowStockThreshold: e.target.value })}
                                      className="w-12 px-1.5 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-center"
                                    />
                                    o menos
                                  </label>
                                )}
                                <button
                                  onClick={() => updateTierConfig(ev.id, t.id, { status: isSoldOut ? 'ACTIVE' : 'SOLD_OUT' })}
                                  disabled={busy}
                                  className={`px-3 py-1.5 rounded-lg font-bold uppercase transition cursor-pointer disabled:opacity-50 ${
                                    isSoldOut
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {busy ? '...' : isSoldOut ? 'Reactivar' : 'Marcar agotada'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
