'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tier {
  id?: string;
  name: string;
  price: number;
  capacity: number;
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
  ticket_tiers?: Tier[];
}

const EMPTY_TIER: Tier = { name: '', price: 0, capacity: 100 };

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

  const handleTierChange = (idx: number, field: keyof Tier, value: string) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: field === 'name' ? value : Number(value) } : t))
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

  const toggleStatus = async (ev: EventRow) => {
    const newStatus = ev.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
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

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              {producerName || 'Tu Productora'}
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Mis Eventos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition cursor-pointer"
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
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
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
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Hora límite de ingreso</label>
                <input type="time" value={doorTime} onChange={(e) => setDoorTime(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Venue *</label>
                <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Ciudad</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Dirección</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Imagen (URL)</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Capacidad total</label>
                <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Datos para pago por transferencia</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={bankAlias} onChange={(e) => setBankAlias(e.target.value)} placeholder="Alias" className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
                <input value={bankCbu} onChange={(e) => setBankCbu(e.target.value)} placeholder="CBU/CVU" className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
                <input value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} placeholder="Titular" className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Tandas de entradas *</span>
                <button
                  type="button"
                  onClick={() => setTiers((prev) => [...prev, { ...EMPTY_TIER }])}
                  className="text-[10px] text-amber-400 underline cursor-pointer"
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
                    className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Precio"
                    value={t.price}
                    onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                    className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Capacidad"
                    value={t.capacity}
                    onChange={(e) => handleTierChange(idx, 'capacity', e.target.value)}
                    className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
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
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creando...' : 'Crear Evento →'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : events.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Todavía no creaste ningún evento.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-sm font-bold text-white block">{ev.name || ev.title}</span>
                  <span className="text-[11px] text-neutral-400">
                    {ev.venue} · {ev.date ? new Date(ev.date).toLocaleString('es-AR') : ''} ·{' '}
                    {(ev.ticket_tiers || []).length} tanda(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      ev.status === 'PUBLISHED' || ev.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {ev.status}
                  </span>
                  <Link href={`/events/${ev.slug}`} target="_blank" className="text-[11px] text-amber-400 underline">
                    Ver página →
                  </Link>
                  <button
                    onClick={() => toggleStatus(ev)}
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
                  >
                    {ev.status === 'PUBLISHED' || ev.status === 'ACTIVE' ? 'Pasar a borrador' : 'Publicar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
