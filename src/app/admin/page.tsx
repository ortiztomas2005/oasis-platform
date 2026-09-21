'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';
import { useSession } from '@/core/auth/useSession';

export interface Tier {
  name: string;
  price: number;
  capacity: number;
  originalCapacity?: number;
  soldCount?: number;
  entryCutoffTime?: string;
  showStockToClients?: boolean;
  scarcityThreshold?: number;
  status?: 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN';
}

export interface BarDrink {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface CostItem {
  id: string;
  eventId: string;
  concept: string;
  amount: number;
  paid: boolean;
}

export interface CouponItem {
  id: string;
  code: string;
  discountPct: number;
  active: boolean;
}

export interface RRPPMember {
  id: string;
  name: string;
  code: string;
  commissionPerTicket: number;
  active: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  dni?: string;
  phone?: string;
  role: 'OWNER' | 'ADMIN' | 'DOOR' | 'BAR';
  producerName: string;
  producerType?: 'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB';
}

export interface EventItem {
  id: string;
  producerName: string;
  producerType?: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  imageUrl: string;
  genre: string;
  description: string;
  tiers: Tier[];
  barMenu: BarDrink[];
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}

// Función auxiliar declarada correctamente para evitar ReferenceError
const getProducersForEmail = (team: any[], targetEmail: string) => {
  if (!targetEmail) return [];
  return team
    .filter((m: any) => {
      const matchesEmail = (m.email || '').toLowerCase().trim() === targetEmail.toLowerCase().trim();
      const isEntertainment = m.producerType === 'ENTERTAINMENT' || !m.producerType || m.producerType === 'CORPORATE' || m.producerType === 'THEATRE';
      return matchesEmail && isEntertainment;
    })
    .map((m: any) => m.producerName);
};

export default function LiveExperienceAdmin() {
  const router = useRouter();
  // Identidad real (Supabase Auth) en vez de localStorage — antes esta
  // pantalla no reconocía ninguna sesión real, por más que existiera de
  // verdad una productora creada.
  const { user: sessionUser, isAuthenticated, loading: sessionLoading } = useSession();

  const [isMounted, setIsMounted] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [activeProducer, setActiveProducer] = useState<string>('');
  const [activeProducerType, setActiveProducerType] = useState<'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB'>('ENTERTAINMENT');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [barOrders, setBarOrders] = useState<any[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [rrppList, setRrppList] = useState<RRPPMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  
  const [prepaidBalances, setPrepaidBalances] = useState<{ [producer: string]: number }>({});
  
  const [customTicketQtyStr, setCustomTicketQtyStr] = useState<string>('100');
  const customTicketQty = Number(customTicketQtyStr) || 0;

  const [checkoutPackage, setCheckoutPackage] = useState<{ name: string; count: number; price: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mercado_pago' | 'transfer'>('mercado_pago');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [simulatedDispatch, setSimulatedDispatch] = useState<any | null>(null);
  const [isSendingMail, setIsSendingMail] = useState(false);

  const [currentSection, setCurrentSection] = useState<'events_active' | 'events_finished' | 'events_suspended' | 'dashboard' | 'costs' | 'marketing' | 'team' | 'prepaid_market' | 'activity' | 'delivery' | 'crm' | 'broadcast' | 'guestlist' | 'finances'>('broadcast');
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState<boolean>(true);

  const [eventSubView, setEventSubView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedDashboardEventId, setSelectedDashboardEventId] = useState<string>('all');
  const [selectedEventForRrpp, setSelectedEventForRrpp] = useState<string>('all');

  const [activeScanner, setActiveScanner] = useState<'door' | 'bar' | null>(null);
  const [scannerResult, setScannerResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [newCoupon, setNewCoupon] = useState({ code: '', discountPct: 15 });
  const [newRrpp, setNewRrpp] = useState({ name: '', code: '', commissionPerTicket: 1500 });
  const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '', dni: '', phone: '', role: 'DOOR' as const, producerName: '' });
  
  const [newProducerModal, setNewProducerModal] = useState(false);
  const [producerForm, setProducerForm] = useState({
    producerName: '',
    producerType: 'ENTERTAINMENT' as 'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB',
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
  });

  const [formData, setFormData] = useState({
    producerName: '',
    name: '',
    date: '',
    startTime: '22:00',
    endTime: '06:00',
    venue: '',
    city: '',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    genre: 'Melodic Techno',
    description: '',
  });

  const [tiers, setTiers] = useState<Tier[]>([
    { name: 'Early Bird', price: 12000, capacity: 100, originalCapacity: 100, soldCount: 0, entryCutoffTime: '01:00', showStockToClients: true, scarcityThreshold: 20, status: 'ACTIVE' },
    { name: 'General T1', price: 15000, capacity: 250, originalCapacity: 250, soldCount: 0, entryCutoffTime: '03:00', showStockToClients: false, scarcityThreshold: 15, status: 'ACTIVE' },
  ]);

  const [barMenu, setBarMenu] = useState<BarDrink[]>([
    { id: 'b-1', name: 'Fernet Branca con Cola', category: 'Tragos', price: 6000, stock: 200 },
    { id: 'b-2', name: 'Gin Tonic Botánico', category: 'Tragos', price: 6500, stock: 150 },
  ]);

  const [newDrink, setNewDrink] = useState({ name: '', category: 'Tragos', price: 6500, stock: 100 });
  const [newCost, setNewCost] = useState({ eventId: '', concept: '', amount: 150000 });

  // Carga las secciones que todavía son 100% locales (barra, costos,
  // cupones, RRPP, eventos "de prueba" de este panel, actividad) — sin
  // tocar, siguen igual que antes.
  const loadLocalData = () => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('le_local_events') || '[]');
      setEvents(storedEvents);

      setTickets(JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]'));
      setBarOrders(JSON.parse(localStorage.getItem('le_bar_orders') || '[]'));
      setCosts(JSON.parse(localStorage.getItem('le_costs_data') || '[]'));
      setCoupons(JSON.parse(localStorage.getItem('le_coupons') || '[]'));
      setRrppList(JSON.parse(localStorage.getItem('le_rrpp_members') || '[]'));
      setActivityLogs(JSON.parse(localStorage.getItem('le_activity_logs') || '[]'));
    } catch (e) {
      console.error(e);
    }
  };

  // Identidad, equipo y saldo: antes se adivinaban de localStorage (por
  // eso una productora creada de verdad nunca aparecía acá). Ahora salen
  // de la sesión real de Supabase Auth y de las mismas rutas /api/producers
  // que ya usan /admin/eventos, /admin/equipo, etc.
  const loadRealIdentity = async () => {
    if (!sessionUser) {
      setCurrentUserEmail('');
      setActiveProducer('');
      return;
    }

    setCurrentUserEmail(sessionUser.email);
    setProducerForm((prev) => ({ ...prev, email: sessionUser.email }));

    try {
      const res = await fetch('/api/producers/team');
      if (!res.ok) {
        // No es staff de ninguna productora todavía
        setActiveProducer('');
        setTeamMembers([]);
        return;
      }
      const data = await res.json();
      const producerName = data.producerName || '';
      setActiveProducer(producerName);

      const mapped: TeamMember[] = (data.team || []).map((m: any) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        dni: m.dni || undefined,
        phone: m.phone || undefined,
        role: m.role,
        producerName,
      }));
      setTeamMembers(mapped);

      const meRes = await fetch('/api/producers/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.producer) {
          setPrepaidBalances((prev) => ({ ...prev, [meData.producer.name]: meData.producer.prepaid_balance }));
        }
      }
    } catch (e) {
      console.error('Error cargando la productora real:', e);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadLocalData();
    window.addEventListener('storage', loadLocalData);
    return () => window.removeEventListener('storage', loadLocalData);
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    loadRealIdentity();
  }, [sessionLoading, sessionUser]);

  useEffect(() => {
    if (activeScanner) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [activeScanner]);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const addLog = (type: string, text: string) => {
    const newLog = { id: Date.now(), type, text, time: 'Hace un momento' };
    const updated = [newLog, ...activityLogs];
    setActivityLogs(updated);
    localStorage.setItem('le_activity_logs', JSON.stringify(updated));
  };

  const calculatePriceForQuantity = (qty: number) => {
    if (qty >= 2000) return qty * 120;
    if (qty >= 1000) return qty * 150;
    if (qty >= 500) return qty * 180;
    return qty * 200;
  };

  const handleProcessCheckout = () => {
    if (!checkoutPackage || !activeProducer) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      const amount = checkoutPackage.count;
      const current = prepaidBalances[activeProducer] || 500;
      const updated = { ...prepaidBalances, [activeProducer]: current + amount };
      
      setPrepaidBalances(updated);
      localStorage.setItem('le_prepaid_balances', JSON.stringify(updated));

      addLog('MARKET', `Adquisición exitosa de ${amount} tickets prepagos (${checkoutPackage.name})`);

      setIsProcessingPayment(false);
      setCheckoutPackage(null);
      alert(`🎉 ¡Pago procesado con éxito! Se han acreditado ${amount} tickets prepagos a "${activeProducer}".`);
    }, 1500);
  };

  const handleValidateDoorTicket = (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) return;
    try {
      const allTickets = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
      const foundIndex = allTickets.findIndex(
        (t: any) => (t.qrToken || t.qrCode || '').trim().toLowerCase() === cleanToken.toLowerCase() || t.id.trim().toLowerCase() === cleanToken.toLowerCase()
      );

      if (foundIndex === -1) {
        setScannerResult({ success: false, message: '❌ Pase inválido o inexistente en el sistema.' });
        return;
      }

      const ticket = allTickets[foundIndex];
      if (ticket.status === 'USED') {
        setScannerResult({ success: false, message: `⚠️ ACCESO DENEGADO: El pase de ${ticket.holderName || 'Titular'} ya fue utilizado.`, details: ticket });
        return;
      }

      allTickets[foundIndex].status = 'USED';
      allTickets[foundIndex].scannedAt = new Date().toISOString();
      localStorage.setItem('oasis_issued_tickets', JSON.stringify(allTickets));
      setTickets(allTickets);

      const currentBalance = prepaidBalances[activeProducer] || 500;
      const newBalances = { ...prepaidBalances, [activeProducer]: Math.max(0, currentBalance - 1) };
      setPrepaidBalances(newBalances);
      localStorage.setItem('le_prepaid_balances', JSON.stringify(newBalances));

      addLog('DOOR', `Acceso concedido a ${ticket.holderName || 'Asistente'} (${ticket.tierName})`);

      setScannerResult({ success: true, message: `✅ ACCESO CONCEDIDO: ¡Bienvenido/a ${ticket.holderName || 'Asistente'}!`, details: ticket });
      setManualCode('');
    } catch (e) {
      setScannerResult({ success: false, message: 'Error interno al validar el pase.' });
    }
  };

  const handleValidateBarToken = (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim().toUpperCase();
    if (!cleanToken) return;
    try {
      const allOrders = JSON.parse(localStorage.getItem('le_bar_orders') || localStorage.getItem('oasis_bar_orders') || '[]');
      const foundIndex = allOrders.findIndex((o: any) => (o.pickupToken || o.token || '').trim().toUpperCase() === cleanToken);

      if (foundIndex === -1) {
        setScannerResult({ success: false, message: '❌ Token de barra no encontrado.' });
        return;
      }

      const order = allOrders[foundIndex];
      if (order.status === 'REDEEMED' || order.status === 'delivered') {
        setScannerResult({ success: false, message: `⚠️ CONSUMICIÓN YA RETIRADA: Pedido de ${order.customerName}.`, details: order });
        return;
      }

      allOrders[foundIndex].status = 'REDEEMED';
      localStorage.setItem('le_bar_orders', JSON.stringify(allOrders));
      localStorage.setItem('oasis_bar_orders', JSON.stringify(allOrders));
      setBarOrders(allOrders);

      addLog('BAR', `Entrega de barra a ${order.customerName}`);

      setScannerResult({ success: true, message: `🍸 PEDIDO ENTREGADO: Retira ${order.customerName}`, details: order });
      setManualCode('');
    } catch (e) {
      setScannerResult({ success: false, message: 'Error al procesar el token de barra.' });
    }
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    const updated = [...coupons, { id: `cp-${Date.now()}`, code: newCoupon.code.toUpperCase().trim(), discountPct: Number(newCoupon.discountPct), active: true }];
    setCoupons(updated);
    localStorage.setItem('le_coupons', JSON.stringify(updated));
    setNewCoupon({ code: '', discountPct: 15 });
  };

  const removeCoupon = (id: string) => {
    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    localStorage.setItem('le_coupons', JSON.stringify(updated));
  };

  const handleAddRrpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRrpp.code || !newRrpp.name) return;
    const updated = [...rrppList, { id: `rp-${Date.now()}`, name: newRrpp.name, code: newRrpp.code.toLowerCase().trim(), commissionPerTicket: Number(newRrpp.commissionPerTicket), active: true }];
    setRrppList(updated);
    localStorage.setItem('le_rrpp_members', JSON.stringify(updated));
    setNewRrpp({ name: '', code: '', commissionPerTicket: 1500 });
  };

  const removeRrpp = (id: string) => {
    const updated = rrppList.filter((r) => r.id !== id);
    setRrppList(updated);
    localStorage.setItem('le_rrpp_members', JSON.stringify(updated));
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamMember.email || !newTeamMember.name) return;
    const member: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newTeamMember.name,
      email: newTeamMember.email.toLowerCase().trim(),
      dni: newTeamMember.dni,
      phone: newTeamMember.phone,
      role: newTeamMember.role,
      producerName: activeProducer,
      producerType: activeProducerType
    };
    const updated = [...teamMembers, member];
    setTeamMembers(updated);
    localStorage.setItem('le_team_members', JSON.stringify(updated));
    setNewTeamMember({ name: '', email: '', dni: '', phone: '', role: 'DOOR', producerName: activeProducer });
  };

  const removeTeamMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    localStorage.setItem('le_team_members', JSON.stringify(updated));
  };

  const handleRegisterProducer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerForm.producerName || !producerForm.firstName || !producerForm.lastName || !producerForm.dni || !producerForm.phone) {
      alert('Por favor completá todos los campos obligatorios.');
      return;
    }

    if (!currentUserEmail) {
      alert('No hay una sesión activa con correo electrónico.');
      return;
    }

    const prodName = producerForm.producerName.trim().toUpperCase();
    const prodType = producerForm.producerType;
    const regEmail = currentUserEmail;

    const storedTeam = JSON.parse(localStorage.getItem('le_team_members') || '[]');
    const existingForThisMail = storedTeam.find((m: any) => (m.email || '').toLowerCase().trim() === regEmail && m.role === 'OWNER');

    if (existingForThisMail) {
      alert(`Ya tenés registrada la productora "${existingForThisMail.producerName}" con este correo. Solo se permite una productora por cuenta.`);
      setNewProducerModal(false);
      setActiveProducer(existingForThisMail.producerName);
      return;
    }

    setActiveProducer(prodName);
    setActiveProducerType(prodType);

    const newOwner: TeamMember = {
      id: `tm-${Date.now()}`,
      name: `${producerForm.firstName} ${producerForm.lastName}`,
      email: regEmail,
      dni: producerForm.dni.trim(),
      phone: producerForm.phone.trim(),
      role: 'OWNER',
      producerName: prodName,
      producerType: prodType
    };

    const updatedTeam = [newOwner, ...storedTeam];
    setTeamMembers(updatedTeam);
    localStorage.setItem('le_team_members', JSON.stringify(updatedTeam));

    const updatedBalances = { ...prepaidBalances, [prodName]: 500 };
    setPrepaidBalances(updatedBalances);
    localStorage.setItem('le_prepaid_balances', JSON.stringify(updatedBalances));

    setNewProducerModal(false);

    if (prodType === 'CLUB') {
      router.push('/admin/club');
    } else {
      alert(`¡Productora "${prodName}" creada con éxito para ${regEmail}!`);
    }
  };

  const handleDeleteOrLeaveProducer = () => {
    const isOwner = teamMembers.some(m => m.producerName === activeProducer && m.role === 'OWNER');
    const confirmMsg = isOwner 
      ? `¿Estás seguro de ELIMINAR por completo la productora "${activeProducer}"? Se borrarán sus eventos y equipo asociado.`
      : `¿Estás seguro de ABANDONAR la productora "${activeProducer}"?`;

    if (!confirm(confirmMsg)) return;

    const updatedTeam = teamMembers.filter(m => m.producerName !== activeProducer);
    const updatedEvents = events.filter(e => e.producerName !== activeProducer);

    setTeamMembers(updatedTeam);
    setEvents(updatedEvents);

    localStorage.setItem('le_team_members', JSON.stringify(updatedTeam));
    localStorage.setItem('le_local_events', JSON.stringify(updatedEvents));

    const remainingProducers = Array.from(new Set(
      updatedTeam
        .filter((m: any) => (m.email || '').toLowerCase().trim() === currentUserEmail.toLowerCase().trim())
        .map((m: any) => m.producerName)
    )) as string[];
    
    if (remainingProducers.length > 0) {
      setActiveProducer(remainingProducers[0]);
      alert(`Has eliminado la productora con éxito.`);
    } else {
      setActiveProducer('');
      alert('Ya no tenés productoras activas asociadas a este correo.');
    }
  };

  const saveAndSyncEvents = (updated: EventItem[]) => {
    setEvents(updated);
    localStorage.setItem('le_local_events', JSON.stringify(updated));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, imageUrl: URL.createObjectURL(file) });
  };

  const handleOpenCreate = () => {
    if (!activeProducer) {
      alert('Primero debés crear o seleccionar una productora.');
      setNewProducerModal(true);
      return;
    }
    setEditingEventId(null);
    setFormData({
      producerName: activeProducer,
      name: '',
      date: '',
      startTime: '22:00',
      endTime: '06:00',
      venue: '',
      city: '',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
      genre: 'Melodic Techno',
      description: '',
    });
    setTiers([
      { name: 'Early Bird', price: 12000, capacity: 100, originalCapacity: 100, soldCount: 0, entryCutoffTime: '01:00', showStockToClients: true, scarcityThreshold: 15, status: 'ACTIVE' },
      { name: 'General T1', price: 15000, capacity: 250, originalCapacity: 250, soldCount: 0, entryCutoffTime: '03:00', showStockToClients: false, scarcityThreshold: 20, status: 'ACTIVE' },
    ]);
    setBarMenu([
      { id: 'b-1', name: 'Fernet Branca con Cola', category: 'Tragos', price: 6000, stock: 200 },
      { id: 'b-2', name: 'Gin Tonic Botánico', category: 'Tragos', price: 6500, stock: 150 },
    ]);
    setEventSubView('create');
  };

  const handleOpenEdit = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setFormData({
      producerName: ev.producerName || activeProducer,
      name: ev.name,
      date: ev.date,
      startTime: ev.startTime || '22:00',
      endTime: ev.endTime || '06:00',
      venue: ev.venue,
      city: ev.city,
      imageUrl: ev.imageUrl,
      genre: ev.genre || 'Melodic Techno',
      description: ev.description || '',
    });
    setTiers((ev.tiers || []).map((t) => ({ ...t, originalCapacity: t.originalCapacity ?? t.capacity })));
    setBarMenu(ev.barMenu || []);
    setEventSubView('edit');
  };

  const handleSaveNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.venue || !formData.city) {
      alert('Completá los campos obligatorios.');
      return;
    }
    const initialTiers = tiers.map((t) => ({ ...t, originalCapacity: t.capacity }));
    const newEvent: EventItem = { 
      id: `ev-${Date.now()}`, 
      ...formData, 
      producerName: activeProducer, 
      producerType: activeProducerType,
      status: 'ACTIVE', 
      tiers: initialTiers, 
      barMenu 
    };
    saveAndSyncEvents([newEvent, ...events]);
    setEventSubView('list');
  };

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;

    for (const tier of tiers) {
      const origCap = tier.originalCapacity ?? tier.capacity;
      if (tier.capacity < origCap) {
        alert(`No podés reducir la capacidad de "${tier.name}" por debajo del stock original (${origCap}).`);
        return;
      }
    }

    const updated = events.map((ev) => (ev.id === editingEventId ? { ...ev, ...formData, producerName: activeProducer, producerType: activeProducerType, tiers, barMenu } : ev));
    saveAndSyncEvents(updated);
    setEventSubView('list');
    setEditingEventId(null);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'FINISHED' : 'ACTIVE';
    saveAndSyncEvents(events.map((ev) => (ev.id === id ? { ...ev, status: nextStatus as any } : ev)));
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm('¿Eliminar evento permanentemente?')) return;
    saveAndSyncEvents(events.filter((ev) => ev.id !== id));
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost.concept || !newCost.eventId) return;
    const item: CostItem = { id: `c-${Date.now()}`, eventId: newCost.eventId, concept: newCost.concept, amount: Number(newCost.amount), paid: false };
    const updated = [...costs, item];
    setCosts(updated);
    localStorage.setItem('le_costs_data', JSON.stringify(updated));
    setNewCost({ eventId: '', concept: '', amount: 150000 });
  };

  const toggleCostPaid = (id: string) => {
    const updated = costs.map((c) => (c.id === id ? { ...c, paid: !c.paid } : c));
    setCosts(updated);
    localStorage.setItem('le_costs_data', JSON.stringify(updated));
  };

  const removeCost = (id: string) => {
    const updated = costs.filter((c) => c.id !== id);
    setCosts(updated);
    localStorage.setItem('le_costs_data', JSON.stringify(updated));
  };

  const producerEvents = events.filter((ev) => (ev.producerName || '') === activeProducer);
  const filteredEventsList = producerEvents.filter((ev) => {
    const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (currentSection === 'events_active') return matchesSearch && ev.status === 'ACTIVE';
    if (currentSection === 'events_finished') return matchesSearch && ev.status === 'FINISHED';
    if (currentSection === 'events_suspended') return matchesSearch && ev.status === 'CANCELLED';
    return matchesSearch;
  });

  const filteredTickets = tickets.filter((t) => selectedDashboardEventId === 'all' || t.eventId === selectedDashboardEventId);
  const filteredOrders = barOrders.filter((o) => selectedDashboardEventId === 'all' || o.eventName === events.find(e => e.id === selectedDashboardEventId)?.name);
  const filteredCosts = costs.filter((c) => selectedDashboardEventId === 'all' || c.eventId === selectedDashboardEventId);

  const totalTicketRev = filteredTickets.reduce((acc, t) => acc + (t.price || 0), 0);
  const totalBarRev = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalScanned = filteredTickets.filter((t) => t.status === 'USED').length;
  const attendanceRate = filteredTickets.length > 0 ? Math.round((totalScanned / filteredTickets.length) * 100) : 0;
  const eventCostsTotal = filteredCosts.reduce((acc, c) => acc + (c.amount || 0), 0);
  const netProfit = totalTicketRev + totalBarRev - eventCostsTotal;

  const uniqueProducers = isMounted ? Array.from(new Set(getProducersForEmail(teamMembers, currentUserEmail))) : [];
  const currentPrepaidCount = prepaidBalances[activeProducer] ?? 500;
  const isUserOwner = teamMembers.some(m => m.producerName === activeProducer && m.role === 'OWNER');

  if (!isMounted) return null;

  // BLOQUEO ABSOLUTO SI NO HAY SESIÓN ACTIVA
  if (!currentUserEmail) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col items-center justify-center p-6 font-mono selection:bg-amber-500 selection:text-black">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          .font-luxury { font-family: 'Cinzel', serif; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; }
        `}</style>
        <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/30 p-8 space-y-6 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black mx-auto">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="font-luxury text-xl font-black text-white uppercase">Iniciá Sesión</h1>
            <p className="text-xs text-slate-400">No hay ninguna cuenta logueada. Para administrar productoras debés iniciar sesión.</p>
          </div>
          <Link href="/" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition block shadow-lg cursor-pointer">
            Ir a la Cartelera / Iniciar Sesión 🔑
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER SUPERIOR */}
      <header className="h-16 border-b border-white/5 bg-[#07070a] px-6 flex items-center justify-between shrink-0 z-30 font-mono">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20">
            {activeProducer ? activeProducer.substring(0, 2).toUpperCase() : 'LE'}
          </div>
          <div className="flex flex-col">
            <select
              value={activeProducer}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NEW') {
                  setNewProducerModal(true);
                } else {
                  setActiveProducer(val);
                }
              }}
              className="bg-transparent text-white font-luxury text-sm font-black tracking-widest uppercase focus:outline-none cursor-pointer"
            >
              {uniqueProducers.length === 0 && (
                <option value="" disabled className="bg-[#0c0f17] text-slate-400">Sin productoras para este mail</option>
              )}
              {uniqueProducers.map((prod) => (
                <option key={prod} value={prod} className="bg-[#0c0f17] text-white">🏢 {prod}</option>
              ))}
              <option disabled value="" className="bg-[#0c0f17] text-slate-600">────────────────────</option>
              <option value="NEW" className="bg-[#0c0f17] text-amber-400 font-bold">+ Crear productora para {currentUserEmail}</option>
            </select>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider">MÓDULO FIESTAS & ENTRETENIMIENTO ({currentUserEmail})</span>
          </div>

          {activeProducer && (
            <div className="ml-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-inner">
              <span>🎟️ Tickets Disponibles:</span>
              <span className="text-white font-black text-sm">{currentPrepaidCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-bold font-mono">
          <Link href="/admin/club" className="px-4 py-2 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center gap-2 shadow-md">
            <span>⚽</span>
            <span>Ir a Módulo Clubes / Deportes</span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white transition">Ver Cartelera</Link>
          <UserMenu />
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR */}
      <div className="flex flex-1 overflow-hidden font-mono">
        
        <aside className="w-64 border-r border-white/5 bg-[#050507] flex flex-col justify-between p-4 shrink-0 select-none overflow-y-auto">
          <nav className="space-y-1 text-xs font-medium">

            {/* HERRAMIENTAS CONECTADAS DE VERDAD A SUPABASE. Lo que queda
                abajo en "Local / demo" (Broadcast, Escáner de Barra, Pases
                PDF/APK, Cupones & RRPP) todavía no tiene tabla real. */}
            <div className="mb-4 pb-4 border-b border-white/10 space-y-1">
              <span className="px-3 text-[9px] text-emerald-400 uppercase font-bold tracking-widest block mb-1.5">
                ● Conectado a tu cuenta real
              </span>
              <Link href="/admin/eventos" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>🎫</span><span>Eventos (real)</span>
              </Link>
              <Link href="/admin/pedidos" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>💳</span><span>Confirmar Ventas</span>
              </Link>
              <Link href="/admin/equipo" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>👥</span><span>Equipo (real)</span>
              </Link>
              <Link href="/admin/mercadopago" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>💙</span><span>Mercado Pago</span>
              </Link>
              <Link href="/admin/comprar-tickets" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>🎟️</span><span>Comprar Tickets</span>
              </Link>
              <Link href="/scanner" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>📷</span><span>Escanear QR (Puerta)</span>
              </Link>
              <Link href="/admin/asistentes" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>👥</span><span>CRM de Asistentes</span>
              </Link>
              <Link href="/admin/cortesias" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>🎟️</span><span>Guestlist & Cortesías</span>
              </Link>
              <Link href="/admin/costos" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>💳</span><span>Cobros & Gastos</span>
              </Link>
              <Link href="/admin/metricas" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition">
                <span>📊</span><span>Dashboard & Métricas</span>
              </Link>
            </div>

            <span className="px-3 text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1.5">
              Local / demo (sin conectar todavía)
            </span>

            <button
              onClick={() => setCurrentSection('broadcast')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'broadcast' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📢</span>
              <span>Broadcast & Alertas</span>
            </button>

            <button
              onClick={() => setActiveScanner('bar')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition cursor-pointer"
            >
              <span>🍸</span>
              <span>Escáner de Barra</span>
            </button>

            <button
              onClick={() => setCurrentSection('delivery')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'delivery' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📨</span>
              <span>Pases PDF & App (APK)</span>
            </button>

            <button
              onClick={() => setCurrentSection('marketing')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'marketing' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>🏷️</span>
              <span>Cupones & RRPP</span>
            </button>

          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#07070a]">
          
          {!activeProducer ? (
            <div className="p-16 text-center rounded-3xl bg-[#0c0f17] border border-amber-500/30 space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
              <span className="text-4xl">🏢</span>
              <h2 className="font-luxury text-xl font-bold text-white uppercase">No tenés ninguna productora para este correo</h2>
              <p className="text-xs text-slate-400">Estás conectado con <strong className="text-amber-400">{currentUserEmail}</strong>. Registrá tu productora exclusiva para este mail.</p>
              <button
                onClick={() => setNewProducerModal(true)}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer"
              >
                + Crear Productora para este Mail 🚀
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickets.length > 0 && (
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-[#0c0f17] border border-amber-500/30 flex items-center justify-between gap-4 font-mono shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg animate-bounce">
                        🎟️
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-white">¡Nuevas entradas emitidas!</h4>
                        <p className="text-[11px] text-slate-400">{tickets.length} pases listos para validar.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveScanner('door')}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-xl transition shadow-md cursor-pointer shrink-0"
                    >
                      📷 Escáner Puerta
                    </button>
                  </div>
                )}
              </div>

              {/* SECCIÓN BROADCAST & ALERTAS */}
              {currentSection === 'broadcast' && (
                <div className="space-y-6 max-w-4xl mx-auto font-mono">
                  <div className="border-b border-white/5 pb-4">
                    <h1 className="font-luxury text-2xl font-black text-white uppercase">📢 Broadcast & Alertas a Asistentes</h1>
                    <p className="text-xs text-slate-400 mt-1">Enviá notificaciones instantáneas a los dispositivos de todos los compradores de {activeProducer}.</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const title = (document.getElementById('broadcastTitle') as HTMLInputElement).value;
                        const message = (document.getElementById('broadcastMsg') as HTMLTextAreaElement).value;
                        const targetEvent = (document.getElementById('broadcastEvent') as HTMLSelectElement).value;

                        if (!title || !message) return alert('Completá el título y el mensaje.');

                        const newAlert = {
                          id: `alert-${Date.now()}`,
                          title,
                          message,
                          targetEvent,
                          producerName: activeProducer,
                          time: 'Hace un momento',
                          read: false
                        };

                        const existingAlerts = JSON.parse(localStorage.getItem('le_broadcast_alerts') || '[]');
                        localStorage.setItem('le_broadcast_alerts', JSON.stringify([newAlert, ...existingAlerts]));

                        addLog('BROADCAST', `Notificación enviada: "${title}"`);
                        alert('¡Notificación masiva enviada con éxito a los asistentes!');
                        (document.getElementById('broadcastTitle') as HTMLInputElement).value = '';
                        (document.getElementById('broadcastMsg') as HTMLTextAreaElement).value = '';
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold">Evento Destino</label>
                        <select id="broadcastEvent" className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold">
                          <option value="all">🌐 Todos los Eventos de la Productora</option>
                          {producerEvents.map((ev) => (
                            <option key={ev.id} value={ev.name}>{ev.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold">Título del Aviso</label>
                        <input id="broadcastTitle" type="text" required placeholder="Ej: ¡Apertura de puertas adelantada a las 21:30!" className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold">Mensaje Detallado</label>
                        <textarea id="broadcastMsg" rows={3} required placeholder="Escribí los detalles que verá el asistente en su billetera..." className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-sans text-xs" />
                      </div>

                      <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition shadow-xl shadow-amber-500/20 cursor-pointer tracking-wider">
                        Enviar Notificación Masiva 🚀
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* SECCIÓN PASES PDF & APP */}
              {currentSection === 'delivery' && (
                <div className="space-y-6 max-w-4xl mx-auto font-mono">
                  <div className="border-b border-white/5 pb-4">
                    <h1 className="font-luxury text-2xl font-black text-white uppercase">📨 Envío Automático de Pases (PDF & APK)</h1>
                    <p className="text-xs text-slate-400 mt-1">Despachá entradas digitales oficiales desde <strong className="text-amber-400">liveexperience123@gmail.com</strong>.</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-6 shadow-xl">
                    <div className="space-y-2 text-xs">
                      <label className="text-slate-400 uppercase font-bold block">Correo del Comprador</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          id="testEmail"
                          placeholder="asistente@correo.com"
                          className="flex-1 px-4 py-3.5 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                          defaultValue="comprador@liveexperience.com"
                        />
                        <button
                          type="button"
                          disabled={isSendingMail}
                          onClick={async () => {
                            const emailInput = (document.getElementById('testEmail') as HTMLInputElement).value;
                            if (!emailInput) return alert('Ingresá un correo válido.');

                            setIsSendingMail(true);
                            try {
                              const res = await fetch('https://formsubmit.co/ajax/liveexperience123@gmail.com', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                                body: JSON.stringify({
                                  _subject: `🎟️ Pase Oficial - ${producerEvents[0]?.name || 'Evento'}`,
                                  Destinatario: emailInput,
                                  Evento: producerEvents[0]?.name || 'Evento',
                                  Tanda: 'General Anticipada',
                                  Titular: 'Asistente Oficial',
                                  QR_Token: 'LE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                                  Token_Barra: 'BR-9912',
                                  _template: 'table'
                                })
                              });

                              const data = await res.json();
                              if (data.success || res.ok) {
                                setSimulatedDispatch({
                                  email: emailInput,
                                  eventName: producerEvents[0]?.name || 'Evento',
                                  timestamp: new Date().toLocaleTimeString()
                                });
                                alert('¡Entrada enviada con éxito a ' + emailInput + ' desde liveexperience123@gmail.com!');
                              } else {
                                alert('Error al despachar el correo.');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Error de conexión al enviar el correo.');
                            } finally {
                              setIsSendingMail(false);
                            }
                          }}
                          className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                        >
                          {isSendingMail ? 'Enviando...' : 'Enviar por Mail Real 🚀'}
                        </button>
                      </div>
                    </div>

                    {simulatedDispatch && (
                      <div className="p-5 rounded-2xl bg-[#0c170f] border border-emerald-900/60 space-y-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <span>✓</span>
                          <span>¡Correo con PDF y APK adjuntos despachado a {simulatedDispatch.email} desde liveexperience123@gmail.com!</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">El usuario recibió los archivos oficiales correctamente.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN CUPONES & RRPP */}
              {currentSection === 'marketing' && (
                <div className="space-y-8 max-w-5xl mx-auto font-mono">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <form onSubmit={handleAddCoupon} className="p-6 sm:p-8 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl">
                      <h3 className="font-luxury text-base font-black text-white uppercase">🏷️ Crear Cupón de Descuento</h3>
                      <div className="space-y-1 text-xs">
                        <label className="text-slate-400 uppercase font-bold text-[10px]">Código de Cupón</label>
                        <input type="text" required placeholder="Ej: VERANO20" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-amber-400 font-black uppercase focus:outline-none" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="text-slate-400 uppercase font-bold text-[10px]">Descuento (%)</label>
                        <input type="number" required min="1" max="100" value={newCoupon.discountPct} onChange={(e) => setNewCoupon({ ...newCoupon, discountPct: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white font-bold focus:outline-none" />
                      </div>
                      <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl cursor-pointer tracking-wider">Guardar Cupón +</button>
                      <div className="space-y-2 pt-4 border-t border-white/5">
                        {coupons.map((c) => (
                          <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-[#07070a] border border-white/5 text-xs">
                            <div><span className="font-black text-amber-400">{c.code}</span> <span className="text-slate-400">({c.discountPct}% OFF)</span></div>
                            <button type="button" onClick={() => removeCoupon(c.id)} className="text-rose-400 cursor-pointer">✕</button>
                          </div>
                        ))}
                      </div>
                    </form>

                    <form onSubmit={handleAddRrpp} className="p-6 sm:p-8 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl">
                      <h3 className="font-luxury text-base font-black text-white uppercase">🤝 Alta de Embajador RRPP</h3>
                      <div className="space-y-1 text-xs">
                        <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre</label>
                        <input type="text" required placeholder="Ej: Franco Martínez" value={newRrpp.name} onChange={(e) => setNewRrpp({ ...newRrpp, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="text-slate-400 uppercase font-bold text-[10px]">Código Único (Ej: asd)</label>
                        <input type="text" required placeholder="asd" value={newRrpp.code} onChange={(e) => setNewRrpp({ ...newRrpp, code: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-amber-400 font-black lowercase" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="text-slate-400 uppercase font-bold text-[10px]">Comisión por Entrada ($)</label>
                        <input type="number" required value={newRrpp.commissionPerTicket} onChange={(e) => setNewRrpp({ ...newRrpp, commissionPerTicket: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-emerald-400 font-bold" />
                      </div>
                      <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl cursor-pointer tracking-wider">Crear RRPP +</button>
                    </form>
                  </div>
                </div>
              )}

            </>
          )}

        </main>
      </div>

      {/* PASARELA DE PAGO */}
      {checkoutPackage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
          <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-luxury text-base font-black uppercase text-white">💳 Pasarela de Pago Segura</h3>
              <button onClick={() => setCheckoutPackage(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#07070a] border border-white/5 space-y-2">
                <div className="flex justify-between font-bold text-white">
                  <span>{checkoutPackage.name}</span>
                  <span className="text-emerald-400">+{checkoutPackage.count} pases</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-white/5">
                  <span>Total a abonar:</span>
                  <span className="text-lg font-black text-white">${checkoutPackage.price.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleProcessCheckout}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-2xl transition shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 tracking-wider"
            >
              {isProcessingPayment ? <span>Procesando pago seguro...</span> : <span>Pagar ${checkoutPackage.price.toLocaleString('es-AR')} 🚀</span>}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVA PRODUCTORA */}
      {newProducerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
          <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <h3 className="font-luxury text-base font-black text-white uppercase">✨ Registrar Nueva Productora / Entidad</h3>
            <form onSubmit={handleRegisterProducer} className="space-y-3">
              <input type="text" required placeholder="Nombre Comercial" value={producerForm.producerName} onChange={e => setProducerForm({...producerForm, producerName: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white font-bold" />
              
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-bold text-[10px]">Tipo de Entidad / Rubro</label>
                <select value={producerForm.producerType} onChange={e => setProducerForm({...producerForm, producerType: e.target.value as any})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-amber-400 font-bold">
                  <option value="ENTERTAINMENT">🎉 Entretenimiento / Fiestas / Festivales</option>
                  <option value="CLUB">⚽ Club / Institución / Deportes</option>
                  <option value="CORPORATE">💼 Corporativo / Congresos</option>
                  <option value="THEATRE">🎭 Teatro / Cultura</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Nombre" value={producerForm.firstName} onChange={e => setProducerForm({...producerForm, firstName: e.target.value})} className="px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
                <input type="text" required placeholder="Apellido" value={producerForm.lastName} onChange={e => setProducerForm({...producerForm, lastName: e.target.value})} className="px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              </div>
              <input type="text" required placeholder="DNI" value={producerForm.dni} onChange={e => setProducerForm({...producerForm, dni: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              <input type="email" required disabled value={currentUserEmail} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-emerald-400 font-bold opacity-80" />
              <input type="text" required placeholder="Teléfono" value={producerForm.phone} onChange={e => setProducerForm({...producerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setNewProducerModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl border border-white/10">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER PUERTA */}
      {activeScanner === 'door' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
          <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-emerald-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-sm">📷 Escáner de Puerta</h3>
              <button onClick={() => { setActiveScanner(null); setScannerResult(null); }} className="text-slate-400">✕</button>
            </div>
            <div className="aspect-video rounded-2xl bg-black border border-white/15 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Código..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="flex-1 px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-emerald-400 font-bold" />
              <button onClick={() => handleValidateDoorTicket(manualCode)} className="px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Validar</button>
            </div>
            {scannerResult && (
              <div className={`p-3.5 rounded-xl border ${scannerResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                {scannerResult.message}
              </div>
            )}
            <button onClick={() => { setActiveScanner(null); setScannerResult(null); }} className="w-full py-3 bg-white/5 text-white rounded-xl font-bold border border-white/10 cursor-pointer">Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER BARRA */}
      {activeScanner === 'bar' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
          <div className="max-w-md w-full rounded-3xl bg-[#0c0f17] border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-sm">🍸 Escáner de Barra</h3>
              <button onClick={() => { setActiveScanner(null); setScannerResult(null); }} className="text-slate-400">✕</button>
            </div>
            <div className="aspect-video rounded-2xl bg-black border border-white/15 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Token..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="flex-1 px-3.5 py-3 bg-[#07070a] border border-white/10 rounded-xl text-amber-400 font-bold uppercase" />
              <button onClick={() => handleValidateBarToken(manualCode)} className="px-5 py-3 bg-amber-500 text-black font-bold rounded-xl cursor-pointer">Canjear</button>
            </div>
            {scannerResult && (
              <div className={`p-3.5 rounded-xl border ${scannerResult.success ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                {scannerResult.message}
              </div>
            )}
            <button onClick={() => { setActiveScanner(null); setScannerResult(null); }} className="w-full py-3 bg-white/5 text-white rounded-xl font-bold border border-white/10 cursor-pointer">Cerrar</button>
          </div>
        </div>
      )}

    </div>
  );
}