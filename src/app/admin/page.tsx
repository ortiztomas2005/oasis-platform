'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjjpmetithnzkmisnbk.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqanBtZXRpdGhuemttaXNuYmsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MjQ1NjA5OSwiZXhwIjoyMDg4MDMyMDk5fQ.N59V83N31eGZZ_X2yH0_R5650Ww7y1lIcx-3lTkh32A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

interface TierItem {
  id?: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  maxPerBuy?: number;
  visible: boolean;
  isSoldOut: boolean;
  status?: string;
}

interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  imageUrl?: string;
  slug?: string;
  tiers: TierItem[];
}

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState<'events' | 'crm' | 'costs'>('events');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [currentTiers, setCurrentTiers] = useState<TierItem[]>([]);
  const [savingTiers, setSavingTiers] = useState(false);

  // Modal Crear Evento
  const [showEventModal, setShowEventModal] = useState(false);
  const [evName, setEvName] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evVenue, setEvVenue] = useState('');
  const [evImg, setEvImg] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Modal Editar Evento
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editImg, setEditImg] = useState('');
  const [updatingEvent, setUpdatingEvent] = useState(false);

  // Modal Tanda
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [tierName, setTierName] = useState('');
  const [tierDesc, setTierDesc] = useState('');
  const [tierPrice, setTierPrice] = useState<number>(0);
  const [tierCapacity, setTierCapacity] = useState<number>(100);
  const [tierMaxPerBuy, setTierMaxPerBuy] = useState<number>(10);
  const [tierVisible, setTierVisible] = useState(true);
  const [tierSoldOut, setTierSoldOut] = useState(false);

  // Costos
  const [costConcept, setCostConcept] = useState('');
  const [costAmount, setCostAmount] = useState<number | ''>('');

  // CRM
  const [selectedEventFilter, setSelectedEventFilter] = useState('ALL');
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedTicketModal, setSelectedTicketModal] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Costos locales
      const savedCosts = localStorage.getItem('oasis_costs_data');
      if (savedCosts) {
        setCosts(JSON.parse(savedCosts));
      } else {
        const defaultCosts = [
          { id: 'c1', concept: 'DJ & Técnica Sonido', amount: 450000, paid: true },
          { id: 'c2', concept: 'Seguridad & Control Puerta', amount: 280000, paid: false },
          { id: 'c3', concept: 'Alquiler Locación', amount: 800000, paid: true },
        ];
        setCosts(defaultCosts);
        localStorage.setItem('oasis_costs_data', JSON.stringify(defaultCosts));
      }

      // Fetch directo desde el navegador (NUNCA pasa por Node backend)
      let rawEvents: any[] = [];
      let rawTiers: any[] = [];
      let rawTickets: any[] = [];

      try {
        const { data: dbEvents, error: errEv } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: dbTiers } = await supabase.from('ticket_tiers').select('*');
        const { data: dbTickets } = await supabase.from('tickets').select('*');

        if (dbEvents && dbEvents.length > 0) {
          rawEvents = dbEvents;
          rawTiers = dbTiers || [];
          rawTickets = dbTickets || [];
        }
      } catch (e) {
        console.warn('Fallo Supabase directo:', e);
      }

      // Si la base está vacía o falló la red, inyecta el evento de desarrollo
      if (rawEvents.length === 0) {
        rawEvents = [
          {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'OASIS SUNSET EDITION',
            date: '2026-10-15',
            venue: 'PMRC Puerto Madero, Buenos Aires',
            image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
            slug: 'oasis-sunset',
          },
        ];
        rawTiers = [
          {
            id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            event_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'Early Bird',
            price: 12000,
            capacity: 100,
            status: 'ACTIVE',
          },
          {
            id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
            event_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'General T1',
            price: 15000,
            capacity: 250,
            status: 'ACTIVE',
          },
        ];
      }

      setTickets(rawTickets);

      const mapped: EventItem[] = rawEvents.map((e: any) => {
        const matchingTiers = rawTiers.filter((t: any) => t.event_id === e.id);
        const mappedTiers: TierItem[] = matchingTiers.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          price: Number(t.price),
          capacity: Number(t.total_capacity || t.capacity || 100),
          maxPerBuy: 10,
          visible: t.status !== 'PAUSED',
          isSoldOut: t.status === 'SOLD_OUT',
          status: t.status || 'ACTIVE',
        }));

        return {
          id: e.id,
          name: e.name || e.title,
          date: e.date,
          venue: e.venue || 'Buenos Aires',
          imageUrl: e.image_url || '',
          slug: e.slug || e.id,
          tiers:
            mappedTiers.length > 0
              ? mappedTiers
              : [
                  { name: 'Early Bird', price: 12000, capacity: 100, visible: true, isSoldOut: false, status: 'ACTIVE' },
                  { name: 'General T1', price: 15000, capacity: 250, visible: true, isSoldOut: false, status: 'ACTIVE' },
                ],
        };
      });

      setEvents(mapped);
      if (mapped.length > 0) {
        setSelectedEventId(mapped[0].id);
        setCurrentTiers([...mapped[0].tiers]);
      }
    } catch (err) {
      console.error('Error cargando panel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev) setCurrentTiers([...ev.tiers]);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evName || !evDate) return;
    try {
      setCreatingEvent(true);
      const newEv = {
        id: crypto.randomUUID(),
        name: evName,
        date: evDate,
        venue: evVenue || 'Buenos Aires',
        image_url: evImg,
        slug: evName.toLowerCase().replace(/\s+/g, '-'),
      };
      await supabase.from('events').insert([newEv]);
      setShowEventModal(false);
      setEvName('');
      setEvDate('');
      setEvVenue('');
      setEvImg('');
      await loadDashboard();
      alert('¡Evento creado con éxito!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleOpenEditEvent = () => {
    const ev = events.find((e) => e.id === selectedEventId);
    if (!ev) return;
    setEditName(ev.name);
    setEditDate(ev.date ? ev.date.substring(0, 10) : '');
    setEditVenue(ev.venue);
    setEditImg(ev.imageUrl || '');
    setShowEditEventModal(true);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      setUpdatingEvent(true);
      await supabase
        .from('events')
        .update({
          name: editName,
          date: editDate,
          venue: editVenue,
          image_url: editImg,
        })
        .eq('id', selectedEventId);

      setShowEditEventModal(false);
      await loadDashboard();
      alert('¡Evento actualizado!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    const ev = events.find((e) => e.id === selectedEventId);
    if (!ev) return;
    if (!confirm(`¿Eliminar "${ev.name}"?`)) return;
    try {
      await supabase.from('events').delete().eq('id', selectedEventId);
      setSelectedEventId('');
      await loadDashboard();
      alert('Evento eliminado.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moveTier = (index: number, direction: 'up' | 'down') => {
    const newTiers = [...currentTiers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTiers.length) return;
    const [moved] = newTiers.splice(index, 1);
    newTiers.splice(targetIndex, 0, moved);
    setCurrentTiers(newTiers);
  };

  const handleOpenCreateTier = () => {
    setEditingTierIndex(null);
    setTierName('');
    setTierDesc('');
    setTierPrice(15000);
    setTierCapacity(100);
    setTierMaxPerBuy(10);
    setTierVisible(true);
    setTierSoldOut(false);
    setShowTierModal(true);
  };

  const handleOpenEditTier = (index: number) => {
    const t = currentTiers[index];
    setEditingTierIndex(index);
    setTierName(t.name);
    setTierDesc(t.description || '');
    setTierPrice(t.price);
    setTierCapacity(t.capacity);
    setTierMaxPerBuy(t.maxPerBuy || 10);
    setTierVisible(t.visible);
    setTierSoldOut(t.isSoldOut);
    setShowTierModal(true);
  };

  const handleSaveTierModal = () => {
    if (!tierName.trim()) return;
    const updatedTier: TierItem = {
      name: tierName.trim(),
      description: tierDesc,
      price: Number(tierPrice),
      capacity: Number(tierCapacity),
      maxPerBuy: Number(tierMaxPerBuy),
      visible: tierVisible,
      isSoldOut: tierSoldOut,
      status: !tierVisible ? 'PAUSED' : tierSoldOut ? 'SOLD_OUT' : 'ACTIVE',
    };

    let nextTiers = [...currentTiers];
    if (editingTierIndex !== null) {
      nextTiers[editingTierIndex] = updatedTier;
    } else {
      nextTiers.push(updatedTier);
    }
    setCurrentTiers(nextTiers);
    setShowTierModal(false);
  };

  const handleDeleteTier = (index: number) => {
    if (!confirm('¿Eliminar esta tanda?')) return;
    setCurrentTiers(currentTiers.filter((_, i) => i !== index));
  };

  const handlePersistTiers = async () => {
    if (!selectedEventId) return;
    try {
      setSavingTiers(true);
      await supabase.from('ticket_tiers').delete().eq('event_id', selectedEventId);
      const rows = currentTiers.map((t) => ({
        event_id: selectedEventId,
        name: t.name,
        price: t.price,
        capacity: t.capacity,
        status: t.status || 'ACTIVE',
      }));
      await supabase.from('ticket_tiers').insert(rows);
      alert('¡Tandas guardadas y sincronizadas!');
      await loadDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTiers(false);
    }
  };

  const updateCosts = (newCosts: any[]) => {
    setCosts(newCosts);
    localStorage.setItem('oasis_costs_data', JSON.stringify(newCosts));
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costConcept.trim() || !costAmount) return;
    updateCosts([
      ...costs,
      {
        id: 'c-' + Date.now(),
        concept: costConcept.trim(),
        amount: Number(costAmount),
        paid: false,
      },
    ]);
    setCostConcept('');
    setCostAmount('');
  };

  const handleToggleCost = (id: string) => {
    updateCosts(costs.map((c) => (c.id === id ? { ...c, paid: !c.paid } : c)));
  };

  const handleDeleteCost = (id: string) => {
    updateCosts(costs.filter((c) => c.id !== id));
  };

  const handleExportCSV = () => {
    const rows = [
      ['Titular', 'DNI', 'Email', 'Evento', 'Tanda', 'Precio', 'Estado', 'Codigo Hash'],
      ...filteredTickets.map((t: any) => [
        t.customer_name || t.holder_name || '',
        t.customer_dni || t.holder_dni || '',
        t.customer_email || t.holder_email || '',
        t.events?.name || t.events?.title || 'OASIS',
        t.tier_name || 'General',
        t.price_paid || 0,
        t.status || 'AVAILABLE',
        t.auth_code || t.qr_hash || t.id,
      ]),
    ];

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OASIS_Tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = tickets.reduce((acc, t) => acc + Number(t.price_paid || 0), 0);
  const totalCosts = costs.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const totalPaid = costs.filter((c) => c.paid).reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const totalPending = costs.filter((c) => !c.paid).reduce((acc, c) => acc + Number(c.amount || 0), 0);

  const filteredTickets = tickets.filter((t: any) => {
    const matchEvent = selectedEventFilter === 'ALL' || t.event_id === selectedEventFilter;
    const q = crmSearch.toLowerCase();
    const name = (t.customer_name || t.holder_name || '').toLowerCase();
    const dni = (t.customer_dni || t.holder_dni || '').toLowerCase();
    const email = (t.customer_email || t.holder_email || '').toLowerCase();
    const hash = (t.auth_code || t.qr_hash || '').toLowerCase();
    return matchEvent && (name.includes(q) || dni.includes(q) || email.includes(q) || hash.includes(q));
  });

  const activeEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex font-sans antialiased">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#090d16] border-r border-neutral-800/60 p-5 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800/60">
            <img src="/logo-oasis.png" alt="OASIS" className="h-8 w-auto invert brightness-200" />
            <div>
              <span className="text-xs font-bold text-white block">OASIS</span>
              <span className="text-[10px] text-neutral-500">Backstage Hub</span>
            </div>
          </div>
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveNav('events')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'events' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <span>🎟️</span> Eventos & Tandas
            </button>
            <button
              onClick={() => setActiveNav('costs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'costs' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <span>💳</span> Cobros & Gastos
            </button>
            <button
              onClick={() => setActiveNav('crm')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'crm' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <span>👥</span> CRM de Asistentes
            </button>
            <Link
              href="/scan"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all"
            >
              <span>📷</span> Escanear QR
            </Link>
          </nav>
        </div>
        <div className="pt-4 border-t border-neutral-800/60">
          <Link href="/" className="text-xs text-neutral-500 hover:text-white flex items-center gap-2">
            ← Salir al Sitio Público
          </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 bg-[#06080e] p-6 lg:p-10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800/60 pb-6">
          {activeEvent ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center">
                {activeEvent.imageUrl ? (
                  <img src={activeEvent.imageUrl} alt={activeEvent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-blue-400">O</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white uppercase">OASIS // {activeEvent.name}</h1>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ACTIVO
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  📍 {activeEvent.venue} · 📅 {activeEvent.date ? new Date(activeEvent.date).toLocaleDateString('es-AR') : 'Sin fecha'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-bold text-white uppercase">Panel de Control OASIS</h1>
              <p className="text-xs text-neutral-500">No hay eventos activos.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {events.length > 0 && (
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="bg-[#0b101c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            )}

            {activeEvent && (
              <button
                onClick={handleOpenEditEvent}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-all"
              >
                ✏️ Editar Evento
              </button>
            )}

            {activeEvent && (
              <button
                onClick={handleDeleteEvent}
                className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900 text-rose-400 font-bold text-xs rounded-xl transition-all"
              >
                🚫 Eliminar
              </button>
            )}

            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md shadow-blue-600/30"
            >
              + NUEVO EVENTO
            </button>
          </div>
        </div>

        {/* 1. SECCION DE TANDAS */}
        {activeNav === 'events' && (
          <div className="space-y-6 font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0b101c] border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Enlace Público del Evento</span>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`http://localhost:3000/events/${activeEvent?.slug || activeEvent?.id || ''}`}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:3000/events/${activeEvent?.slug || activeEvent?.id}`);
                      alert('¡Link copiado!');
                    }}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold rounded-xl whitespace-nowrap"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="bg-[#0b101c] border border-neutral-800/80 rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Ventas Totales</span>
                  <p className="text-2xl font-black text-white">${totalRevenue.toLocaleString('es-AR')}</p>
                  <span className="text-[11px] text-neutral-400">{tickets.length} entradas emitidas</span>
                </div>
                <button
                  onClick={handlePersistTiers}
                  disabled={savingTiers}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {savingTiers ? 'Guardando...' : '💾 GUARDAR CAMBIOS'}
                </button>
              </div>
            </div>

            <div className="bg-[#0b101c] border border-neutral-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <h3 className="text-sm font-bold uppercase text-white">Tandas & Productos</h3>
                <button
                  onClick={handleOpenCreateTier}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl"
                >
                  + CREAR TANDA
                </button>
              </div>

              {currentTiers.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No hay tandas creadas. Tocá "+ Crear Tanda" para empezar.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentTiers.map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-black/40 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl p-4 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveTier(idx, 'up')}
                            className="text-xs text-neutral-500 hover:text-white disabled:opacity-20"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === currentTiers.length - 1}
                            onClick={() => moveTier(idx, 'down')}
                            className="text-xs text-neutral-500 hover:text-white disabled:opacity-20"
                          >
                            ▼
                          </button>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm uppercase">{t.name}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                !t.visible
                                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                  : t.isSoldOut
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {!t.visible ? 'OCULTA' : t.isSoldOut ? 'SOLD OUT' : 'ACTIVA'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">
                            ${t.price.toLocaleString('es-AR')} · Stock: {t.capacity} disponibles
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditTier(idx)}
                          className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTier(idx)}
                          className="text-neutral-600 hover:text-rose-400 text-xs px-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. COBROS Y GASTOS */}
        {activeNav === 'costs' && (
          <div className="space-y-6 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b101c] border border-neutral-800 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Costos Totales</span>
                <p className="text-xl font-black text-white">${totalCosts.toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-[#0b101c] border border-neutral-800 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Total Pagado</span>
                <p className="text-xl font-black text-emerald-400">${totalPaid.toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-[#0b101c] border border-neutral-800 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold">Pendiente</span>
                <p className="text-xl font-black text-amber-400">${totalPending.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-[#0b101c] border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase text-white">+ Nuevo Gasto</h3>
                <form onSubmit={handleAddCost} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Concepto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: DJ, Sonido, Barra"
                      value={costConcept}
                      onChange={(e) => setCostConcept(e.target.value)}
                      className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Monto ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 300000"
                      value={costAmount}
                      onChange={(e) => setCostAmount(Number(e.target.value))}
                      className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold uppercase rounded-xl">
                    Guardar
                  </button>
                </form>
              </div>

              <div className="lg:col-span-8 bg-[#0b101c] border border-neutral-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase text-white">Planilla de Pagos</h3>
                <div className="space-y-2 text-xs">
                  {costs.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border flex justify-between items-center ${
                        c.paid ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-black/40 border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={c.paid}
                          onChange={() => handleToggleCost(c.id)}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className={`font-bold uppercase ${c.paid ? 'line-through text-neutral-500' : 'text-white'}`}>
                          {c.concept}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-black ${c.paid ? 'text-neutral-500' : 'text-rose-400'}`}>
                          ${Number(c.amount).toLocaleString('es-AR')}
                        </span>
                        <button onClick={() => handleDeleteCost(c.id)} className="text-neutral-600 hover:text-rose-400">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CRM DE ASISTENTES */}
        {activeNav === 'crm' && (
          <div className="bg-[#0b101c] border border-neutral-800 rounded-2xl p-6 space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-sm font-bold uppercase text-white">CRM de Asistentes</h3>
                <span className="text-xs text-neutral-400">Mostrando {filteredTickets.length} entradas</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="ALL">Todos los Eventos</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  className="bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Descargar CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 text-[10px] uppercase">
                    <th className="pb-3">Titular</th>
                    <th className="pb-3">DNI</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Tanda</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right">Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {filteredTickets.map((t: any) => {
                    const ticketName = t.customer_name || t.holder_name || 'Sin nombre';
                    const ticketHash = t.auth_code || t.qr_hash || t.id;
                    const ticketEmail = t.customer_email || t.holder_email || '';
                    const whatsappMsg = encodeURIComponent(
                      `¡Hola ${ticketName}! Acá tenés tu entrada oficial OASIS: http://localhost:3000/my-tickets (Hash: ${ticketHash})`
                    );

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-bold uppercase text-white">{ticketName}</td>
                        <td className="py-3 text-blue-400 font-bold">{t.customer_dni || t.holder_dni || '-'}</td>
                        <td className="py-3 text-neutral-400">{ticketEmail}</td>
                        <td className="py-3 uppercase text-white font-bold">{t.tier_name || 'General'}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              t.status === 'AVAILABLE' || t.status === 'VALID'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {t.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedTicketModal(t)}
                              className="px-2.5 py-1 bg-blue-950 border border-blue-800 text-white font-bold rounded-lg text-[10px] hover:bg-blue-900"
                            >
                              Ver QR
                            </button>
                            <a
                              href={`https://wa.me/?text=${whatsappMsg}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold rounded-lg text-[10px] hover:bg-emerald-900"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={`mailto:${ticketEmail}?subject=Tu Entrada Oficial OASIS&body=${whatsappMsg}`}
                              className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold rounded-lg text-[10px] hover:text-white"
                            >
                              Email
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CREAR NUEVO EVENTO */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold uppercase text-white">+ Registrar Nuevo Evento</h3>
              <button onClick={() => setShowEventModal(false)} className="text-neutral-500 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Nombre del Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: OASIS Sunset Edition"
                  value={evName}
                  onChange={(e) => setEvName(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={evDate}
                    onChange={(e) => setEvDate(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Locación / Lugar</label>
                  <input
                    type="text"
                    placeholder="Ej: PMRC Puerto Madero"
                    value={evVenue}
                    onChange={(e) => setEvVenue(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-neutral-400 block">Portada / Flyer del Evento</label>
                <div className="border border-dashed border-neutral-700 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer relative bg-black/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, setEvImg)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1 pointer-events-none">
                    <span className="text-xl block">📷</span>
                    <p className="font-bold text-white text-[11px]">Hacé clic o arrastrá tu imagen acá</p>
                    <p className="text-[9px] text-neutral-500">JPG, PNG o WebP desde tu computadora</p>
                  </div>
                </div>
                {evImg && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-neutral-800 relative">
                    <img src={evImg} alt="Preview Flyer" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEvImg('')}
                      className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] text-rose-400"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {creatingEvent ? 'Creando...' : 'Crear y Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR EVENTO */}
      {showEditEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold uppercase text-white">Editar Evento</h3>
              <button onClick={() => setShowEditEventModal(false)} className="text-neutral-500 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditEvent} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Nombre del Evento</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 uppercase font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Locación / Lugar</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-neutral-400 block">Actualizar Portada / Flyer</label>
                <div className="border border-dashed border-neutral-700 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer relative bg-black/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, setEditImg)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1 pointer-events-none">
                    <span className="text-xl block">📷</span>
                    <p className="font-bold text-white text-[11px]">Elegir nueva foto de tu PC</p>
                    <p className="text-[9px] text-neutral-500">Reemplaza la portada actual</p>
                  </div>
                </div>
                {editImg && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-neutral-800 relative">
                    <img src={editImg} alt="Preview Flyer" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditImg('')}
                      className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] text-rose-400"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditEventModal(false)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingEvent}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {updatingEvent ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR TANDA */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-6 font-mono">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold uppercase text-white">
                {editingTierIndex !== null ? 'Editar Producto / Tanda' : 'Nueva Tanda'}
              </h3>
              <button onClick={() => setShowTierModal(false)} className="text-neutral-500 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Early Bird, General, VIP"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Contale a tus clientes qué incluye"
                  value={tierDesc}
                  onChange={(e) => setTierDesc(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={tierCapacity}
                    onChange={(e) => setTierCapacity(Number(e.target.value))}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Máx. por Compra</label>
                  <input
                    type="number"
                    value={tierMaxPerBuy}
                    onChange={(e) => setTierMaxPerBuy(Number(e.target.value))}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Precio ($)</label>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">$</span>
                  <input
                    type="number"
                    value={tierPrice}
                    onChange={(e) => setTierPrice(Number(e.target.value))}
                    className="w-full bg-black/50 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-neutral-800 space-y-3">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Visibilidad</span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-neutral-800">
                  <div>
                    <p className="font-bold text-white">Visible para compradores</p>
                    <p className="text-[10px] text-neutral-500">Aparece en la página pública del evento</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tierVisible}
                    onChange={(e) => setTierVisible(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-neutral-800">
                  <div>
                    <p className="font-bold text-white">Sold out</p>
                    <p className="text-[10px] text-neutral-500">Los compradores verán el producto como agotado</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tierSoldOut}
                    onChange={(e) => setTierSoldOut(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTierModal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR QR */}
      {selectedTicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-neutral-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 font-mono">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-blue-400 uppercase">Credencial Digital</span>
              <button onClick={() => setSelectedTicketModal(null)} className="text-neutral-500 hover:text-white">
                ✕
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 w-44 h-44 mx-auto flex items-center justify-center shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  selectedTicketModal.auth_code || selectedTicketModal.qr_hash || selectedTicketModal.id
                )}`}
                alt="QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-white uppercase">{selectedTicketModal.customer_name || selectedTicketModal.holder_name}</p>
              <p className="text-blue-400 font-bold">DNI: {selectedTicketModal.customer_dni || selectedTicketModal.holder_dni || '-'}</p>
              <p className="text-[10px] text-neutral-500">Hash: {selectedTicketModal.auth_code || selectedTicketModal.qr_hash}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}