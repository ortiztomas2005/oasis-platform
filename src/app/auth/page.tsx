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

  // Modos: 'login' | 'register_client' | 'register_producer'
  const [mode, setMode] = useState<'login' | 'register_client' | 'register_producer'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  
  // Campos específicos para Productora
  const [producerName, setProducerName] = useState('');
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
    } else if (mode === 'register_client') {
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
    } else if (mode === 'register_producer') {
      if (!producerName || !name || !dni || !email || !password) {
        setErrorMsg('Por favor completá todos los datos de la productora y el responsable.');
        return;
      }

      // 1. Registramos al usuario como owner
      const result = register({ name, dni, email, phone, password });
      if (!result.success) {
        setErrorMsg(result.error || 'Error al registrar el responsable de la productora.');
        return;
      }

      // 2. Creamos la productora y le asignamos sus 500 tickets prepagos iniciales
      try {
        const prodNameClean = producerName.trim().toUpperCase();
        
        // Guardar equipo/dueño en localStorage
        const teamMembers = JSON.parse(localStorage.getItem('le_team_members') || '[]');
        const newOwner = {
          id: `tm-${Date.now()}`,
          name,
          email: email.toLowerCase().trim(),
          dni,
          phone,
          role: 'OWNER',
          producerName: prodNameClean
        };
        localStorage.setItem('le_team_members', JSON.stringify([newOwner, ...teamMembers]));

        // Inicializar saldo prepago de la productora en 500
        const balances = JSON.parse(localStorage.getItem('le_prepaid_balances') || '{"OASIS": 500}');
        balances[prodNameClean] = 500;
        localStorage.setItem('le_prepaid_balances', JSON.stringify(balances));

        alert(`¡Productora "${prodNameClean}" creada con éxito con 500 tickets prepagos de regalo!`);
        router.push('/admin');
      } catch (err) {
        console.error(err);
        setErrorMsg('Error al inicializar la productora en el sistema.');
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
          {mode === 'login' && 'Iniciar Sesión en OASIS'}
          {mode === 'register_client' && 'Crear Cuenta de Asistente'}
          {mode === 'register_producer' && 'Registrar Nueva Productora'}
        </h1>
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
          onClick={() => { setMode('login'); setErrorMsg(null); }}
          className={`py-2 rounded-xl font-bold transition cursor-pointer ${mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
        >
          Iniciar Sesión
        </button>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => { setMode('register_client'); setErrorMsg(null); }}
            className={`py-2 rounded-xl font-bold transition cursor-pointer text-[10px] ${mode === 'register_client' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => { setMode('register_producer'); setErrorMsg(null); }}
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
          className={`w-full py-3.5 text-white font-black uppercase text-xs rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${
            mode === 'register_producer' 
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' 
              : mode === 'register_client' 
              ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
          }`}
        >
          {mode === 'login' && 'Ingresar a mi Cuenta →'}
          {mode === 'register_client' && 'Crear Cuenta de Asistente →'}
          {mode === 'register_producer' && 'Crear Productora (500 Pases Free) 🚀'}
        </button>
      </form>
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