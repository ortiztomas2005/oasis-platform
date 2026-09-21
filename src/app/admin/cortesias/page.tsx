'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface EventOption {
  id: string;
  name: string;
  title: string;
  ticket_tiers?: { name: string }[];
}

interface Producer {
  name: string;
  prepaid_balance: number;
}

export default function ProducerCourtesyPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    event_id: '',
    tier_name: 'VIP INVITADO',
    holder_name: '',
    holder_email: '',
    holder_dni: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [eventsRes, meRes] = await Promise.all([fetch('/api/producers/events'), fetch('/api/producers/me')]);
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        setEvents(eventsData.events || []);
        setForm((prev) => ({ ...prev, event_id: prev.event_id || eventsData.events?.[0]?.id || '' }));
      }
      const meData = await meRes.json();
      if (meRes.ok && meData.producer) {
        setProducer({ name: meData.producer.name, prepaid_balance: meData.producer.prepaid_balance });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event_id || !form.holder_name.trim() || !form.holder_email.trim() || !form.holder_dni.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tickets/courtesy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir la cortesía');
      setMessage({ type: 'ok', text: `Cortesía emitida para ${form.holder_name}.` });
      setForm((prev) => ({ ...prev, holder_name: '', holder_email: '', holder_dni: '' }));
      await load();
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === form.event_id);

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">Guestlist & Cortesías</span>
            <h1 className="text-2xl font-black uppercase text-white">Enviar entrada de cortesía</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        {producer && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              producer.prepaid_balance > 0
                ? 'bg-[#0c0f16] border-white/10 text-neutral-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            Cada cortesía descuenta 1 ticket de tu saldo prepago. Te quedan{' '}
            <strong className={producer.prepaid_balance > 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {producer.prepaid_balance} tickets
            </strong>
            . {producer.prepaid_balance <= 0 && (
              <Link href="/admin/comprar-tickets" className="text-amber-400 underline ml-1">
                Comprar más →
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : events.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Primero creá un evento en Eventos (real) para poder enviar cortesías.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
            <select
              value={form.event_id}
              onChange={(e) => setForm({ ...form, event_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name || ev.title}
                </option>
              ))}
            </select>

            <select
              value={form.tier_name}
              onChange={(e) => setForm({ ...form, tier_name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
            >
              <option value="VIP INVITADO">VIP INVITADO</option>
              {(selectedEvent?.ticket_tiers || []).map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              value={form.holder_name}
              onChange={(e) => setForm({ ...form, holder_name: e.target.value })}
              placeholder="Nombre completo"
              className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
            />
            <input
              value={form.holder_email}
              onChange={(e) => setForm({ ...form, holder_email: e.target.value })}
              placeholder="Email"
              type="email"
              className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
            />
            <input
              value={form.holder_dni}
              onChange={(e) => setForm({ ...form, holder_dni: e.target.value })}
              placeholder="DNI"
              className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
            />

            {message && (
              <p className={`text-xs ${message.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{message.text}</p>
            )}

            <button
              type="submit"
              disabled={submitting || (producer !== null && producer.prepaid_balance <= 0)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Emitiendo...' : '🎟️ Emitir cortesía'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
