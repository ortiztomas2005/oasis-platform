-- Activa Row Level Security en las tablas "legacy" (anteriores a los
-- migrations versionados: no tienen un CREATE TABLE acá porque ya existían
-- en la base antes de este sistema de migraciones). Corré esto en el SQL
-- Editor de tu proyecto de Supabase (Project > SQL Editor > New query) una
-- sola vez.
--
-- Se confirmó en vivo, con la clave anon real contra la base real, que
-- 'events', 'tickets', 'ticket_tiers' y 'orders' eran legibles por
-- cualquiera sin pasar por la app: 'tickets' en particular exponía nombre,
-- DNI, email y el QR real de entrada (qr_hash/auth_code) de cada comprador.
--
-- A propósito NO se crea ninguna policy pública en ninguna de estas tablas:
-- todo el código de la app ya lee y escribe estas tablas exclusivamente
-- server-side con supabaseAdmin (service role, que bypasea RLS) — se
-- verificó que no queda ningún componente cliente consultando Supabase
-- directo con la clave anon (el último caso, la home page, se migró a
-- /api/admin/events-data). "RLS activado sin policies" == nadie puede leer
-- ni escribir estas tablas desde el navegador con la clave anon, igual que
-- ya pasa con admin_users, team_members y las tablas de la migration 006.

alter table public.events enable row level security;
alter table public.tickets enable row level security;
alter table public.orders enable row level security;
alter table public.ticket_tiers enable row level security;

-- Estas ya deberían estar activadas por migrations anteriores, pero se
-- reafirman acá por las dudas / para que este archivo sirva como
-- referencia completa de qué tablas tienen RLS activo en la base.
alter table public.producers enable row level security;
alter table public.team_members enable row level security;
alter table public.admin_users enable row level security;
alter table public.ticket_resales enable row level security;
