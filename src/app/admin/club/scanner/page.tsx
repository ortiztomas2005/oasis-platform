'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function GateScannerPage() {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userRoleInfo, setUserRoleInfo] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    try {
      const globalConfig = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
      const activeClubName = globalConfig.clubName || globalConfig.name || 'CLUB ATLÉTICO';
      const slug = activeClubName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      const sessionRaw = localStorage.getItem('le_current_session') || localStorage.getItem('oasis_current_session');
      const staffList = JSON.parse(localStorage.getItem(`le_club_team_staff_${slug}`) || localStorage.getItem('le_club_team_staff') || '[]');

      let role = 'ADMIN';
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        const matchStaff = staffList.find((st: any) => st.email.toLowerCase() === (session.email || '').toLowerCase());
        if (matchStaff) {
          role = matchStaff.role;
        } else if (session.role) {
          role = session.role;
        }
      } else if (staffList.length > 0) {
        role = staffList[0].role;
      }

      setUserRoleInfo(role);

      if (role === 'ADMIN' || role === 'SEGURIDAD' || role === 'CAJA') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    } catch (e) {
      console.error(e);
      setAuthorized(true);
    }
  }, []);

  const startCamera = async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta el acceso a la cámara.');
      }

      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.error("Error al reproducir video:", e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setErrorMsg(`No se pudo iniciar la cámara: ${err.message || 'Verifique permisos o uso en otra app.'}`);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
    setAlertType(null);

    const tokenToSearch = (codeToVerify || qrInput).trim().toUpperCase();
    if (!tokenToSearch) return;

    try {
      const globalConfig = JSON.parse(localStorage.getItem('oasis_club_config') || localStorage.getItem('le_club_config') || '{}');
      const activeClubName = globalConfig.clubName || globalConfig.name || 'CLUB ATLÉTICO';
      const slug = activeClubName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Bases de datos privadas de este club
      const tickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
      const membersDb = JSON.parse(localStorage.getItem(`le_club_members_db_${slug}`) || localStorage.getItem('le_club_members_db') || '[]');
      
      // 1. Buscamos si el código ingresado corresponde a un Token de Ticket o a un Carnet/DNI de Socio
      let foundTicketIndex = tickets.findIndex((t: any) => 
        String(t.qrToken || '').toUpperCase() === tokenToSearch || 
        String(t.id || '').toUpperCase() === tokenToSearch
      );

      let matchedMember: any = null;
      let matchedTicket: any = null;

      if (foundTicketIndex !== -1) {
        matchedTicket = tickets[foundTicketIndex];
        // Buscar si el titular del ticket está en el padrón de socios del club
        matchedMember = membersDb.find((m: any) => 
          String(m.dni || '') === String(matchedTicket.holderDni || '') ||
          String(m.fullName || '').toLowerCase() === String(matchedTicket.holderName || '').toLowerCase() ||
          String(m.memberNumber || '') === String(matchedTicket.memberNumber || '')
        );
      } else {
        // Si no es un ticket directo, verificamos si es el carnet/DNI de un socio registrado en el padrón del club
        matchedMember = membersDb.find((m: any) => 
          String(m.dni || '').toUpperCase() === tokenToSearch ||
          String(m.memberNumber || '').toUpperCase() === tokenToSearch ||
          tokenToSearch.includes(String(m.memberNumber || '').toUpperCase())
        );

        if (matchedMember) {
          // Buscamos si este socio tiene una entrada/ticket emitido activo para el evento
          foundTicketIndex = tickets.findIndex((t: any) => 
            String(t.holderDni || '') === String(matchedMember.dni || '') ||
            String(t.holderName || '').toLowerCase() === String(matchedMember.fullName || '').toLowerCase()
          );

          if (foundTicketIndex !== -1) {
            matchedTicket = tickets[foundTicketIndex];
          }
        }
      }

      // Si no encontramos ni ticket válido ni socio en el padrón del club
      if (!matchedTicket && !matchedMember) {
        setErrorMsg('❌ ACCESO DENEGADO: El código no corresponde a ningún socio empadronado ni ticket válido.');
        setAlertType('error');
        
        const accessLogs = JSON.parse(localStorage.getItem(`le_club_access_logs_${slug}`) || localStorage.getItem('le_club_access_logs') || '[]');
        accessLogs.unshift({
          id: `LOG-${Date.now()}`,
          name: 'Desconocido',
          method: 'ESCANER CARNET/QR',
          detail: `Token/Socio no encontrado: ${tokenToSearch}`,
          status: 'DENIED',
          timestamp: new Date().toLocaleString('es-AR')
        });
        localStorage.setItem(`le_club_access_logs_${slug}`, JSON.stringify(accessLogs));
        localStorage.setItem('le_club_access_logs', JSON.stringify(accessLogs));
        return;
      }

      const ticketData = matchedTicket || {
        id: `SOCIO-ACCESO-${Date.now()}`,
        eventName: `${activeClubName} - Partido Oficial`,
        tierName: matchedMember.category || 'Socio Activo (Acceso Carnet)',
        holderName: matchedMember.fullName,
        holderDni: matchedMember.dni,
        memberNumber: matchedMember.memberNumber,
        status: 'VALID'
      };

      const enrichedResult = {
        ...ticketData,
        isMemberActive: true,
        memberNumber: matchedMember?.memberNumber || ticketData.memberNumber || 'S/N',
        holderName: matchedMember?.fullName || ticketData.holderName,
        holderDni: matchedMember?.dni || ticketData.holderDni
      };

      if (ticketData.status === 'USED') {
        setErrorMsg(`⚠️ ACCESO RECHAZADO: Este carnet / ticket ya fue utilizado con anterioridad.`);
        setAlertType('warning');
        setScanResult(enrichedResult);
        return;
      }

      if (ticketData.status === 'CANCELLED' || ticketData.status === 'REVOKED') {
        setErrorMsg('❌ ACCESO DENEGADO: Credencial cancelada o revocada.');
        setAlertType('error');
        setScanResult(enrichedResult);
        return;
      }

      // Marcar como utilizado (Check-in exitoso en molinete)
      if (matchedTicket && foundTicketIndex !== -1) {
        tickets[foundTicketIndex].status = 'USED';
        tickets[foundTicketIndex].usedAt = new Date().toISOString();
        localStorage.setItem('oasis_issued_tickets', JSON.stringify(tickets));
      }

      // Registrar en el historial privado de accesos del club
      const accessLogs = JSON.parse(localStorage.getItem(`le_club_access_logs_${slug}`) || localStorage.getItem('le_club_access_logs') || '[]');
      accessLogs.unshift({
        id: `LOG-${Date.now()}`,
        name: enrichedResult.holderName,
        method: 'CARNET / ENTRADA',
        detail: `Sector: ${enrichedResult.tierName} | Socio: #${enrichedResult.memberNumber}`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleString('es-AR')
      });
      localStorage.setItem(`le_club_access_logs_${slug}`, JSON.stringify(accessLogs));
      localStorage.setItem('le_club_access_logs', JSON.stringify(accessLogs));

      setSuccessMsg('✅ ¡ACCESO HABILITADO! Credencial verificada correctamente.');
      setAlertType('success');
      setScanResult(enrichedResult);
      setQrInput('');
      window.dispatchEvent(new Event('storage'));

    } catch (err) {
      console.error(err);
      setErrorMsg('Error al procesar la lectura.');
      setAlertType('error');
    }
  };

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col items-center justify-center font-mono p-6">
        <div className="max-w-md w-full bg-[#0c0f16] border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-black">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="font-luxury text-xl font-black text-white uppercase">Acceso Restringido</h1>
            <p className="text-xs text-slate-400">
              Tu rol actual (<strong className="text-blue-400 uppercase">{userRoleInfo}</strong>) no cuenta con permisos de seguridad para operar el escáner.
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
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans antialiased font-mono p-8">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10 mb-8">
        <div>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block">CONTROL DE ACCESO ESTADIO (ROL: {userRoleInfo})</span>
          <h1 className="font-luxury text-2xl font-black text-white uppercase">Escáner de Carnets & Entradas</h1>
        </div>
        <button onClick={() => { stopCamera(); window.location.href = '/admin/club'; }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer">
          ← Volver al Panel
        </button>
      </header>

      <main className="max-w-xl mx-auto w-full space-y-8">
        <div className="bg-[#0c0f16] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="space-y-2 text-center">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Validación Unificada</h2>
            <p className="text-xs text-slate-400">Escanee el carnet digital del socio, el QR de la entrada o ingrese el código manualmente.</p>
          </div>

          <div className="space-y-4">
            <div className="aspect-video rounded-2xl bg-black border border-white/15 overflow-hidden relative flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`} 
              />
              {!isCameraActive && (
                <div className="text-center p-6 space-y-2 absolute inset-0 flex flex-col items-center justify-center">
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
              placeholder="Token de Carnet, Entrada o DNI..."
              className="w-full px-5 py-4 bg-[#05070d] border border-blue-500/40 rounded-2xl text-blue-400 font-black text-center text-sm uppercase tracking-widest focus:outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-blue-600/20 tracking-wider cursor-pointer"
            >
              🔍 Verificar Acceso en Molinete
            </button>
          </form>

          {errorMsg && alertType === 'error' && (
            <div className="p-5 rounded-2xl bg-rose-500/20 border-2 border-rose-500 text-rose-300 text-sm font-black text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          {errorMsg && alertType === 'warning' && (
            <div className="p-5 rounded-2xl bg-blue-500/20 border-2 border-blue-500 text-blue-300 text-sm font-black text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          {successMsg && alertType === 'success' && (
            <div className="p-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 text-sm font-black text-center animate-pulse">
              {successMsg}
            </div>
          )}
        </div>

        {scanResult && (
          <div className={`p-6 rounded-3xl border-2 space-y-4 shadow-2xl ${
            alertType === 'success' ? 'bg-[#0c0f16] border-emerald-500' :
            alertType === 'warning' ? 'bg-[#0c0f16] border-amber-500' :
            'bg-[#0c0f16] border-rose-500'
          }`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Resultado en Molinete</span>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Acceso Verificado
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div><span className="text-slate-500 block uppercase text-[10px]">Titular / Asistente</span><strong className="text-white text-sm">{scanResult.holderName} (DNI: {scanResult.holderDni})</strong></div>
              <div><span className="text-slate-500 block uppercase text-[10px]">Número de Socio / Carnet</span><strong className="text-blue-400">#{scanResult.memberNumber}</strong></div>
              <div><span className="text-slate-500 block uppercase text-[10px]">Categoría / Sector</span><strong className="text-white">{scanResult.tierName}</strong></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}