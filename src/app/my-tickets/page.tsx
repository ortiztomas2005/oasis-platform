'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/core/supabase/client';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase.from('tickets').select('*, events(*)').order('created_at', { ascending: false });

        if (user?.email) {
          query = query.or(`customer_email.eq.${user.email},holder_email.eq.${user.email},user_id.eq.${user.id}`);
        }

        const { data, error } = await query;
        if (!error && data) {
          setTickets(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-yellow-400 uppercase font-bold">
              Bóveda Criptográfica Oficial
            </span>
            <h1 className="text-3xl font-black uppercase text-white mt-1">
              Mis Entradas
            </h1>
          </div>
          <Link
            href="/events"
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 transition-all"
          >
            ← Cartelera
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-24 font-mono text-xs text-neutral-500">
            Verificando credenciales en blockchain y base de datos...
          </div>
        ) : tickets.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center space-y-4">
            <p className="font-mono text-sm text-neutral-400">No tenés entradas emitidas en tu cuenta.</p>
            <Link
              href="/events"
              className="inline-block px-5 py-2.5 bg-yellow-400 text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-yellow-300 transition-all"
            >
              Explorar Próximos Eventos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((ticket) => {
              const hash = ticket.auth_code || ticket.qr_hash || ticket.id;
              const eventTitle = ticket.events?.name || 'Evento OASIS';
              const venue = ticket.events?.venue || 'Ubicación Central';

              return (
                <div
                  key={ticket.id}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-full">
                          {ticket.tier_name || 'GENERAL'}
                        </span>
                        <h2 className="text-xl font-black uppercase text-white mt-2">
                          {eventTitle}
                        </h2>
                        <p className="text-xs font-mono text-neutral-400">{venue}</p>
                      </div>

                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        ticket.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {ticket.status === 'AVAILABLE' ? '● Válido' : ticket.status}
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-4 rounded-2xl flex items-center justify-center max-w-[200px] mx-auto shadow-inner">
                      <QRCodeSVG
                        value={hash}
                        size={170}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* Ticket Details */}
                    <div className="bg-black/60 border border-neutral-800/80 rounded-2xl p-3.5 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-500 uppercase">Titular:</span>
                        <span className="text-white font-bold uppercase">
                          {ticket.customer_name || ticket.holder_name || 'Invitado'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-500 uppercase">DNI:</span>
                        <span className="text-neutral-300">
                          {ticket.customer_dni || ticket.holder_dni || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-1 border-t border-neutral-800">
                        <span className="text-neutral-600">HASH:</span>
                        <span className="text-neutral-500 truncate max-w-[160px]">{hash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Apple Wallet */}
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <a
                      href={`/api/tickets/${ticket.id}/wallet`}
                      download
                      className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-950 border border-neutral-700 py-3 px-4 rounded-xl text-white font-mono text-xs font-bold transition-all shadow-md active:scale-98"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.03.63-2.68 1.38-.56.64-1.05 1.7-0.92 2.74 1.04.08 2.07-.5 2.68-1.25z"/>
                      </svg>
                      <span>Añadir a Apple Wallet</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}