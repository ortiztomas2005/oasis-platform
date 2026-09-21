'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Alert {
  id: string;
  event_id: string | null;
  title: string;
  message: string;
  created_at: string;
  events?: { name?: string; title?: string };
}

interface EventOption {
  id: string;
  name: string;
  title: string;
}

export default function BroadcastPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ event_id: '', title: '', message: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [alertsRes, eventsRes] = await Promise.all([fetch('/api/producers/broadcast'), fetch('/api/producers/events')]);
      const alertsData = await alertsRes.json();
      if (!alertsRes.ok) throw new Error(alertsData.error || 'Error al cargar avisos');
      setAlerts(alertsData.alerts || []);

      const eventsData = await eventsRes.json();
      if (eventsRes.ok) setEvents((eventsData.events || []).map((e: any) => ({ id: e.id, name: e.name, title: e.title })));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/producers/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: form.event_id || null, title: form.title, message: form.message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar el aviso');
      setForm({ event_id: '', title: '', message: '' });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">Broadcast & Alertas</span>
            <h1 className="text-2xl font-black uppercase text-white">Avisos a tus compradores</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
          <select
            value={form.event_id}
            onChange={(e) => setForm({ ...form, event_id: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
          >
            <option value="">🌐 Todos tus eventos</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name || ev.title}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título del aviso"
            className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Mensaje detallado..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
          />
          <p className="text-[10px] text-neutral-500">
            Se muestra en <strong className="text-neutral-400">/my-tickets</strong> a cualquiera que tenga una entrada del evento elegido (o de cualquiera de tus eventos si no elegís uno).
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Enviando...' : 'Enviar aviso 📢'}
          </button>
        </form>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Todavía no enviaste ningún aviso.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-bold text-white">{a.title}</span>
                  <span className="text-[10px] text-neutral-500 shrink-0">{new Date(a.created_at).toLocaleString('es-AR')}</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">{a.message}</p>
                <span className="text-[10px] text-amber-400 uppercase font-bold mt-2 block">
                  {a.events?.name || a.events?.title || 'Todos los eventos'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
