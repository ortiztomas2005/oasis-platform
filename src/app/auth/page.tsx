'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/core/supabase/client';
import { useSession } from '@/core/auth/useSession';
import AuroraBackground from '@/components/fx/AuroraBackground';
import GlitchHeading from '@/components/fx/GlitchHeading';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const supabase = createClient();
  const { user: sessionUser, isAuthenticated } = useSession();

  // Modos: 'login' | 'register_client' | 'register_producer'
  const [mode, setMode] = useState<'login' | 'register_client' | 'register_producer'>('login');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');

  // Campos específicos para Productora
  const [producerName, setProducerName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && sessionUser) {
      setEmail(sessionUser.email);
      setName((prev) => prev || sessionUser.name);
      setDni((prev) => prev || sessionUser.dni);
    }
  }, [isAuthenticated, sessionUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      // Si ya hay una sesión iniciada y elegís "Productora", no tiene
      // sentido pasar por signUp() de nuevo — ese email ya existe y
      // signUp() lo rechaza, y la productora nunca se llega a crear. Se
      // registra directo con la sesión actual.
      if (isAuthenticated && mode === 'register_producer') {
        if (!producerName.trim()) {
          setErrorMsg('Por favor completá el nombre de la productora.');
          return;
        }
        const res = await fetch('/api/auth/register-producer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ producerName: producerName.trim(), dni: dni.trim(), phone: phone.trim() }),
        });
        const resData = await res.json();
        if (!res.ok) {
          setErrorMsg(resData.error || 'Error al registrar la productora.');
          return;
        }
        router.push('/admin');
        router.refresh();
        return;
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(
            error.message === 'Invalid login credentials'
              ? 'Credenciales inválidas. Verificá tu correo o contraseña.'
              : error.message
          );
          return;
        }

        // Si llegaste acá porque tenías el formulario de "Productora"
        // abierto con un mail que ya tenía cuenta (te mandamos a loguearte
        // en vez de dejarte trabado con "ya existe una cuenta"), termina de
        // crear la productora ahora que ya hay sesión.
        if (producerName.trim()) {
          const res = await fetch('/api/auth/register-producer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerName: producerName.trim(), dni: dni.trim(), phone: phone.trim() }),
          });
          const resData = await res.json();
          if (!res.ok) {
            setErrorMsg(resData.error || 'Iniciaste sesión, pero hubo un error al registrar la productora.');
            return;
          }
          router.push('/admin');
          router.refresh();
          return;
        }

        router.push(redirectUrl);
        router.refresh();
        return;
      }

      // Ambos modos de registro validan campos obligatorios y crean el
      // usuario en Supabase Auth (ya no en localStorage).
      if (!name || !dni || !email || !password) {
        setErrorMsg('Por favor completá todos los campos obligatorios.');
        return;
      }
      if (mode === 'register_producer' && !producerName.trim()) {
        setErrorMsg('Por favor completá el nombre de la productora.');
        return;
      }

      // Si el modo es "productora", guardamos la intención en user_metadata:
      // si el proyecto exige confirmar el email, signUp no abre sesión
      // todavía y acá no se puede llamar a /api/auth/register-producer (no
      // hay con qué autenticar el pedido). Queda pendiente y se termina de
      // crear en /auth/callback cuando la persona confirma y vuelve.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim(),
            dni: dni.trim(),
            phone: phone.trim(),
            ...(mode === 'register_producer'
              ? { pending_producer: { producerName: producerName.trim(), dni: dni.trim(), phone: phone.trim() } }
              : {}),
          },
        },
      });

      if (error) {
        if (error.message === 'User already registered') {
          // Antes esto dejaba a la persona trabada en el formulario de
          // "Productora" con un error, sin ninguna salida clara — parecía
          // que había que "volver a loguearse" pero no había cómo. Ahora
          // la mandamos directo a Iniciar Sesión (con el mail ya cargado y
          // el nombre de la productora guardado): apenas inicie sesión, la
          // productora se termina de crear sola (ver la rama de arriba).
          setMode('login');
          setPassword(''); // la que escribiste acá no es tu contraseña real, que no la mande a "Credenciales inválidas" sin darse cuenta
          setErrorMsg(
            mode === 'register_producer'
              ? 'Ese correo ya tiene una cuenta. Iniciá sesión con tu contraseña real y tu productora se crea sola.'
              : 'Ya existe una cuenta registrada con este correo electrónico. Iniciá sesión.'
          );
          return;
        }
        setErrorMsg(error.message);
        return;
      }

      // Por seguridad (para no dejar adivinar qué emails ya están
      // registrados), Supabase responde signUp() como "éxito" incluso
      // cuando el email ya tiene una cuenta sin confirmar — no tira error,
      // pero data.user.identities viene vacío. Sin este chequeo, reintentar
      // el registro con el mismo mail parece crear una cuenta nueva cada
      // vez cuando en realidad sigue siendo la misma sin confirmar.
      const looksLikeExistingUnconfirmed = (data.user?.identities?.length ?? 1) === 0;
      if (looksLikeExistingUnconfirmed) {
        setErrorMsg('Ya hay una cuenta con este correo esperando confirmación. Revisá tu bandeja de entrada (y spam) del registro anterior.');
        return;
      }

      // Si el proyecto de Supabase exige confirmar el email, signUp no abre
      // sesión todavía. Para "cliente" no hay nada más que hacer hasta que
      // confirme; para "productora" la creación queda pendiente en
      // user_metadata y se completa sola en /auth/callback.
      if (!data.session) {
        setInfoMsg(
          mode === 'register_producer'
            ? '¡Cuenta creada! Revisá tu correo y confirmá la cuenta — apenas lo hagas, tu productora queda creada automáticamente.'
            : '¡Cuenta creada! Revisá tu correo para confirmar la cuenta antes de iniciar sesión.'
        );
        setMode('login');
        return;
      }

      if (mode === 'register_producer') {
        const res = await fetch('/api/auth/register-producer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            producerName: producerName.trim(),
            dni: dni.trim(),
            phone: phone.trim(),
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          setErrorMsg(resData.error || 'Tu cuenta se creó, pero hubo un error al registrar la productora.');
          return;
        }
        router.push('/admin');
        router.refresh();
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error del sistema. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'login'
      ? 'Iniciar Sesión en Live Experience'
      : mode === 'register_client'
      ? 'Crear Cuenta de Asistente'
      : 'Registrar Nueva Productora';

  return (
    <div className="glass glass-edge hud-corners w-full max-w-md rounded-3xl p-8 space-y-6 font-mono">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-600/30 mx-auto">
            O
          </div>
        </Link>
        <GlitchHeading as="h1" className="neon-text block text-xl font-black uppercase text-white tracking-wide">
          {title}
        </GlitchHeading>
        <p className="text-xs text-neutral-400">
          {mode === 'login' && 'Ingresá con tus credenciales registradas.'}
          {mode === 'register_client' && 'Tus entradas estarán vinculadas de forma inmutable a tu DNI.'}
          {mode === 'register_producer' && 'Publicá eventos y gestioná tu propio ecosistema de festivales.'}
        </p>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN DE REGISTRO / LOGIN */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-neutral-800 text-[11px]">
        <button
          type="button"
          onClick={() => { setMode('login'); setErrorMsg(null); setInfoMsg(null); }}
          className={`py-2 rounded-xl font-bold transition cursor-pointer ${mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
        >
          Iniciar Sesión
        </button>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => { setMode('register_client'); setErrorMsg(null); setInfoMsg(null); }}
            className={`py-2 rounded-xl font-bold transition cursor-pointer text-[10px] ${mode === 'register_client' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => { setMode('register_producer'); setErrorMsg(null); setInfoMsg(null); }}
            className={`py-2 rounded-xl font-bold transition cursor-pointer text-[10px] ${mode === 'register_producer' ? 'bg-emerald-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
          >
            Productora
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-bold text-center">
          ⚠️ {errorMsg}
        </div>
      )}
      {infoMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-bold text-center">
          ✓ {infoMsg}
        </div>
      )}

      {isAuthenticated && mode === 'register_producer' && (
        <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-xl text-blue-300 text-xs text-center">
          Ya estás logueado como <strong>{sessionUser?.email}</strong> — solo falta el nombre de tu productora.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {mode === 'register_producer' && (
          <div className="space-y-1">
            <label className="text-[10px] text-emerald-400 uppercase font-bold">
              Nombre Comercial de la Productora
            </label>
            <input
              type="text"
              placeholder="Ej: BNP PRODUCTIONS"
              value={producerName}
              onChange={(e) => setProducerName(e.target.value)}
              className="w-full bg-black/60 border border-emerald-900/60 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 uppercase font-bold"
              required
            />
          </div>
        )}

        {(mode === 'register_client' || mode === 'register_producer') && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase font-bold">
                Nombre y Apellido del Responsable
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
                DNI / Documento
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

        {!(isAuthenticated && mode === 'register_producer') && (
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
        )}

        {!(isAuthenticated && mode === 'register_producer') && (
        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
            required
          />
        </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 text-white font-black uppercase text-xs rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:hover:scale-100 ${
            mode === 'register_producer'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              : mode === 'register_client'
              ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
          }`}
        >
          {loading && 'Procesando...'}
          {!loading && mode === 'login' && 'Ingresar a mi Cuenta →'}
          {!loading && mode === 'register_client' && 'Crear Cuenta de Asistente →'}
          {!loading && mode === 'register_producer' && 'Crear Productora (500 Pases Free) 🚀'}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-[#05070d] text-white flex items-center justify-center p-4 overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 w-full flex items-center justify-center">
        <Suspense fallback={<div className="text-xs text-neutral-500 font-mono">Cargando...</div>}>
          <AuthContent />
        </Suspense>
      </div>
    </div>
  );
}
