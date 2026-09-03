'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';

export interface StadiumSector {
  name: string;
  generalPrice: number;
  memberPrice: number;
  capacity: number;
  soldGeneral?: number;
  soldMember?: number;
  soldCash?: number;
}

export interface ClubMember {
  id: string;
  fullName: string;
  dni: string;
  memberNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function ClubAdminPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [membersDb, setMembersDb] = useState<ClubMember[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [cashTickets, setCashTickets] = useState<any[]>([]);
  
  const [currentSection, setCurrentSection] = useState<'matches_active' | 'matches_finished' | 'matches_suspended' | 'members_db' | 'cash_emission' | 'quick_box' | 'audit_logs' | 'metrics' | 'create' | 'edit'>('matches_active');
  const [isMatchesMenuOpen, setIsMatchesMenuOpen] = useState<boolean>(true);

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const [cashForm, setCashForm] = useState({
    matchId: '',
    holderName: '',
    holderDni: '35000000',
    selectedSectorName: '',
    cashAmount: 12000
  });

  const [quickBoxForm, setQuickBoxForm] = useState({
    matchId: '',
    selectedSectorName: '',
    quantity: 1
  });

  const [activeScanner, setActiveScanner] = useState<boolean>(false);
  const [scannerResult, setScannerResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [selectedMetricMatchId, setSelectedMetricMatchId] = useState<string>('all');
  const [newMember, setNewMember] = useState({ fullName: '', dni: '', memberNumber: '' });
  const [csvInput, setCsvInput] = useState('');

  const DEFAULT_STADIUM_IMAGE = 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop';

  const [matchForm, setMatchForm] = useState({
    name: '',
    date: '',
    startTime: '19:00',
    gateOpenTime: '17:00',
    ticketExpiryTime: '21:30',
    gateAccess: 'Puerta A (Popular) / Puerta B (Platea)',
    venue: 'Estadio Monumental',
    city: 'Buenos Aires',
    imageUrl: DEFAULT_STADIUM_IMAGE,
    status: 'ACTIVE'
  });

  const [sectors, setSectors] = useState<StadiumSector[]>([
    { name: 'Popular Norte', generalPrice: 12000, memberPrice: 0, capacity: 15000, soldGeneral: 8500, soldMember: 4500, soldCash: 0 },
    { name: 'Platea Baja', generalPrice: 25000, memberPrice: 15000, capacity: 5000, soldGeneral: 2100, soldMember: 2400, soldCash: 0 },
  ]);

  const loadData = () => {
    try {
      const storedMatches = JSON.parse(localStorage.getItem('le_club_matches') || '[]');
      const initialMatches = storedMatches.length > 0 ? storedMatches : [{
        id: 'm-1',
        name: 'CLUB ATLÉTICO VS RIVAL',
        date: '2026-09-15',
        startTime: '19:00',
        gateOpenTime: '17:00',
        ticketExpiryTime: '21:30',
        gateAccess: 'Puerta A y B (Popular)',
        venue: 'Estadio Principal',
        imageUrl: DEFAULT_STADIUM_IMAGE,
        sectors: [
          { name: 'Popular Norte', generalPrice: 12000, memberPrice: 0, capacity: 15000, soldGeneral: 8500, soldMember: 4500, soldCash: 120 },
          { name: 'Platea Baja', generalPrice: 25000, memberPrice: 15000, capacity: 5000, soldGeneral: 2100, soldMember: 2400, soldCash: 50 }
        ],
        status: 'ACTIVE'
      }];

      const now = new Date();
      const updatedTimeCheck = initialMatches.map((m: any) => {
        if (m.status === 'ACTIVE' && m.date && m.ticketExpiryTime) {
          const matchExpiryDate = new Date(`${m.date}T${m.ticketExpiryTime}:00`);
          if (now > matchExpiryDate) {
            return { ...m, status: 'FINISHED' };
          }
        }
        return m;
      });

      setMatches(updatedTimeCheck);
      if (updatedTimeCheck.length > 0) {
        setSelectedMetricMatchId(updatedTimeCheck[0].id);
        const firstM = updatedTimeCheck[0];
        const defaultSector = firstM.sectors?.[0];
        if (!cashForm.matchId) {
          setCashForm(prev => ({
            ...prev,
            matchId: firstM.id,
            selectedSectorName: defaultSector?.name || '',
            cashAmount: defaultSector?.generalPrice || 12000
          }));
        }
        if (!quickBoxForm.matchId) {
          setQuickBoxForm(prev => ({
            ...prev,
            matchId: firstM.id,
            selectedSectorName: defaultSector?.name || ''
          }));
        }
      }

      const clubMembersDb = JSON.parse(localStorage.getItem('le_club_members_db') || '[]');
      const globalUsersDb = JSON.parse(localStorage.getItem('oasis_global_users_db') || '[]');

      const combinedMap = new Map();
      [...globalUsersDb, ...clubMembersDb].forEach((u: any) => {
        const key = u.dni || u.memberNumber || u.email;
        if (key) combinedMap.set(key, u);
      });

      const mergedMembers = Array.from(combinedMap.values());
      if (mergedMembers.length === 0) {
        const defaults: ClubMember[] = [
          { id: 'mb-1', fullName: 'Carlos Gómez', dni: '35123456', memberNumber: '10023', status: 'ACTIVE' },
          { id: 'mb-2', fullName: 'Lucía Fernández', dni: '38999888', memberNumber: '10045', status: 'ACTIVE' }
        ];
        setMembersDb(defaults);
        localStorage.setItem('le_club_members_db', JSON.stringify(defaults));
      } else {
        setMembersDb(mergedMembers);
      }

      const storedLogs = JSON.parse(localStorage.getItem('le_club_access_logs') || '[]');
      setAccessLogs(storedLogs);

      const storedCash = JSON.parse(localStorage.getItem('le_club_cash_tickets') || '[]');
      setCashTickets(storedCash);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMatchForm({ ...matchForm, imageUrl: URL.createObjectURL(file) });
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.fullName || !newMember.dni || !newMember.memberNumber) {
      alert('Completá todos los datos del socio.');
      return;
    }

    const memberObj: ClubMember = {
      id: `mb-${Date.now()}`,
      fullName: newMember.fullName.trim(),
      dni: newMember.dni.trim(),
      memberNumber: newMember.memberNumber.trim(),
      status: 'ACTIVE'
    };

    const updated = [memberObj, ...membersDb];
    setMembersDb(updated);
    localStorage.setItem('le_club_members_db', JSON.stringify(updated));
    localStorage.setItem('oasis_global_users_db', JSON.stringify(updated));

    setNewMember({ fullName: '', dni: '', memberNumber: '' });
    alert(`¡Socio ${memberObj.fullName} registrado con éxito!`);
  };

  const handleImportCsv = () => {
    if (!csvInput.trim()) return alert('Pegá el formato CSV (Nombre, DNI, NroSocio).');
    const lines = csvInput.split('\n');
    const newMembers: ClubMember[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',');
      if (parts.length >= 3) {
        newMembers.push({
          id: `mb-csv-${Date.now()}-${idx}`,
          fullName: parts[0].trim(),
          dni: parts[1].trim(),
          memberNumber: parts[2].trim(),
          status: 'ACTIVE'
        });
      }
    });

    if (newMembers.length === 0) {
      alert('Formato incorrecto. Usar: Nombre, DNI, NroSocio por línea.');
      return;
    }

    const updated = [...newMembers, ...membersDb];
    setMembersDb(updated);
    localStorage.setItem('le_club_members_db', JSON.stringify(updated));
    localStorage.setItem('oasis_global_users_db', JSON.stringify(updated));

    setCsvInput('');
    alert(`¡Se importaron ${newMembers.length} socios correctamente!`);
  };

  const handleDeleteMember = (id: string) => {
    if (!confirm('¿Eliminar socio?')) return;
    const updated = membersDb.filter(m => m.id !== id);
    setMembersDb(updated);
    localStorage.setItem('le_club_members_db', JSON.stringify(updated));
    localStorage.setItem('oasis_global_users_db', JSON.stringify(updated));
  };

  const handleMatchChangeForCash = (matchId: string) => {
    const targetMatch = matches.find(m => m.id === matchId);
    const defaultSector = targetMatch?.sectors?.[0];
    setCashForm({
      ...cashForm,
      matchId,
      selectedSectorName: defaultSector?.name || '',
      cashAmount: defaultSector?.generalPrice || 12000
    });
  };

  const handleSectorChangeForCash = (sectorName: string) => {
    const targetMatch = matches.find(m => m.id === cashForm.matchId);
    const sectorObj = targetMatch?.sectors?.find((s: any) => s.name === sectorName);
    setCashForm({
      ...cashForm,
      selectedSectorName: sectorName,
      cashAmount: sectorObj ? sectorObj.generalPrice : 12000
    });
  };

  const handleIssueCashTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashForm.holderName) {
      alert('Por favor ingresá el nombre del asistente.');
      return;
    }

    const matchedMatch = matches.find(m => m.id === cashForm.matchId) || matches[0];

    const newCashTicket = {
      id: `CASH-${Date.now()}`,
      matchId: matchedMatch.id,
      matchName: matchedMatch.name,
      holderName: cashForm.holderName.trim(),
      holderDni: cashForm.holderDni.trim() || '35000000',
      tierName: cashForm.selectedSectorName,
      cashAmount: Number(cashForm.cashAmount),
      qrToken: 'CASH-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'VALID',
      issuedAt: new Date().toLocaleString('es-AR')
    };

    const updatedCash = [newCashTicket, ...cashTickets];
    setCashTickets(updatedCash);
    localStorage.setItem('le_club_cash_tickets', JSON.stringify(updatedCash));

    const updatedMatches = matches.map(m => {
      if (m.id === matchedMatch.id) {
        const updatedSectors = (m.sectors || []).map((sec: any) => {
          if (sec.name === cashForm.selectedSectorName) {
            return { 
              ...sec, 
              soldCash: (sec.soldCash || 0) + 1,
              soldGeneral: (sec.soldGeneral || 0) + 1
            };
          }
          return sec;
        });
        return { ...m, sectors: updatedSectors };
      }
      return m;
    });

    setMatches(updatedMatches);
    localStorage.setItem('le_club_matches', JSON.stringify(updatedMatches));

    const issuedTickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
    localStorage.setItem('oasis_issued_tickets', JSON.stringify([{
      id: newCashTicket.id,
      eventName: newCashTicket.matchName,
      tierName: `${newCashTicket.tierName} (Pago Efectivo: $${newCashTicket.cashAmount.toLocaleString('es-AR')})`,
      price: newCashTicket.cashAmount,
      holderName: newCashTicket.holderName,
      holderDni: newCashTicket.holderDni,
      qrToken: newCashTicket.qrToken,
      status: 'VALID',
      purchasedAt: new Date().toISOString()
    }, ...issuedTickets]));

    alert(`¡Entrada en Efectivo emitida con éxito! Token QR: ${newCashTicket.qrToken}`);
    setCashForm(prev => ({ ...prev, holderName: '', holderDni: '35000000' }));
  };

  const handleQuickBoxSale = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMatch = matches.find(m => m.id === quickBoxForm.matchId) || matches[0];
    const sectorObj = targetMatch?.sectors?.find((s: any) => s.name === quickBoxForm.selectedSectorName);
    const unitPrice = sectorObj ? sectorObj.generalPrice : 12000;
    const qty = Number(quickBoxForm.quantity) || 1;

    const newBatchTickets = [];
    const timestamp = new Date().toISOString();
    const displayTime = new Date().toLocaleString('es-AR');

    for (let i = 0; i < qty; i++) {
      newBatchTickets.push({
        id: `BOX-${Date.now()}-${i}`,
        matchId: targetMatch.id,
        matchName: targetMatch.name,
        holderName: `Ventanilla Rápida #${i + 1}`,
        holderDni: '00000000',
        tierName: quickBoxForm.selectedSectorName,
        cashAmount: unitPrice,
        qrToken: 'BOX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: 'VALID',
        issuedAt: displayTime
      });
    }

    const updatedCash = [...newBatchTickets, ...cashTickets];
    setCashTickets(updatedCash);
    localStorage.setItem('le_club_cash_tickets', JSON.stringify(updatedCash));

    const updatedMatches = matches.map(m => {
      if (m.id === targetMatch.id) {
        const updatedSectors = (m.sectors || []).map((sec: any) => {
          if (sec.name === quickBoxForm.selectedSectorName) {
            return { 
              ...sec, 
              soldCash: (sec.soldCash || 0) + qty,
              soldGeneral: (sec.soldGeneral || 0) + qty
            };
          }
          return sec;
        });
        return { ...m, sectors: updatedSectors };
      }
      return m;
    });

    setMatches(updatedMatches);
    localStorage.setItem('le_club_matches', JSON.stringify(updatedMatches));

    const existingTickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
    const formattedBatch = newBatchTickets.map(t => ({
      id: t.id,
      eventName: t.matchName,
      tierName: `${t.tierName} (Boletería Rápida)`,
      price: t.cashAmount,
      holderName: t.holderName,
      holderDni: t.holderDni,
      qrToken: t.qrToken,
      status: 'VALID',
      purchasedAt: timestamp
    }));

    localStorage.setItem('oasis_issued_tickets', JSON.stringify([...formattedBatch, ...existingTickets]));

    alert(`¡Se emitieron ${qty} entradas rápidas para ${quickBoxForm.selectedSectorName} por un total de $${(unitPrice * qty).toLocaleString('es-AR')}!`);
  };

  const handleOpenCreate = () => {
    setEditingMatchId(null);
    setMatchForm({
      name: '',
      date: '',
      startTime: '19:00',
      gateOpenTime: '17:00',
      ticketExpiryTime: '21:30',
      gateAccess: 'Puerta A (Popular) / Puerta B (Platea)',
      venue: 'Estadio Monumental',
      city: 'Buenos Aires',
      imageUrl: DEFAULT_STADIUM_IMAGE,
      status: 'ACTIVE'
    });
    setSectors([
      { name: 'Popular', generalPrice: 12000, memberPrice: 0, capacity: 15000, soldGeneral: 0, soldMember: 0, soldCash: 0 },
      { name: 'Platea', generalPrice: 25000, memberPrice: 15000, capacity: 5000, soldGeneral: 0, soldMember: 0, soldCash: 0 }
    ]);
    setCurrentSection('create');
  };

  const handleOpenEdit = (m: any) => {
    setEditingMatchId(m.id);
    setMatchForm({
      name: m.name,
      date: m.date,
      startTime: m.startTime || '19:00',
      gateOpenTime: m.gateOpenTime || '17:00',
      ticketExpiryTime: m.ticketExpiryTime || '21:30',
      gateAccess: m.gateAccess || 'Puerta Principal',
      venue: m.venue || 'Estadio',
      city: m.city || 'Buenos Aires',
      imageUrl: m.imageUrl || DEFAULT_STADIUM_IMAGE,
      status: m.status || 'ACTIVE'
    });
    setSectors(m.sectors || []);
    setCurrentSection('edit');
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchForm.name || !matchForm.date) {
      alert('Completá los datos obligatorios del partido.');
      return;
    }

    let updatedMatches = [];
    if (editingMatchId) {
      updatedMatches = matches.map(m => m.id === editingMatchId ? { ...m, ...matchForm, sectors } : m);
    } else {
      const newMatch = {
        id: `match-${Date.now()}`,
        ...matchForm,
        sectors
      };
      updatedMatches = [newMatch, ...matches];
    }

    setMatches(updatedMatches);
    localStorage.setItem('le_club_matches', JSON.stringify(updatedMatches));
    setCurrentSection('matches_active');
  };

  const handleToggleCancelMatch = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'CANCELLED' ? 'ACTIVE' : 'CANCELLED';
    const updated = matches.map(m => m.id === id ? { ...m, status: nextStatus } : m);
    setMatches(updated);
    localStorage.setItem('le_club_matches', JSON.stringify(updated));
  };

  const logAccessAttempt = (name: string, identifier: string, method: 'DNI' | 'CARNET' | 'QR' | 'EFECTIVO', status: 'SUCCESS' | 'DENIED', detail: string) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      identifier,
      method,
      status,
      detail,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    const updatedLogs = [newLog, ...accessLogs];
    setAccessLogs(updatedLogs);
    localStorage.setItem('le_club_access_logs', JSON.stringify(updatedLogs));
  };

  const handleValidateMolinete = (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) return;

    const foundMemberByDni = membersDb.find(m => m.dni.toLowerCase() === cleanCode.toLowerCase());
    if (foundMemberByDni) {
      if (foundMemberByDni.status === 'INACTIVE') {
        logAccessAttempt(foundMemberByDni.fullName, foundMemberByDni.dni, 'DNI', 'DENIED', 'Socio moroso');
        setScannerResult({ success: false, message: `⚠️ ACCESO DENEGADO: Socio moroso (${foundMemberByDni.fullName})` });
      } else {
        logAccessAttempt(foundMemberByDni.fullName, foundMemberByDni.dni, 'DNI', 'SUCCESS', `Socio N° ${foundMemberByDni.memberNumber}`);
        setScannerResult({ success: true, message: `✅ ACCESO CONCEDIDO (DNI): ¡Hola ${foundMemberByDni.fullName}!` });
      }
      setManualCode('');
      return;
    }

    const foundMemberByCard = membersDb.find(m => m.memberNumber?.toLowerCase() === cleanCode.toLowerCase());
    if (foundMemberByCard) {
      if (foundMemberByCard.status === 'INACTIVE') {
        logAccessAttempt(foundMemberByCard.fullName, foundMemberByCard.memberNumber, 'CARNET', 'DENIED', 'Carnet moroso');
        setScannerResult({ success: false, message: `⚠️ ACCESO DENEGADO: Carnet moroso (${foundMemberByCard.fullName})` });
      } else {
        logAccessAttempt(foundMemberByCard.fullName, foundMemberByCard.memberNumber, 'CARNET', 'SUCCESS', `DNI: ${foundMemberByCard.dni}`);
        setScannerResult({ success: true, message: `✅ ACCESO CONCEDIDO (CARNET): ¡Bienvenido ${foundMemberByCard.fullName}!` });
      }
      setManualCode('');
      return;
    }

    const issuedTickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
    const foundTicket = issuedTickets.find((t: any) => 
      (t.qrToken || '').toLowerCase() === cleanCode.toLowerCase() || 
      (t.id || '').toLowerCase() === cleanCode.toLowerCase() ||
      (t.holderDni || '') === cleanCode
    );

    if (foundTicket) {
      if (foundTicket.status === 'USED') {
        logAccessAttempt(foundTicket.holderName || 'Titular', cleanCode, 'QR', 'DENIED', 'Entrada ya utilizada');
        setScannerResult({ success: false, message: `⚠️ ENTRADA YA UTILIZADA.` });
      } else {
        foundTicket.status = 'USED';
        localStorage.setItem('oasis_issued_tickets', JSON.stringify(issuedTickets));
        const isCash = (foundTicket.tierName || '').includes('Efectivo') || (foundTicket.tierName || '').includes('Boletería');
        logAccessAttempt(foundTicket.holderName || 'Titular', foundTicket.holderDni || cleanCode, isCash ? 'EFECTIVO' : 'QR', 'SUCCESS', foundTicket.tierName);
        setScannerResult({ success: true, message: `✅ ACCESO VÁLIDO (${isCash ? 'PAGO EFECTIVO' : 'QR'}): ${foundTicket.holderName} (${foundTicket.tierName})` });
      }
    } else {
      logAccessAttempt('Desconocido', cleanCode, 'QR', 'DENIED', 'No registrado');
      setScannerResult({ success: false, message: `❌ CREDENCIAL INVÁLIDA.` });
    }
    setManualCode('');
  };

  const filteredMatches = matches.filter(m => {
    if (currentSection === 'matches_active') return m.status === 'ACTIVE' || !m.status;
    if (currentSection === 'matches_finished') return m.status === 'FINISHED';
    if (currentSection === 'matches_suspended') return m.status === 'CANCELLED';
    return true;
  });

  const currentMatchForMetrics = matches.find(m => m.id === selectedMetricMatchId) || matches[0];
  const metricSectors: StadiumSector[] = currentMatchForMetrics?.sectors || [];
  
  const totalStadiumCapacity = metricSectors.reduce((acc, s) => acc + s.capacity, 0);
  const totalSoldGeneral = metricSectors.reduce((acc, s) => acc + (s.soldGeneral || 0), 0);
  const totalSoldMember = metricSectors.reduce((acc, s) => acc + (s.soldMember || 0), 0);
  const totalSoldCash = metricSectors.reduce((acc, s) => acc + (s.soldCash || 0), 0);
  const totalOccupancy = totalSoldGeneral + totalSoldMember;
  const overallFillRate = totalStadiumCapacity > 0 ? Math.round((totalOccupancy / totalStadiumCapacity) * 100) : 0;

  const totalRevenueGeneral = metricSectors.reduce((acc, s) => acc + ((s.soldGeneral || 0) * s.generalPrice), 0);
  const totalRevenueMember = metricSectors.reduce((acc, s) => acc + ((s.soldMember || 0) * s.memberPrice), 0);
  const totalMatchRevenue = totalRevenueGeneral + totalRevenueMember;

  const selectedMatchForCash = matches.find(m => m.id === cashForm.matchId) || matches[0];
  const selectedMatchForQuickBox = matches.find(m => m.id === quickBoxForm.matchId) || matches[0];

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black font-mono">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER SUPERIOR */}
      <header className="h-16 border-b border-white/5 bg-[#07070a] px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20">
            ⚽
          </div>
          <div className="flex flex-col">
            <span className="bg-transparent text-white font-luxury text-sm font-black tracking-widest uppercase">
              CLUB ATLÉTICO
            </span>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Módulo Institucional & Partidos</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <Link href="/admin" className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition">
            ← Volver a Módulo Fiestas / Eventos
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR Y ACORDEÓN */}
      <div className="flex flex-1 overflow-hidden">
        
        <aside className="w-64 border-r border-white/5 bg-[#050507] p-4 space-y-1.5 shrink-0 select-none overflow-y-auto">
          
          <div>
            <button
              onClick={() => {
                setIsMatchesMenuOpen(!isMatchesMenuOpen);
                if (!isMatchesMenuOpen && !currentSection.startsWith('matches')) {
                  setCurrentSection('matches_active');
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer text-xs ${currentSection.startsWith('matches') ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-2.5">
                <span>⚽</span>
                <span>Partidos Oficiales</span>
              </div>
              <span className={`transform transition-transform ${isMatchesMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {isMatchesMenuOpen && (
              <div className="pl-6 pt-1.5 space-y-1 text-xs">
                <button
                  onClick={() => setCurrentSection('matches_active')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition cursor-pointer ${currentSection === 'matches_active' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                  Partidos Activos
                </button>
                <button
                  onClick={() => setCurrentSection('matches_finished')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${currentSection === 'matches_finished' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                  Finalizados (Historial)
                </button>
                <button
                  onClick={() => setCurrentSection('matches_suspended')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${currentSection === 'matches_suspended' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                  Suspendidos
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentSection('members_db')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer text-xs ${currentSection === 'members_db' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>👥</span>
            <span>Padrón de Socios (DB)</span>
          </button>

          <button
            onClick={() => setCurrentSection('cash_emission')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer text-xs ${currentSection === 'cash_emission' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>💵</span>
            <span>Venta / Compra en Efectivo</span>
          </button>

          <button
            onClick={() => setCurrentSection('quick_box')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer text-xs ${currentSection === 'quick_box' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>⚡</span>
            <span>Simulador Caja Rápida</span>
          </button>

          <button
            onClick={() => setCurrentSection('audit_logs')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer text-xs ${currentSection === 'audit_logs' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>📋</span>
            <span>Historial de Accesos (En Vivo)</span>
          </button>

          <button
            onClick={() => setCurrentSection('metrics')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer text-xs ${currentSection === 'metrics' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>📊</span>
            <span>Métricas & Ocupación</span>
          </button>

          {/* BOTÓN CONECTADO AL ESCÁNER DE PUERTA */}
          <Link
            href="/admin/club/scanner"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 transition cursor-pointer font-bold"
          >
            <span>📷</span>
            <span>Escáner de Puerta</span>
          </Link>

          <button
            onClick={() => setActiveScanner(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-white/5 transition cursor-pointer"
          >
            <span>⚙️</span>
            <span>Escáner de Molinete (Modal)</span>
          </button>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#07070a]">
          
          {currentSection === 'quick_box' && (
            <div className="space-y-8 max-w-4xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">⚡ Simulador de Caja Rápida (Turno de Boletería)</h1>
                <p className="text-xs text-slate-400 mt-1">Ideal para la venta masiva y ágil en ventanilla antes del pitazo inicial.</p>
              </div>

              <form onSubmit={handleQuickBoxSale} className="p-8 rounded-3xl bg-[#0c0f17] border border-emerald-500/40 space-y-6 shadow-2xl text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-bold text-[10px]">Seleccionar Partido</label>
                  <select
                    value={quickBoxForm.matchId}
                    onChange={e => {
                      const mId = e.target.value;
                      const target = matches.find(m => m.id === mId);
                      setQuickBoxForm({
                        ...quickBoxForm,
                        matchId: mId,
                        selectedSectorName: target?.sectors?.[0]?.name || ''
                      });
                    }}
                    className="w-full p-3.5 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold cursor-pointer"
                  >
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>⚽ {m.name} ({m.date})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-bold text-[10px]">Tribuna / Sector</label>
                  <select
                    value={quickBoxForm.selectedSectorName}
                    onChange={e => setQuickBoxForm({...quickBoxForm, selectedSectorName: e.target.value})}
                    className="w-full p-3.5 bg-[#07070a] border border-white/10 rounded-xl text-amber-300 font-bold cursor-pointer"
                  >
                    {(selectedMatchForQuickBox?.sectors || []).map((sec: any, idx: number) => (
                      <option key={idx} value={sec.name}>
                        {sec.name} — ${sec.generalPrice.toLocaleString('es-AR')} por entrada
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-emerald-400 uppercase font-bold text-[10px]">Cantidad de Entradas a Emitir en el Acto</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={quickBoxForm.quantity}
                    onChange={e => setQuickBoxForm({...quickBoxForm, quantity: Number(e.target.value)})}
                    className="w-full p-3.5 bg-[#07070a] border border-emerald-500/40 rounded-xl text-emerald-400 font-black text-lg"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400 uppercase">Total a Cobrar en Efectivo:</span>
                  <span className="text-emerald-400 text-lg">
                    ${((selectedMatchForQuickBox?.sectors?.find((s: any) => s.name === quickBoxForm.selectedSectorName)?.generalPrice || 12000) * quickBoxForm.quantity).toLocaleString('es-AR')}
                  </span>
                </div>

                <button type="submit" className="w-full py-4 bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-500 hover:from-emerald-300 text-black font-black uppercase text-xs rounded-2xl shadow-xl cursor-pointer tracking-wider">
                  Registrar Cobro y Emitir Lote Rápido ⚡
                </button>
              </form>
            </div>
          )}

          {currentSection === 'cash_emission' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">💵 Venta y Emisión de Entradas en Efectivo</h1>
                <p className="text-xs text-slate-400 mt-1">Cobro presencial en boletería con asignación automática de valor nominal y registro en métricas.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleIssueCashTicket} className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f17] border border-emerald-500/30 space-y-4 shadow-xl text-xs">
                  <h3 className="font-luxury text-base font-black text-white uppercase">🎟️ Boletería Efectivo</h3>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Seleccionar Partido</label>
                    <select
                      value={cashForm.matchId}
                      onChange={e => handleMatchChangeForCash(e.target.value)}
                      className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold cursor-pointer"
                    >
                      {matches.map(m => (
                        <option key={m.id} value={m.id}>⚽ {m.name} ({m.date})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Tribuna / Sector Disponible</label>
                    <select
                      value={cashForm.selectedSectorName}
                      onChange={e => handleSectorChangeForCash(e.target.value)}
                      className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-amber-300 font-bold cursor-pointer"
                    >
                      {(selectedMatchForCash?.sectors || []).map((sec: any, idx: number) => (
                        <option key={idx} value={sec.name}>
                          {sec.name} — ${sec.generalPrice.toLocaleString('es-AR')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre del Asistente (Comprador)</label>
                    <input type="text" required placeholder="Ej: Juan Pérez" value={cashForm.holderName} onChange={e => setCashForm({...cashForm, holderName: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-emerald-400 uppercase font-bold text-[10px]">Valor en Efectivo ($ ARS)</label>
                    <input type="number" min="0" required value={cashForm.cashAmount} onChange={e => setCashForm({...cashForm, cashAmount: Number(e.target.value)})} className="w-full p-3 bg-[#07070a] border border-emerald-500/40 rounded-xl text-emerald-400 font-black text-base" />
                  </div>

                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-500 hover:from-emerald-300 text-black font-black uppercase text-xs rounded-2xl shadow-lg cursor-pointer tracking-wider">
                    Cobrar y Emitir Pase 🚀
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs font-bold text-slate-400 uppercase">
                    <span>Ventas en Efectivo Recientes</span>
                    <span className="text-emerald-400">{cashTickets.length} emitidas</span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {cashTickets.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-xs">
                        No hay ventas en efectivo registradas todavía.
                      </div>
                    ) : (
                      cashTickets.map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{t.holderName}</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">${t.cashAmount.toLocaleString('es-AR')}</span>
                            </div>
                            <span className="text-slate-400 block text-[11px]">Partido: {t.matchName} · Sector: {t.tierName}</span>
                            <span className="text-emerald-400 font-bold block text-[10px]">QR Token: {t.qrToken}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Cobrado</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'audit_logs' && (
            <div className="space-y-6 max-w-5xl mx-auto font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">📋 Historial de Accesos en Tiempo Real</h1>
                  <p className="text-xs text-slate-400 mt-1">Auditoría completa de molinetes.</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('¿Vaciar el registro de auditoría?')) {
                      setAccessLogs([]);
                      localStorage.removeItem('le_club_access_logs');
                    }
                  }}
                  className="px-4 py-2 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                >
                  Limpiar Historial 🗑️
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-1 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🟢 Exitosos</span>
                  <span className="text-2xl font-black text-emerald-400 block">{accessLogs.filter(l => l.status === 'SUCCESS').length}</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-1 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🔴 Denegados</span>
                  <span className="text-2xl font-black text-rose-400 block">{accessLogs.filter(l => l.status === 'DENIED').length}</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-1 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">📊 Total Intentos</span>
                  <span className="text-2xl font-black text-white block">{accessLogs.length}</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-2xl">
                {accessLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">No hay registros de acceso todavía.</div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {accessLogs.map((log) => {
                      const isSuccess = log.status === 'SUCCESS';
                      return (
                        <div key={log.id} className="p-4 rounded-2xl bg-[#07070a] border border-white/5 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              {isSuccess ? '✓' : '✕'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{log.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.method === 'EFECTIVO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>{log.method}</span>
                              </div>
                              <span className="text-slate-400 text-[11px]">{log.detail}</span>
                            </div>
                          </div>
                          <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentSection === 'members_db' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">👥 Padrón de Socios & Base de Datos</h1>
                <p className="text-xs text-slate-400 mt-1">Registros unificados para validación por DNI, Carnet o QR en los molinetes.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleAddMember} className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl text-xs">
                  <h3 className="font-luxury text-base font-black text-white uppercase">✨ Registrar Socio</h3>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre y Apellido</label>
                    <input type="text" required placeholder="Ej: Carlos Gómez" value={newMember.fullName} onChange={e => setNewMember({...newMember, fullName: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">DNI</label>
                    <input type="text" required placeholder="35123456" value={newMember.dni} onChange={e => setNewMember({...newMember, dni: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nro de Carnet / Socio</label>
                    <input type="text" required placeholder="10023" value={newMember.memberNumber} onChange={e => setNewMember({...newMember, memberNumber: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-amber-400 font-bold" />
                  </div>

                  <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer tracking-wider">
                    Guardar Socio +
                  </button>

                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px] block">Importar CSV Masivo</label>
                    <textarea rows={3} placeholder="Juan Pérez,32111222,10500" value={csvInput} onChange={e => setCsvInput(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-xl text-xs text-white" />
                    <button type="button" onClick={handleImportCsv} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 cursor-pointer">
                      Importar Base CSV 📥
                    </button>
                  </div>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs font-bold text-slate-400 uppercase">
                    <span>Socios Habilitados</span>
                    <span className="text-emerald-400">{membersDb.length} registros</span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {membersDb.map((m) => (
                      <div key={m.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{m.fullName}</span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">Socio #{m.memberNumber || 'N/A'}</span>
                          </div>
                          <span className="text-slate-400 block">DNI: {m.dni}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Al Día ✓</span>
                          <button onClick={() => handleDeleteMember(m.id)} className="text-slate-500 hover:text-rose-400 font-bold p-1 cursor-pointer">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection.startsWith('matches') && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">
                    {currentSection === 'matches_active' ? 'Partidos Activos / Próximos' : currentSection === 'matches_finished' ? 'Partidos Finalizados (Historial)' : 'Partidos Suspendidos'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Gestión institucional de encuentros y accesos.</p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer tracking-wider"
                >
                  + Programar Partido
                </button>
              </div>

              <div className="space-y-3">
                {filteredMatches.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#0c0f17] border border-white/5 text-slate-500 text-xs">
                    No hay partidos registrados en esta sección.
                  </div>
                ) : (
                  filteredMatches.map((m) => {
                    const isCancelled = m.status === 'CANCELLED';
                    const isFinished = m.status === 'FINISHED';

                    return (
                      <div key={m.id} className={`p-6 rounded-3xl bg-[#0c0f17] border transition flex flex-col gap-4 shadow-xl relative overflow-hidden ${isCancelled ? 'border-rose-900/50 opacity-75' : isFinished ? 'border-slate-700/50 opacity-80' : 'border-white/5 hover:border-amber-500/30'}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCancelled ? 'bg-rose-500' : isFinished ? 'bg-slate-500' : 'bg-emerald-500'}`} />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                          <div className="flex items-center gap-4">
                            <img src={m.imageUrl || DEFAULT_STADIUM_IMAGE} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-luxury text-base font-black text-white">{m.name}</h3>
                                {isCancelled && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">Suspendido</span>}
                                {isFinished && <span className="px-2 py-0.5 rounded bg-slate-700/30 text-slate-300 text-[10px] font-bold uppercase">Finalizado (Expirado)</span>}
                              </div>
                              <p className="text-xs text-slate-400">📅 {m.date} · ⚽ Inicio: <strong className="text-amber-400">{m.startTime} HS</strong></p>
                              <p className="text-xs text-slate-400">🚪 Cierre de Validez QR: <strong className="text-emerald-400">{m.ticketExpiryTime || '21:30'} HS</strong> | 📍 Acceso: <strong className="text-amber-300">{m.gateAccess}</strong></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <button onClick={() => handleOpenEdit(m)} className="px-3.5 py-2 bg-white/5 text-slate-200 border border-white/10 rounded-xl font-bold hover:bg-white/10 cursor-pointer transition">
                              ✏️ Modificar
                            </button>

                            {!isFinished && (
                              <button onClick={() => handleToggleCancelMatch(m.id, isCancelled ? 'ACTIVE' : 'CANCELLED')} className={`px-3.5 py-2 rounded-xl font-bold border cursor-pointer transition ${isCancelled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
                                {isCancelled ? 'Reactivar' : 'Suspender 🚫'}
                              </button>
                            )}

                            <button onClick={() => { setSelectedMetricMatchId(m.id); setCurrentSection('metrics'); }} className="px-3.5 py-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-bold hover:bg-amber-500/20 cursor-pointer transition">
                              Métricas 📊
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex flex-wrap gap-3 pl-2">
                          {(m.sectors || []).map((sec: StadiumSector, i: number) => (
                            <div key={i} className="px-4 py-2 rounded-2xl bg-[#07070a] border border-white/10 text-xs flex flex-col gap-0.5">
                              <span className="font-bold text-white">{sec.name}</span>
                              <span className="text-slate-400">General: <strong className="text-amber-400">${sec.generalPrice.toLocaleString('es-AR')}</strong></span>
                              <span className="text-slate-400">Socio: <strong className="text-emerald-400">{sec.memberPrice === 0 ? 'FREE (Canje)' : `$${sec.memberPrice.toLocaleString('es-AR')}`}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentSection === 'metrics' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">📊 Métricas & Ocupación del Estadio</h1>
                  <p className="text-xs text-slate-400 mt-1">Control en tiempo real de aforo y recaudación.</p>
                </div>
                <select
                  value={selectedMetricMatchId}
                  onChange={(e) => setSelectedMetricMatchId(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-[#0c0f17] border border-amber-500/30 text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>⚽ {m.name} ({m.date})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🏟️ Aforo Total Ocupado</span>
                  <span className="text-2xl font-black text-emerald-400 block">{overallFillRate}%</span>
                  <span className="text-[11px] text-slate-400 block">{totalOccupancy.toLocaleString('es-AR')} / {totalStadiumCapacity.toLocaleString('es-AR')} lugares</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">💵 Ventas en Efectivo</span>
                  <span className="text-2xl font-black text-emerald-400 block">{totalSoldCash.toLocaleString('es-AR')}</span>
                  <span className="text-[11px] text-slate-400 block">Pases emitidos en boletería</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">⭐ Socios / Canjes</span>
                  <span className="text-2xl font-black text-white block">{totalSoldMember.toLocaleString('es-AR')}</span>
                  <span className="text-[11px] text-slate-400 block">Masa societaria</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">📈 Recaudación Partido</span>
                  <span className="text-2xl font-black text-emerald-400 block">${totalMatchRevenue.toLocaleString('es-AR')}</span>
                  <span className="text-[11px] text-slate-500 block">Ingresos totales</span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-6 shadow-2xl">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="font-luxury text-lg font-bold text-white uppercase">Ocupación por Tribuna / Sector</h3>
                </div>

                <div className="space-y-6">
                  {metricSectors.map((sec, i) => {
                    const soldGen = sec.soldGeneral || 0;
                    const soldMem = sec.soldMember || 0;
                    const soldCashSec = sec.soldCash || 0;
                    const totalSoldSector = soldGen + soldMem;
                    const fillPct = sec.capacity > 0 ? Math.min(Math.round((totalSoldSector / sec.capacity) * 100), 100) : 0;
                    
                    return (
                      <div key={i} className="space-y-2 p-4 rounded-2xl bg-[#07070a] border border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold">
                          <span className="text-white text-sm font-luxury font-black">{sec.name}</span>
                          <div className="flex gap-4 text-slate-400 font-mono">
                            <span>Vendidas: <strong className="text-white">{totalSoldSector}</strong> (Gen: {soldGen} | Soc: {soldMem} | <strong className="text-emerald-400">Efectivo: {soldCashSec}</strong>) / {sec.capacity}</span>
                            <span className="text-amber-400 font-black">{fillPct}%</span>
                          </div>
                        </div>

                        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                          <div 
                            style={{ width: `${fillPct}%` }}
                            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-400 to-yellow-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(currentSection === 'create' || currentSection === 'edit') && (
            <form onSubmit={handleSaveMatch} className="space-y-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-luxury text-xl font-black uppercase text-white">{currentSection === 'create' ? 'Programar Nuevo Partido' : 'Modificar Partido'}</h2>
                <button type="button" onClick={() => setCurrentSection('matches_active')} className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#0c0f17] text-slate-300 text-xs font-bold cursor-pointer">← Volver</button>
              </div>

              <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl">
                <h3 className="font-luxury text-sm font-black uppercase text-white">1. Datos del Encuentro y Configuración de Validez</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Encuentro (Local vs Visitante)</label>
                    <input type="text" required placeholder="Ej: Club Atlético vs River Plate" value={matchForm.name} onChange={e => setMatchForm({...matchForm, name: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Fecha</label>
                    <input type="date" required value={matchForm.date} onChange={e => setMatchForm({...matchForm, date: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[9px]">⚽ Inicio</label>
                      <input type="time" required value={matchForm.startTime} onChange={e => setMatchForm({...matchForm, startTime: e.target.value})} className="w-full px-2.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[9px]">🚪 Puertas</label>
                      <input type="time" required value={matchForm.gateOpenTime} onChange={e => setMatchForm({...matchForm, gateOpenTime: e.target.value})} className="w-full px-2.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-emerald-400 font-bold text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[9px]">⌛ Cierre QR</label>
                      <input type="time" required value={matchForm.ticketExpiryTime} onChange={e => setMatchForm({...matchForm, ticketExpiryTime: e.target.value})} className="w-full px-2.5 py-3 bg-[#07070a] border border-amber-500/40 rounded-xl text-amber-400 font-bold text-center" title="Hora hasta la cual se pueden validar tickets" />
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">📍 Acceso / Por qué Puerta se Ingresa</label>
                    <input type="text" required value={matchForm.gateAccess} onChange={e => setMatchForm({...matchForm, gateAccess: e.target.value})} placeholder="Ej: Puerta A (Popular), Puerta B (Platea)" className="w-full px-4 py-3 bg-[#07070a] border border-white/10 text-amber-300 font-bold" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Estadio / Sede</label>
                    <input type="text" required value={matchForm.venue} onChange={e => setMatchForm({...matchForm, venue: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Ciudad</label>
                    <input type="text" required value={matchForm.city} onChange={e => setMatchForm({...matchForm, city: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 text-white" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Foto del Partido / Estadio</label>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#07070a] border border-white/10">
                      <img src={matchForm.imageUrl || DEFAULT_STADIUM_IMAGE} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-700" />
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full text-xs text-slate-400 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTORES Y PRECIOS DIFERENCIADOS */}
              <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-luxury text-sm font-black uppercase text-white">2. Tribunas, Sectores y Precios para Socios</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Configurá el valor general y el precio especial si el asistente es socio.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSectors([...sectors, { name: `Sector ${sectors.length + 1}`, generalPrice: 15000, memberPrice: 0, capacity: 5000, soldGeneral: 0, soldMember: 0, soldCash: 0 }])}
                    className="px-4 py-2.5 bg-amber-500 text-black text-xs font-black uppercase rounded-xl cursor-pointer shadow-md"
                  >
                    + Agregar Sector
                  </button>
                </div>

                <div className="space-y-4">
                  {sectors.map((sec, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-[#07070a] border border-white/5 space-y-4 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="font-black text-white uppercase">Sector #{idx + 1}</span>
                        {sectors.length > 1 && (
                          <button type="button" onClick={() => setSectors(sectors.filter((_, i) => i !== idx))} className="text-rose-400 cursor-pointer">✕ Quitar</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Nombre del Sector</label>
                          <input type="text" required placeholder="Ej: Popular Norte" value={sec.name} onChange={e => { const c = [...sectors]; c[idx].name = e.target.value; setSectors(c); }} className="w-full p-3 bg-[#0c0f17] rounded-xl border border-white/10 text-white font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Precio General ($)</label>
                          <input type="number" required min="0" value={sec.generalPrice} onChange={e => { const c = [...sectors]; c[idx].generalPrice = Number(e.target.value); setSectors(c); }} className="w-full p-3 bg-[#0c0f17] rounded-xl border border-white/10 text-amber-400 font-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-emerald-400 font-bold uppercase">Precio Socio ($ / $0 Free)</label>
                          <input type="number" required min="0" value={sec.memberPrice} onChange={e => { const c = [...sectors]; c[idx].memberPrice = Number(e.target.value); setSectors(c); }} className="w-full p-3 bg-[#0c0f17] rounded-xl border border-white/10 text-emerald-400 font-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Capacidad</label>
                          <input type="number" required min="1" value={sec.capacity} onChange={e => { const c = [...sectors]; c[idx].capacity = Number(e.target.value); setSectors(c); }} className="w-full p-3 bg-[#0c0f17] rounded-xl border border-white/10 text-white font-bold" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-2xl transition shadow-xl cursor-pointer tracking-wider">
                {currentSection === 'create' ? 'Guardar y Programar Partido ⚽' : 'Actualizar Cambios 💾'}
              </button>
            </form>
          )}

        </main>
      </div>

      {activeScanner && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-xs">
          <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-emerald-500/40 p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-sm">📷 Escáner de Molinete (Validación 4 Vías)</h3>
              <button onClick={() => setActiveScanner(false)} className="text-slate-400">✕</button>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Ingresá <strong className="text-blue-400">DNI</strong>, <strong className="text-emerald-400">Carnet</strong>, <strong className="text-white">QR</strong> o <strong className="text-yellow-400">Token Efectivo</strong>.
            </p>

            <div className="aspect-video rounded-2xl bg-black border border-white/15 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="DNI, Carnet, QR o Efectivo..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleValidateMolinete(manualCode); }}
                className="flex-1 px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-emerald-400 font-bold"
              />
              <button onClick={() => handleValidateMolinete(manualCode)} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition">
                Validar 🟢
              </button>
            </div>

            {scannerResult && (
              <div className={`p-3.5 rounded-xl border ${scannerResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                {scannerResult.message}
              </div>
            )}

            <button onClick={() => setActiveScanner(false)} className="w-full py-3 bg-white/5 text-white rounded-xl font-bold border border-white/10 cursor-pointer">
              Cerrar Escáner
            </button>
          </div>
        </div>
      )}

    </div>
  );
}