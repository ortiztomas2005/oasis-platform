'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminUser {
  user_id: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN';
  created_at: string;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPERADMIN'>('ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      setAdmins(data.admins || []);
      setLoadError(data.error || null);
    } catch (e: any) {
      setLoadError(e.message);
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
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar administrador');

      setEmail('');
      setRole('ADMIN');
      await load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('¿Sacarle el acceso de administrador a esta cuenta?')) return;
    try {
      const res = await fetch(`/api/admin/admins?user_id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
              Acceso al Panel
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Administradores</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Estas cuentas (distintas de las de cliente o productora) pueden entrar a <strong className="text-white">/admin</strong>.
          Un SUPERADMIN puede dar de alta o quitar otros administradores. La cuenta que agregues tiene que
          haberse registrado antes en <Link href="/auth" className="text-amber-400 underline">/auth</Link>.
        </p>

        <form onSubmit={handleAdd} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase text-neutral-300">Agregar administrador</h2>

          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              ⚠️ {formError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="email@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'SUPERADMIN')}
              className="px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">Superadmin</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>

        <div className="bg-[#0c0f16] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 text-xs font-bold uppercase text-neutral-300">
            Con acceso hoy
          </div>

          {loading ? (
            <div className="p-5 text-xs text-neutral-500">Cargando...</div>
          ) : loadError ? (
            <div className="p-5 text-xs text-amber-400">
              {loadError.includes('does not exist') || loadError.includes('admin_users')
                ? 'Todavía no corriste la migración de admin_users en Supabase (supabase/migrations/001_admin_users.sql).'
                : loadError}
            </div>
          ) : admins.length === 0 ? (
            <div className="p-5 text-xs text-neutral-500">No hay administradores cargados todavía.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {admins.map((a) => (
                <div key={a.user_id} className="px-5 py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">{a.email}</span>
                    <span className="text-[10px] text-neutral-500 uppercase">{a.role}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(a.user_id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 transition cursor-pointer"
                  >
                    Quitar acceso
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
