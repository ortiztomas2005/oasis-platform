import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

interface TicketTierInput {
  name: string;
  price: number;
  serviceFee: number;
  totalQuota: number;
  maxPerOrder: number;
  description?: string;
}

interface CreateEventBody {
  title: string;
  slug: string;
  description: string;
  venueName: string;
  venueAddress: string;
  startTime: string;
  endTime?: string;
  ticketTypes: TicketTierInput[];
}

export async function POST(req: Request) {
  try {
    const body: CreateEventBody = await req.json();
    const { title, slug, description, venueName, venueAddress, startTime, endTime, ticketTypes } = body;

    if (!title || !slug || !venueName || !startTime || !ticketTypes || ticketTypes.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para crear el evento' },
        { status: 400 }
      );
    }

    const totalCapacity = ticketTypes.reduce((acc, tier) => acc + (Number(tier.totalQuota) || 0), 0);
    const startIso = new Date(startTime).toISOString();
    const calculatedEndTime = endTime
      ? new Date(endTime).toISOString()
      : new Date(new Date(startTime).getTime() + 6 * 60 * 60 * 1000).toISOString();

    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : '00000000-0000-0000-0000-000000000001';
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // 1. Insertamos o recuperamos el evento
    let eventId: string;
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        organization_id: organizationId,
        title,
        slug: normalizedSlug,
        description,
        venue_name: venueName,
        venue_address: venueAddress,
        start_time: startIso,
        end_time: calculatedEndTime,
        max_capacity: totalCapacity,
        status: 'PUBLISHED',
      })
      .select()
      .single();

    if (eventError) {
      const { data: existingEvent } = await supabaseAdmin
        .from('events')
        .select('id, slug')
        .eq('slug', normalizedSlug)
        .single();

      if (!existingEvent) {
        return NextResponse.json(
          { error: `Error al crear el evento: ${eventError.message}` },
          { status: 500 }
        );
      }
      eventId = existingEvent.id;
    } else {
      eventId = event.id;
    }

    // 2. Insertamos las tandas con sale_start_time y sale_end_time
    const nowIso = new Date().toISOString();
    const tiersToInsert = ticketTypes.map((tier) => ({
      organization_id: organizationId,
      event_id: eventId,
      name: tier.name,
      price: tier.price,
      service_fee: tier.serviceFee || 0,
      total_quota: tier.totalQuota,
      available_quota: tier.totalQuota,
      max_per_order: tier.maxPerOrder || 6,
      description: tier.description || null,
      sale_start_time: nowIso,
      sale_end_time: calculatedEndTime,
    }));

    const { error: tiersError } = await supabaseAdmin
      .from('ticket_types')
      .insert(tiersToInsert);

    if (tiersError) {
      return NextResponse.json(
        { error: `Error al crear las tandas de tickets: ${tiersError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventId,
      slug: normalizedSlug,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}