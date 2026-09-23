'use client';

import React, { useEffect, useState } from 'react';

/**
 * Protege todo lo que se renderiza dentro de /admin: pide la contraseña de
 * administrador (ADMIN_PASSWORD) antes de mostrar cualquier contenido.
 * La cookie de sesión la valida el servidor en /api/admin/session, así que
 * esto es defensa en profundidad: la protección real vive en cada ruta de
 * la API (ver requireAdminSession), no acá.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session')
      .then((res) => res.json())
      .then((data) => setStatus(data.authenticated ? 'unlocked' : 'locked'))
      .catch(() => setStatus('locked'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Contraseña incorrecta');
        return;
      }
      setStatus('unlocked');
    } catch {
      setError('Error de conexión. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#05070d] flex items-center justify-center">
        <span className="text-xs font-mono text-neutral-500">Verificando acceso...</span>
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-[#090d16] border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-5 font-mono"
        >
          <div className="text-center space-y-1">
            <span className="text-[10px] tracking-widest text-blue-400 uppercase font-bold">
              Acceso Restringido
            </span>
            <h1 className="text-xl font-black uppercase text-white">Panel de Administración</h1>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 uppercase font-bold">
              Contraseña de administrador
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Verificando...' : 'Ingresar →'}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
