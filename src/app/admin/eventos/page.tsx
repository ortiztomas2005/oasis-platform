'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AuroraBackground from '@/components/fx/AuroraBackground';

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
  has_bar?: boolean;
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
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

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

  // Paso 3: barra en vivo. Es opt-in — si la productora dice que no,
  // el evento no lleva ninguna carta y listo (nada más que preguntar).
  const [hasBar, setHasBar] = useState(false);
  const [barItems, setBarItems] = useState<{ name: string; price: string; stock: string }[]>([]);
  const [newBarItem, setNewBarItem] = useState({ name: '', price: '', stock: '' });

  const addBarItem = () => {
    if (!newBarItem.name.trim()) return;
    setBarItems((prev) => [...prev, { ...newBarItem }]);
    setNewBarItem({ name: '', price: '', stock: '' });
  };
  const removeBarItem = (idx: number) => setBarItems((prev) => prev.filter((_, i) => i !== idx));

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
    setHasBar(false);
    setBarItems([]);
    setNewBarItem({ name: '', price: '', stock: '' });
    setWizardStep(1);
    setFormError(null);
  };

  const goToStep = (next: 1 | 2 | 3) => {
    setFormError(null);
    if (next === 2) {
      if (!title.trim()) return setFormError('Falta el nombre del evento.');
      if (!date) return setFormError('Falta la fecha del evento.');
      if (!venue.trim()) return setFormError('Falta el lugar del evento.');
    }
    if (next === 3) {
      if (tiers.some((t) => !t.name.trim() || t.price < 0 || t.capacity <= 0)) {
        return setFormError('Revisá las tandas: todas necesitan nombre, precio válido y capacidad mayor a 0.');
      }
    }
    setWizardStep(next);
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
          hasBar,
          barItems,
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

  // Antes solo se podían cargar tandas al crear el evento — si después
  // necesitabas sumar una (ej: agregar "VIP" a un evento que ya estaba
  // publicado) no había forma de hacerlo sin tocar la base a mano.
  const EMPTY_NEW_TIER_FORM = { name: '', price: '', capacity: '', description: '', entryCutoffTime: '' };
  const [newTierForm, setNewTierForm] = useState(EMPTY_NEW_TIER_FORM);
  const [addingTier, setAddingTier] = useState(false);

  const addTierToEvent = async (eventId: string) => {
    if (!newTierForm.name.trim() || !newTierForm.price || !newTierForm.capacity) {
      alert('Completá nombre, precio y capacidad de la tanda.');
      return;
    }
    setAddingTier(true);
    try {
      const res = await fetch(`/api/producers/events/${eventId}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTierForm.name,
          price: Number(newTierForm.price),
          capacity: Number(newTierForm.capacity),
          description: newTierForm.description,
          entryCutoffTime: newTierForm.entryCutoffTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewTierForm(EMPTY_NEW_TIER_FORM);
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingTier(false);
    }
  };

  const removeTierFromEvent = async (eventId: string, tierId: string) => {
    if (!confirm('¿Eliminar esta tanda?')) return;
    setSavingTierId(tierId);
    try {
      const res = await fetch(`/api/producers/events/${eventId}/tiers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
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

  const toggleHasBar = async (ev: EventRow) => {
    try {
      const res = await fetch(`/api/producers/events/${ev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasBar: !ev.has_bar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070d] text-white p-4 sm:p-10 font-mono overflow-x-hidden">
      <AuroraBackground />
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block truncate">
              {producerName || 'Tu Productora'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-white">Mis Eventos</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (showForm) resetForm();
                setShowForm((v) => !v);
              }}
              className="px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-out-strong text-white font-black text-xs uppercase rounded-xl cursor-pointer whitespace-nowrap"
            >
              {showForm ? 'Cancelar' : '+ Crear Evento'}
            </button>
            <Link href="/admin" className="text-xs text-neutral-400 hover:text-white transition-colors duration-150 ease-out-strong whitespace-nowrap">
              ← Panel
            </Link>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-6 space-y-5">
            {/* INDICADOR DE PASOS */}
            <div className="flex items-center gap-2">
              {([
                { n: 1, label: 'Datos del evento' },
                { n: 2, label: 'Tandas y pagos' },
                { n: 3, label: 'Barra' },
              ] as const).map((s, i) => (
                <React.Fragment key={s.n}>
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase shrink-0 ${
                    wizardStep === s.n ? 'text-blue-400' : wizardStep > s.n ? 'text-emerald-400' : 'text-neutral-600'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                      wizardStep === s.n ? 'border-blue-400 bg-blue-500/10' : wizardStep > s.n ? 'border-emerald-400 bg-emerald-500/10' : 'border-neutral-700'
                    }`}>
                      {wizardStep > s.n ? '✓' : s.n}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-px ${wizardStep > s.n ? 'bg-emerald-400/40' : 'bg-neutral-800'}`} />}
                </React.Fragment>
              ))}
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl">
                ⚠️ {formError}
              </div>
            )}

            {/* PASO 1: DATOS DEL EVENTO */}
            {wizardStep === 1 && (
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
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Lugar (venue) *</label>
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
            )}

            {/* PASO 2: TANDAS Y MÉTODOS DE PAGO */}
            {wizardStep === 2 && (
              <>
                <div className="space-y-2">
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
              </>
            )}

            {/* PASO 3: BARRA */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-blue-400 uppercase font-bold block">¿Querés barra en vivo en tu evento?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHasBar(true)}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                        hasBar ? 'bg-blue-500/15 border-blue-500 text-blue-300' : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      🍸 Sí, quiero barra
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasBar(false)}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                        !hasBar ? 'bg-white/10 border-white/30 text-white' : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      No, sin barra
                    </button>
                  </div>
                </div>

                {hasBar && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Carta inicial (podés seguir editándola después desde Escáner de Barra)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_90px_auto] gap-2">
                      <input
                        placeholder="Bebida (ej: Gin Tonic)"
                        value={newBarItem.name}
                        onChange={(e) => setNewBarItem({ ...newBarItem, name: e.target.value })}
                        className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={newBarItem.price}
                        onChange={(e) => setNewBarItem({ ...newBarItem, price: e.target.value })}
                        className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newBarItem.stock}
                        onChange={(e) => setNewBarItem({ ...newBarItem, stock: e.target.value })}
                        className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addBarItem}
                        className="px-4 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition cursor-pointer"
                      >
                        + Agregar
                      </button>
                    </div>

                    {barItems.length > 0 && (
                      <div className="space-y-1.5">
                        {barItems.map((b, idx) => (
                          <div key={idx} className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-black/40 border border-white/10 text-xs">
                            <span className="text-white font-bold">{b.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-neutral-400">${Number(b.price || 0).toLocaleString('es-AR')} · Stock: {b.stock || 0}</span>
                              <button type="button" onClick={() => removeBarItem(idx)} className="text-rose-400 hover:text-rose-300 cursor-pointer">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NAVEGACIÓN DEL WIZARD */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => { setFormError(null); setWizardStep((wizardStep - 1) as 1 | 2); }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-xs font-bold hover:bg-white/5 transition cursor-pointer"
                >
                  ← Atrás
                </button>
              ) : <span />}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => goToStep((wizardStep + 1) as 2 | 3)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Siguiente →
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                    Publicar ahora
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Publicando...' : 'Publicar Evento 🚀'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-blue-400">{error}</p>
        ) : events.length === 0 ? (
          <div className="animate-fade-in py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Todavía no creaste ningún evento.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              return (
                <div key={ev.id} className="bg-[#0b1120] border border-white/10 hover:border-blue-500/30 rounded-2xl overflow-hidden transition-colors duration-200 ease-out-strong">
                  {/* CABECERA: estado, nombre y datos clave */}
                  <div className="p-4 sm:p-5 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                            ev.status === 'PUBLISHED' || ev.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : ev.status === 'CANCELLED'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}
                        >
                          {ev.status === 'CANCELLED' ? 'Suspendido' : ev.status === 'PUBLISHED' || ev.status === 'ACTIVE' ? 'Publicado' : 'Borrador'}
                        </span>
                        {ev.has_bar && (
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-blue-500/30 bg-blue-500/10 text-blue-300">
                            🍸 Con barra
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight break-words">{ev.name || ev.title}</h3>
                      <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 flex-wrap">
                        <span className="break-words">📍 {ev.venue}</span>
                        <span className="whitespace-nowrap">📅 {ev.date ? new Date(ev.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        <span className="whitespace-nowrap">🎟️ {(ev.ticket_tiers || []).length} tanda{(ev.ticket_tiers || []).length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    <Link
                      href={`/events/${ev.slug}`}
                      target="_blank"
                      className="shrink-0 text-[11px] px-3.5 py-2 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 active:scale-95 transition-[color,border-color,transform] duration-150 ease-out-strong"
                    >
                      Ver página ↗
                    </Link>
                  </div>

                  {/* BARRA DE ACCIONES */}
                  <div className="px-4 sm:px-5 py-3 border-t border-white/5 bg-black/20 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleHasBar(ev)}
                      className={`text-[11px] px-3 py-2 sm:py-1.5 rounded-lg border active:scale-95 transition-[background-color,color,border-color,transform] duration-150 ease-out-strong cursor-pointer ${
                        ev.has_bar
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                          : 'border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      🍸 {ev.has_bar ? 'Con barra' : 'Sin barra'}
                    </button>
                    {ev.has_bar && (
                      <Link href="/admin/barra" className="text-[11px] px-3 py-2 sm:py-1.5 rounded-lg border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 active:scale-95 transition-[color,border-color,transform] duration-150 ease-out-strong">
                        Editar carta
                      </Link>
                    )}

                    <div className="hidden sm:block w-px h-4 bg-white/10 mx-1" />

                    {ev.status === 'CANCELLED' ? (
                      <button
                        onClick={() => setEventStatus(ev, 'DRAFT')}
                        className="text-[11px] px-3 py-2 sm:py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-[background-color,transform] duration-150 ease-out-strong cursor-pointer"
                      >
                        Reactivar (a borrador)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleStatus(ev)}
                          className="text-[11px] px-3 py-2 sm:py-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 active:scale-95 transition-[color,border-color,transform] duration-150 ease-out-strong cursor-pointer"
                        >
                          {ev.status === 'PUBLISHED' || ev.status === 'ACTIVE' ? 'Pasar a borrador' : 'Publicar'}
                        </button>
                        <button
                          onClick={() => setEventStatus(ev, 'CANCELLED')}
                          className="text-[11px] px-3 py-2 sm:py-1.5 rounded-lg border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 active:scale-95 transition-[background-color,transform] duration-150 ease-out-strong cursor-pointer"
                        >
                          Suspender
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setNewTierForm(EMPTY_NEW_TIER_FORM);
                        setExpandedEventId(isExpanded ? null : ev.id);
                      }}
                      className="w-full sm:w-auto sm:ml-auto text-[11px] px-3.5 py-2 sm:py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out-strong cursor-pointer font-bold text-center"
                    >
                      {isExpanded ? 'Cerrar tandas ▲' : 'Gestionar tandas ▾'}
                    </button>
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
                                {t.available_capacity === t.total_capacity && (
                                  <button
                                    onClick={() => removeTierFromEvent(ev.id, t.id)}
                                    disabled={busy}
                                    className="self-start sm:self-auto text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer disabled:opacity-50"
                                  >
                                    Quitar tanda
                                  </button>
                                )}
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

                      {/* AGREGAR TANDA NUEVA */}
                      <div className="p-3.5 rounded-xl bg-[#05070d] border border-dashed border-white/15 space-y-2">
                        <span className="text-[10px] text-blue-400 uppercase font-bold block">+ Agregar tanda nueva</span>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_110px] gap-2">
                          <input
                            placeholder="Nombre (ej: VIP)"
                            value={newTierForm.name}
                            onChange={(e) => setNewTierForm({ ...newTierForm, name: e.target.value })}
                            className="px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-white outline-none focus:border-blue-500"
                          />
                          <input
                            type="number"
                            min={0}
                            placeholder="Precio"
                            value={newTierForm.price}
                            onChange={(e) => setNewTierForm({ ...newTierForm, price: e.target.value })}
                            className="px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-white outline-none focus:border-blue-500"
                          />
                          <input
                            type="number"
                            min={1}
                            placeholder="Capacidad"
                            value={newTierForm.capacity}
                            onChange={(e) => setNewTierForm({ ...newTierForm, capacity: e.target.value })}
                            className="px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-2">
                          <input
                            placeholder="Descripción breve (opcional)"
                            value={newTierForm.description}
                            onChange={(e) => setNewTierForm({ ...newTierForm, description: e.target.value })}
                            className="px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-neutral-300 outline-none focus:border-blue-500"
                          />
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-neutral-500 whitespace-nowrap">Hora límite:</label>
                            <input
                              type="time"
                              value={newTierForm.entryCutoffTime}
                              onChange={(e) => setNewTierForm({ ...newTierForm, entryCutoffTime: e.target.value })}
                              className="flex-1 px-2 py-2 bg-black/60 border border-white/10 rounded-lg text-[11px] text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => addTierToEvent(ev.id)}
                          disabled={addingTier}
                          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
                        >
                          {addingTier ? 'Agregando...' : '+ Agregar tanda'}
                        </button>
                      </div>
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
