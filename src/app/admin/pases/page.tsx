'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Ticket {
  id: string;
  event_id: string;
  tier_name: string;
  holder_name: string;
  holder_email: string;
  status: string;
  events?: { name?: string; title?: string };
}

export default function PasesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/attendees');
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) => t.holder_name?.toLowerCase().includes(q) || t.holder_email?.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const resend = async (ticketId: string) => {
    setSendingId(ticketId);
    try {
      const res = await fetch('/api/producers/tickets/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">Pases PDF & App</span>
            <h1 className="text-2xl font-black uppercase text-white">Reenviar pases reales</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full px-4 py-3 rounded-xl bg-[#0c0f16] border border-white/10 text-xs text-white placeholder:text-neutral-600"
        />

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            No hay pases que coincidan.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-sm font-bold text-white block">{t.holder_name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {t.holder_email} · {t.events?.name || t.events?.title} · {t.tier_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tickets/${t.id}/print`}
                    target="_blank"
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white transition"
                  >
                    Ver PDF →
                  </Link>
                  <button
                    onClick={() => resend(t.id)}
                    disabled={sendingId === t.id}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
                  >
                    {sendingId === t.id ? 'Enviando...' : 'Reenviar mail ✉️'}
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
