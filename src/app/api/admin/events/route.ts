import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      venueName,
      venueAddress,
      startTime,
      endTime,
      maxCapacity,
      coverImageUrl,
      ticketTiers, // Array de { name, price, quota, description }
    } = body;

    if (!title || !venueName || !venueAddress || !startTime || !maxCapacity) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Obtener Organización base
    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : '00000000-0000-0000-0000-000000000001';

    // 2. Generar slug único
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // 3. Insertar Evento
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        organization_id: organizationId,
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        status: 'PUBLISHED',
        cover_image_url: coverImageUrl || null,
        max_capacity: parseInt(maxCapacity, 10),
      })
      .select()
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // 4. Insertar Tandas / Tickets
    if (ticketTiers && Array.isArray(ticketTiers) && ticketTiers.length > 0) {
      const now = new Date().toISOString();
      const saleEnd = endTime ? new Date(endTime).toISOString() : new Date(new Date(startTime).getTime() + 86400000).toISOString();

      const tiersPayload = ticketTiers.map((tier: any) => ({
        organization_id: organizationId,
        event_id: event.id,
        name: tier.name.trim(),
        description: tier.description?.trim() || null,
        price: Number(tier.price || 0),
        service_fee: 0,
        total_quota: parseInt(tier.quota, 10) || 100,
        available_quota: parseInt(tier.quota, 10) || 100,
        max_per_order: 6,
        sale_start_time: now,
        sale_end_time: saleEnd,
        is_visible: true,
        is_guestlist: false,
        version: 1,
      }));

      const { error: tiersError } = await supabaseAdmin.from('ticket_types').insert(tiersPayload);

      if (tiersError) {
        return NextResponse.json({ error: 'Evento creado pero fallaron las tandas: ' + tiersError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}