import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/core/supabase/server';
import { createProducerForUser } from '@/core/services/producers';

export const dynamic = 'force-dynamic';

// Convierte a un usuario recién registrado (ya autenticado con Supabase
// Auth) en dueño de una productora nueva, con su saldo prepago inicial.
// Requiere sesión real — antes esto se hacía escribiendo directo en
// localStorage sin que el servidor supiera que existía.
//
// Si el proyecto de Supabase exige confirmar el email, este endpoint NO se
// llega a llamar en el momento del registro (todavía no hay sesión) — la
// productora se termina de crear en /auth/callback cuando la persona
// confirma y vuelve, usando la misma createProducerForUser.
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Tenés que iniciar sesión primero.' }, { status: 401 });
    }

    const { producerName, producerType, dni, phone } = await req.json();
    const result = await createProducerForUser(
      { email: user.email, user_metadata: user.user_metadata },
      { producerName, producerType, dni, phone }
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, producerName: String(producerName).trim().toUpperCase() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al registrar la productora' }, { status: 500 });
  }
}
