'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  event_id: string;
  name: string;
  price: number;
  stock: number;
  events?: { name?: string; title?: string };
}

interface Sale {
  id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  created_at: string;
  events?: { name?: string; title?: string };
}

interface EventOption {
  id: string;
  name: string;
  title: string;
}

export default function BarraPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [newItem, setNewItem] = useState({ event_id: '', name: '', price: '', stock: '' });
  const [saleForm, setSaleForm] = useState({ bar_menu_id: '', quantity: '1' });

  const load = async () => {
    setLoading(true);
    try {
      const [menuRes, salesRes, eventsRes] = await Promise.all([
        fetch('/api/producers/bar-menu'),
        fetch('/api/producers/bar-sales'),
        fetch('/api/producers/events'),
      ]);
      const menuData = await menuRes.json();
      if (menuRes.ok) setMenu(menuData.items || []);
      const salesData = await salesRes.json();
      if (salesRes.ok) setSales(salesData.sales || []);
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        const opts = (eventsData.events || []).map((e: any) => ({ id: e.id, name: e.name, title: e.title }));
        setEvents(opts);
        setNewItem((prev) => ({ ...prev, event_id: prev.event_id || opts[0]?.id || '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.event_id || !newItem.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/producers/bar-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, price: Number(newItem.price), stock: Number(newItem.stock) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewItem((prev) => ({ ...prev, name: '', price: '', stock: '' }));
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('¿Eliminar esta bebida de la carta?')) return;
    setBusy(true);
    try {
      await fetch('/api/producers/bar-menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.bar_menu_id) return;
    setBusy(true);
    try {
      const res = await fetch('/api/producers/bar-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_menu_id: saleForm.bar_menu_id, quantity: Number(saleForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaleForm({ bar_menu_id: '', quantity: '1' });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">Escáner de Barra</span>
            <h1 className="text-2xl font-black uppercase text-white">Carta y ventas de barra</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : events.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-xs text-neutral-500">
            Primero creá un evento en Eventos (real) para poder cargarle una carta de barra.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">🍸 Registrar venta</span>
                <form onSubmit={handleSale} className="space-y-2">
                  <select
                    value={saleForm.bar_menu_id}
                    onChange={(e) => setSaleForm({ ...saleForm, bar_menu_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
                  >
                    <option value="">-- Elegir bebida --</option>
                    {menu.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · ${Number(m.price).toLocaleString('es-AR')} · Stock: {m.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={busy || !saleForm.bar_menu_id}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
                  >
                    Cobrar 🍸
                  </button>
                </form>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">+ Agregar bebida a la carta</span>
                <form onSubmit={handleAddItem} className="space-y-2">
                  <select
                    value={newItem.event_id}
                    onChange={(e) => setNewItem({ ...newItem, event_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name || ev.title}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Nombre (ej: Gin Tonic)"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      placeholder="Precio"
                      className="px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
                    />
                    <input
                      type="number"
                      value={newItem.stock}
                      onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                      placeholder="Stock"
                      className="px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold uppercase hover:bg-white/5 transition disabled:opacity-50 cursor-pointer"
                  >
                    + Agregar a la carta
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                {menu.map((m) => (
                  <div key={m.id} className="bg-[#0c0f16] border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{m.name}</span>
                      <span className="text-neutral-500">
                        {m.events?.name || m.events?.title} · ${Number(m.price).toLocaleString('es-AR')} · Stock: {m.stock}
                      </span>
                    </div>
                    <button onClick={() => removeItem(m.id)} className="text-rose-400 hover:text-rose-300 cursor-pointer">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase">Ventas recientes</span>
                <span className="text-emerald-400 font-black text-sm">${totalSales.toLocaleString('es-AR')}</span>
              </div>
              {sales.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl text-xs text-neutral-500">
                  Todavía no se registró ninguna venta.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sales.map((s) => (
                    <div key={s.id} className="bg-[#0c0f16] border border-white/10 rounded-xl px-4 py-2.5 flex justify-between items-center text-xs">
                      <span className="text-neutral-300">
                        {s.quantity}x {s.item_name} · {s.events?.name || s.events?.title}
                      </span>
                      <span className="text-emerald-400 font-bold">${Number(s.total).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
