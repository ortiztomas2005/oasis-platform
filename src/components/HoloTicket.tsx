'use client';

import React, { useState, useRef } from 'react';

export interface TicketData {
  id: string;
  qrCode: string;
  eventName: string;
  tierName: string;
  ownerName: string;
  ownerDni: string;
  ownerEmail?: string;
  status: 'active' | 'used' | 'resold';
  purchasedAt?: string;
  scannedAt?: string;
}

export default function HoloTicket({ ticket }: { ticket: TicketData }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.45,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const renderQrPattern = (seed: string) => {
    const cells = [];
    const size = 21;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isCorner =
          (r < 7 && c < 7) ||
          (r < 7 && c >= size - 7) ||
          (r >= size - 7 && c < 7);

        let filled = false;
        if (isCorner) {
          const inBorder = r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= size - 7 && (r === size - 1 || r === size - 7)) ||
            (c >= size - 7 && (c === size - 1 || c === size - 7));
          const inCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) ||
            (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4);
          filled = inBorder || inCenter;
        } else {
          filled = ((hash >> ((r * size + c) % 16)) & 1) === 1;
        }

        if (filled) {
          cells.push(
            <rect
              key={`${r}-${c}`}
              x={c * 9}
              y={r * 9}
              width={8}
              height={8}
              rx={1.5}
              className="fill-slate-900"
            />
          );
        }
      }
    }
    return cells;
  };

  const isUsable = ticket.status === 'active';

  return (
    <div style={{ perspective: '1200px' }} className="w-full max-w-sm mx-auto select-none">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className={`relative rounded-3xl overflow-hidden border p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl ${
          ticket.status === 'used'
            ? 'bg-[#10131a]/90 border-slate-800 opacity-65'
            : ticket.status === 'resold'
            ? 'bg-rose-950/20 border-rose-900/40 opacity-50'
            : 'bg-gradient-to-b from-[#181d2c] via-[#121622] to-[#0c0f17] border-blue-500/30 hover:border-blue-400/60 shadow-blue-950/40'
        }`}
      >
        {isUsable && (
          <div
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}) 0%, rgba(59, 130, 246, 0.25) 30%, rgba(236, 72, 153, 0.2) 60%, transparent 80%)`,
              mixBlendMode: 'color-dodge',
            }}
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
          />
        )}

        <div className="space-y-4 font-mono z-20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-blue-400">
              OASIS ACCESS
            </span>
            <span
              className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                ticket.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : ticket.status === 'used'
                  ? 'bg-slate-700/20 text-slate-400 border-slate-700'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              {ticket.status === 'active'
                ? '● Habilitado'
                : ticket.status === 'used'
                ? '✓ Utilizado'
                : '✕ Anulado'}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black uppercase text-white tracking-tight leading-snug">
              {ticket.eventName}
            </h3>
            <span className="text-xs text-blue-300 font-bold tracking-wide">
              {ticket.tierName}
            </span>
          </div>
        </div>

        <div className="my-6 flex flex-col items-center justify-center z-20">
          <div className="p-4 bg-white rounded-2xl shadow-inner relative group">
            <svg
              viewBox="0 0 189 189"
              className="w-44 h-44 drop-shadow-sm"
              shapeRendering="crispEdges"
            >
              {renderQrPattern(ticket.qrCode)}
            </svg>

            {ticket.status !== 'active' && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] rounded-2xl flex items-center justify-center p-4 text-center font-mono">
                <span className="text-xs font-black uppercase text-rose-400 border border-rose-500/40 px-3 py-1.5 rounded-xl bg-black">
                  {ticket.status === 'used' ? 'Ticket Usado' : 'Transferido'}
                </span>
              </div>
            )}
          </div>

          <span className="mt-3 text-[11px] font-mono tracking-widest text-slate-400 font-bold uppercase">
            {ticket.qrCode}
          </span>
        </div>

        <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-mono z-20">
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">
              Titular
            </span>
            <span className="text-white font-bold truncate block">
              {ticket.ownerName}
            </span>
            {ticket.ownerEmail && (
              <span className="text-[9px] text-slate-500 truncate block">
                {ticket.ownerEmail}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase block font-bold">
              DNI Nominado
            </span>
            <span className="text-slate-300 font-bold">
              {ticket.ownerDni}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}