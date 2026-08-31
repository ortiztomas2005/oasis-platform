import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// EDITAR EVENTO (PUT)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const eventId = resolvedParams?.id;

    if (!eventId || eventId === 'undefined') {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { name, date, venue, imageUrl } = body;

    const eventDate = date ? new Date(date).toISOString() : undefined;

    const updatePayload: Record<string, any> = {};
    if (name !== undefined) {
      updatePayload.name = name;
      updatePayload.title = name;
    }
    if (eventDate !== undefined) updatePayload.date = eventDate;
    if (venue !== undefined) updatePayload.venue = venue;
    if (imageUrl !== undefined) updatePayload.image_url = imageUrl;

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, event: data });
  } catch (error: any) {
    console.error('Error PUT event:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar evento' }, { status: 500 });
  }
}

// ELIMINAR EVENTO (DELETE)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const eventId = resolvedParams?.id;

    if (!eventId || eventId === 'undefined') {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    // 1. Limpieza de tablas hijas relacionadas
    try {
      await supabaseAdmin.from('resale_listings').delete().eq('event_id', eventId);
    } catch (_) {}

    try {
      await supabaseAdmin.from('tickets').delete().eq('event_id', eventId);
    } catch (_) {}

    try {
      await supabaseAdmin.from('ticket_tiers').delete().eq('event_id', eventId);
    } catch (_) {}

    // 2. Eliminar evento principal
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE event:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar evento' }, { status: 500 });
  }
}