'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface EventItem {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  date?: string;
  venue?: string;
  capacity?: number;
  cbu_alias?: string;
}

interface TicketTierItem {
  id: string;
  event_id: string;
  name: string;
  price: number;
  total_capacity: number;
  available_capacity?: number;
  capacity?: number;
  status: string;
}

interface CostItem {
  id: string;
  eventId: string;
  concept: string;
  category: string;
  amount: number;
  isPaid: boolean;
}

interface PromotorItem {
  id: string;
  eventId: string;
  name: string;
  code: string;
  commissionPerTicket: number;
}

export default function AdminDashboardPro() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [tiers, setTiers] = useState<TicketTierItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegación
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'METRICS' | 'TRANSFERS' | 'TICKETS' | 'TIERS_CONFIG' | 'RRPP' | 'COSTS'>('METRICS');

  // Modales
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [selectedQrTicket, setSelectedQrTicket] = useState<any | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form Nuevo Evento
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState('1000');
  const [newEventCbu, setNewEventCbu] = useState('OASIS.OFICIAL');
  const [creatingEventLoading, setCreatingEventLoading] = useState(false);

  // Form Nueva Tanda
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [newTierCapacity, setNewTierCapacity] = useState('150');
  const [tierSubmitting, setTierSubmitting] = useState(false);

  // Edición de Evento
  const [editEventVenue, setEditEventVenue] = useState('');
  const [editEventCbu, setEditEventCbu] = useState('');
  const [editEventCapacity, setEditEventCapacity] = useState('');

  // Búsqueda en Tickets
  const [ticketSearch, setTicketSearch] = useState('');

  // RRPP State
  const [promoters, setPromoters] = useState<PromotorItem[]>([
    { id: 'p1', eventId: 'ALL', name: 'Santi Promotor', code: 'SANTI-VIP', commissionPerTicket: 1500 },
    { id: 'p2', eventId: 'ALL', name: 'Micaela RRPP', code: 'MICA-PASS', commissionPerTicket: 1500 },
  ]);
  const [newRrppName, setNewRrppName] = useState('');
  const [newRrppCode, setNewRrppCode] = useState('');
  const [newRrppCommission, setNewRrppCommission] = useState('1500');

  // Costos State
  const [costs, setCosts] = useState<CostItem[]>([
    { id: 'c1', eventId: 'ALL', concept: 'Sonido e Iluminación Line Array', category: 'Técnica', amount: 450000, isPaid: true },
    { id: 'c2', eventId: 'ALL', concept: 'Honorarios DJ Headliner', category: 'Artística', amount: 600000, isPaid: false },
    { id: 'c3', eventId: 'ALL', concept: 'Seguridad y Control (8 Efectivos)', category: 'Operativa', amount: 280000, isPaid: true },
    { id: 'c4', eventId: 'ALL', concept: 'Barra & Insumos Iniciales', category: 'Insumos', amount: 350000, isPaid: false },
  ]);
  const [newCostConcept, setNewCostConcept] = useState('');
  const [newCostCategory, setNewCostCategory] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEventId !== 'ALL') {
      fetchEventTiers(selectedEventId);
      const ev = events.find((e) => e.id === selectedEventId);
      if (ev) {
        setEditEventVenue(ev.venue || '');
        setEditEventCbu(ev.cbu_alias || 'OASIS.OFICIAL');
        setEditEventCapacity(String(ev.capacity || 1000));
      }
    } else {
      setTiers([]);
    }
  }, [selectedEventId, events]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events-data');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setOrders(data.orders || []);
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTiers = async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/tiers`);
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setTiers(data.tiers || []);
        }
      }
    } catch (err) {
      console.error('Error al cargar tandas:', err);
    }
  };

  const getEventName = (evt?: EventItem) => {
    if (!evt) return 'Todos los Eventos (Consolidado)';
    return evt.name || evt.title || evt.slug || `Evento #${evt.id.substring(0, 4)}`;
  };

  const currentEvent = useMemo(() => events.find((e) => e.id === selectedEventId), [events, selectedEventId]);

  const filteredOrders = useMemo(() => {
    if (selectedEventId === 'ALL') return orders;
    return orders.filter((o) => o.event_id === selectedEventId);
  }, [orders, selectedEventId]);

  const filteredTickets = useMemo(() => {
    let list = selectedEventId === 'ALL' ? tickets : tickets.filter((t) => t.event_id === selectedEventId);
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      list = list.filter((t) => {
        const name = (t.customer_name || t.holder_name || '').toLowerCase();
        const dni = (t.customer_dni || t.holder_dni || '').toLowerCase();
        const email = (t.customer_email || t.holder_email || '').toLowerCase();
        const hash = (t.auth_code || t.qr_hash || '').toLowerCase();
        return name.includes(q) || dni.includes(q) || email.includes(q) || hash.includes(q);
      });
    }
    return list;
  }, [tickets, selectedEventId, ticketSearch]);

  const filteredCosts = useMemo(() => {
    if (selectedEventId === 'ALL') return costs;
    return costs.filter((c) => c.eventId === selectedEventId || c.eventId === 'ALL');
  }, [costs, selectedEventId]);

  const filteredPromoters = useMemo(() => {
    if (selectedEventId === 'ALL') return promoters;
    return promoters.filter((p) => p.eventId === selectedEventId || p.eventId === 'ALL');
  }, [promoters, selectedEventId]);

  const pendingTransfers = useMemo(() => {
    return filteredOrders.filter((o) => o.payment_method === 'TRANSFER_MANUAL' && o.status === 'PENDING');
  }, [filteredOrders]);

  const approvedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'APPROVED');
  }, [filteredOrders]);

  const totalRevenue = useMemo(() => {
    return approvedOrders.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [approvedOrders]);

  const totalCosts = useMemo(() => {
    return filteredCosts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredCosts]);

  const totalPaidCosts = useMemo(() => {
    return filteredCosts.filter((c) => c.isPaid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredCosts]);

  const pendingCosts = totalCosts - totalPaidCosts;
  const netProfit = totalRevenue - totalCosts;
  const maxCapacity = currentEvent?.capacity || (events.length > 0 ? events.length * 1000 : 1000);
  const occupancyRate = Math.min(100, Math.round((filteredTickets.length / maxCapacity) * 100));

  const tierStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    approvedOrders.forEach((o) => {
      const tier = o.ticket_tier || 'General';
      if (!map[tier]) map[tier] = { count: 0, total: 0 };
      map[tier].count += 1;
      map[tier].total += Number(o.amount || 0);
    });
    return map;
  }, [approvedOrders]);

  const salesTimeline = useMemo(() => {
    const daysMap: Record<string, { date: string; amount: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      daysMap[key] = { date: label, amount: 0, count: 0 };
    }

    approvedOrders.forEach((o) => {
      const dayKey = (o.created_at || '').split('T')[0];
      if (daysMap[dayKey]) {
        daysMap[dayKey].amount += Number(o.amount || 0);
        daysMap[dayKey].count += 1;
      }
    });

    return Object.values(daysMap);
  }, [approvedOrders]);

  const maxTimelineAmount = Math.max(...salesTimeline.map((s) => s.amount), 10000);

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEventId === 'ALL' || !newTierName || !newTierPrice) return;
    setTierSubmitting(true);

    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTierName,
          price: newTierPrice,
          total_capacity: newTierCapacity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear tanda');

      if (data.tier) {
        setTiers((prev) => [...prev, data.tier]);
      } else {
        fetchEventTiers(selectedEventId);
      }

      setNewTierName('');
      setNewTierPrice('');
      alert('¡Tanda creada exitosamente!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTierSubmitting(false);
    }
  };

  const handleUpdateTier = async (tierId: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}/tiers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, ...updates }),
      });
      if (res.ok) {
        fetchEventTiers(selectedEventId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEventId === 'ALL') return;

    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}/tiers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateEventDetails: {
            name: currentEvent?.name || currentEvent?.title,
            venue: editEventVenue,
            capacity: editEventCapacity,
            cbu_alias: editEventCbu,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar evento');
      alert('¡Configuración guardada!');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;
    setCreatingEventLoading(true);

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          date: newEventDate,
          venue: newEventVenue,
          capacity: newEventCapacity,
          cbuAlias: newEventCbu,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear evento');

      alert('¡Evento creado exitosamente!');
      setIsCreatingEvent(false);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventVenue('');
      fetchData();
      if (data.event?.id) {
        setSelectedEventId(data.event.id);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingEventLoading(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar orden');
      alert(action === 'APPROVE' ? 'Transferencia aprobada.' : 'Orden rechazada.');
      setPreviewReceiptUrl(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendTicket = async (ticketId: string) => {
    try {
      setResendingId(ticketId);
      const res = await fetch('/api/admin/tickets/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reenviar');
      alert(data.message || 'Ticket reenviado exitosamente');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResendingId(null);
    }
  };

  const handleSendWhatsApp = (t: any) => {
    const name = t.customer_name || t.holder_name || 'Asistente';
    const hash = t.auth_code || t.qr_hash || t.id;
    const eventName = t.events?.name || t.events?.title || 'OASIS Event';
    const text = encodeURIComponent(
      `🎟 ¡Hola ${name}! Tu entrada oficial para *${eventName}* está confirmada.\n\n` +
      `● *Tanda:* ${t.tier_name || 'General'}\n` +
      `● *DNI:* ${t.customer_dni || t.holder_dni || '-'}\n` +
      `● *Código de Acceso:* ${hash}\n\n` +
      `Accedé a tu ticket y código QR en vivo acá:\n` +
      `http://localhost:3000/my-tickets\n\n` +
      `_Presentá este pase en la puerta al ingresar._`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostConcept || !newCostAmount) return;
    const item: CostItem = {
      id: 'cost_' + Date.now(),
      eventId: selectedEventId,
      concept: newCostConcept,
      category: newCostCategory.trim() || 'General',
      amount: parseFloat(newCostAmount),
      isPaid: false,
    };
    setCosts([item, ...costs]);
    setNewCostConcept('');
    setNewCostCategory('');
    setNewCostAmount('');
  };

  const toggleCostPaid = (id: string) => {
    setCosts(costs.map((c) => (c.id === id ? { ...c, isPaid: !c.isPaid } : c)));
  };

  const updateCostAmount = (id: string, newAmount: string) => {
    const val = parseFloat(newAmount);
    if (!isNaN(val)) {
      setCosts(costs.map((c) => (c.id === id ? { ...c, amount: val } : c)));
    }
  };

  const deleteCost = (id: string) => {
    setCosts(costs.filter((c) => c.id !== id));
  };

  const handleAddPromoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRrppName || !newRrppCode) return;
    const cleanCode = newRrppCode.toUpperCase().replace(/\s+/g, '-');
    const item: PromotorItem = {
      id: 'rrpp_' + Date.now(),
      eventId: selectedEventId,
      name: newRrppName,
      code: cleanCode,
      commissionPerTicket: parseFloat(newRrppCommission) || 0,
    };
    setPromoters([...promoters, item]);
    setNewRrppName('');
    setNewRrppCode('');
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* MODAL CREAR EVENTO */}
        {isCreatingEvent && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-yellow-400">Productora OASIS</span>
                  <h3 className="font-black text-lg uppercase text-white">Lanzar Nuevo Evento</h3>
                </div>
                <button onClick={() => setIsCreatingEvent(false)} className="text-neutral-400 hover:text-white font-mono text-sm">✕</button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Nombre / Título *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: OASIS NIGHT: OPENING SEASON"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-yellow-400 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Capacidad</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={newEventCapacity}
                      onChange={(e) => setNewEventCapacity(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Lugar / Venue</label>
                  <input
                    type="text"
                    placeholder="Ej: Club Hípico"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Alias CBU</label>
                  <input
                    type="text"
                    placeholder="OASIS.OFICIAL"
                    value={newEventCbu}
                    onChange={(e) => setNewEventCbu(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 uppercase font-bold"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingEvent(false)}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl uppercase font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingEventLoading}
                    className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl uppercase font-black transition-all"
                  >
                    {creatingEventLoading ? 'Publicando...' : 'Publicar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL QR */}
        {selectedQrTicket && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase text-yellow-400">Credencial Oficial</span>
                <button onClick={() => setSelectedQrTicket(null)} className="text-neutral-400 hover:text-white font-mono text-sm">✕</button>
              </div>
              <div className="bg-white p-5 rounded-2xl inline-block mx-auto shadow-xl">
                <QRCodeSVG value={selectedQrTicket.auth_code || selectedQrTicket.qr_hash || selectedQrTicket.id} size={200} level="H" />
              </div>
              <div className="text-left font-mono text-xs bg-black/60 p-3 rounded-xl border border-neutral-800 space-y-1">
                <p className="font-bold uppercase text-white">{selectedQrTicket.customer_name || selectedQrTicket.holder_name}</p>
                <p className="text-neutral-400">DNI: {selectedQrTicket.customer_dni || selectedQrTicket.holder_dni}</p>
                <p className="text-yellow-400 font-bold uppercase">{selectedQrTicket.tier_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleResendTicket(selectedQrTicket.id)}
                  disabled={resendingId === selectedQrTicket.id}
                  className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all"
                >
                  {resendingId === selectedQrTicket.id ? '...' : '✉ Email'}
                </button>
                <button
                  onClick={() => handleSendWhatsApp(selectedQrTicket)}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all"
                >
                  💬 WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL COMPROBANTE */}
        {previewReceiptUrl && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase text-white font-mono">Comprobante de Transferencia</h3>
                <button onClick={() => setPreviewReceiptUrl(null)} className="text-neutral-400 hover:text-white font-mono text-sm">✕</button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-black max-h-[60vh] flex items-center justify-center">
                <img src={previewReceiptUrl} alt="Comprobante" className="w-full h-auto object-contain" />
              </div>
              <div className="flex justify-end gap-2">
                <a href={previewReceiptUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs rounded-xl">
                  Abrir en pestaña nueva ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
                Consola Central de Productora • Backstage
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight mt-1">
              {getEventName(currentEvent)}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreatingEvent(true)}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-black font-mono text-xs uppercase rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Nuevo Evento</span>
            </button>

            <Link
              href="/scan"
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black font-mono text-xs uppercase rounded-xl transition-all shadow-lg shadow-yellow-400/10 flex items-center gap-2"
            >
              <span>📷</span>
              <span>Escáner de Puerta</span>
            </Link>
          </div>
        </div>

        {/* SELECTOR DE EVENTOS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold block">
              Eventos de la Productora:
            </label>
            <span className="text-[10px] font-mono text-neutral-500">{events.length} fiestas activas</span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedEventId('ALL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
                selectedEventId === 'ALL'
                  ? 'bg-white text-black shadow-lg font-black'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <span>🌐</span>
              <span>Todos los Eventos (Consolidado)</span>
            </button>

            {events.map((evt, idx) => {
              const displayName = evt.name || evt.title || `Fiesta #${idx + 1}`;
              const isSelected = selectedEventId === evt.id;
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-yellow-400 text-black shadow-lg font-black'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className={isSelected ? 'text-black' : 'text-yellow-400'}>●</span>
                  <span>{displayName}</span>
                  {evt.date && (
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}>
                      ({new Date(evt.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl space-y-1 relative overflow-hidden">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Recaudación Bruta</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-yellow-400">${totalRevenue.toLocaleString('es-AR')}</p>
            <span className="text-[10px] font-mono text-neutral-500 block">{approvedOrders.length} compras aprobadas</span>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Costos Totales</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-red-400">${totalCosts.toLocaleString('es-AR')}</p>
            <span className="text-[10px] font-mono text-neutral-500 block">Pagado: ${totalPaidCosts.toLocaleString('es-AR')} | Pendiente: ${pendingCosts.toLocaleString('es-AR')}</span>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Beneficio Neto (P&L)</span>
            <p className={`text-2xl sm:text-3xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              ${netProfit.toLocaleString('es-AR')}
            </p>
            <span className="text-[10px] font-mono text-neutral-500 block">
              Margen: <strong className="text-white">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong>
            </span>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Aforo Ocupado</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white">
              {filteredTickets.length} <span className="text-xs text-neutral-500">/ {maxCapacity}</span>
            </p>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-yellow-400 h-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* SUB-PESTAÑAS */}
        <div className="flex border-b border-neutral-800 gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
              activeTab === 'METRICS' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            📊 Métricas Visuales & Gráficos
          </button>

          <button
            onClick={() => setActiveTab('TRANSFERS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap relative ${
              activeTab === 'TRANSFERS' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            🏦 Validar Transferencias ({pendingTransfers.length})
            {pendingTransfers.length > 0 && <span className="ml-2 w-2 h-2 bg-amber-400 rounded-full inline-block animate-ping"></span>}
          </button>

          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
              activeTab === 'TICKETS' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            🎟 Entradas Emitidas ({filteredTickets.length})
          </button>

          <button
            onClick={() => setActiveTab('TIERS_CONFIG')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
              activeTab === 'TIERS_CONFIG' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            ⚙️ Tandas & Configuración
          </button>

          <button
            onClick={() => setActiveTab('RRPP')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
              activeTab === 'RRPP' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            👥 RRPP & Promotores ({filteredPromoters.length})
          </button>

          <button
            onClick={() => setActiveTab('COSTS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
              activeTab === 'COSTS' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            💸 Gestión de Costos ({filteredCosts.length})
          </button>
        </div>

        {/* CONTENIDO PESTAÑA: TANDAS & CONFIGURACIÓN */}
        {activeTab === 'TIERS_CONFIG' && (
          <div className="space-y-8 font-mono text-xs">
            {selectedEventId === 'ALL' ? (
              <div className="p-8 border border-neutral-800 rounded-3xl bg-neutral-900/60 text-center text-neutral-400">
                Seleccioná un evento específico de la barra superior para gestionar sus tandas de precios y configurar sus datos.
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-wider">
                    Tandas de Entradas & Precios ({currentEvent?.name || currentEvent?.title})
                  </h3>

                  <form onSubmit={handleCreateTier} className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase block mb-1">Nombre de la Tanda</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: EARLY BIRD, GENERAL, VIP..."
                        value={newTierName}
                        onChange={(e) => setNewTierName(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase block mb-1">Precio Unitario ($ ARS)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej: 15000"
                        value={newTierPrice}
                        onChange={(e) => setNewTierPrice(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase block mb-1">Cupo de Tickets</label>
                      <input
                        type="number"
                        required
                        placeholder="150"
                        value={newTierCapacity}
                        onChange={(e) => setNewTierCapacity(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={tierSubmitting}
                      className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-xl transition-all"
                    >
                      {tierSubmitting ? 'Guardando...' : '+ Crear Tanda'}
                    </button>
                  </form>

                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl overflow-hidden">
                    <div className="grid grid-cols-12 p-4 border-b border-neutral-800 text-[10px] font-bold uppercase text-neutral-400">
                      <span className="col-span-4">Nombre de la Tanda</span>
                      <span className="col-span-3">Precio Unitario ($ ARS)</span>
                      <span className="col-span-3">Cupo Asignado</span>
                      <span className="col-span-2 text-right">Estado</span>
                    </div>

                    {tiers.length === 0 ? (
                      <div className="p-8 text-center text-neutral-500">No hay tandas creadas aún para este evento.</div>
                    ) : (
                      tiers.map((tier) => (
                        <div key={tier.id} className="grid grid-cols-12 p-4 border-b border-neutral-800/60 items-center hover:bg-neutral-800/20">
                          <div className="col-span-4 font-black text-white uppercase text-sm">{tier.name}</div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              defaultValue={tier.price}
                              onBlur={(e) => handleUpdateTier(tier.id, { price: e.target.value })}
                              className="bg-black border border-neutral-800 rounded-lg px-2 py-1 text-yellow-400 font-bold w-28 outline-none focus:border-yellow-400"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              defaultValue={tier.total_capacity || tier.capacity}
                              onBlur={(e) => handleUpdateTier(tier.id, { total_capacity: e.target.value })}
                              className="bg-black border border-neutral-800 rounded-lg px-2 py-1 text-white w-24 outline-none focus:border-yellow-400"
                            />
                          </div>

                          <div className="col-span-2 text-right">
                            <select
                              value={tier.status}
                              onChange={(e) => handleUpdateTier(tier.id, { status: e.target.value })}
                              className={`bg-black border border-neutral-800 rounded-lg px-2 py-1 text-xs font-bold outline-none ${
                                tier.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              <option value="ACTIVE">ACTIVA</option>
                              <option value="PAUSED">PAUSADA</option>
                              <option value="SOLD_OUT">AGOTADA</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-wider">
                    Configuración Operativa & Venue
                  </h3>

                  <form onSubmit={handleSaveEventDetails} className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-neutral-400 uppercase block mb-1">Lugar / Venue</label>
                        <input
                          type="text"
                          value={editEventVenue}
                          onChange={(e) => setEditEventVenue(e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-400 uppercase block mb-1">Capacidad Total Aforo</label>
                        <input
                          type="number"
                          value={editEventCapacity}
                          onChange={(e) => setEditEventCapacity(e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-400 uppercase block mb-1">Alias CBU Cobros</label>
                        <input
                          type="text"
                          value={editEventCbu}
                          onChange={(e) => setEditEventCbu(e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 uppercase font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-xl transition-all"
                      >
                        Guardar Cambios del Evento
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 1: MÉTRICAS */}
        {activeTab === 'METRICS' && (
          <div className="space-y-6 font-mono">
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs uppercase font-bold text-yellow-400 tracking-wider">
                    Evolución Diaria de Ventas (Últimos 7 días)
                  </h3>
                  <p className="text-[11px] text-neutral-400">Comportamiento temporal de recaudación y flujo de caja.</p>
                </div>
                <span className="text-xs text-neutral-400 font-bold">
                  Pico diario: <strong className="text-yellow-400">${maxTimelineAmount.toLocaleString('es-AR')}</strong>
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 border-b border-neutral-800">
                {salesTimeline.map((item, idx) => {
                  const heightPercent = maxTimelineAmount > 0 ? Math.max(8, Math.round((item.amount / maxTimelineAmount) * 100)) : 8;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] text-yellow-400 opacity-0 group-hover:opacity-100 transition-all font-bold">
                        ${item.amount.toLocaleString('es-AR')}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 ${
                          item.amount > 0 ? 'bg-yellow-400 group-hover:bg-yellow-300' : 'bg-neutral-800'
                        }`}
                      ></div>
                      <span className="text-[10px] text-neutral-400 mt-2">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs uppercase font-bold text-yellow-400 tracking-wider">
                  Distribución por Tanda de Entradas
                </h3>
                <div className="space-y-3">
                  {Object.keys(tierStats).length === 0 ? (
                    <p className="text-xs text-neutral-500">Sin tickets vendidos para este evento.</p>
                  ) : (
                    Object.entries(tierStats).map(([tier, data]) => {
                      const percent = totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0;
                      return (
                        <div key={tier} className="bg-black/50 border border-neutral-800 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-white uppercase">{tier}</span>
                              <span className="text-neutral-500 ml-2">({data.count} pases)</span>
                            </div>
                            <span className="text-yellow-400 font-bold">${data.total.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-yellow-400 h-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold text-yellow-400 tracking-wider">
                    Punto de Equilibrio (Break-Even)
                  </h3>
                  <div className="bg-black/50 border border-neutral-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Amortización de Costos:</span>
                      <span className="text-white font-bold">{totalCosts > 0 ? Math.min(100, Math.round((totalRevenue / totalCosts) * 100)) : 100}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${totalRevenue >= totalCosts ? 'bg-emerald-400' : 'bg-yellow-400'}`}
                        style={{ width: `${totalCosts > 0 ? Math.min(100, (totalRevenue / totalCosts) * 100) : 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-400 space-y-2 pt-2">
                    <div className="flex justify-between">
                      <span>Costo por Asistente Promedio:</span>
                      <span className="text-white">${filteredTickets.length > 0 ? Math.round(totalCosts / filteredTickets.length).toLocaleString('es-AR') : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket Promedio (Avg Price):</span>
                      <span className="text-white">${approvedOrders.length > 0 ? Math.round(totalRevenue / approvedOrders.length).toLocaleString('es-AR') : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl text-[11px] text-yellow-300">
                  ● Margen neto proyectado: <strong className="text-white">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TRANSFERENCIAS */}
        {activeTab === 'TRANSFERS' && (
          <div className="space-y-4">
            {pendingTransfers.length === 0 ? (
              <div className="border border-dashed border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 font-mono text-xs">
                No hay transferencias pendientes para validar en este evento.
              </div>
            ) : (
              pendingTransfers.map((order) => (
                <div
                  key={order.id}
                  className="bg-neutral-900/60 border border-yellow-400/30 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-yellow-400/5 shadow-lg"
                >
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase text-sm">{order.customer_name}</span>
                      <span className="text-neutral-500 text-[10px]">DNI: {order.customer_dni}</span>
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    </div>
                    <p className="text-neutral-400">
                      Email: <span className="text-white">{order.customer_email}</span> • Tanda: <strong className="text-yellow-400">{order.ticket_tier}</strong>
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Código Referencia: <span className="text-white font-bold bg-neutral-800 px-1.5 py-0.5 rounded">{order.reference_code}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right font-mono">
                      <span className="text-xs text-neutral-500 uppercase block">Monto</span>
                      <span className="text-base font-black text-yellow-400">${Number(order.amount).toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.receipt_url ? (
                        <button
                          onClick={() => setPreviewReceiptUrl(order.receipt_url)}
                          className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 border border-yellow-400/30 font-mono text-xs font-bold rounded-xl transition-all"
                        >
                          👁 Comprobante
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 italic px-2">Sin foto</span>
                      )}

                      <button
                        onClick={() => handleOrderAction(order.id, 'APPROVE')}
                        disabled={actionLoadingId === order.id}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-xs uppercase rounded-xl transition-all disabled:opacity-50"
                      >
                        {actionLoadingId === order.id ? '...' : '✓ Aprobar'}
                      </button>

                      <button
                        onClick={() => handleOrderAction(order.id, 'REJECT')}
                        disabled={actionLoadingId === order.id}
                        className="px-3 py-2 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 font-mono text-xs rounded-xl transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PESTAÑA 3: ENTRADAS */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-4 font-mono">
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-2xl flex items-center gap-3">
              <span className="text-neutral-500 text-sm">🔍</span>
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Buscar por Nombre, DNI, Email o Código Hash..."
                className="bg-transparent text-xs text-white outline-none w-full"
              />
              {ticketSearch && (
                <button onClick={() => setTicketSearch('')} className="text-neutral-500 hover:text-white text-xs">
                  Limpiar
                </button>
              )}
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="grid grid-cols-12 p-4 border-b border-neutral-800 text-[10px] font-bold uppercase text-neutral-500">
                <span className="col-span-3">Asistente / Titular</span>
                <span className="col-span-2">DNI / Doc</span>
                <span className="col-span-2">Tanda</span>
                <span className="col-span-2">Estado</span>
                <span className="col-span-3 text-right">Despacho</span>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">No se encontraron tickets emitidos.</div>
              ) : (
                filteredTickets.map((t) => (
                  <div key={t.id} className="grid grid-cols-12 p-4 border-b border-neutral-800/60 text-xs items-center hover:bg-neutral-800/30 transition-all">
                    <div className="col-span-3">
                      <p className="font-bold text-white uppercase truncate">{t.customer_name || t.holder_name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{t.customer_email || t.holder_email || 'Sin correo'}</p>
                    </div>

                    <div className="col-span-2 text-neutral-300 font-bold">
                      {t.customer_dni || t.holder_dni || '-'}
                    </div>

                    <div className="col-span-2">
                      <span className="text-yellow-400 font-bold uppercase text-[11px]">{t.tier_name}</span>
                    </div>

                    <div className="col-span-2">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        t.status === 'AVAILABLE'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : t.status === 'USED'
                          ? 'text-neutral-400 bg-neutral-800 border-neutral-700'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="col-span-3 flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedQrTicket(t)}
                        className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 rounded-lg text-xs font-bold"
                        title="Ver QR"
                      >
                        👁 QR
                      </button>
                      <button
                        onClick={() => handleResendTicket(t.id)}
                        disabled={resendingId === t.id}
                        className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
                        title="Reenviar Email"
                      >
                        {resendingId === t.id ? '...' : '✉ Mail'}
                      </button>
                      <button
                        onClick={() => handleSendWhatsApp(t)}
                        className="px-2 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                        title="Enviar por WhatsApp"
                      >
                        💬 Wpp
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: RRPP */}
        {activeTab === 'RRPP' && (
          <div className="space-y-6 font-mono text-xs">
            <form onSubmit={handleAddPromoter} className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase block mb-1">Nombre Promotor / RRPP</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lucas Staff"
                  value={newRrppName}
                  onChange={(e) => setNewRrppName(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase block mb-1">Código Promocional</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: LUCAS-VIP"
                  value={newRrppCode}
                  onChange={(e) => setNewRrppCode(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase block mb-1">Comisión por Ticket ($)</label>
                <input
                  type="number"
                  required
                  placeholder="1500"
                  value={newRrppCommission}
                  onChange={(e) => setNewRrppCommission(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold uppercase rounded-xl transition-all"
              >
                + Generar RRPP Link
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPromoters.map((p) => {
                const trackingLink = `http://localhost:3000/events/${currentEvent?.slug || 'fiesta'}?ref=${p.code}`;
                return (
                  <div key={p.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm uppercase">{p.name}</span>
                      <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-[10px] font-bold px-2 py-0.5 rounded">
                        {p.code}
                      </span>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center text-[10px]">
                      <span className="text-neutral-400 truncate max-w-[200px]">{trackingLink}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(trackingLink);
                          alert('¡Link copiado!');
                        }}
                        className="text-yellow-400 hover:underline font-bold"
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex justify-between text-xs">
                      <span className="text-neutral-400">Comisión fija:</span>
                      <span className="text-emerald-400 font-bold">${p.commissionPerTicket} / ticket</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 5: COSTOS */}
        {activeTab === 'COSTS' && (
          <div className="space-y-6 font-mono text-xs">
            <form onSubmit={handleAddCost} className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase block mb-1">Concepto del Gasto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alquiler Grupo Electrógeno"
                  value={newCostConcept}
                  onChange={(e) => setNewCostConcept(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase block mb-1">Categoría</label>
                <input
                  type="text"
                  placeholder="Ej: Técnica, Artística..."
                  value={newCostCategory}
                  onChange={(e) => setNewCostCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase block mb-1">Monto ($ ARS)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 250000"
                  value={newCostAmount}
                  onChange={(e) => setNewCostAmount(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold uppercase rounded-xl transition-all"
              >
                + Registrar Gasto
              </button>
            </form>

            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="grid grid-cols-12 p-4 border-b border-neutral-800 text-[10px] font-bold uppercase text-neutral-400">
                <span className="col-span-1 text-center">Pagado</span>
                <span className="col-span-4">Concepto</span>
                <span className="col-span-3">Categoría</span>
                <span className="col-span-3 text-right">Monto ($ ARS)</span>
                <span className="col-span-1 text-center">✕</span>
              </div>

              {filteredCosts.map((c) => (
                <div key={c.id} className="grid grid-cols-12 p-4 border-b border-neutral-800/60 text-xs items-center hover:bg-neutral-800/30 transition-all">
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => toggleCostPaid(c.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs ${
                        c.isPaid ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-700 bg-black text-transparent hover:border-neutral-500'
                      }`}
                    >
                      ✓
                    </button>
                  </div>

                  <div className="col-span-4">
                    <span className={`font-bold uppercase ${c.isPaid ? 'line-through text-neutral-500' : 'text-white'}`}>
                      {c.concept}
                    </span>
                  </div>

                  <div className="col-span-3 text-neutral-400">
                    <span className="bg-neutral-800 px-2 py-0.5 rounded text-[11px]">{c.category}</span>
                  </div>

                  <div className="col-span-3 text-right">
                    <input
                      type="number"
                      defaultValue={c.amount}
                      onBlur={(e) => updateCostAmount(c.id, e.target.value)}
                      className="bg-black/60 border border-neutral-800 rounded-lg px-2 py-1 text-right text-red-400 font-bold w-32 outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => deleteCost(c.id)} className="text-neutral-600 hover:text-red-400 text-sm">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}