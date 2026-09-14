'use client';

import React, { useState, useEffect } from 'react';
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
  isDependent?: boolean;
  authorizedEmail?: string;
  category?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CAJA' | 'SEGURIDAD';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ClubAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  date: string;
}

export default function ClubAdminPage() {
  const router = useRouter();

  const [clubName, setClubName] = useState('CLUB ATLÉTICO');
  const [clubLogo, setClubLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');
  const [accentColor, setAccentColor] = useState('#fbbf24');
  const [savedConfig, setSavedConfig] = useState(false);

  const [matches, setMatches] = useState<any[]>([]);
  const [membersDb, setMembersDb] = useState<ClubMember[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [cashTickets, setCashTickets] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [uniqueClubs, setUniqueClubs] = useState<string[]>([]);
  const [newProducerModal, setNewProducerModal] = useState(false);
  const [producerForm, setProducerForm] = useState({
    producerName: '',
    producerType: 'CLUB' as 'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB',
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
  });
  
  const [currentSection, setCurrentSection] = useState<'matches_active' | 'matches_finished' | 'matches_suspended' | 'config' | 'members_db' | 'staff_roles' | 'cash_emission' | 'audit_logs' | 'metrics' | 'announcements' | 'sectors_prices' | 'create' | 'edit'>('matches_active');
  const [isMatchesMenuOpen, setIsMatchesMenuOpen] = useState<boolean>(true);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'CAJA' as 'ADMIN' | 'CAJA' | 'SEGURIDAD' });

  const [cashForm, setCashForm] = useState({
    matchId: '',
    holderName: '',
    holderDni: '35000000',
    selectedSectorName: '',
    cashAmount: 12000
  });

  const [selectedMetricMatchId, setSelectedMetricMatchId] = useState<string>('all');
  
  const [newMember, setNewMember] = useState({ 
    fullName: '', 
    dni: '', 
    memberNumber: '', 
    isDependent: false, 
    authorizedEmail: '',
    category: 'Activo Pleno'
  });
  
  const [csvInput, setCsvInput] = useState('');

  const DEFAULT_STADIUM_IMAGE = 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop';

  const [matchForm, setMatchForm] = useState({
    name: '',
    date: '',
    startTime: '19:00',
    gateOpenTime: '17:00',
    ticketExpiryTime: '21:30',
    gateAccess: 'Puerta A (Popular) / Puerta B (Platea)',
    venue: 'Estadio Principal',
    city: 'Buenos Aires',
    imageUrl: DEFAULT_STADIUM_IMAGE,
    status: 'ACTIVE'
  });

  const [sectors, setSectors] = useState<StadiumSector[]>([
    { name: 'Popular', generalPrice: 12000, memberPrice: 0, capacity: 15000, soldGeneral: 0, soldMember: 0, soldCash: 0 },
    { name: 'Platea', generalPrice: 25000, memberPrice: 15000, capacity: 5000, soldGeneral: 0, soldMember: 0, soldCash: 0 },
  ]);

  const getClubSlug = (name: string) => (name || clubName || 'club_atletico').toLowerCase().replace(/[^a-z0-9]/g, '_');

  const loadData = () => {
    try {
      const storedTeam = JSON.parse(localStorage.getItem('le_team_members') || '[]');
      setTeamMembers(storedTeam);

      const clubProducers = storedTeam
        .filter((m: any) => m.producerType === 'CLUB')
        .map((m: any) => m.producerName);

      const allClubs = Array.from(new Set([...clubProducers, clubName, 'CLUB ATLÉTICO'])) as string[];
      setUniqueClubs(allClubs);

      const slug = getClubSlug(clubName);

      const config = localStorage.getItem(`le_club_config_${slug}`) || localStorage.getItem('oasis_club_config');
      if (config) {
        const parsed = JSON.parse(config);
        setClubLogo(parsed.clubLogo || parsed.logo || '');
        setPrimaryColor(parsed.primaryColor || '#f59e0b');
        setAccentColor(parsed.accentColor || '#fbbf24');
      } else {
        setClubLogo('');
        setPrimaryColor('#f59e0b');
        setAccentColor('#fbbf24');
      }

      const storedSectors = JSON.parse(localStorage.getItem(`le_club_sectors_${slug}`) || '[]');
      if (storedSectors.length > 0) {
        setSectors(storedSectors);
      } else {
        setSectors([
          { name: 'Popular', generalPrice: 12000, memberPrice: 0, capacity: 15000, soldGeneral: 0, soldMember: 0, soldCash: 0 },
          { name: 'Platea', generalPrice: 25000, memberPrice: 15000, capacity: 5000, soldGeneral: 0, soldMember: 0, soldCash: 0 },
        ]);
      }

      const storedAnnouncements = JSON.parse(localStorage.getItem(`le_club_announcements_${slug}`) || '[]');
      if (storedAnnouncements.length === 0) {
        const defaultAnnouncements: ClubAnnouncement[] = [
          { id: 'ann-1', title: '¡Apertura de Puertas!', message: `Las puertas del estadio de ${clubName} se abrirán 2 horas antes.`, type: 'INFO', date: new Date().toLocaleDateString('es-AR') }
        ];
        setAnnouncements(defaultAnnouncements);
        localStorage.setItem(`le_club_announcements_${slug}`, JSON.stringify(defaultAnnouncements));
      } else {
        setAnnouncements(storedAnnouncements);
      }

      const storedStaff = JSON.parse(localStorage.getItem(`le_club_team_staff_${slug}`) || '[]');
      if (storedStaff.length === 0) {
        const defaultStaff: StaffMember[] = [
          { id: 'st-1', name: 'Administrador Club', email: 'admin@club.com', role: 'ADMIN', status: 'ACTIVE' },
          { id: 'st-2', name: 'Boletería', email: 'caja@club.com', role: 'CAJA', status: 'ACTIVE' },
          { id: 'st-3', name: 'Seguridad Puerta', email: 'puerta@club.com', role: 'SEGURIDAD', status: 'ACTIVE' }
        ];
        setStaffList(defaultStaff);
        localStorage.setItem(`le_club_team_staff_${slug}`, JSON.stringify(defaultStaff));
      } else {
        setStaffList(storedStaff);
      }

      const storedMatches = JSON.parse(localStorage.getItem(`le_club_matches_${slug}`) || '[]');
      const initialMatches = storedMatches.length > 0 ? storedMatches : [{
        id: `m-${slug}-1`,
        name: `${clubName} VS RIVAL`,
        date: '2026-09-15',
        startTime: '19:00',
        gateOpenTime: '17:00',
        ticketExpiryTime: '21:30',
        gateAccess: 'Puerta A y B (Popular)',
        venue: 'Estadio Principal',
        imageUrl: DEFAULT_STADIUM_IMAGE,
        sectors: sectors,
        status: 'ACTIVE'
      }];

      setMatches(initialMatches);
      if (initialMatches.length > 0) {
        setSelectedMetricMatchId(initialMatches[0].id);
        const firstM = initialMatches[0];
        const defaultSector = firstM.sectors?.[0];
        setCashForm(prev => ({
          ...prev,
          matchId: firstM.id,
          selectedSectorName: defaultSector?.name || '',
          cashAmount: defaultSector?.generalPrice || 12000
        }));
      }

      const clubMembersDb = JSON.parse(localStorage.getItem(`le_club_members_db_${slug}`) || '[]');
      if (clubMembersDb.length === 0) {
        const defaults: ClubMember[] = [
          { id: 'mb-1', fullName: `Socio Titular ${clubName}`, dni: '35123456', memberNumber: '10001', status: 'ACTIVE', category: 'Activo Pleno' }
        ];
        setMembersDb(defaults);
        localStorage.setItem(`le_club_members_db_${slug}`, JSON.stringify(defaults));
      } else {
        setMembersDb(clubMembersDb);
      }

      const storedLogs = JSON.parse(localStorage.getItem(`le_club_access_logs_${slug}`) || '[]');
      setAccessLogs(storedLogs);

      const storedCash = JSON.parse(localStorage.getItem(`le_club_cash_tickets_${slug}`) || '[]');
      setCashTickets(storedCash);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [clubName]);

  const handleRegisterProducer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerForm.producerName || !producerForm.firstName || !producerForm.lastName || !producerForm.dni || !producerForm.email || !producerForm.phone) {
      alert('Por favor completá todos los campos obligatorios.');
      return;
    }

    const prodName = producerForm.producerName.trim().toUpperCase();
    const prodType = producerForm.producerType;
    setClubName(prodName);

    const newOwner: any = {
      id: `tm-${Date.now()}`,
      name: `${producerForm.firstName} ${producerForm.lastName}`,
      email: producerForm.email.toLowerCase().trim(),
      dni: producerForm.dni.trim(),
      phone: producerForm.phone.trim(),
      role: 'OWNER',
      producerName: prodName,
      producerType: prodType
    };

    const updatedTeam = [newOwner, ...teamMembers];
    setTeamMembers(updatedTeam);
    localStorage.setItem('le_team_members', JSON.stringify(updatedTeam));

    setProducerForm({ producerName: '', producerType: 'CLUB', firstName: '', lastName: '', dni: '', email: '', phone: '' });
    setNewProducerModal(false);

    if (prodType !== 'CLUB') {
      router.push('/admin');
    } else {
      alert(`¡Entidad deportiva "${prodName}" registrada con éxito!`);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = getClubSlug(clubName);
    const configData = { clubName, clubLogo, primaryColor, accentColor };
    localStorage.setItem(`le_club_config_${slug}`, JSON.stringify(configData));
    localStorage.setItem('oasis_club_config', JSON.stringify(configData));
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 3000);
  };

  const handleSaveSectors = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = getClubSlug(clubName);
    localStorage.setItem(`le_club_sectors_${slug}`, JSON.stringify(sectors));
    alert('¡Sectores y precios institucionales guardados con éxito!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClubLogo(DEFAULT_STADIUM_IMAGE);
  };

  const handleMatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatchForm({ ...matchForm, imageUrl: DEFAULT_STADIUM_IMAGE });
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    const announcementObj: ClubAnnouncement = {
      id: `ann-${Date.now()}`,
      title: newAnnouncement.title.trim(),
      message: newAnnouncement.message.trim(),
      type: newAnnouncement.type,
      date: new Date().toLocaleDateString('es-AR')
    };

    const slug = getClubSlug(clubName);
    const updated = [announcementObj, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem(`le_club_announcements_${slug}`, JSON.stringify(updated));
    setNewAnnouncement({ title: '', message: '', type: 'INFO' });
    alert('¡Comunicado publicado!');
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!confirm('¿Eliminar comunicado?')) return;
    const slug = getClubSlug(clubName);
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem(`le_club_announcements_${slug}`, JSON.stringify(updated));
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    const staffObj: StaffMember = {
      id: `st-${Date.now()}`,
      name: newStaff.name.trim(),
      email: newStaff.email.trim(),
      role: newStaff.role,
      status: 'ACTIVE'
    };
    const slug = getClubSlug(clubName);
    const updated = [staffObj, ...staffList];
    setStaffList(updated);
    localStorage.setItem(`le_club_team_staff_${slug}`, JSON.stringify(updated));
    setNewStaff({ name: '', email: '', role: 'CAJA' });
  };

  const handleDeleteStaff = (id: string) => {
    if (!confirm('¿Eliminar personal?')) return;
    const slug = getClubSlug(clubName);
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    localStorage.setItem(`le_club_team_staff_${slug}`, JSON.stringify(updated));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.fullName || !newMember.dni || !newMember.memberNumber) return;

    const memberObj: ClubMember = {
      id: `mb-${Date.now()}`,
      fullName: newMember.fullName.trim(),
      dni: newMember.dni.trim(),
      memberNumber: newMember.memberNumber.trim(),
      status: 'ACTIVE',
      category: newMember.category
    };

    const slug = getClubSlug(clubName);
    const updated = [memberObj, ...membersDb];
    setMembersDb(updated);
    localStorage.setItem(`le_club_members_db_${slug}`, JSON.stringify(updated));
    setNewMember({ fullName: '', dni: '', memberNumber: '', isDependent: false, authorizedEmail: '', category: 'Activo Pleno' });
    alert(`¡Socio ${memberObj.fullName} registrado!`);
  };

  const handleImportCsv = () => {
    if (!csvInput.trim()) return alert('Pegá el formato CSV.');
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
          status: 'ACTIVE',
          category: 'Activo Pleno'
        });
      }
    });

    const slug = getClubSlug(clubName);
    const updated = [...newMembers, ...membersDb];
    setMembersDb(updated);
    localStorage.setItem(`le_club_members_db_${slug}`, JSON.stringify(updated));
    setCsvInput('');
    alert(`¡Se importaron ${newMembers.length} socios!`);
  };

  const handleDeleteMember = (id: string) => {
    if (!confirm('¿Eliminar socio?')) return;
    const slug = getClubSlug(clubName);
    const updated = membersDb.filter(m => m.id !== id);
    setMembersDb(updated);
    localStorage.setItem(`le_club_members_db_${slug}`, JSON.stringify(updated));
  };

  const handleToggleSuspendMatch = (matchId: string, currentStatus: string) => {
    const slug = getClubSlug(clubName);
    const nextStatus = currentStatus === 'CANCELLED' ? 'ACTIVE' : 'CANCELLED';
    const updated = matches.map(m => m.id === matchId ? { ...m, status: nextStatus } : m);
    setMatches(updated);
    localStorage.setItem(`le_club_matches_${slug}`, JSON.stringify(updated));
    alert(nextStatus === 'CANCELLED' ? '⚠️ Partido suspendido.' : '✅ Partido reactivado.');
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
    if (!cashForm.holderName) return;

    const matchedMatch = matches.find(m => m.id === cashForm.matchId) || matches[0];
    const slug = getClubSlug(clubName);

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
    localStorage.setItem(`le_club_cash_tickets_${slug}`, JSON.stringify(updatedCash));
    alert(`¡Entrada emitida! Token: ${newCashTicket.qrToken}`);
    setCashForm(prev => ({ ...prev, holderName: '', holderDni: '35000000' }));
  };

  const handleOpenCreate = () => {
    setEditingMatchId(null);
    setMatchForm({
      name: '',
      date: '',
      startTime: '19:00',
      gateOpenTime: '17:00',
      ticketExpiryTime: '21:30',
      gateAccess: 'Puerta A / B',
      venue: 'Estadio Principal',
      city: 'Buenos Aires',
      imageUrl: DEFAULT_STADIUM_IMAGE,
      status: 'ACTIVE'
    });
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
    setCurrentSection('edit');
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchForm.name || !matchForm.date) {
      alert('Completá los datos obligatorios.');
      return;
    }

    const slug = getClubSlug(clubName);
    let updatedMatches = [];
    if (editingMatchId) {
      updatedMatches = matches.map(m => m.id === editingMatchId ? { ...m, ...matchForm, clubName, clubLogo, primaryColor, sectors } : m);
    } else {
      const newMatch = {
        id: `match-${Date.now()}`,
        clubName,
        clubLogo,
        primaryColor,
        ...matchForm,
        sectors
      };
      updatedMatches = [newMatch, ...matches];
    }

    setMatches(updatedMatches);
    localStorage.setItem(`le_club_matches_${slug}`, JSON.stringify(updatedMatches));
    setCurrentSection('matches_active');
  };

  const filteredMatches = matches.filter(m => {
    if (currentSection === 'matches_active') return m.status === 'ACTIVE' || !m.status;
    if (currentSection === 'matches_finished') return m.status === 'FINISHED';
    if (currentSection === 'matches_suspended') return m.status === 'CANCELLED';
    return true;
  });

  const selectedMatchForCash = matches.find(m => m.id === cashForm.matchId) || matches[0];
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

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased font-mono">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER SUPERIOR */}
      <header className="h-16 border-b border-white/5 bg-[#07070a] px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-lg font-luxury" style={{ backgroundColor: primaryColor }}>
            ⚽
          </div>
          <div className="flex flex-col">
            <select
              value={clubName}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NEW') {
                  setNewProducerModal(true);
                } else {
                  setClubName(val);
                }
              }}
              className="bg-transparent text-white font-luxury text-sm font-black tracking-widest uppercase focus:outline-none cursor-pointer"
            >
              {uniqueClubs.map((club) => (
                <option key={club} value={club} className="bg-[#0c0f17] text-white">⚽ {club}</option>
              ))}
              <option disabled value="" className="bg-[#0c0f17] text-slate-600">────────────────────</option>
              <option value="NEW" className="bg-[#0c0f17] text-amber-400 font-bold">+ Crear nuevo club / entidad</option>
            </select>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Módulo Institucional & Partidos (Privado)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <Link 
            href="/admin" 
            className="px-4 py-2 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer flex items-center gap-2 shadow-md text-xs font-bold"
          >
            <span>🎉</span>
            <span>Volver a Módulo Fiestas</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR */}
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection.startsWith('matches') ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
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
                  className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer ${currentSection === 'matches_active' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                  ● Activos
                </button>
                <button
                  onClick={() => setCurrentSection('matches_finished')}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${currentSection === 'matches_finished' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                  Finalizados (Historial)
                </button>
                <button
                  onClick={() => setCurrentSection('matches_suspended')}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${currentSection === 'matches_suspended' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                  🚫 Suspendidos
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentSection('config')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'config' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>🛡️</span>
            <span>Identidad & Colores</span>
          </button>

          <button
            onClick={() => setCurrentSection('sectors_prices')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'sectors_prices' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>🏷️</span>
            <span>Sectores y Precios</span>
          </button>

          <button
            onClick={() => setCurrentSection('announcements')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'announcements' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>📢</span>
            <span>Comunicados / Anuncios</span>
          </button>

          <button
            onClick={() => setCurrentSection('members_db')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'members_db' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>👥</span>
            <span>Padrón Privado de Socios</span>
          </button>

          <button
            onClick={() => setCurrentSection('staff_roles')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'staff_roles' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>🔐</span>
            <span>Roles & Personal</span>
          </button>

          <button
            onClick={() => setCurrentSection('cash_emission')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'cash_emission' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>💵</span>
            <span>Venta en Efectivo</span>
          </button>

          <button
            onClick={() => setCurrentSection('audit_logs')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'audit_logs' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>📋</span>
            <span>Historial de Accesos</span>
          </button>

          <button
            onClick={() => setCurrentSection('metrics')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs ${currentSection === 'metrics' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span>📊</span>
            <span>Métricas & Ocupación</span>
          </button>

          <Link
            href="/admin/club/scanner"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 transition cursor-pointer font-bold block"
          >
            <span>📷</span>
            <span>Escáner de Puerta</span>
          </Link>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#07070a]">
          
          {currentSection === 'sectors_prices' && (
            <form onSubmit={handleSaveSectors} className="space-y-8 max-w-4xl mx-auto font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">🏷️ Sectores y Precios ({clubName})</h1>
                  <p className="text-xs text-slate-400 mt-1">Configuración general de aforos y tarifas institucionales.</p>
                </div>
                <button type="button" onClick={() => setSectors([...sectors, { name: `Sector ${sectors.length + 1}`, generalPrice: 15000, memberPrice: 0, capacity: 5000 }])} className="px-4 py-2 bg-amber-500 text-black text-xs font-black uppercase rounded-2xl cursor-pointer shadow-md">
                  + Agregar Sector
                </button>
              </div>

              <div className="space-y-4">
                {sectors.map((sec, idx) => (
                  <div key={idx} className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-3 text-xs shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400 uppercase">Sector #{idx + 1}</span>
                      {sectors.length > 1 && (
                        <button type="button" onClick={() => setSectors(sectors.filter((_, i) => i !== idx))} className="text-rose-400 font-bold cursor-pointer">✕ Quitar</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[9px] uppercase font-bold">Nombre</label>
                        <input type="text" placeholder="Ej: Popular" value={sec.name} onChange={e => { const c = [...sectors]; c[idx].name = e.target.value; setSectors(c); }} className="w-full p-3 bg-[#07070a] rounded-2xl border border-white/10 text-white font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-amber-400 text-[9px] uppercase font-bold">General ($)</label>
                        <input type="number" min="0" value={sec.generalPrice} onChange={e => { const c = [...sectors]; c[idx].generalPrice = Number(e.target.value); setSectors(c); }} className="w-full p-3 bg-[#07070a] rounded-2xl border border-white/10 text-amber-400 font-black" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-emerald-400 text-[9px] uppercase font-bold">Socio ($)</label>
                        <input type="number" min="0" value={sec.memberPrice} onChange={e => { const c = [...sectors]; c[idx].memberPrice = Number(e.target.value); setSectors(c); }} className="w-full p-3 bg-[#07070a] rounded-2xl border border-white/10 text-emerald-400 font-black" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[9px] uppercase font-bold">Capacidad</label>
                        <input type="number" min="1" value={sec.capacity} onChange={e => { const c = [...sectors]; c[idx].capacity = Number(e.target.value); setSectors(c); }} className="w-full p-3 bg-[#07070a] rounded-2xl border border-white/10 text-white font-bold" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-black uppercase text-xs rounded-2xl shadow-xl cursor-pointer tracking-wider">
                Guardar Sectores y Precios 💾
              </button>
            </form>
          )}

          {currentSection === 'announcements' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">📢 Comunicados & Anuncios ({clubName})</h1>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleAddAnnouncement} className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl text-xs">
                  <h3 className="font-luxury text-base font-black text-white uppercase">✨ Nuevo Anuncio</h3>
                  <input type="text" required placeholder="Título" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                  <textarea rows={4} required placeholder="Mensaje..." value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                  <button type="submit" className="w-full py-3.5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl cursor-pointer">Publicar 📢</button>
                </form>
                <div className="lg:col-span-7 space-y-3">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs">
                      <div><strong className="text-white text-sm">{ann.title}</strong><p className="text-slate-300">{ann.message}</p></div>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-rose-400 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentSection === 'staff_roles' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">🔐 Personal y Roles ({clubName})</h1>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleAddStaff} className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 text-xs">
                  <input type="text" required placeholder="Nombre" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                  <input type="email" required placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                  <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-amber-300 font-bold">
                    <option value="ADMIN">👑 Administrador</option>
                    <option value="CAJA">💵 Boletería</option>
                    <option value="SEGURIDAD">📷 Seguridad</option>
                  </select>
                  <button type="submit" className="w-full py-3.5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl cursor-pointer">Registrar Personal +</button>
                </form>
                <div className="lg:col-span-7 space-y-2">
                  {staffList.map((st) => (
                    <div key={st.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs">
                      <div><strong className="text-white">{st.name} ({st.role})</strong><span className="text-slate-400 block">{st.email}</span></div>
                      <button onClick={() => handleDeleteStaff(st.id)} className="text-rose-400 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentSection === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-8 max-w-2xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">🛡️ Identidad Institucional & Colores</h1>
              </div>
              <div className="p-8 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-6 text-xs">
                <input type="text" required value={clubName} onChange={e => setClubName(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white font-bold" />
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#07070a] border border-white/10">
                  {clubLogo ? <img src={clubLogo} alt="" className="w-16 h-16 rounded-2xl object-cover" /> : <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">⚽</div>}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-10 bg-transparent rounded-2xl cursor-pointer border border-white/20" />
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-full h-10 bg-transparent rounded-2xl cursor-pointer border border-white/20" />
                </div>
                <button type="submit" className="w-full py-3.5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl cursor-pointer">Guardar Cambios 💾</button>
              </div>
            </form>
          )}

          {currentSection === 'cash_emission' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">💵 Venta en Efectivo (Boletería)</h1>
              </div>
              <form onSubmit={handleIssueCashTicket} className="max-w-md p-6 rounded-3xl bg-[#0c0f17] border border-emerald-500/30 space-y-4 text-xs">
                <select value={cashForm.matchId} onChange={e => handleMatchChangeForCash(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white font-bold">
                  {matches.map(m => (<option key={m.id} value={m.id}>⚽ {m.name}</option>))}
                </select>
                <select value={cashForm.selectedSectorName} onChange={e => handleSectorChangeForCash(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-amber-300 font-bold">
                  {(selectedMatchForCash?.sectors || []).map((sec: any, idx: number) => (<option key={idx} value={sec.name}>{sec.name} — ${sec.generalPrice}</option>))}
                </select>
                <input type="text" required placeholder="Nombre del Asistente" value={cashForm.holderName} onChange={e => setCashForm({...cashForm, holderName: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                <input type="number" required value={cashForm.cashAmount} onChange={e => setCashForm({...cashForm, cashAmount: Number(e.target.value)})} className="w-full p-3 bg-[#07070a] border border-emerald-500/40 rounded-2xl text-emerald-400 font-black text-base" />
                <button type="submit" className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-xs rounded-2xl cursor-pointer">Cobrar y Emitir Pase 🚀</button>
              </form>
            </div>
          )}

          {currentSection === 'audit_logs' && (
            <div className="space-y-6 max-w-5xl mx-auto font-mono">
              <h1 className="font-luxury text-2xl font-black text-white uppercase">📋 Historial Privado de Accesos</h1>
              <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2">
                {accessLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-[#07070a] flex justify-between items-center text-xs">
                    <div><strong className="text-white">{log.name}</strong><span className="text-slate-400 block">{log.detail}</span></div>
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'members_db' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">👥 Padrón Privado de Socios</h1>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleAddMember} className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 text-xs">
                  <input type="text" required placeholder="Nombre y Apellido" value={newMember.fullName} onChange={e => setNewMember({...newMember, fullName: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                  <input type="text" required placeholder="DNI" value={newMember.dni} onChange={e => setNewMember({...newMember, dni: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white" />
                  <input type="text" required placeholder="Nro de Carnet" value={newMember.memberNumber} onChange={e => setNewMember({...newMember, memberNumber: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-amber-400 font-bold" />
                  <button type="submit" className="w-full py-3.5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl cursor-pointer">Guardar en Padrón +</button>
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <textarea rows={3} placeholder="Nombre,DNI,NroSocio" value={csvInput} onChange={e => setCsvInput(e.target.value)} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-xs text-white" />
                    <button type="button" onClick={handleImportCsv} className="w-full py-2.5 bg-white/5 text-white font-bold rounded-2xl border border-white/10">Importar CSV 📥</button>
                  </div>
                </form>
                <div className="lg:col-span-7 space-y-2 max-h-[500px] overflow-y-auto">
                  {membersDb.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs">
                      <div><strong className="text-white">{m.fullName}</strong><span className="text-slate-400 block">DNI: {m.dni} · Carnet: #{m.memberNumber}</span></div>
                      <button onClick={() => handleDeleteMember(m.id)} className="text-rose-400 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentSection === 'metrics' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">📊 Métricas & Ocupación</h1>
                <select value={selectedMetricMatchId} onChange={e => setSelectedMetricMatchId(e.target.value)} className="px-4 py-3 rounded-2xl bg-[#0c0f17] border border-amber-500/30 text-xs font-bold text-white cursor-pointer">
                  {matches.map(m => (<option key={m.id} value={m.id}>⚽ {m.name}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🏟️ Aforo Ocupado</span>
                  <span className="text-2xl font-black text-emerald-400 block">{overallFillRate}%</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">💵 Efectivo</span>
                  <span className="text-2xl font-black text-emerald-400 block">{totalSoldCash}</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">⭐ Socios</span>
                  <span className="text-2xl font-black text-white block">{totalSoldMember}</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">📈 Recaudación Total</span>
                  <span className="text-2xl font-black text-emerald-400 block">${totalMatchRevenue.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          )}

          {currentSection.startsWith('matches') && (
            <div className="space-y-6 max-w-5xl mx-auto font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">
                  {currentSection === 'matches_active' ? 'Partidos Activos / Próximos' : currentSection === 'matches_finished' ? 'Historial de Partidos' : 'Partidos Suspendidos'}
                </h1>
                <button onClick={handleOpenCreate} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-2xl shadow-lg cursor-pointer">+ Programar Partido</button>
              </div>
              <div className="space-y-3">
                {filteredMatches.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#0c0f17] border border-white/5 text-slate-500 text-xs">
                    No hay partidos registrados en esta sección.
                  </div>
                ) : (
                  filteredMatches.map((m) => {
                    const isCancelled = m.status === 'CANCELLED';
                    return (
                      <div key={m.id} className={`p-6 rounded-3xl bg-[#0c0f17] border flex justify-between items-center shadow-xl ${isCancelled ? 'border-rose-900/50 opacity-75' : 'border-white/5'}`}>
                        <div className="flex items-center gap-4">
                          <img src={m.imageUrl || DEFAULT_STADIUM_IMAGE} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                          <div>
                            <h3 className="font-luxury text-base font-black text-white">{m.name}</h3>
                            <p className="text-xs text-slate-400">📅 {m.date} · ⚽ Inicio: <strong className="text-amber-400">{m.startTime} HS</strong></p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => handleOpenEdit(m)} className="px-4 py-2 bg-white/5 text-slate-200 border border-white/10 rounded-2xl font-bold hover:bg-white/10 cursor-pointer transition">✏️ Modificar</button>
                          <button onClick={() => handleToggleSuspendMatch(m.id, m.status)} className={`px-4 py-2 rounded-2xl font-bold border cursor-pointer transition ${isCancelled ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>
                            {isCancelled ? 'Reactivar' : 'Suspender 🚫'}
                          </button>
                          <button onClick={() => { setSelectedMetricMatchId(m.id); setCurrentSection('metrics'); }} className="px-4 py-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-2xl font-bold hover:bg-amber-500/20 cursor-pointer transition">Métricas 📊</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {(currentSection === 'create' || currentSection === 'edit') && (
            <form onSubmit={handleSaveMatch} className="space-y-8 max-w-4xl mx-auto font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-luxury text-xl font-black uppercase text-white">{currentSection === 'create' ? 'PROGRAMAR PARTIDO' : 'MODIFICAR PARTIDO'}</h2>
                <button type="button" onClick={() => setCurrentSection('matches_active')} className="px-4 py-2 rounded-2xl border border-white/10 bg-[#0c0f17] text-slate-300 text-xs font-bold cursor-pointer">← Volver</button>
              </div>

              {/* INFORMACIÓN GENERAL DEL PARTIDO */}
              <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-4 text-xs shadow-xl">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold text-[10px]">Encuentro (Local vs Visitante)</label>
                  <input type="text" required placeholder="Ej: Club vs Rival" value={matchForm.name} onChange={e => setMatchForm({...matchForm, name: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-2xl text-white font-bold" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold text-[10px]">Fecha del Partido</label>
                  <input type="date" required value={matchForm.date} onChange={e => setMatchForm({...matchForm, date: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-2xl text-white font-bold" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase font-bold text-[9px]">⚽ Hora de Inicio</label>
                    <input type="time" required value={matchForm.startTime} onChange={e => setMatchForm({...matchForm, startTime: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white text-center font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase font-bold text-[9px]">🚪 Apertura Puertas</label>
                    <input type="time" required value={matchForm.gateOpenTime} onChange={e => setMatchForm({...matchForm, gateOpenTime: e.target.value})} className="w-full p-3 bg-[#07070a] border border-white/10 rounded-2xl text-white text-center font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-amber-400 uppercase font-bold text-[9px]">⌛ Cierre de Venta</label>
                    <input type="time" required value={matchForm.ticketExpiryTime} onChange={e => setMatchForm({...matchForm, ticketExpiryTime: e.target.value})} className="w-full p-3 bg-[#07070a] border border-amber-500/40 rounded-2xl text-amber-400 text-center font-black" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-slate-400 uppercase font-bold text-[10px]">Flyer / Imagen del Partido</label>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#07070a] border border-white/10">
                    <img src={matchForm.imageUrl || DEFAULT_STADIUM_IMAGE} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-700" />
                    <input type="file" accept="image/*" onChange={handleMatchFileUpload} className="text-xs text-slate-400 cursor-pointer" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-black uppercase text-xs rounded-2xl shadow-xl cursor-pointer tracking-wider">
                Guardar Partido ⚽
              </button>
            </form>
          )}

        </main>
      </div>

      {/* MODAL CREAR NUEVO CLUB CON DESPLEGABLE DE TIPO DESTACADO */}
      {newProducerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
          <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <h3 className="font-luxury text-base font-black text-white uppercase">✨ Registrar Nueva Entidad / Club</h3>
            <form onSubmit={handleRegisterProducer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre del Club / Entidad</label>
                <input type="text" required placeholder="Ej: Racing Club" value={producerForm.producerName} onChange={e => setProducerForm({...producerForm, producerName: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-amber-400 uppercase font-bold text-[10px]">Tipo de Entidad / Rubro</label>
                <select value={producerForm.producerType} onChange={e => setProducerForm({...producerForm, producerType: e.target.value as any})} className="w-full px-4 py-3 bg-[#07070a] border border-amber-500/50 rounded-xl text-amber-300 font-bold cursor-pointer">
                  <option value="CLUB">⚽ Club / Institución / Deportes</option>
                  <option value="ENTERTAINMENT">🎉 Entretenimiento / Fiestas / Festivales</option>
                  <option value="CORPORATE">💼 Corporativo / Congresos</option>
                  <option value="THEATRE">🎭 Teatro / Cultura</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Nombre" value={producerForm.firstName} onChange={e => setProducerForm({...producerForm, firstName: e.target.value})} className="px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
                <input type="text" required placeholder="Apellido" value={producerForm.lastName} onChange={e => setProducerForm({...producerForm, lastName: e.target.value})} className="px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              </div>
              <input type="text" required placeholder="DNI" value={producerForm.dni} onChange={e => setProducerForm({...producerForm, dni: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              <input type="email" required placeholder="Correo" value={producerForm.email} onChange={e => setProducerForm({...producerForm, email: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              <input type="text" required placeholder="Teléfono" value={producerForm.phone} onChange={e => setProducerForm({...producerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setNewProducerModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl border border-white/10">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl cursor-pointer">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}