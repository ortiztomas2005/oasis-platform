'use client';

import { useState, useMemo } from 'react';

interface AttendeeTicket {
  id: string;
  ticket_code: string;
  attendee_first_name: string;
  attendee_last_name: string;
  attendee_dni: string;
  status: string;
  is_courtesy?: boolean;
  used_at?: string | null;
  created_at: string;
  ticket_types?: { name: string; price: number } | { name: string; price: number }[];
}

interface AttendeeListProps {
  eventId: string;
  tickets: AttendeeTicket[];
}

export function AttendeeList({ eventId, tickets }: AttendeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'USED'>('ALL');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        `${t.attendee_first_name} ${t.attendee_last_name} ${t.attendee_dni} ${t.ticket_code}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Controles de Búsqueda y Exportación */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Buscar por DNI, Nombre, Apellido o Código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Todos ({tickets.length})</option>
            <option value="ISSUED">Sin Ingresar ({tickets.filter((t) => t.status === 'ISSUED').length})</option>
            <option value="USED">Adentro ({tickets.filter((t) => t.status === 'USED').length})</option>
          </select>
        </div>

        <a
          href={`/api/admin/export?event_id=${eventId}`}
          download
          className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>📥 Exportar Excel (CSV)</span>
        </a>
      </div>

      {/* Tabla de Asistentes */}
      <div className="overflow-x-auto">
        <table className="w-frull w-full text-left text-xs">
          <thead className="text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="pb-3 font-semibold">Asistente</th>
              <th className="pb-3 font-semibold">DNI</th>
              <th className="pb-3 font-semibold">Tanda</th>
              <th className="pb-3 font-semibold">Código Pase</th>
              <th className="pb-3 font-semibold">Tipo</th>
              <th className="pb-3 font-semibold text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40 font-mono">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const type = Array.isArray(ticket.ticket_types)
                  ? ticket.ticket_types[0]
                  : ticket.ticket_types;

                return (
                  <tr key={ticket.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="py-3 font-sans">
                      <p className="text-white font-semibold">
                        {ticket.attendee_last_name}, {ticket.attendee_first_name}
                      </p>
                    </td>
                    <td className="py-3 text-neutral-200">{ticket.attendee_dni}</td>
                    <td className="py-3 font-sans text-neutral-300">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[11px] font-semibold text-amber-400/90">
                        {type?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-400 font-bold">{ticket.ticket_code}</td>
                    <td className="py-3 font-sans">
                      {ticket.is_courtesy ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                          CORTESÍA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400">
                          VENTA
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ticket.status === 'USED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {ticket.status === 'USED' ? 'INGRESÓ' : 'VÁLIDO'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500 font-sans text-xs">
                  No se encontraron asistentes con el criterio de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}