'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Ticket {
  id: string;
  event_id: string;
  tier_name: string;
  holder_name: string;
  holder_email: string;
  holder_dni: string;
  purchase_price: number;
  status: string;
  created_at: string;
  scanned_at: string | null;
  events?: { name?: string; title?: string };
}

const STATUS_LABEL: Record<string, string> = {
  VALID: 'Válido',
  USED: 'Usado',
  CANCELLED: 'Cancelado',
};

export default function ProducerAttendeesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/attendees');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar asistentes');
      setTickets(data.tickets || []);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.holder_name?.toLowerCase().includes(q) ||
        t.holder_email?.toLowerCase().includes(q) ||
        t.holder_dni?.toLowerCase().includes(q) ||
        (t.events?.name || t.events?.title || '').toLowerCase().includes(q)
    );
  }, [tickets, search]);

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">CRM de Asistentes</span>
            <h1 className="text-2xl font-black uppercase text-white">Entradas vendidas ({tickets.length})</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email, DNI o evento..."
          className="w-full px-4 py-3 rounded-xl bg-[#0c0f16] border border-white/10 text-xs text-white placeholder:text-neutral-600"
        />

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            No hay asistentes que coincidan.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-sm font-bold text-white block">{t.holder_name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {t.holder_email} · DNI {t.holder_dni} · {t.events?.name || t.events?.title} · {t.tier_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-black text-sm">
                    {Number(t.purchase_price) > 0 ? `$${Number(t.purchase_price).toLocaleString('es-AR')}` : 'Cortesía'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      t.status === 'VALID'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : t.status === 'USED'
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {t.scanned_at ? 'Ingresó' : STATUS_LABEL[t.status] || t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
