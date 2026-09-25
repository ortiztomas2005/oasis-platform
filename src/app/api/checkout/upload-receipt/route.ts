import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { checkRateLimit, getClientIp } from '@/core/security/rate-limit';

export const dynamic = 'force-dynamic';

// Antes esto no chequeaba tipo ni tamaño, y usaba la extensión del nombre
// de archivo tal cual la mandaba el cliente — se podía subir cualquier
// cosa (no solo comprobantes) a un bucket público, sin límite de tamaño ni
// de intentos.
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`upload-receipt:${ip}`, { limit: 10, windowSeconds: 600 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const fileExt = ALLOWED_TYPES[file.type];
    if (!fileExt) {
      return NextResponse.json({ error: 'Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo no puede pesar más de 8MB.' }, { status: 400 });
    }

    const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo al bucket 'receipts' en Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // Si el bucket no existe en supabase, crearlo al vuelo o devolver error descriptivo
      throw uploadError;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
