import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

interface TierInput {
  name: string;
  price: number;
  capacity: number;
  showStockToClients: boolean;
  lowStockThreshold: number;
  description: string;
  entryCutoffTime: string;
}

// Lista los eventos reales de la productora del usuario logueado (no
// localStorage, no un listado global de Live Experience). Cualquier rol del equipo
// puede leerla (DOOR/BAR la necesitan para saber qué evento escanear),
// pero crear/editar sigue restringido a OWNER/ADMIN.
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN', 'DOOR', 'BAR']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('*, ticket_tiers(*)')
    .eq('producer_name', producerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: events || [], producerName });
}

// Crea un evento de verdad en Supabase (antes esto solo pasaba en
// localStorage dentro de /admin) con sus tandas, ya asignado a la
// productora del usuario logueado.
export async function POST(req: Request) {
  const producerName = await getManagedProducerName();
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      venue,
      address,
      city,
      date,
      doorTime,
      imageUrl,
      capacity,
      bankAlias,
      bankCbu,
      bankHolderName,
      tiers,
      publish,
      hasBar,
      barItems,
    } = body;

    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) return NextResponse.json({ error: 'Falta el nombre del evento' }, { status: 400 });
    if (!date) return NextResponse.json({ error: 'Falta la fecha del evento' }, { status: 400 });

    // Antes esto reventaba con "Invalid time value" (el mensaje crudo de
    // toISOString() en una fecha inválida) si el input datetime-local traía
    // algo que Date no puede parsear, como un año mal tipeado (ej: 222222).
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'La fecha del evento no es válida. Revisala e intentá de nuevo.' }, { status: 400 });
    }
    const minYear = new Date().getFullYear() - 1;
    const maxYear = new Date().getFullYear() + 10;
    if (parsedDate.getFullYear() < minYear || parsedDate.getFullYear() > maxYear) {
      return NextResponse.json({ error: `El año de la fecha parece un error de tipeo (${parsedDate.getFullYear()}). Revisalo.` }, { status: 400 });
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json({ error: 'Agregá al menos una tanda de entradas' }, { status: 400 });
    }

    const cleanTiers: TierInput[] = tiers.map((t: any) => ({
      name: String(t.name || '').trim() || 'General',
      price: Math.max(0, Number(t.price) || 0),
      capacity: Math.max(1, Number(t.capacity) || 100),
      showStockToClients: t.showStockToClients !== false,
      lowStockThreshold: Math.max(0, Number(t.lowStockThreshold) || 10),
      description: String(t.description || '').trim(),
      entryCutoffTime: String(t.entryCutoffTime || '').trim(),
    }));

    // El checkout busca la tanda por nombre (no por id) dentro de un mismo
    // evento, así que dos tandas con el mismo nombre quedan ambiguas y
    // el pago termina fallando con "la tanda no existe" aunque sí exista.
    const seenNames = new Set<string>();
    for (const t of cleanTiers) {
      const key = t.name.toLowerCase();
      if (seenNames.has(key)) {
        return NextResponse.json({ error: `Hay dos tandas con el mismo nombre ("${t.name}"). Cada tanda necesita un nombre distinto.` }, { status: 400 });
      }
      seenNames.add(key);
    }

    const baseSlug = cleanTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const eventDate = parsedDate.toISOString();
    const status = publish === false ? 'DRAFT' : 'PUBLISHED';
    const eventImage =
      imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop';

    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .insert({
        name: cleanTitle,
        title: cleanTitle,
        slug,
        description: description || null,
        venue: venue || null,
        venue_name: venue || null,
        address: address || null,
        city: city || null,
        date: eventDate,
        start_date: eventDate,
        door_time: doorTime || null,
        image_url: eventImage,
        cover_image_url: eventImage,
        capacity: Number(capacity) || 500,
        max_capacity: Number(capacity) || 500,
        bank_alias: bankAlias || null,
        bank_cbu: bankCbu || null,
        bank_holder_name: bankHolderName || null,
        cbu_alias: bankAlias || null,
        status,
        producer_name: producerName,
        has_bar: !!hasBar,
      })
      .select()
      .single();

    if (eventErr) return NextResponse.json({ error: eventErr.message }, { status: 500 });

    const tierRows = cleanTiers.map((t) => ({
      event_id: event.id,
      name: t.name,
      price: t.price,
      total_capacity: t.capacity,
      available_capacity: t.capacity,
      capacity: t.capacity,
      status: 'ACTIVE',
      show_stock_to_clients: t.showStockToClients,
      low_stock_threshold: t.lowStockThreshold,
      description: t.description || null,
      entry_cutoff_time: t.entryCutoffTime || null,
    }));

    const { error: tiersErr } = await supabaseAdmin.from('ticket_tiers').insert(tierRows);

    if (tiersErr) {
      // No dejamos un evento sin tandas colgado a medias
      await supabaseAdmin.from('events').delete().eq('id', event.id);
      return NextResponse.json({ error: `Error al crear las tandas: ${tiersErr.message}` }, { status: 500 });
    }

    // Carta de barra inicial, solo si la productora activó "barra en vivo"
    // para este evento (ver migración 009). Se puede seguir editando
    // después desde Escáner de Barra.
    if (hasBar && Array.isArray(barItems) && barItems.length > 0) {
      const barRows = barItems
        .filter((b: any) => String(b?.name || '').trim())
        .map((b: any) => ({
          event_id: event.id,
          name: String(b.name).trim(),
          price: Number(b.price) || 0,
          stock: Number(b.stock) || 0,
        }));

      if (barRows.length > 0) {
        const { error: barErr } = await supabaseAdmin.from('bar_menu').insert(barRows);
        if (barErr) console.error('Error al crear la carta de barra inicial:', barErr);
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
