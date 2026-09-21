'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  dni: string | null;
  phone: string | null;
  role: 'OWNER' | 'ADMIN' | 'DOOR' | 'BAR';
  created_at: string;
}

const ROLE_INFO: Record<string, { label: string; hint: string }> = {
  OWNER: { label: 'Dueño', hint: 'Todo: eventos, equipo, MP, ventas' },
  ADMIN: { label: 'Admin', hint: 'Eventos, confirmar ventas, cortesías, escaneo' },
  DOOR: { label: 'Puerta', hint: 'Solo escanear entradas' },
  BAR: { label: 'Barra', hint: 'Solo barra (sin acceso a ventas todavía)' },
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [producerName, setProducerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'DOOR' | 'BAR'>('DOOR');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/team');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar el equipo');
      setTeam(data.team || []);
      setProducerName(data.producerName || null);
      setIsOwner(data.myRole === 'OWNER');
      setMyEmail(data.myEmail || null);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/producers/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, dni, phone, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar');

      setEmail('');
      setName('');
      setDni('');
      setPhone('');
      setRole('DOOR');
      await load();
    } catch (err: any) {
      setFormError(err.message);
      if (err.message.includes('Solo el dueño')) setIsOwner(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Sacar a esta persona del equipo?')) return;
    try {
      const res = await fetch(`/api/producers/team?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const myRow = team.find((m) => m.email.toLowerCase() === (myEmail || '').toLowerCase());

  const handleLeave = async () => {
    if (!myRow) return;
    if (!confirm(`¿Abandonar el equipo de ${producerName}? Vas a perder el acceso a este panel.`)) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/producers/team?id=${myRow.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = '/admin';
    } catch (err: any) {
      alert(err.message);
      setLeaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              {producerName || 'Tu Productora'}
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Equipo</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : error && team.length === 0 ? (
          <p className="text-xs text-amber-400">{error}</p>
        ) : (
          <>
            {isOwner && (
              <form onSubmit={handleAdd} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 space-y-3">
                <h2 className="text-xs font-bold uppercase text-neutral-300">Sumar al equipo</h2>
                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                    ⚠️ {formError}
                  </div>
                )}
                <p className="text-[11px] text-neutral-500">
                  No hace falta que ya tenga cuenta — en cuanto se registre en{' '}
                  <Link href="/auth" className="text-amber-400 underline">/auth</Link> con este mismo email, va a tener acceso automáticamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
                  <input required placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
                  <input placeholder="DNI (opcional)" value={dni} onChange={(e) => setDni(e.target.value)} className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
                  <input placeholder="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500" />
                </div>

                <div className="flex gap-2">
                  {(['DOOR', 'BAR', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2.5 rounded-xl border text-[11px] font-bold uppercase transition cursor-pointer ${
                        role === r ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-black/40 border-white/10 text-neutral-400'
                      }`}
                    >
                      {ROLE_INFO[r].label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-500">{ROLE_INFO[role].hint}</p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Agregar →'}
                </button>
              </form>
            )}

            <div className="space-y-2">
              {team.map((m) => (
                <div key={m.id} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">{m.name}</span>
                    <span className="text-[11px] text-neutral-400">{m.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-neutral-300">
                      {ROLE_INFO[m.role]?.label || m.role}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {myRow && (
              <div className="rounded-2xl bg-rose-950/20 border border-rose-900/40 p-5 space-y-2">
                <h4 className="text-xs font-black uppercase text-rose-400">Zona de peligro</h4>
                <p className="text-[11px] text-neutral-400">
                  {isOwner
                    ? 'Como dueño, podés abandonar el equipo si hay otro OWNER además de vos.'
                    : `Podés dejar de ser parte del equipo de ${producerName} cuando quieras.`}
                </p>
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {leaving ? 'Saliendo...' : 'Abandonar productora 🚪'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
