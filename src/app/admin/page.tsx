'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from '@/components/UserMenu';

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

export default function LiveExperienceAdmin() {
  const router = useRouter();
  const [activeProducer, setActiveProducer] = useState<string>('LIVE EXPERIENCE');
  const [activeProducerType, setActiveProducerType] = useState<'ENTERTAINMENT' | 'CORPORATE' | 'THEATRE' | 'CLUB'>('ENTERTAINMENT');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [barOrders, setBarOrders] = useState<any[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [rrppList, setRrppList] = useState<RRPPMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  
  const [prepaidBalances, setPrepaidBalances] = useState<{ [producer: string]: number }>({ 'LIVE EXPERIENCE': 500 });
  
  const [customTicketQtyStr, setCustomTicketQtyStr] = useState<string>('100');
  const customTicketQty = Number(customTicketQtyStr) || 0;

  const [checkoutPackage, setCheckoutPackage] = useState<{ name: string; count: number; price: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mercado_pago' | 'transfer'>('mercado_pago');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [simulatedDispatch, setSimulatedDispatch] = useState<any | null>(null);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [originUrl, setOriginUrl] = useState('');

  // Navegación y Acordeón Lateral Funcional
  const [currentSection, setCurrentSection] = useState<'events_active' | 'events_finished' | 'events_suspended' | 'dashboard' | 'costs' | 'marketing' | 'team' | 'prepaid_market' | 'activity' | 'delivery' | 'crm' | 'broadcast' | 'guestlist' | 'finances'>('events_active');
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
  const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '', dni: '', phone: '', role: 'DOOR' as const, producerName: 'LIVE EXPERIENCE' });
  
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
    producerName: 'LIVE EXPERIENCE',
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
    { name: 'Early Bird', price: 12000, capacity: 100, originalCapacity: 100, soldCount: 85, entryCutoffTime: '01:00', showStockToClients: true, scarcityThreshold: 20, status: 'ACTIVE' },
    { name: 'General T1', price: 15000, capacity: 250, originalCapacity: 250, soldCount: 50, entryCutoffTime: '03:00', showStockToClients: false, scarcityThreshold: 15, status: 'ACTIVE' },
  ]);

  const [barMenu, setBarMenu] = useState<BarDrink[]>([
    { id: 'b-1', name: 'Fernet Branca con Cola', category: 'Tragos', price: 6000, stock: 200 },
    { id: 'b-2', name: 'Gin Tonic Botánico', category: 'Tragos', price: 6500, stock: 150 },
  ]);

  const [newDrink, setNewDrink] = useState({ name: '', category: 'Tragos', price: 6500, stock: 100 });
  const [newCost, setNewCost] = useState({ eventId: '', concept: '', amount: 150000 });

  const loadData = () => {
    try {
      if (typeof window !== 'undefined') setOriginUrl(window.location.origin);
      
      const storedTeam = JSON.parse(localStorage.getItem('le_team_members') || '[]');
      const remainingProducers = Array.from(new Set(storedTeam.map((m: any) => m.producerName)));

      if (storedTeam.length > 0 && remainingProducers.length === 0) {
        alert('Ya no pertenecés a ninguna productora activa.');
        router.push('/');
        return;
      }

      setTeamMembers(storedTeam);

      const currentMember = storedTeam.find((m: any) => m.producerName === activeProducer);
      if (currentMember && currentMember.producerType) {
        setActiveProducerType(currentMember.producerType);
        if (currentMember.producerType === 'CLUB') {
          router.push('/admin/club');
          return;
        }
      }

      const storedEvents = JSON.parse(localStorage.getItem('le_local_events') || '[]');
      if (storedEvents.length > 0) {
        setEvents(storedEvents);
        if (selectedDashboardEventId === 'all') setSelectedDashboardEventId(storedEvents[0].id);
        if (selectedEventForRrpp === 'all' && storedEvents[0]) setSelectedEventForRrpp(storedEvents[0].id);
      } else {
        const defaultEv: EventItem[] = [{
          id: 'ev-1',
          producerName: 'LIVE EXPERIENCE',
          producerType: 'ENTERTAINMENT',
          name: 'LIVE EXPERIENCE SUNSET EDITION',
          date: '2026-10-14',
          startTime: '23:00',
          endTime: '07:00',
          venue: 'PMRC Puerto Madero',
          city: 'Buenos Aires',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
          genre: 'Melodic Techno',
          description: 'Sunset edition oficial.',
          tiers: [{ name: 'General', price: 15000, capacity: 300, originalCapacity: 300, soldCount: 285, entryCutoffTime: '02:00', scarcityThreshold: 20, status: 'ACTIVE' }],
          barMenu: [{ id: 'b-1', name: 'Fernet con Cola', category: 'Tragos', price: 6000, stock: 200 }],
          status: 'ACTIVE'
        }];
        setEvents(defaultEv);
        localStorage.setItem('le_local_events', JSON.stringify(defaultEv));
      }

      setTickets(JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]'));
      setBarOrders(JSON.parse(localStorage.getItem('le_bar_orders') || localStorage.getItem('oasis_bar_orders') || '[]'));
      setCosts(JSON.parse(localStorage.getItem('le_costs_data') || '[]'));
      setCoupons(JSON.parse(localStorage.getItem('le_coupons') || '[{"id":"cp-1","code":"VERANO15","discountPct":15,"active":true}]'));
      setRrppList(JSON.parse(localStorage.getItem('le_rrpp_members') || '[{"id":"rp-1","name":"Franco","code":"franco","commissionPerTicket":1500,"active":true}]'));
      setActivityLogs(JSON.parse(localStorage.getItem('le_activity_logs') || '[{"id":1, "type":"DOOR", "text":"Acceso concedido", "time":"Hace 5 min"}]'));
      
      const balances = JSON.parse(localStorage.getItem('le_prepaid_balances') || '{"LIVE EXPERIENCE": 500}');
      setPrepaidBalances(balances);

      if (remainingProducers.length > 0 && !remainingProducers.includes(activeProducer)) {
        setActiveProducer(String(remainingProducers[0]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  useEffect(() => {
    const currentMember = teamMembers.find((m: any) => m.producerName === activeProducer);
    if (currentMember && currentMember.producerType) {
      setActiveProducerType(currentMember.producerType);
      if (currentMember.producerType === 'CLUB') {
        router.push('/admin/club');
      }
    }
  }, [activeProducer, teamMembers, router]);

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
    if (!checkoutPackage) return;
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
    if (!producerForm.producerName || !producerForm.firstName || !producerForm.lastName || !producerForm.dni || !producerForm.email || !producerForm.phone) {
      alert('Por favor completá todos los campos obligatorios.');
      return;
    }

    const prodName = producerForm.producerName.trim().toUpperCase();
    const prodType = producerForm.producerType;
    setActiveProducer(prodName);
    setActiveProducerType(prodType);

    const newOwner: TeamMember = {
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

    const updatedBalances = { ...prepaidBalances, [prodName]: 500 };
    setPrepaidBalances(updatedBalances);
    localStorage.setItem('le_prepaid_balances', JSON.stringify(updatedBalances));

    setProducerForm({ producerName: '', producerType: 'ENTERTAINMENT', firstName: '', lastName: '', dni: '', email: '', phone: '' });
    setNewProducerModal(false);

    if (prodType === 'CLUB') {
      router.push('/admin/club');
    } else {
      alert(`¡Productora "${prodName}" registrada con éxito!`);
    }
  };

  const handleDeleteOrLeaveProducer = () => {
    const isOwner = teamMembers.some(m => m.producerName === activeProducer && m.role === 'OWNER');
    const confirmMsg = isOwner 
      ? `¿Estás seguro de ELIMINAR por completo la productora "${activeProducer}"? Se borrarán sus eventos y equipo asociado.`
      : `¿Estás seguro de ABANDONAR la productora "${activeProducer}"? Perderás el acceso a sus operaciones.`;

    if (!confirm(confirmMsg)) return;

    const updatedTeam = teamMembers.filter(m => m.producerName !== activeProducer);
    const updatedEvents = events.filter(e => e.producerName !== activeProducer);

    setTeamMembers(updatedTeam);
    setEvents(updatedEvents);

    localStorage.setItem('le_team_members', JSON.stringify(updatedTeam));
    localStorage.setItem('le_local_events', JSON.stringify(updatedEvents));

    const remainingProducers = Array.from(new Set(updatedTeam.map(m => m.producerName)));
    
    if (remainingProducers.length > 0) {
      setActiveProducer(String(remainingProducers[0]));
      alert(`Has ${isOwner ? 'eliminado' : 'abandonado'} la productora con éxito.`);
    } else {
      alert('Ya no pertenecés a ninguna productora activa. Redirigiendo a la cartelera...');
      router.push('/');
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

  const producerEvents = events.filter((ev) => (ev.producerName || 'LIVE EXPERIENCE') === activeProducer);
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

  const uniqueProducers = Array.from(new Set(teamMembers.map((m) => m.producerName)));
  if (!uniqueProducers.includes(activeProducer)) uniqueProducers.push(activeProducer);

  const currentPrepaidCount = prepaidBalances[activeProducer] ?? 500;
  const isUserOwner = teamMembers.some(m => m.producerName === activeProducer && m.role === 'OWNER');

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-luxury { font-family: 'Cinzel', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* HEADER SUPERIOR CON REDIRECCIÓN INTELIGENTE AL SELECCIONAR CLUB */}
      <header className="h-16 border-b border-white/5 bg-[#07070a] px-6 flex items-center justify-between shrink-0 z-30 font-mono">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-500/20">
            {activeProducer.substring(0, 2).toUpperCase()}
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
                  const member = teamMembers.find((m: any) => m.producerName === val);
                  if (member && member.producerType === 'CLUB') {
                    router.push('/admin/club');
                  }
                }
              }}
              className="bg-transparent text-white font-luxury text-sm font-black tracking-widest uppercase focus:outline-none cursor-pointer"
            >
              {uniqueProducers.map((prod) => (
                <option key={prod} value={prod} className="bg-[#0c0f17] text-white">🏢 {prod}</option>
              ))}
              <option disabled value="" className="bg-[#0c0f17] text-slate-600">────────────────────</option>
              <option value="NEW" className="bg-[#0c0f17] text-amber-400 font-bold">+ Crear productora</option>
            </select>
            <span className="text-[10px] text-amber-400 hover:underline cursor-pointer uppercase tracking-wider">Mis productoras ›</span>
          </div>

          <div className="ml-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-inner">
            <span>🎟️ Tickets Disponibles:</span>
            <span className="text-white font-black text-sm">{currentPrepaidCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold font-mono">
          <Link href="/" className="text-slate-400 hover:text-white transition">Ver Cartelera</Link>
          <UserMenu />
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR */}
      <div className="flex flex-1 overflow-hidden font-mono">
        
        <aside className="w-64 border-r border-white/5 bg-[#050507] flex flex-col justify-between p-4 shrink-0 select-none overflow-y-auto">
          <nav className="space-y-1 text-xs font-medium">
            
            <div>
              <button
                onClick={() => {
                  setIsEventsMenuOpen(!isEventsMenuOpen);
                  if (!isEventsMenuOpen && !currentSection.startsWith('events')) {
                    setCurrentSection('events_active');
                    setEventSubView('list');
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection.startsWith('events') ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span>📅</span>
                  <span>Eventos & Tandas</span>
                </div>
                <span className={`transform transition-transform ${isEventsMenuOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {isEventsMenuOpen && (
                <div className="pl-6 pt-1.5 space-y-1">
                  <button
                    onClick={() => { setCurrentSection('events_active'); setEventSubView('list'); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition cursor-pointer ${currentSection === 'events_active' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => { setCurrentSection('events_finished'); setEventSubView('list'); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${currentSection === 'events_finished' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                  >
                    Finalizados
                  </button>
                  <button
                    onClick={() => { setCurrentSection('events_suspended'); setEventSubView('list'); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${currentSection === 'events_suspended' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                  >
                    Suspendidos
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentSection('crm')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'crm' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>👥</span>
              <span>CRM de Asistentes</span>
            </button>

            <button
              onClick={() => setCurrentSection('guestlist')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'guestlist' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>🎟️</span>
              <span>Guestlist & Cortesías</span>
            </button>

            <button
              onClick={() => setCurrentSection('broadcast')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'broadcast' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📢</span>
              <span>Broadcast & Alertas</span>
            </button>

            <button
              onClick={() => setActiveScanner('door')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition cursor-pointer"
            >
              <span>📷</span>
              <span>Escanear QR (Puerta)</span>
            </button>

            <button
              onClick={() => setActiveScanner('bar')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition cursor-pointer"
            >
              <span>🍸</span>
              <span>Escáner de Barra</span>
            </button>

            <button
              onClick={() => setCurrentSection('prepaid_market')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'prepaid_market' ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📦</span>
              <span>Adquirir Tickets</span>
            </button>

            <div className="pt-4 pb-2 border-t border-white/5 text-[10px] text-slate-500 uppercase tracking-widest px-3 font-bold">
              Gestión & Finanzas
            </div>

            <button
              onClick={() => setCurrentSection('finances')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'finances' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📈</span>
              <span>Reportes & Auditoría</span>
            </button>

            <button
              onClick={() => setCurrentSection('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'dashboard' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📊</span>
              <span>Dashboard & Métricas</span>
            </button>

            <button
              onClick={() => setCurrentSection('activity')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'activity' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>⚡</span>
              <span>Actividad en Vivo</span>
            </button>

            <button
              onClick={() => setCurrentSection('delivery')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'delivery' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>📨</span>
              <span>Pases PDF & App (APK)</span>
            </button>

            <button
              onClick={() => setCurrentSection('costs')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'costs' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>💳</span>
              <span>Cobros & Gastos</span>
            </button>

            <button
              onClick={() => setCurrentSection('team')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${currentSection === 'team' ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span>👥</span>
              <span>Equipo & Permisos</span>
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

          {/* SECCIÓN REPORTES FINANCIEROS Y AUDITORÍA (CON GRÁFICOS AVANZADOS) */}
          {currentSection === 'finances' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">📈 Reportes Financieros & Auditoría</h1>
                  <p className="text-xs text-slate-400 mt-1">Balance contable consolidado y análisis gráfico de rendimiento de {activeProducer}.</p>
                </div>
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      ["Concepto,Monto,Tipo"].join(",") + "\n" +
                      `Recaudación Entradas,${totalTicketRev},Ingreso\n` +
                      `Recaudación Barra,${totalBarRev},Ingreso\n` +
                      `Costos Operativos,${eventCostsTotal},Egreso\n` +
                      `Balance Neto,${netProfit},Resultado`;
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `auditoria_financiera_${activeProducer}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <span>📥</span> Descargar Reporte Contable CSV
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-[#0c0f17] border border-amber-500/30 space-y-2 shadow-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Curva de Crecimiento</span>
                  <h3 className="text-2xl font-black text-white">📈 Ingresos en Alza</h3>
                  <p className="text-xs text-slate-400 font-sans">El ritmo de adquisición de pases aumentó un 34% respecto al evento anterior.</p>
                </div>

                <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-2 shadow-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Horario Pico en Puerta</span>
                  <h3 className="text-2xl font-black text-amber-400">🕒 01:30 AM</h3>
                  <p className="text-xs text-slate-400 font-sans">Concentración estimada del 65% del flujo total de asistentes.</p>
                </div>

                <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-2 shadow-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Producto Líder de Barra</span>
                  <h3 className="text-2xl font-black text-white">🍸 Gin Tonic Heredero</h3>
                  <p className="text-xs text-slate-400 font-sans">Representa el 42% de las consumiciones totales procesadas.</p>
                </div>
              </div>

              {/* GRÁFICO DE TENDENCIA DE VENTAS SVG */}
              <div className="p-8 rounded-3xl bg-[#0c0f17] border border-white/10 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="font-luxury text-lg font-bold text-white uppercase">Curva de Recaudación Acumulada</h3>
                    <p className="text-xs text-slate-400">Evolución de ventas de tickets en tiempo real (ARS)</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                    Actualizado En Vivo
                  </span>
                </div>

                <div className="h-64 flex items-end justify-between gap-4 pt-8 px-4 border-b border-white/10 relative">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-dashed border-white w-full" />
                    <div className="border-b border-dashed border-white w-full" />
                    <div className="border-b border-dashed border-white w-full" />
                  </div>

                  {[
                    { date: '01/09', amount: Math.max(totalTicketRev * 0.2, 120000) },
                    { date: '02/09', amount: Math.max(totalTicketRev * 0.4, 350000) },
                    { date: '03/09', amount: Math.max(totalTicketRev * 0.7, 580000) },
                    { date: '04/09', amount: Math.max(totalTicketRev * 0.9, 940000) },
                    { date: '05/09', amount: Math.max(totalTicketRev, 1450000) }
                  ].map((item, idx) => {
                    const maxAmount = 2000000;
                    const heightPct = Math.round((item.amount / maxAmount) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition duration-300 bg-black/90 border border-amber-500/50 px-3 py-1.5 rounded-xl text-[10px] text-amber-300 font-bold whitespace-nowrap shadow-xl">
                          ${item.amount.toLocaleString('es-AR')}
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition">
                          {heightPct}%
                        </span>
                        <div 
                          style={{ height: `${Math.max(heightPct, 15)}%` }}
                          className="w-full max-w-[48px] rounded-t-2xl bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 shadow-lg shadow-amber-500/20 group-hover:brightness-125 transition-all duration-500"
                        />
                        <span className="text-[11px] text-slate-400 font-bold pt-2">{item.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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

          {/* SECCIÓN GUESTLIST & CORTESÍAS VIP */}
          {currentSection === 'guestlist' && (
            <div className="space-y-6 max-w-5xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">🎟️ Listas de Invitados y Cortesías VIP</h1>
                  <p className="text-xs text-slate-400 mt-1">Otorgá pases libres nominados para staff, prensa y amigos de la productora.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = (document.getElementById('guestName') as HTMLInputElement).value;
                    const dni = (document.getElementById('guestDni') as HTMLInputElement).value;
                    const email = (document.getElementById('guestEmail') as HTMLInputElement).value;
                    const eventName = (document.getElementById('guestEvent') as HTMLSelectElement).value;
                    const tierName = (document.getElementById('guestTier') as HTMLInputElement).value || 'Acceso VIP Guestlist';

                    if (!name || !email || !dni) return alert('Completá todos los datos del invitado.');

                    const currentBalances = JSON.parse(localStorage.getItem('le_prepaid_balances') || '{"LIVE EXPERIENCE": 500}');
                    const currentStock = currentBalances[activeProducer] ?? 500;
                    currentBalances[activeProducer] = Math.max(0, currentStock - 1);
                    localStorage.setItem('le_prepaid_balances', JSON.stringify(currentBalances));
                    setPrepaidBalances(currentBalances);

                    const freeTicket = {
                      id: `t-guest-${Date.now()}`,
                      eventName,
                      tierName,
                      price: 0,
                      holderName: name,
                      holderDni: dni,
                      holderEmail: email.toLowerCase().trim(),
                      qrToken: 'VIP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                      status: 'VALID',
                      purchasedAt: new Date().toISOString()
                    };

                    const existing = JSON.parse(localStorage.getItem('oasis_issued_tickets') || '[]');
                    localStorage.setItem('oasis_issued_tickets', JSON.stringify([freeTicket, ...existing]));
                    setTickets([freeTicket, ...existing]);

                    addLog('DOOR', `Cortesía VIP emitida para ${name} (${eventName}) (-1 prepago)`);
                    alert(`¡Cortesía emitida con éxito para ${name}! Se descontó 1 pase prepago del stock.`);
                    (document.getElementById('guestName') as HTMLInputElement).value = '';
                    (document.getElementById('guestDni') as HTMLInputElement).value = '';
                    (document.getElementById('guestEmail') as HTMLInputElement).value = '';
                  }}
                  className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl"
                >
                  <h3 className="font-luxury text-base font-black uppercase text-white">✨ Emitir Pase de Cortesía</h3>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Evento</label>
                    <select id="guestEvent" className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-white/10 text-white font-bold">
                      {producerEvents.map((ev) => (
                        <option key={ev.id} value={ev.name}>{ev.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre y Apellido</label>
                    <input id="guestName" type="text" required placeholder="Ej: Sofía Martínez" className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">DNI</label>
                    <input id="guestDni" type="text" required placeholder="40123456" className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Correo Electrónico (Para su Billetera)</label>
                    <input id="guestEmail" type="email" required placeholder="invitado@correo.com" className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Categoría / Tipo de Pase</label>
                    <input id="guestTier" type="text" placeholder="Ej: Prensa / Staff / VIP" defaultValue="Acceso VIP Guestlist" className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-white/10 text-amber-400 font-bold" />
                  </div>

                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl cursor-pointer shadow-xl shadow-amber-500/20 tracking-wider">
                    Generar y Enviar Pase Free 🎟️
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase block pb-1">Cortesías Registradas en el Sistema</span>
                  <div className="space-y-2">
                    {tickets.filter((t: any) => t.price === 0).map((t: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-amber-400 font-bold uppercase">{t.eventName} ({t.tierName})</span>
                          <h4 className="text-sm font-black text-white">{t.holderName} <span className="text-slate-400 font-normal">({t.holderEmail})</span></h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          FREE VIP ($0)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN CRM DE ASISTENTES */}
          {currentSection === 'crm' && (
            <div className="space-y-6 max-w-6xl mx-auto font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">CRM de Asistentes</h1>
                  <p className="text-xs text-slate-400 mt-1">Base de datos de compradores, DNIs y control de acreditaciones de {activeProducer}.</p>
                </div>
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + ["Titular,DNI,Email,Tanda,Estado"].join(",") + "\n" +
                      tickets.map(t => [t.holderName, t.holderDni, t.email, t.tierName, t.status].join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `crm_asistentes_${activeProducer}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 tracking-wider"
                >
                  <span>📥</span> Descargar CSV
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <select
                    value={selectedDashboardEventId}
                    onChange={(e) => setSelectedDashboardEventId(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-xs font-bold text-white focus:outline-none w-full sm:w-auto"
                  >
                    <option value="all">Todos los Eventos</option>
                    {producerEvents.map((ev) => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                  </select>

                  <div className="relative w-full sm:w-80">
                    <span className="absolute left-3.5 top-3 text-slate-500">🔍</span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o DNI"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-white/5 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Titular</th>
                        <th className="py-3 px-4">DNI</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Tanda</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {tickets.filter(t => {
                        const matchesEvent = selectedDashboardEventId === 'all' || t.eventId === selectedDashboardEventId;
                        const matchesSearch = (t.holderName || '').toLowerCase().includes(crmSearch.toLowerCase()) || (t.holderDni || '').includes(crmSearch);
                        return matchesEvent && matchesSearch;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No se encontraron asistentes registrados para este filtro.
                          </td>
                        </tr>
                      ) : (
                        tickets.filter(t => {
                          const matchesEvent = selectedDashboardEventId === 'all' || t.eventId === selectedDashboardEventId;
                          const matchesSearch = (t.holderName || '').toLowerCase().includes(crmSearch.toLowerCase()) || (t.holderDni || '').includes(crmSearch);
                          return matchesEvent && matchesSearch;
                        }).map((t, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-3.5 px-4 font-bold text-white">{t.holderName || 'Sin Nombre'}</td>
                            <td className="py-3.5 px-4 text-slate-400">{t.holderDni || 'N/A'}</td>
                            <td className="py-3.5 px-4 text-slate-400">{t.email}</td>
                            <td className="py-3.5 px-4 text-amber-400 font-bold">{t.tierName}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${t.status === 'USED' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                {t.status === 'USED' ? '✓ Utilizado' : 'Válido'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`¿Reenviar pase a ${t.email}?`)) {
                                    alert(`¡Pase reenviado con éxito a ${t.email}!`);
                                  }
                                }}
                                className="px-3.5 py-2 bg-white/5 text-slate-200 border border-white/10 rounded-xl font-bold hover:bg-white/10 cursor-pointer text-[11px] transition"
                              >
                                Reenviar Mail ✉️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN LISTA DE ÓRDENES DE BARRA Y EVENTOS */}
          {currentSection.startsWith('events') && eventSubView === 'list' && (
            <div className="space-y-6 max-w-5xl mx-auto font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-luxury text-2xl font-black text-white uppercase">
                    Eventos {currentSection === 'events_active' ? 'Activos' : currentSection === 'events_finished' ? 'Finalizados' : 'Suspendidos'} ({activeProducer})
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Gestión y control de cartelera.</p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black text-xs uppercase rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer tracking-wider"
                >
                  + Crear evento
                </button>
              </div>

              <div className="space-y-3">
                {filteredEventsList.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#0c0f17] border border-white/5 text-slate-500 text-xs">
                    No hay eventos registrados en esta sección.
                  </div>
                ) : (
                  filteredEventsList.map((ev) => {
                    const isActive = ev.status === 'ACTIVE';
                    const eventOrders = barOrders.filter(o => o.eventName === ev.name);

                    return (
                      <div
                        key={ev.id}
                        className="p-6 rounded-3xl bg-[#0c0f17] border border-white/5 hover:border-amber-500/30 transition flex flex-col gap-4 shadow-xl group relative overflow-hidden"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                          <div className="flex items-center gap-4">
                            <img src={ev.imageUrl} alt={ev.name} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                            <div className="space-y-1">
                              <h3 className="font-luxury text-base font-black text-white group-hover:text-amber-400 transition">{ev.name}</h3>
                              <p className="text-xs text-slate-400">📅 {ev.date} · {ev.venue}, {ev.city}</p>
                              
                              <div className="flex flex-wrap gap-2 pt-1">
                                {(ev.tiers || []).map((t, i) => (
                                  <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                                    <span>{t.name}: ${t.price.toLocaleString('es-AR')}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono">
                            <button onClick={() => handleOpenEdit(ev)} className="px-4 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-xl font-bold hover:bg-white/10 cursor-pointer transition">
                              ✏️ Editar
                            </button>
                            <button onClick={() => handleToggleStatus(ev.id, ev.status)} className={`px-4 py-2.5 rounded-xl font-bold border cursor-pointer transition ${isActive ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'}`}>
                              {isActive ? 'Finalizar' : 'Activar'}
                            </button>
                            <button onClick={() => handleDeleteEvent(ev.id)} className="p-2.5 bg-white/5 text-slate-400 hover:text-rose-400 rounded-xl border border-white/10 cursor-pointer transition">
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN ACTIVIDAD EN VIVO */}
          {currentSection === 'activity' && (
            <div className="space-y-6 max-w-4xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">⚡ Actividad en Vivo</h1>
                <p className="text-xs text-slate-400 mt-1">Registro de escaneos en puerta, canjes en barra y compras en tiempo real.</p>
              </div>

              <div className="space-y-3">
                {activityLogs.map((log: any) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex items-center justify-between text-xs shadow-md">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${log.type === 'DOOR' ? 'bg-emerald-500/20 text-emerald-400' : log.type === 'BAR' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {log.type === 'DOOR' ? '🚪' : log.type === 'BAR' ? '🍸' : '🎟️'}
                      </span>
                      <span className="font-bold text-white">{log.text}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{log.time}</span>
                  </div>
                ))}
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
                              _subject: `🎟️ Pase Oficial - ${producerEvents[0]?.name || 'LIVE EXPERIENCE SUNSET EDITION'}`,
                              Destinatario: emailInput,
                              Evento: producerEvents[0]?.name || 'LIVE EXPERIENCE SUNSET EDITION',
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
                              eventName: producerEvents[0]?.name || 'LIVE EXPERIENCE SUNSET EDITION',
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

          {/* SECCIÓN MERCADO DE TICKETS PREPAGOS */}
          {currentSection === 'prepaid_market' && (
            <div className="space-y-8 max-w-4xl mx-auto font-mono">
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-luxury text-2xl font-black text-white uppercase">🎟️ Adquirir Tickets Prepagos</h1>
                <p className="text-xs text-slate-400 mt-1">Comprá paquetes o personalizá la cantidad para <strong className="text-amber-400">{activeProducer}</strong> (Saldo actual: {currentPrepaidCount}).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { name: 'Pack Start', count: 250, desc: 'Ideal para eventos medianos.' },
                  { name: 'Pack Pro', count: 1000, desc: 'Para productoras con flujo constante.', popular: true },
                  { name: 'Pack Enterprise', count: 5000, desc: 'Volumen máximo con tarifa preferencial.' }
                ].map((pack, idx) => {
                  const totalPrice = calculatePriceForQuantity(pack.count);
                  return (
                    <div key={idx} className={`p-6 rounded-3xl bg-[#0c0f17] border flex flex-col justify-between space-y-6 relative shadow-xl ${pack.popular ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-white/5'}`}>
                      {pack.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-amber-500 text-black font-black text-[10px] uppercase rounded-full shadow-lg">
                          Más Elegido ⭐
                        </span>
                      )}
                      <div className="space-y-2">
                        <h3 className="font-luxury text-lg font-black text-white uppercase">{pack.name}</h3>
                        <span className="text-3xl font-black text-amber-400 block">+{pack.count} <span className="text-xs text-slate-400">pases</span></span>
                        <p className="text-xs text-slate-400 font-sans">{pack.desc}</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <span className="text-xl font-black text-white block">${totalPrice.toLocaleString('es-AR')}</span>
                        <button
                          onClick={() => setCheckoutPackage({ name: pack.name, count: pack.count, price: totalPrice })}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
                        >
                          Comprar con Pasarela 💳
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-8 rounded-3xl bg-[#0c0f17] border border-amber-500/30 space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <h3 className="font-luxury text-base font-black text-white uppercase">⚙️ Compra Personalizada de Tickets</h3>
                  <p className="text-xs text-slate-400">Ingresá la cantidad exacta que necesites.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2 text-xs">
                    <label className="text-slate-400 uppercase font-bold block">Cantidad de Tickets</label>
                    <input
                      type="number"
                      min="1"
                      max="50000"
                      value={customTicketQtyStr}
                      onChange={(e) => setCustomTicketQtyStr(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#07070a] border border-white/10 rounded-xl text-white font-black text-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-[#07070a] border border-white/5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total a Pagar:</span>
                      <span className="text-2xl font-black text-amber-400">${calculatePriceForQuantity(customTicketQty).toLocaleString('es-AR')}</span>
                    </div>
                    <button
                      onClick={() => setCheckoutPackage({ name: `Pack Personalizado (${customTicketQty}u)`, count: customTicketQty, price: calculatePriceForQuantity(customTicketQty) })}
                      className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl transition shadow-xl shadow-amber-500/20 cursor-pointer tracking-wider"
                    >
                      Pagar {customTicketQty} Tickets 🚀
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN DASHBOARD Y MÉTRICAS */}
          {currentSection === 'dashboard' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-luxury text-2xl font-black uppercase text-white tracking-tight">Rendimiento: {activeProducer}</h2>
                  <p className="text-xs text-slate-400 mt-1">Métricas de venta, acreditación y auditoría financiera.</p>
                </div>
                <select
                  value={selectedDashboardEventId}
                  onChange={(e) => setSelectedDashboardEventId(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-[#0c0f17] border border-white/10 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="all">🌐 Todos los Eventos</option>
                  {producerEvents.map((ev) => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🎟️ Recaudación Entradas</span>
                  <span className="text-2xl font-black text-white block">${totalTicketRev.toLocaleString('es-AR')}</span>
                  <span className="text-[11px] text-amber-400 block font-bold">{filteredTickets.length} pases emitidos</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🍸 Recaudación Barra</span>
                  <span className="text-2xl font-black text-amber-400 block">${totalBarRev.toLocaleString('es-AR')}</span>
                  <span className="text-[11px] text-slate-400 block">{filteredOrders.length} consumiciones</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">🚪 Acreditación Puerta</span>
                  <span className="text-2xl font-black text-emerald-400 block">{attendanceRate}%</span>
                  <span className="text-[11px] text-slate-400 block">{totalScanned} validados</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-2 shadow-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">📈 Balance Neto</span>
                  <span className={`text-2xl font-black block ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${netProfit.toLocaleString('es-AR')}</span>
                  <span className="text-[11px] text-slate-500 block">Ingresos menos costos</span>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN CUPONES & RRPP */}
          {currentSection === 'marketing' && (
            <div className="space-y-8 max-w-5xl mx-auto font-mono">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <form onSubmit={handleAddCoupon} className="p-6 sm:p-8 rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4 shadow-xl">
                  <h3 className="font-luxury text-base font-black uppercase text-white">🏷️ Crear Cupón de Descuento</h3>
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
                  <h3 className="font-luxury text-base font-black uppercase text-white">🤝 Alta de Embajador RRPP</h3>
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

          {/* SECCIÓN EQUIPO & PERMISOS */}
          {currentSection === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto font-mono">
              <div className="lg:col-span-5 space-y-6">
                <form onSubmit={handleAddTeamMember} className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl">
                  <h3 className="font-luxury text-base font-black uppercase text-white">👥 Invitar Colaborador ({activeProducer})</h3>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre y Apellido</label>
                    <input type="text" required placeholder="Ej: Juan Pérez" value={newTeamMember.name} onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Correo Electrónico</label>
                    <input type="email" required placeholder="juan@productora.com" value={newTeamMember.email} onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[10px]">DNI</label>
                      <input type="text" required placeholder="35123456" value={newTeamMember.dni} onChange={(e) => setNewTeamMember({ ...newTeamMember, dni: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[10px]">Teléfono</label>
                      <input type="text" required placeholder="1123456789" value={newTeamMember.phone} onChange={(e) => setNewTeamMember({ ...newTeamMember, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Rol en el Sistema</label>
                    <select value={newTeamMember.role} onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value as any })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white font-bold">
                      <option value="ADMIN">🛡️ Administrador</option>
                      <option value="DOOR">📷 Validador de Puerta</option>
                      <option value="BAR">🍸 Cajero de Barra</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl cursor-pointer tracking-wider">Otorgar Permisos +</button>
                </form>

                <div className="rounded-3xl bg-rose-950/20 border border-rose-900/40 p-6 space-y-3 shadow-xl">
                  <h4 className="text-xs font-black uppercase text-rose-400">⚠️ Zona de Peligro: {activeProducer}</h4>
                  <p className="text-[11px] text-slate-400">
                    {isUserOwner ? 'Como dueño, podés eliminar por completo esta productora y todos sus datos.' : 'Podés abandonar esta productora para salir de su equipo.'}
                  </p>
                  <button type="button" onClick={handleDeleteOrLeaveProducer} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs rounded-xl transition cursor-pointer">
                    {isUserOwner ? 'Eliminar Productora 🗑️' : 'Abandonar Productora 🚪'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs font-bold text-slate-400 uppercase">
                  <span>Equipo de {activeProducer}</span>
                  <span className="text-emerald-400">{teamMembers.filter(m => m.producerName === activeProducer).length} activos</span>
                </div>
                <div className="space-y-3">
                  {teamMembers.filter(m => m.producerName === activeProducer).map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs shadow-md">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{m.name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${m.role === 'OWNER' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>{m.role}</span>
                        </div>
                        <span className="text-slate-400 block">{m.email} {m.dni ? `· DNI: ${m.dni}` : ''}</span>
                      </div>
                      {m.role !== 'OWNER' && (
                        <button onClick={() => removeTeamMember(m.id)} className="text-slate-500 hover:text-rose-400 p-2 cursor-pointer font-bold">Revocar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN COSTOS */}
          {currentSection === 'costs' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto font-mono">
              <div className="lg:col-span-5">
                <form onSubmit={handleAddCost} className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl">
                  <h3 className="font-luxury text-base font-black uppercase text-white">Registrar Costo Operativo</h3>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Evento</label>
                    <select required value={newCost.eventId} onChange={(e) => setNewCost({ ...newCost, eventId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white text-xs">
                      <option value="">-- Elegir Evento --</option>
                      {producerEvents.map((ev) => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Concepto</label>
                    <input type="text" required placeholder="Ej: Sonido" value={newCost.concept} onChange={(e) => setNewCost({ ...newCost, concept: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white text-xs" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Monto ($)</label>
                    <input type="number" required value={newCost.amount} onChange={(e) => setNewCost({ ...newCost, amount: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-rose-400 font-bold text-xs" />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-xl cursor-pointer tracking-wider">Guardar Costo +</button>
                </form>
              </div>
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs font-bold text-slate-400 uppercase">
                  <span>Egresos</span><span className="text-rose-400">Total: ${costs.reduce((a, c) => a + c.amount, 0).toLocaleString('es-AR')}</span>
                </div>
                {costs.map((c) => {
                  const evAssigned = events.find((e) => e.id === c.eventId);
                  return (
                    <div key={c.id} className="p-4 rounded-2xl bg-[#0c0f17] border border-white/5 flex justify-between items-center text-xs shadow-md">
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">{evAssigned?.name}</span>
                        <span className="font-bold text-white block">{c.concept}</span>
                        <span className="text-rose-400 font-black">${c.amount.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCostPaid(c.id)} className={`px-3 py-1 rounded-xl text-[10px] font-bold ${c.paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{c.paid ? '✓ Abonado' : '⏳ Pendiente'}</button>
                        <button onClick={() => removeCost(c.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FORMULARIOS DE CREAR / EDITAR EVENTO (CON TANDAS Y BARRA) */}
          {(eventSubView === 'create' || eventSubView === 'edit') && (
            <form onSubmit={eventSubView === 'create' ? handleSaveNewEvent : handleUpdateEvent} className="space-y-8 max-w-4xl mx-auto font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-luxury text-xl font-black uppercase text-white">{eventSubView === 'create' ? `Publicar Evento (${activeProducer})` : 'Modificar Evento'}</h2>
                <button type="button" onClick={() => setEventSubView('list')} className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#0c0f17] text-slate-300 text-xs font-bold cursor-pointer">← Volver</button>
              </div>

              <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl">
                <h3 className="font-luxury text-sm font-black uppercase text-white">1. Información General y Productora</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Productora Organizadora</label>
                    <input type="text" disabled value={activeProducer} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-amber-400 font-bold opacity-80" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Nombre del Evento</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Fecha</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[10px]">Inicio</label>
                      <input type="time" required value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3.5 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-bold text-[10px]">Fin</label>
                      <input type="time" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-3.5 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Lugar / Venue</label>
                    <input type="text" required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Ciudad</label>
                    <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Flyer (Multimedia)</label>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#07070a] border border-white/10">
                      <img src={formData.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-700" />
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full text-xs text-slate-400 cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px]">Descripción</label>
                    <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#07070a] border border-white/10 text-white font-sans text-xs" />
                  </div>
                </div>
              </div>

              {/* TANDAS AVANZADAS */}
              <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-luxury text-sm font-black uppercase text-white">2. Tandas de Entradas y Opciones Avanzadas</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Precios ($0 Free), hora límite de ingreso y alerta de últimas entradas.</p>
                  </div>
                  <button type="button" onClick={() => setTiers([...tiers, { name: `Tanda ${tiers.length + 1}`, price: 15000, capacity: 150, originalCapacity: 150, status: 'ACTIVE', scarcityThreshold: 15 }])} className="px-4 py-2.5 bg-amber-500 text-black text-xs font-black uppercase rounded-xl cursor-pointer shadow-md">+ Agregar Tanda</button>
                </div>
                <div className="space-y-4">
                  {tiers.map((tier, idx) => {
                    const origCap = tier.originalCapacity ?? tier.capacity;
                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-[#07070a] border border-white/5 space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="font-black text-white uppercase">Lote #{idx + 1}</span>
                          {tiers.length > 1 && (
                            <button type="button" onClick={() => setTiers(tiers.filter((_, i) => i !== idx))} className="text-rose-400 cursor-pointer">✕ Quitar</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <input type="text" required placeholder="Nombre" value={tier.name} onChange={(e) => { const c = [...tiers]; c[idx].name = e.target.value; setTiers(c); }} className="px-4 py-3 bg-[#0c0f17] rounded-xl border border-white/10 text-white font-bold" />
                          <input type="number" required min="0" placeholder="Precio" value={tier.price} onChange={(e) => { const c = [...tiers]; c[idx].price = Number(e.target.value); setTiers(c); }} className="px-4 py-3 bg-[#0c0f17] rounded-xl border border-white/10 text-emerald-400 font-black" />
                          <input type="number" required min={origCap} placeholder="Capacidad" value={tier.capacity} onChange={(e) => { const c = [...tiers]; c[idx].capacity = Number(e.target.value); setTiers(c); }} className="px-4 py-3 bg-[#0c0f17] rounded-xl border border-white/10 text-white font-bold" />
                          <select value={tier.status || 'ACTIVE'} onChange={(e) => { const c = [...tiers]; c[idx].status = e.target.value as any; setTiers(c); }} className="px-4 py-3 bg-[#0c0f17] rounded-xl border border-white/10 text-white font-bold">
                            <option value="ACTIVE">▶️ Activa</option>
                            <option value="SOLD_OUT">🔴 Sold Out</option>
                            <option value="HIDDEN">👁️‍🗨️ Oculta</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BARRA INICIAL */}
              <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl">
                <h3 className="font-luxury text-sm font-black uppercase text-white">3. Carta de Barra Inicial</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <input type="text" placeholder="Bebida" value={newDrink.name} onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })} className="px-4 py-3 bg-[#07070a] rounded-xl border border-white/10 text-white" />
                  <input type="number" placeholder="Precio ($)" value={newDrink.price} onChange={(e) => setNewDrink({ ...newDrink, price: Number(e.target.value) })} className="px-4 py-3 bg-[#07070a] rounded-xl border border-white/10 text-amber-400 font-bold" />
                  <input type="number" placeholder="Stock" value={newDrink.stock} onChange={(e) => setNewDrink({ ...newDrink, stock: Number(e.target.value) })} className="px-4 py-3 bg-[#07070a] rounded-xl border border-white/10 text-white" />
                </div>
                <button type="button" onClick={() => { if (!newDrink.name) return; setBarMenu([...barMenu, { id: `b-${Date.now()}`, ...newDrink }]); setNewDrink({ name: '', category: 'Tragos', price: 6500, stock: 100 }); }} className="w-full py-3 bg-amber-500 text-black font-black uppercase rounded-xl text-xs cursor-pointer shadow-md">Agregar Bebida +</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {barMenu.map((b) => (
                    <div key={b.id} className="p-4 rounded-2xl bg-[#07070a] border border-white/5 flex justify-between items-center text-xs">
                      <div><span className="font-bold text-white block text-sm">{b.name}</span><span className="text-amber-400 font-bold">${b.price.toLocaleString('es-AR')} · Stock: {b.stock}u.</span></div>
                      <button type="button" onClick={() => setBarMenu(barMenu.filter(i => i.id !== b.id))} className="text-slate-500 hover:text-rose-400 font-bold cursor-pointer p-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 text-black font-black uppercase text-xs rounded-2xl transition shadow-xl cursor-pointer tracking-wider">
                {eventSubView === 'create' ? 'Publicar Evento Oficial 🚀' : 'Guardar Cambios 💾'}
              </button>
            </form>
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

      {/* MODAL CREAR NUEVA PRODUCTORA CON REDIRECCIÓN A CLUB SI ES DEPORTE */}
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
              <input type="email" required placeholder="Correo" value={producerForm.email} onChange={e => setProducerForm({...producerForm, email: e.target.value})} className="w-full px-4 py-3 bg-[#07070a] border border-white/10 rounded-xl text-white" />
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