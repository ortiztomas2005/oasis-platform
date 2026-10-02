import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { getManagedProducerName } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// Personalización del mail de confirmación de entradas: a qué email
// responde el cliente, logo, color de marca, info de ingreso/cómo llegar
// y texto de pie. Solo OWNER/ADMIN de la productora puede verla o tocarla.
export async function GET() {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('producers')
    .select('contact_email, email_logo_url, email_brand_color, email_footer_text, email_extra_info')
    .eq('name', producerName)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data || {} });
}

export async function PATCH(req: Request) {
  const producerName = await getManagedProducerName(['OWNER', 'ADMIN']);
  if (!producerName) {
    return NextResponse.json({ error: 'No sos staff de ninguna productora.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const update: Record<string, any> = {};

    if (body.contactEmail !== undefined) {
      const clean = String(body.contactEmail || '').trim();
      if (clean && !EMAIL_RE.test(clean)) {
        return NextResponse.json({ error: 'El email de contacto no parece válido.' }, { status: 400 });
      }
      update.contact_email = clean || null;
    }

    if (body.logoUrl !== undefined) {
      const clean = String(body.logoUrl || '').trim();
      if (clean && !/^https?:\/\//i.test(clean)) {
        return NextResponse.json({ error: 'El logo tiene que ser una URL (http:// o https://).' }, { status: 400 });
      }
      update.email_logo_url = clean || null;
    }

    if (body.brandColor !== undefined) {
      const clean = String(body.brandColor || '').trim();
      if (clean && !HEX_COLOR_RE.test(clean)) {
        return NextResponse.json({ error: 'El color tiene que ser un hex válido, ej: #facc15.' }, { status: 400 });
      }
      update.email_brand_color = clean || null;
    }

    if (body.footerText !== undefined) {
      const clean = String(body.footerText || '').trim();
      if (clean.length > 300) {
        return NextResponse.json({ error: 'El pie del mail no puede superar los 300 caracteres.' }, { status: 400 });
      }
      update.email_footer_text = clean || null;
    }

    if (body.extraInfo !== undefined) {
      const clean = String(body.extraInfo || '').trim();
      if (clean.length > 2000) {
        return NextResponse.json({ error: 'La información importante no puede superar los 2000 caracteres.' }, { status: 400 });
      }
      update.email_extra_info = clean || null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('producers')
      .update(update)
      .eq('name', producerName)
      .select('contact_email, email_logo_url, email_brand_color, email_footer_text, email_extra_info')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, settings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
