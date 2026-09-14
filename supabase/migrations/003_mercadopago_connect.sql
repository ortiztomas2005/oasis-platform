-- Soporte para que cada productora conecte su propia cuenta de Mercado
-- Pago (OAuth / "Mercado Pago Connect"), en vez de usar un solo
-- MP_ACCESS_TOKEN de toda la plataforma. El dinero de cada venta entra
-- directo a la cuenta de la productora dueña del evento.

alter table public.producers
  add column if not exists mp_access_token text,
  add column if not exists mp_refresh_token text,
  add column if not exists mp_user_id text,
  add column if not exists mp_public_key text,
  add column if not exists mp_token_expires_at timestamptz,
  add column if not exists mp_connected_at timestamptz;

-- "events" no tenía ninguna columna que dijera de qué productora es cada
-- evento (organization_id existe pero no se usa de forma consistente en
-- el resto del código). Se agrega esta para poder resolver, al armar un
-- cobro, con la cuenta de Mercado Pago de qué productora hay que crearlo.
alter table public.events
  add column if not exists producer_name text references public.producers(name);

-- Igual que admin_users: sin policies públicas. Los tokens de Mercado Pago
-- son secretos — solo se leen/escriben desde rutas server-side con la
-- service role key.
