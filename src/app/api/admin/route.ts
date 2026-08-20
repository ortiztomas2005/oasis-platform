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

    // 1. Obtenemos la organización por defecto
    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : '00000000-0000-0000-0000-000000000001';

    // 2. Insertamos el evento en Supabase
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        organization_id: organizationId,
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description,
        venue_name: venueName,
        venue_address: venueAddress,
        start_time: startTime,
        end_time: endTime || null,
        status: 'PUBLISHED',
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        { error: `Error al crear el evento: ${eventError.message}` },
        { status: 500 }
      );
    }

    // 3. Insertamos las tandas de entradas asociadas
    const tiersToInsert = ticketTypes.map((tier) => ({
      organization_id: organizationId,
      event_id: event.id,
      name: tier.name,
      price: tier.price,
      service_fee: tier.serviceFee || 0,
      total_quota: tier.totalQuota,
      available_quota: tier.totalQuota,
      max_per_order: tier.maxPerOrder || 6,
      description: tier.description || null,
      status: 'ACTIVE',
    }));

    const { error: tiersError } = await supabaseAdmin
      .from('ticket_types')
      .insert(tiersToInsert);

    if (tiersError) {
      console.error('Error creating ticket types:', tiersError);
      return NextResponse.json(
        { error: `Evento creado, pero hubo un error con los tickets: ${tiersError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      slug: event.slug,
    });
  } catch (error: any) {
    console.error('Admin create event error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}