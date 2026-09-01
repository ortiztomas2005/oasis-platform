'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TicketTier {
  name: string;
  price: number;
  serviceFee: number;
  totalQuota: number;
  maxPerOrder: number;
  description: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [startTime, setStartTime] = useState('');

  const [ticketTypes, setTicketTypes] = useState<TicketTier[]>([
    {
      name: 'Early Bird',
      price: 15000,
      serviceFee: 2250,
      totalQuota: 200,
      maxPerOrder: 4,
      description: 'Ingreso antes de las 01:00 AM',
    },
  ]);

  const autoGenerateSlug = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generated);
  };

  const addTier = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        name: 'General',
        price: 20000,
        serviceFee: 3000,
        totalQuota: 500,
        maxPerOrder: 6,
        description: 'Acceso sin restricción horaria',
      },
    ]);
  };

  const updateTier = (index: number, field: keyof TicketTier, value: any) => {
    setTicketTypes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeTier = (index: number) => {
    if (ticketTypes.length === 1) return;
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          venueName,
          venueAddress,
          startTime: new Date(startTime).toISOString(),
          ticketTypes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al crear evento');
        setIsSubmitting(false);
        return;
      }

      alert('¡Evento y tandas de tickets creados con éxito!');
      router.push(`/events/${data.slug}`);
    } catch {
      alert('Error de red al procesar');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Backstage</span>
            <h1 className="text-2xl font-bold text-white mt-1">Crear Nuevo Evento</h1>
          </div>
          <Link
            href="/admin"
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900"
          >
            ← Volver al Panel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Generales */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Información Principal
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Nombre del Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: OASIS Club Night"
                  value={title}
                  onChange={(e) => autoGenerateSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Slug URL (Identificador)</label>
                <input
                  type="text"
                  required
                  placeholder="oasis-club-night"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el line-up, experiencia y dress code..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Locación y Horarios */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Lugar y Fecha
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Nombre del Venue</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Hipódromo / Arena OASIS"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Dirección</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. del Libertador 4400, CABA"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">Fecha y Hora de Inicio</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Configuración de Tandas de Entradas */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                Tandas de Entradas
              </h2>
              <button
                type="button"
                onClick={addTier}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-colors"
              >
                + Agregar Tanda
              </button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((tier, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Tanda #{idx + 1}</span>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-neutral-400 mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        value={tier.name}
                        onChange={(e) => updateTier(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Cupo Total</label>
                      <input
                        type="number"
                        required
                        value={tier.totalQuota}
                        onChange={(e) => updateTier(idx, 'totalQuota', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Precio ($ ARS)</label>
                      <input
                        type="number"
                        required
                        value={tier.price}
                        onChange={(e) => updateTier(idx, 'price', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Service Fee ($ ARS)</label>
                      <input
                        type="number"
                        value={tier.serviceFee}
                        onChange={(e) => updateTier(idx, 'serviceFee', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Máx. por Compra</label>
                      <input
                        type="number"
                        value={tier.maxPerOrder}
                        onChange={(e) => updateTier(idx, 'maxPerOrder', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-xl active:scale-[0.98]"
          >
            {isSubmitting ? 'Publicando Evento...' : 'Publicar Evento en Cartelera →'}
          </button>
        </form>
      </div>
    </main>
  );
}
