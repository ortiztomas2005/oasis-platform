import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { title, date, venue, capacity, cbuAlias, description, imageUrl } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'El nombre del evento es obligatorio' }, { status: 400 });
    }

    // 1. Obtener primera organización si existe
    let orgId = null;
    try {
      const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1);
      if (orgs && orgs.length > 0) {
        orgId = orgs[0].id;
      }
    } catch {
      // Ignorar si no existe la tabla
    }

    // 2. Generar slug único
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const eventDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const eventVenue = venue || 'Ubicación Central OASIS';

    // 3. Payload limpio y compatible
    const eventPayload: Record<string, any> = {
      title,
      name: title,
      slug,
      date: eventDate,
      start_date: eventDate,
      venue: eventVenue,
      venue_name: eventVenue,
      capacity: parseInt(capacity) || 1000,
      description: description || 'Evento Oficial producido por OASIS Platform.',
      cbu_alias: cbuAlias || 'OASIS.OFICIAL',
      image_url: imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
      status: 'ACTIVE',
    };

    if (orgId) {
      eventPayload.organization_id = orgId;
    }

    const { data: newEvent, error } = await supabaseAdmin
      .from('events')
      .insert([eventPayload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, event: newEvent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}