'use client';

import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';

interface TicketProps {
  code: string;
  eventName: string;
  category: string;
  holderName: string;
  date: string;
  status: string;
}

export default function HoloTicket({ code, eventName, category, holderName, date, status }: TicketProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setRotateX(-y / 15);
    setRotateY(x / 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="py-6 flex justify-center">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="w-full max-w-sm holo-card holo-sheen rounded-3xl p-6 shadow-2xl border border-yellow-500/20 bg-neutral-900/90 text-white"
      >
        {/* Cabecera del Pase */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">ACCESS PASS</span>
          </div>
          <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold rounded-full tracking-wider">
            {category}
          </span>
        </div>

        {/* Título & Datos */}
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">{eventName}</h2>
          <p className="text-xs text-neutral-400 font-mono">{date}</p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-inner mb-6">
          <QRCode value={code} size={180} />
        </div>

        {/* Info del Titular */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs font-mono">
          <div>
            <span className="text-neutral-500 block">TITULAR</span>
            <span className="font-bold text-neutral-200 uppercase truncate block">{holderName}</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block">ESTADO</span>
            <span className={`font-bold uppercase ${status === 'USED' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {status === 'USED' ? 'INGRESADO' : 'VÁLIDO'}
            </span>
          </div>
        </div>

        {/* Código Hash */}
        <div className="mt-4 pt-3 border-t border-dashed border-white/10 text-center font-mono text-[10px] text-neutral-500 tracking-wider">
          ID: {code}
        </div>
      </div>
    </div>
  );
}