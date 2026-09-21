'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Cost {
  id: string;
  event_id: string;
  category: string;
  concept: string;
  amount: number;
  is_paid: boolean;
  created_at: string;
  events?: { name?: string; title?: string };
}

interface EventOption {
  id: string;
  name: string;
  title: string;
}

export default function ProducerCostsPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({ event_id: '', category: 'General', concept: '', amount: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [costsRes, eventsRes] = await Promise.all([
        fetch('/api/producers/costs'),
        fetch('/api/producers/events'),
      ]);
      const costsData = await costsRes.json();
      if (!costsRes.ok) throw new Error(costsData.error || 'Error al cargar gastos');
      setCosts(costsData.costs || []);

      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        const opts = (eventsData.events || []).map((e: any) => ({ id: e.id, name: e.name, title: e.title }));
        setEvents(opts);
        setForm((prev) => ({ ...prev, event_id: prev.event_id || opts[0]?.id || '' }));
      }
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event_id || !form.concept.trim() || !form.amount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/producers/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar gasto');
      setForm((prev) => ({ ...prev, category: 'General', concept: '', amount: '' }));
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePaid = async (cost: Cost) => {
    setBusyId(cost.id);
    try {
      const res = await fetch('/api/producers/costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cost.id, is_paid: !cost.is_paid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (cost: Cost) => {
    if (!confirm(`¿Eliminar el gasto "${cost.concept}"?`)) return;
    setBusyId(cost.id);
    try {
      const res = await fetch('/api/producers/costs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cost.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const total = costs.reduce((sum, c) => sum + Number(c.amount), 0);
  const unpaid = costs.filter((c) => !c.is_paid).reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">Cobros & Gastos</span>
            <h1 className="text-2xl font-black uppercase text-white">Costos por evento</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#0c0f16] border border-white/10">
            <span className="text-[10px] text-neutral-500 uppercase">Total gastado</span>
            <p className="text-xl font-black text-white">${total.toLocaleString('es-AR')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0c0f16] border border-white/10">
            <span className="text-[10px] text-neutral-500 uppercase">Pendiente de pagar</span>
            <p className="text-xl font-black text-rose-400">${unpaid.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
          <span className="text-xs font-bold text-white uppercase block">Nuevo gasto</span>
          {events.length === 0 ? (
            <p className="text-[11px] text-amber-400">Primero creá un evento en Eventos (real) para poder cargarle gastos.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.event_id}
                  onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                  className="px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name || ev.title}
                    </option>
                  ))}
                </select>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
                >
                  {['General', 'Locación', 'Artistas', 'Producción', 'Seguridad', 'Marketing', 'Otro'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={form.concept}
                  onChange={(e) => setForm({ ...form, concept: e.target.value })}
                  placeholder="Concepto (ej: Sonido)"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
                />
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Monto"
                  className="px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Agregando...' : '+ Agregar gasto'}
              </button>
            </>
          )}
        </form>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : costs.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Todavía no cargaste ningún gasto.
          </div>
        ) : (
          <div className="space-y-2">
            {costs.map((c) => (
              <div key={c.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-sm font-bold text-white block">{c.concept}</span>
                  <span className="text-[11px] text-neutral-400">
                    {c.category} · {c.events?.name || c.events?.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-300 font-black text-sm">${Number(c.amount).toLocaleString('es-AR')}</span>
                  <button
                    onClick={() => togglePaid(c)}
                    disabled={busyId === c.id}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer disabled:opacity-50 ${
                      c.is_paid
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {c.is_paid ? 'Pagado' : 'Pendiente'}
                  </button>
                  <button
                    onClick={() => remove(c)}
                    disabled={busyId === c.id}
                    className="text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    Eliminar
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
