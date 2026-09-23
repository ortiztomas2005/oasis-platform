'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Coupon {
  id: string;
  code: string;
  discount_pct: number;
  active: boolean;
}

interface RrppMember {
  id: string;
  name: string;
  code: string;
  commission_per_ticket: number;
}

export default function CuponesRrppPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [members, setMembers] = useState<RrppMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [couponForm, setCouponForm] = useState({ code: '', discount_pct: '15' });
  const [rrppForm, setRrppForm] = useState({ name: '', code: '', commission_per_ticket: '500' });

  const load = async () => {
    setLoading(true);
    try {
      const [couponsRes, rrppRes] = await Promise.all([fetch('/api/producers/coupons'), fetch('/api/producers/rrpp')]);
      const couponsData = await couponsRes.json();
      if (couponsRes.ok) setCoupons(couponsData.coupons || []);
      const rrppData = await rrppRes.json();
      if (rrppRes.ok) setMembers(rrppData.members || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/producers/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponForm.code, discount_pct: Number(couponForm.discount_pct) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCouponForm({ code: '', discount_pct: '15' });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeCoupon = async (id: string) => {
    setBusy(true);
    try {
      await fetch('/api/producers/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const addRrpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rrppForm.name.trim() || !rrppForm.code.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/producers/rrpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rrppForm, commission_per_ticket: Number(rrppForm.commission_per_ticket) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRrppForm({ name: '', code: '', commission_per_ticket: '500' });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeRrpp = async (id: string) => {
    setBusy(true);
    try {
      await fetch('/api/producers/rrpp', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">Cupones & RRPP</span>
            <h1 className="text-2xl font-black uppercase text-white">Descuentos y embajadores</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <p className="text-[11px] text-neutral-500 bg-[#0c0f16] border border-white/10 rounded-xl p-3">
          Por ahora esto guarda tus cupones y RRPP de verdad, pero todavía no se aplican solos en el checkout — es el primer paso antes de conectarlos ahí.
        </p>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <form onSubmit={addCoupon} className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">🏷️ Crear cupón</span>
                <input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="Código (ej: VERANO20)"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-blue-400 font-bold uppercase placeholder:text-neutral-600"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={couponForm.discount_pct}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_pct: e.target.value })}
                  placeholder="% de descuento"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white"
                />
                <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer">
                  + Guardar cupón
                </button>
              </form>

              <div className="space-y-2">
                {coupons.map((c) => (
                  <div key={c.id} className="bg-[#0c0f16] border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span>
                      <span className="font-black text-blue-400">{c.code}</span> <span className="text-neutral-400">({c.discount_pct}% OFF)</span>
                    </span>
                    <button onClick={() => removeCoupon(c.id)} className="text-rose-400 hover:text-rose-300 cursor-pointer">
                      ✕
                    </button>
                  </div>
                ))}
                {coupons.length === 0 && <p className="text-xs text-neutral-500">Todavía no creaste ningún cupón.</p>}
              </div>
            </div>

            <div className="space-y-4">
              <form onSubmit={addRrpp} className="p-5 rounded-2xl bg-[#0c0f16] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">🤝 Alta de RRPP</span>
                <input
                  value={rrppForm.name}
                  onChange={(e) => setRrppForm({ ...rrppForm, name: e.target.value })}
                  placeholder="Nombre"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-white placeholder:text-neutral-600"
                />
                <input
                  value={rrppForm.code}
                  onChange={(e) => setRrppForm({ ...rrppForm, code: e.target.value.toLowerCase() })}
                  placeholder="Código único (ej: fran)"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-blue-400 font-bold placeholder:text-neutral-600"
                />
                <input
                  type="number"
                  value={rrppForm.commission_per_ticket}
                  onChange={(e) => setRrppForm({ ...rrppForm, commission_per_ticket: e.target.value })}
                  placeholder="Comisión por entrada ($)"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#05070d] border border-white/10 text-xs text-emerald-400 font-bold"
                />
                <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer">
                  + Crear RRPP
                </button>
              </form>

              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="bg-[#0c0f16] border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span>
                      <span className="font-bold text-white">{m.name}</span>{' '}
                      <span className="text-neutral-400">({m.code}) · ${Number(m.commission_per_ticket).toLocaleString('es-AR')}/entrada</span>
                    </span>
                    <button onClick={() => removeRrpp(m.id)} className="text-rose-400 hover:text-rose-300 cursor-pointer">
                      ✕
                    </button>
                  </div>
                ))}
                {members.length === 0 && <p className="text-xs text-neutral-500">Todavía no diste de alta a ningún RRPP.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
