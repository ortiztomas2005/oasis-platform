'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CostItem {
  id: string;
  category: string;
  concept: string;
  amount: number;
}

interface CostManagerProps {
  eventId: string;
  initialCosts: CostItem[];
}

export function CostManager({ eventId, initialCosts }: CostManagerProps) {
  const router = useRouter();
  const [costs, setCosts] = useState<CostItem[]>(initialCosts);
  const [category, setCategory] = useState('');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !concept.trim() || !amount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          category: category.trim(),
          concept: concept.trim(),
          amount: Number(amount),
        }),
      });

      const data = await res.json();
      if (res.ok && data.cost) {
        setCosts((prev) => [data.cost, ...prev]);
        setCategory('');
        setConcept('');
        setAmount('');
        router.refresh();
      } else {
        alert(data.error || 'Error al guardar el costo');
      }
    } catch {
      alert('Error de red al guardar el costo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/costs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCosts((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch {
      alert('Error al eliminar costo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Carga */}
      <form onSubmit={handleAddCost} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
            Rubro / Categoría
          </label>
          <input
            type="text"
            required
            placeholder="Ej: DJ, Técnica, Seguridad..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
            Concepto / Proveedor
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Alquiler de sonido y pantallas LED"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase font-semibold text-neutral-400 mb-1">
            Monto ($ ARS)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              required
              placeholder="Ej: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs whitespace-nowrap transition-colors"
            >
              + Cargar
            </button>
          </div>
        </div>
      </form>

      {/* Lista de Costos Cargados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="pb-2 font-semibold">Rubro</th>
              <th className="pb-2 font-semibold">Concepto</th>
              <th className="pb-2 font-semibold">Monto</th>
              <th className="pb-2 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40 font-mono">
            {costs.length > 0 ? (
              costs.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-900/60 transition-colors">
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-sans font-semibold">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-neutral-200 font-sans">{c.concept}</td>
                  <td className="py-2.5 text-red-400 font-bold">
                    -${Number(c.amount).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2.5 text-right font-sans">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-neutral-500 hover:text-red-400 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-neutral-500 font-sans text-xs">
                  No hay costos cargados para este evento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}