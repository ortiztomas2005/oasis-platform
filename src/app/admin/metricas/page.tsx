'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Totals {
  events: number;
  ticketsSold: number;
  ticketsScanned: number;
  revenue: number;
  pendingOrders: number;
  totalCosts: number;
  unpaidCosts: number;
  netProfit: number;
}

interface SoldByEvent {
  name: string;
  count: number;
  revenue: number;
}

interface Activity {
  type: string;
  label: string;
  at: string;
}

export default function ProducerMetricsPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [soldByEvent, setSoldByEvent] = useState<SoldByEvent[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/producers/metrics');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar métricas');
        setTotals(data.totals);
        setSoldByEvent(data.soldByEvent || []);
        setActivity(data.recentActivity || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">Dashboard & Métricas</span>
            <h1 className="text-2xl font-black uppercase text-white">Reportes y actividad en vivo</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : totals ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Eventos', value: totals.events, color: 'text-white' },
                { label: 'Entradas vendidas', value: totals.ticketsSold, color: 'text-emerald-400' },
                { label: 'Ingresadas (puerta)', value: totals.ticketsScanned, color: 'text-sky-400' },
                { label: 'Órdenes pendientes', value: totals.pendingOrders, color: 'text-amber-400' },
              ].map((c) => (
                <div key={c.label} className="p-4 rounded-2xl bg-[#0c0f16] border border-white/10">
                  <span className="text-[10px] text-neutral-500 uppercase block">{c.label}</span>
                  <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#0c0f16] border border-white/10">
                <span className="text-[10px] text-neutral-500 uppercase block">Ingresos</span>
                <p className="text-xl font-black text-emerald-400">${totals.revenue.toLocaleString('es-AR')}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0c0f16] border border-white/10">
                <span className="text-[10px] text-neutral-500 uppercase block">Gastos (${totals.unpaidCosts.toLocaleString('es-AR')} sin pagar)</span>
                <p className="text-xl font-black text-rose-400">${totals.totalCosts.toLocaleString('es-AR')}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0c0f16] border border-white/10">
                <span className="text-[10px] text-neutral-500 uppercase block">Ganancia neta</span>
                <p className={`text-xl font-black ${totals.netProfit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                  ${totals.netProfit.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            {soldByEvent.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase block">Ventas por evento</span>
                {soldByEvent.map((s) => (
                  <div key={s.name} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm text-white">{s.name}</span>
                    <span className="text-xs text-neutral-400">
                      {s.count} entradas · <span className="text-emerald-400 font-bold">${s.revenue.toLocaleString('es-AR')}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase block">Actividad reciente</span>
              {activity.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
                  Todavía no hay actividad registrada.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activity.map((a, i) => (
                    <div key={i} className="bg-[#0c0f16] border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-xs text-neutral-300">{a.label}</span>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {new Date(a.at).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
