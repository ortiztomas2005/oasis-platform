'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateEventModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('500');
  const [description, setDescription] = useState('');

  // Tandas iniciales por defecto
  const [ticketTiers, setTicketTiers] = useState([
    { name: 'Early Bird', price: '12000', quota: '100', description: 'Ingreso antes de las 01:30 AM' },
    { name: 'General', price: '18000', quota: '300', description: 'Ingreso toda la noche' },
    { name: 'VIP Standing', price: '28000', quota: '100', description: 'Acceso a sector preferencial' },
  ]);

  const handleAddTier = () => {
    setTicketTiers((prev) => [...prev, { name: '', price: '', quota: '', description: '' }]);
  };

  const handleUpdateTier = (index: number, field: string, value: string) => {
    setTicketTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveTier = (index: number) => {
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venueName || !venueAddress || !startTime || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          venueName,
          venueAddress,
          startTime,
          endTime,
          maxCapacity,
          description,
          ticketTiers,
        }),
      });

      const data = await res.json();
      if (data.success && data.event) {
        setIsOpen(false);
        router.push(`/admin?event_id=${data.event.id}`);
        router.refresh();
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear el evento'));
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/10 flex items-center gap-1.5"
      >
        <span>+</span> Crear Evento
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">PRODUCCIÓN</span>
                <h3 className="text-lg font-bold text-white">Configurar Nuevo Evento</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info Básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Nombre del Evento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: OASIS Club: Hernan Cattaneo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Nombre de Locación</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Complejo Mandarine Park"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Dirección Exacta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Costanera Norte y Sarmiento"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Fecha y Hora de Apertura</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Capacidad Máxima Total</label>
                  <input
                    type="number"
                    required
                    placeholder="500"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Tandas de Entradas */}
              <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                    Tandas de Tickets / Precios
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    + Agregar Tanda
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ticketTiers.map((tier, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
                      <input
                        type="text"
                        placeholder="Nombre (Early, General...)"
                        value={tier.name}
                        onChange={(e) => handleUpdateTier(idx, 'name', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Precio $"
                        value={tier.price}
                        onChange={(e) => handleUpdateTier(idx, 'price', e.target.value)}
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Cupo"
                        value={tier.quota}
                        onChange={(e) => handleUpdateTier(idx, 'quota', e.target.value)}
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        required
                      />
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(idx)}
                          className="text-neutral-500 hover:text-rose-400 px-1 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider"
                >
                  {loading ? 'Creando Evento...' : 'Publicar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}