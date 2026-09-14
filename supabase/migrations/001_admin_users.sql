-- Separación real entre cuentas de cliente/productora y administradores de
-- la plataforma OASIS. Corré esto en el SQL Editor de tu proyecto de
-- Supabase (Project > SQL Editor > New query) una sola vez.
--
-- team_members ya existe y dice "quién trabaja para qué productora"
-- (OWNER/ADMIN/DOOR/BAR de UNA productora puntual). admin_users es otra
-- cosa: quién puede entrar al panel /admin como staff de OASIS, sin
-- importar si tiene o no una productora.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'ADMIN' check (role in ('SUPERADMIN', 'ADMIN')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A propósito no se crea ninguna policy pública: todas las lecturas y
-- escrituras pasan por rutas server-side (/api/admin/*) que usan la
-- service role key, que bypasea RLS. Nadie puede leer ni escribir esta
-- tabla directo desde el navegador con la anon key.

-- ── Paso 2: sembrá el primer SUPERADMIN ─────────────────────────────────
-- 1) Registrate normalmente en /auth con tu email real.
-- 2) Corré esto (reemplazando el email) para volverte SUPERADMIN:
--
-- insert into public.admin_users (user_id, email, role)
-- select id, email, 'SUPERADMIN'
-- from auth.users
-- where email = 'tu@email.com'
-- on conflict (user_id) do update set role = 'SUPERADMIN';
--
-- Desde ahí podés sumar más admins vos mismo desde /admin/admins (o
-- pegándole a POST /api/admin/admins) sin volver a tocar SQL.
