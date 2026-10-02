import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { canManageEvent } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Editar datos básicos o cambiar el estado (publicar/despublicar) de un
// evento propio.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params;
    const eventId = params.id;

    const access = await canManageEvent(eventId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const update: Record<string, any> = {};

    if (body.title !== undefined) {
      update.title = body.title;
      update.name = body.title;
    }
    if (body.description !== undefined) update.description = body.description;
    if (body.venue !== undefined) {
      update.venue = body.venue;
      update.venue_name = body.venue;
    }
    if (body.address !== undefined) update.address = body.address;
    if (body.city !== undefined) update.city = body.city;
    if (body.date !== undefined) {
      const parsedDate = new Date(body.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'La fecha del evento no es válida. Revisala e intentá de nuevo.' }, { status: 400 });
      }
      const iso = parsedDate.toISOString();
      update.date = iso;
      update.start_date = iso;
    }
    if (body.doorTime !== undefined) update.door_time = body.doorTime;
    if (body.imageUrl !== undefined) {
      update.image_url = body.imageUrl;
      update.cover_image_url = body.imageUrl;
    }
    if (body.capacity !== undefined) {
      update.capacity = Number(body.capacity) || 0;
      update.max_capacity = Number(body.capacity) || 0;
    }
    if (body.bankAlias !== undefined) {
      update.bank_alias = body.bankAlias;
      update.cbu_alias = body.bankAlias;
    }
    if (body.bankCbu !== undefined) update.bank_cbu = body.bankCbu;
    if (body.bankHolderName !== undefined) update.bank_holder_name = body.bankHolderName;
    if (body.status !== undefined && ['DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELLED'].includes(body.status)) {
      update.status = body.status;
    }

    // Clasificación de edad: si este pedido la cambia, "nextIsAdultsOnly"
    // guarda el valor nuevo para usarlo más abajo al validar la barra sin
    // tener que volver a leer la base.
    let nextIsAdultsOnly: boolean | undefined;
    if (body.isAdultsOnly !== undefined) {
      if (typeof body.isAdultsOnly !== 'boolean') {
        return NextResponse.json({ error: 'Valor inválido para "mayores de 18".' }, { status: 400 });
      }
      nextIsAdultsOnly = body.isAdultsOnly;
      update.is_adults_only = body.isAdultsOnly;

      if (!body.isAdultsOnly) {
        const parsedMinAge = Number(body.minAge);
        if (body.minAge === undefined || body.minAge === null || body.minAge === '' || !Number.isFinite(parsedMinAge) || parsedMinAge < 0 || parsedMinAge > 17) {
          return NextResponse.json({ error: 'Indicá la edad mínima permitida (0 a 17) para un evento que no es solo para mayores.' }, { status: 400 });
        }
        update.min_age = Math.round(parsedMinAge);
      } else {
        update.min_age = null;
      }
    }

    // La barra sirve alcohol — nunca puede quedar habilitada en un evento
    // que no sea exclusivo para mayores de 18.
    if (body.hasBar !== undefined) {
      if (body.hasBar) {
        const allowsBar =
          nextIsAdultsOnly !== undefined
            ? nextIsAdultsOnly
            : (await supabaseAdmin.from('events').select('is_adults_only').eq('id', eventId).maybeSingle()).data
                ?.is_adults_only;

        if (!allowsBar) {
          return NextResponse.json(
            { error: 'Evento para menores de edad: la barra no se puede habilitar.' },
            { status: 400 }
          );
        }
        update.has_bar = true;
      } else {
        update.has_bar = false;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('events').update(update).eq('id', eventId).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
