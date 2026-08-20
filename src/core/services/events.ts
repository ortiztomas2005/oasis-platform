import { createClient } from '@/core/supabase/server';
import { Event, TicketType } from '@/types/database';

export interface EventWithTicketTypes extends Event {
  ticket_types: TicketType[];
}

/**
 * Obtiene todos los eventos publicados de una organización por su slug
 */
export async function getPublishedEventsByOrg(orgSlug: string): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*, organizations!inner(slug)')
    .eq('organizations.slug', orgSlug)
    .eq('status', 'PUBLISHED')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching org events:', error);
    return [];
  }

  return (data as unknown as Event[]) || [];
}

/**
 * Obtiene el detalle de un evento por su slug junto con sus tipos de tickets disponibles
 */
export async function getEventBySlug(orgSlug: string, eventSlug: string): Promise<EventWithTicketTypes | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizations!inner(slug),
      ticket_types(*)
    `)
    .eq('organizations.slug', orgSlug)
    .eq('slug', eventSlug)
    .single();

  if (error || !data) {
    console.error('Error fetching event detail:', error);
    return null;
  }

  return data as unknown as EventWithTicketTypes;
}