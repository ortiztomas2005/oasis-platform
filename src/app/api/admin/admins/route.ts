import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';
import { requireAdminSession, requireSuperAdmin } from '@/core/auth/admin-session';

export const dynamic = 'force-dynamic';

// GET: cualquier admin puede ver la lista de administradores.
export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('user_id, email, role, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    // La tabla todavía no existe si no corriste la migración.
    return NextResponse.json({ admins: [], error: error.message });
  }

  return NextResponse.json({ admins: data || [] });
}

// POST: solo un SUPERADMIN puede dar de alta a otro admin. La cuenta tiene
// que haberse registrado antes por /auth (no se crean cuentas acá, solo se
// les otorga acceso a /admin).
export async function POST(req: Request) {
  const unauthorized = await requireSuperAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { email, role } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Falta el email' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const targetRole = role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';

    // La API de Supabase no tiene un "buscar por email" directo: se pagina
    // sobre auth.users. Alcanza de sobra para una lista de administradores
    // (no es una búsqueda sobre la base de clientes).
    let foundUserId: string | null = null;
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const match = data.users.find((u) => (u.email || '').toLowerCase() === cleanEmail);
      if (match) {
        foundUserId = match.id;
        break;
      }
      if (data.users.length < 200) break; // no hay más páginas
    }

    if (!foundUserId) {
      return NextResponse.json(
        { error: 'No existe ninguna cuenta con ese email. Tiene que registrarse primero en /auth.' },
        { status: 404 }
      );
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('admin_users')
      .upsert({ user_id: foundUserId, email: cleanEmail, role: targetRole }, { onConflict: 'user_id' });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: solo SUPERADMIN, y no se puede sacar al último SUPERADMIN (evita
// quedarse sin nadie que pueda gestionar admins).
export async function DELETE(req: Request) {
  const unauthorized = await requireSuperAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });
  }

  const { data: target } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (target?.role === 'SUPERADMIN') {
    const { count } = await supabaseAdmin
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'SUPERADMIN');

    if ((count || 0) <= 1) {
      return NextResponse.json({ error: 'No podés eliminar al último SUPERADMIN.' }, { status: 400 });
    }
  }

  const { error } = await supabaseAdmin.from('admin_users').delete().eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
