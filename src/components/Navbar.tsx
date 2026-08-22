'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // PIN por defecto para administradores (lo podés personalizar)
  const ADMIN_PIN = '2026';

  useEffect(() => {
    // Verificamos si ya inició sesión como admin
    const stored = localStorage.getItem('oasis_admin_auth');
    if (stored === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      localStorage.setItem('oasis_admin_auth', 'true');
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setErrorPin(false);
    } else {
      setErrorPin(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('oasis_admin_auth');
    setIsAdmin(false);
    if (pathname.startsWith('/admin')) {
      window.location.href = '/';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo OASIS */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-3 h-3 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
            <span className="font-extrabold tracking-widest text-lg text-white">
              OASIS<span className="text-amber-400">.</span>
            </span>
          </Link>

          {/* Navegación y Switch de Rol */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/' ? 'text-white bg-neutral-900' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cartelera
            </Link>

            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-md shadow-amber-400/20'
                      : 'bg-neutral-900 text-amber-400 border-amber-400/30 hover:bg-amber-400 hover:text-neutral-950'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-pulse" />
                  Backstage / Costos
                </Link>

                <Link
                  href="/scan"
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    pathname === '/scan'
                      ? 'bg-neutral-800 text-white border-neutral-700'
                      : 'text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Scanner
                </Link>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión Staff"
                  className="text-[11px] text-neutral-500 hover:text-red-400 px-2 py-1 transition-colors"
                >
                  Salir Admin
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowPinModal(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-400/40 transition-all flex items-center gap-1.5"
              >
                <span>Acceso Productor</span>
                <span className="text-[10px] text-neutral-600">🔒</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal de PIN para Productores / Staff */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Acceso Backstage
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setErrorPin(false);
                }}
                className="text-neutral-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Ingresá el PIN de productor para gestionar eventos, métricas de ventas y costos.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="PIN de acceso (ej: 2026)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorPin(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-amber-400 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
                />
                {errorPin && (
                  <p className="text-[11px] text-red-400 text-center mt-1.5">
                    PIN incorrecto. Probá con <strong>2026</strong>.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-colors"
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
<Link
  href="/my-tickets"
  className="text-xs font-mono text-neutral-300 hover:text-yellow-400 transition-colors px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60"
>
  🎟 Mis Entradas
</Link>