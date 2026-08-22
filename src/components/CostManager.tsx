'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CostItem {
  id: string;
  category: string;
  concept: string;
  amount: number;
  is_paid?: boolean;
}

interface CostManagerProps {
  eventId: string;
  initialCosts: CostItem[];
}

export function CostManager({ eventId, initialCosts }: CostManagerProps) {
  const router = useRouter();
  const [costs, setCosts] = useState<CostItem[]>(initialCosts);
  const [category, setCategory] = useState('Producción General');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Sincronizar costos cuando cambia de evento en el selector
  useEffect(() => {
    setCosts(initialCosts);
  }, [initialCosts, eventId]);

  const totalCosts = costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPaid = costs.filter((c) => c.is_paid).reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPending = totalCosts - totalPaid;

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !amount || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          category,
          concept,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();
      if (data.success && data.cost) {
        setCosts((prev) => [data.cost, ...prev]);
        setConcept('');
        setAmount('');
        router.refresh();
      } else {
        alert('Error al guardar costo: ' + (data.error || 'Desconocido'));
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic update
    setCosts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_paid: nextStatus } : c))
    );

    try {
      const res = await fetch('/api/admin/costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_paid: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback si falla
        setCosts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_paid: currentStatus } : c))
        );
      } else {
        router.refresh();
      }
    } catch {
      setCosts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_paid: currentStatus } : c))
      );
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar este costo?')) return;

    try {
      const res = await fetch(`/api/admin/costs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCosts((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con Desglose Total / Pagado / Pendiente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h3 className="text-base font-bold text-white">Estructura de Costos del Evento</h3>
          <p className="text-xs text-neutral-500">Cargá gastos y marcá las facturas o ítems ya abonados.</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Pagado</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              ${totalPaid.toLocaleString('es-AR')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Pendiente</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              ${totalPending.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="pl-2 border-l border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Total Gastos</span>
            <span className="text-lg font-black text-rose-400 font-mono">
              ${totalCosts.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario de carga rápida */}
      <form onSubmit={handleAddCost} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
        >
          <option value="Producción General">Producción General</option>
          <option value="Artística & DJs">Artística & DJs</option>
          <option value="Técnica & Sonido">Técnica & Sonido</option>
          <option value="Seguridad & Puerta">Seguridad & Puerta</option>
          <option value="Barra & Bebidas">Barra & Bebidas</option>
          <option value="Marketing & Prensa">Marketing & Prensa</option>
          <option value="Lugar / Locación">Lugar / Locación</option>
          <option value="Otros">Otros</option>
        </select>

        <input
          type="text"
          placeholder="Concepto / Proveedor (ej: Alquiler Sonido)"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
        />

        <input
          type="number"
          placeholder="Monto ($ ARS)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
        />

        <button
          type="submit"
          disabled={loading || !concept.trim() || !amount}
          className="py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all"
        >
          {loading ? 'Cargando...' : '+ Agregar Costo'}
        </button>
      </form>

      {/* Lista / Tabla de Gastos Detallada */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-neutral-500 border-b border-neutral-800/80">
            <tr>
              <th className="pb-2 w-8 text-center font-semibold">Pago</th>
              <th className="pb-2 font-semibold">Rubro / Categoría</th>
              <th className="pb-2 font-semibold">Concepto / Proveedor</th>
              <th className="pb-2 font-semibold text-right">Monto ($ ARS)</th>
              <th className="pb-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40">
            {costs.length > 0 ? (
              costs.map((cost) => {
                const isPaid = !!cost.is_paid;
                return (
                  <tr key={cost.id} className={`hover:bg-neutral-950/60 transition-colors ${isPaid ? 'opacity-60' : ''}`}>
                    <td className="py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={() => handleTogglePaid(cost.id, isPaid)}
                        className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-amber-400 accent-amber-400 cursor-pointer"
                        title={isPaid ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
                      />
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[11px] text-neutral-300 font-medium">
                        {cost.category}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`font-medium ${isPaid ? 'line-through text-neutral-400' : 'text-white'}`}>
                        {cost.concept}
                      </span>
                      {isPaid && (
                        <span className="ml-2 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          PAGADO
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-rose-300">
                      -${Number(cost.amount).toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="text-neutral-600 hover:text-rose-400 transition-colors px-2 py-1 text-xs"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-neutral-600 text-xs">
                  No hay costos cargados todavía para este evento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}