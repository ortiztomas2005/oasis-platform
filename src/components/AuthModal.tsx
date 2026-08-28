'use client';

import { useState } from 'react';
import { createClient } from '@/core/supabase/client';

export default function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(provider);
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      alert(`Error al iniciar sesión: ${err.message}`);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
            Identificación de Seguridad
          </span>
          <h3 className="text-2xl font-black uppercase text-white mt-1">
            Ingresar a OASIS
          </h3>
          <p className="text-xs font-mono text-neutral-400 mt-2">
            Iniciá sesión en un clic para acceder a tus tickets, transferirlos o ponerlos en reventa.
          </p>
        </div>

        <div className="space-y-3">
          {/* Botón Google */}
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={!!loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-black font-bold font-mono text-xs uppercase rounded-xl flex items-center justify-center gap-3 transition-all shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {loading === 'google' ? 'Conectando...' : 'Continuar con Google'}
          </button>

          {/* Botón Apple */}
          <button
            onClick={() => handleOAuthLogin('apple')}
            disabled={!!loading}
            className="w-full py-3.5 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold font-mono text-xs uppercase rounded-xl flex items-center justify-center gap-3 transition-all shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.88-11.93-14.53-7.7-12.08-13.88-25.96-18.52-41.65-4.64-15.69-6.96-29.62-6.96-41.8 0-16.14 4.09-29.41 12.28-39.81 8.18-10.4 18.25-15.7 30.2-15.9 4.35 0 9.42 1.25 15.22 3.75 5.8 2.5 9.74 3.75 11.83 3.75 1.74 0 5.86-1.3 12.35-3.9 6.5-2.6 11.96-3.8 16.39-3.6 13.92.76 25.13 5.75 33.62 14.97-12.08 7.29-18.01 17.2-17.8 29.74.22 9.79 3.96 18.06 11.22 24.81 7.26 6.75 15.76 10.5 25.5 11.25-2.61 7.84-5.99 15.82-10.15 23.94zM119.22 3.12c0 8.05-2.93 15.69-8.8 22.92-5.87 7.23-12.94 11.75-21.2 13.56-.43-1.74-.65-3.48-.65-5.22 0-8.05 3.04-15.9 9.13-23.56 6.09-7.65 13.23-12.22 21.41-13.7.07 2 .11 4 .11 6z" />
            </svg>
            {loading === 'apple' ? 'Conectando...' : 'Continuar con Apple'}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}