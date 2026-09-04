'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function GateScannerPage() {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userRoleInfo, setUserRoleInfo] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Validación estricta de Roles (Solo ADMIN y SEGURIDAD)
  useEffect(() => {
    try {
      const sessionRaw = localStorage.getItem('le_current_session') || localStorage.getItem('oasis_current_session');
      const staffList = JSON.parse(localStorage.getItem('le_club_team_staff') || '[]');

      let role = 'ADMIN'; // Por defecto si no hay sesión estricta se asume admin para pruebas
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        const matchStaff = staffList.find((st: any) => st.email.toLowerCase() === (session.email || '').toLowerCase());
        if (matchStaff) {
          role = matchStaff.role;
        } else if (session.role) {
          role = session.role;
        }
      } else if (staffList.length > 0) {
        // Tomamos el primer admin o seguridad por defecto si está simulando
        role = staffList[0].role;
      }

      setUserRoleInfo(role);

      if (role === 'ADMIN' || role === 'SEGURIDAD') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    } catch (e) {
      console.error(e);
      setAuthorized(true); // Fallback seguro
    }
  }, []);

  // Iniciar la cámara web para lectura visual
  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setErrorMsg('No se pudo acceder a la cámara. Verifique los permisos del navegador.');
    }
  };

  // Detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleVerifyTicket = (codeToVerify?: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setScanResult(null);

    const tokenToSearch = (codeToVerify || qrInput).trim().toUpperCase();
    if (!tokenToSearch) return;

    try {
      const tickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
      const ticketIndex = tickets.findIndex((t: any) => 
        String(t.qrToken || '').toUpperCase() === tokenToSearch || 
        String(t.id || '').toUpperCase() === tokenToSearch
      );

      if (ticketIndex === -1) {
        setErrorMsg('❌ ACCESO DENEGADO: El código de ticket no existe o es inválido.');
        return;
      }

      const ticket = tickets[ticketIndex];

      if (ticket.status === 'USED') {
        setErrorMsg(`⚠️ ACCESO RECHAZADO: Este ticket ya fue utilizado.`);
        setScanResult(ticket);
        return;
      }

      if (ticket.status === 'CANCELLED' || ticket.status === 'REVOKED') {
        setErrorMsg('❌ ACCESO DENEGADO: Este ticket se encuentra cancelado.');
        setScanResult(ticket);
        return;
      }

      // Marcar como utilizado (Check-in exitoso)
      tickets[ticketIndex].status = 'USED';
      tickets[ticketIndex].usedAt = new Date().toISOString();
      localStorage.setItem('oasis_issued_tickets', JSON.stringify(tickets));

      // Registrar en el historial de accesos
      const accessLogs = JSON.parse(localStorage.getItem('le_club_access_logs') || '[]');
      accessLogs.unshift({
        id: `LOG-${Date.now()}`,
        name: ticket.holderName || 'Asistente',
        method: 'ESCANER QR',
        detail: `Sector: ${ticket.tierName}`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleString('es-AR')
      });
      localStorage.setItem('le_club_access_logs', JSON.stringify(accessLogs));

      setSuccessMsg('✅ ¡ACCESO HABILITADO! Pase verificado correctamente.');
      setScanResult(tickets[ticketIndex]);
      setQrInput('');
      window.dispatchEvent(new Event('storage'));

    } catch (err) {
      console.error(err);
      setErrorMsg('Error al procesar la lectura del código.');
    }
  };

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col items-center justify-center font-mono p-6">
        <div className="max-w-md w-full bg-[#0c0f16] border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-black">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="font-luxury text-xl font-black text-white uppercase">Acceso Restringido</h1>
            <p className="text-xs text-slate-400">
              Tu rol actual (<strong className="text-amber-400 uppercase">{userRoleInfo}</strong>) no cuenta con permisos de seguridad para operar el escáner de puerta. Esta sección es exclusiva para personal de <strong className="text-white">Seguridad</strong> y <strong className="text-white">Administradores</strong>.
            </p>
          </div>
          <Link href="/admin/club" className="block w-full py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs uppercase transition">
            ← Volver al Panel Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased font-mono p-8">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10 mb-8">
        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">CONTROL DE ACCESO ESTADIO (ROL: {userRoleInfo})</span>
          <h1 className="font-luxury text-2xl font-black text-white uppercase">Escáner de Puerta (Cámara & QR)</h1>
        </div>
        <button onClick={() => { stopCamera(); window.location.href = '/admin/club'; }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer">
          ← Volver al Panel
        </button>
      </header>

      <main className="max-w-xl mx-auto w-full space-y-8">
        <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="space-y-2 text-center">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Validación por Cámara o Código</h2>
            <p className="text-xs text-slate-400">Encienda la cámara para lectura visual o ingrese el token manualmente.</p>
          </div>

          {/* VISOR DE CÁMARA */}
          <div className="space-y-4">
            <div className="aspect-video rounded-2xl bg-black border border-white/15 overflow-hidden relative flex items-center justify-center">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <span className="text-2xl block">📷</span>
                  <span className="text-xs text-slate-400 block">Cámara de escaneo inactiva</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
                >
                  🟢 Encender Cámara
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
                >
                  🔴 Apagar Cámara
                </button>
              )}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleVerifyTicket(); }} className="space-y-4 pt-4 border-t border-white/10">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="O ingrese el token QR (Ej: SPORT-...)"
              className="w-full px-5 py-4 bg-[#07070a] border border-amber-500/40 rounded-2xl text-amber-400 font-black text-center text-sm uppercase tracking-widest focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-2xl transition shadow-xl shadow-amber-500/20 tracking-wider cursor-pointer"
            >
              🔍 Verificar Pase
            </button>
          </form>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
              {successMsg}
            </div>
          )}
        </div>

        {scanResult && (
          <div className={`p-6 rounded-3xl border space-y-4 ${scanResult.status === 'USED' ? 'bg-[#0c0f16] border-emerald-500/40' : 'bg-[#0c0f16] border-white/10'}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Detalle del Ticket</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${scanResult.status === 'USED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'}`}>
                {scanResult.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div><span className="text-slate-500 block uppercase text-[10px]">Evento / Partido</span><strong className="text-white">{scanResult.eventName}</strong></div>
              <div><span className="text-slate-500 block uppercase text-[10px]">Ubicación / Sector</span><strong className="text-amber-400">{scanResult.tierName}</strong></div>
              <div><span className="text-slate-500 block uppercase text-[10px]">Titular</span><strong className="text-white">{scanResult.holderName} (DNI: {scanResult.holderDni})</strong></div>
              {scanResult.holderMemberNumber && (
                <div><span className="text-slate-500 block uppercase text-[10px]">Número de Socio</span><strong className="text-emerald-400">{scanResult.holderMemberNumber}</strong></div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}