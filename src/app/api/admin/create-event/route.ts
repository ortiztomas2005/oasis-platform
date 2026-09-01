import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, title, date, venue, location, imageUrl, image_url } = body;

    const eventName = (name || title || '').trim();
    if (!eventName) {
      return NextResponse.json({ error: 'El nombre del evento es obligatorio' }, { status: 400 });
    }

    // Generar slug limpio único
    const baseSlug = eventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const eventDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const eventVenue = venue || location || 'Buenos Aires';
    const eventImg =
      imageUrl ||
      image_url ||
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop';

    // 1. Insertar Evento en Supabase
    const { data: newEvent, error: evError } = await supabaseAdmin
      .from('events')
      .insert({
        name: eventName,
        title: eventName,
        slug: uniqueSlug,
        date: eventDate,
        venue: eventVenue,
        image_url: eventImg,
      })
      .select()
      .single();

    if (evError) {
      // Reintento con estructura alternativa por si la tabla usa columnas mínimas
      const { data: fallbackEvent, error: fbError } = await supabaseAdmin
        .from('events')
        .insert({
          title: eventName,
          slug: uniqueSlug,
          date: eventDate,
        })
        .select()
        .single();

      if (fbError) throw fbError;

      // Crear tanda inicial
      if (fallbackEvent?.id) {
        await supabaseAdmin.from('ticket_tiers').insert([
          { event_id: fallbackEvent.id, name: 'General T1', price: 15000, total_capacity: 200, status: 'ACTIVE' }
        ]);
      }

      return NextResponse.json({ success: true, event: fallbackEvent });
    }

    // 2. Crear automáticamente una primera tanda de prueba habilitada
    if (newEvent?.id) {
      await supabaseAdmin.from('ticket_tiers').insert([
        { event_id: newEvent.id, name: 'General T1', price: 15000, total_capacity: 200, status: 'ACTIVE' }
      ]);
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    console.error('Error create-event:', error);
    return NextResponse.json({ error: error.message || 'Error al crear evento' }, { status: 500 });
  }
}
