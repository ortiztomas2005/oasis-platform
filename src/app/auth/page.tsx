'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      const result = login(email, password);
      if (result.success) {
        router.push(redirectUrl);
      } else {
        setErrorMsg(result.error || 'Error al iniciar sesión.');
      }
    } else {
      if (!name || !dni || !email || !password) {
        setErrorMsg('Por favor completá todos los campos obligatorios.');
        return;
      }
      const result = register({ name, dni, email, phone, password });
      if (result.success) {
        router.push(redirectUrl);
      } else {
        setErrorMsg(result.error || 'Error al crear la cuenta.');
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-[#090d16] border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6 font-mono">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-600/30 mx-auto">
            O
          </div>
        </Link>
        <h1 className="text-xl font-black uppercase text-white tracking-wide">
          {mode === 'login' ? 'Iniciar Sesión en OASIS' : 'Crear Cuenta Oficial'}
        </h1>
        <p className="text-xs text-neutral-400">
          {mode === 'login'
            ? 'Ingresá con tus credenciales registradas.'
            : 'Tus entradas estarán vinculadas de forma inmutable a tu DNI.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-bold text-center">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {mode === 'register' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase font-bold">
                Nombre y Apellido Completo
              </label>
              <input
                type="text"
                placeholder="Ej: Franco Martínez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase font-bold">
                DNI / Documento Nacional de Identidad
              </label>
              <input
                type="text"
                placeholder="Ej: 42981332"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase font-bold">
                Teléfono / WhatsApp (Opcional)
              </label>
              <input
                type="tel"
                placeholder="+54 9 11 5555-1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">
            Correo Electrónico
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono lowercase"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          {mode === 'login' ? 'Ingresar a mi Cuenta →' : 'Crear mi Cuenta Oficial →'}
        </button>
      </form>

      <div className="border-t border-neutral-800/80 pt-4 text-center">
        {mode === 'login' ? (
          <p className="text-[11px] text-neutral-400">
            ¿No tenés cuenta aún?{' '}
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className="text-blue-400 hover:underline font-bold"
            >
              Registrate acá
            </button>
          </p>
        ) : (
          <p className="text-[11px] text-neutral-400">
            ¿Ya tenés una cuenta?{' '}
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className="text-blue-400 hover:underline font-bold"
            >
              Iniciá sesión
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-neutral-500 font-mono">Cargando...</div>}>
        <AuthContent />
      </Suspense>
    </div>
  );
}