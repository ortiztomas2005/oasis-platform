import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createProducerForUser, getOwnedProducerName } from '@/core/services/producers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/my-tickets';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Manejo seguro en Server Components
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Si el signup original era de una productora y el proyecto exige
      // confirmar el email primero, en ese momento no había sesión todavía
      // y no se pudo crear la productora (ver /api/auth/register-producer).
      // Se completa recién acá, ahora que la cuenta ya está confirmada y
      // logueada de verdad. Queda en user_metadata.pending_producer y se
      // limpia apenas se usa, para no reintentarlo en cada login.
      const pending = data.user.user_metadata?.pending_producer as
        | { producerName: string; producerType?: string; dni?: string; phone?: string }
        | undefined;

      if (pending?.producerName && data.user.email) {
        const alreadyHasProducer = await getOwnedProducerName();
        if (!alreadyHasProducer) {
          await createProducerForUser(
            { email: data.user.email, user_metadata: data.user.user_metadata },
            pending
          );
        }
        await supabase.auth.updateUser({ data: { pending_producer: null } });
        return NextResponse.redirect(`${origin}/admin`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/my-tickets?error=auth_failed`);
}
