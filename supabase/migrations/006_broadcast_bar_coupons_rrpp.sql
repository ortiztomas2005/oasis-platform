-- Tablas reales para las últimas 4 funciones que todavía vivían solo en
-- localStorage dentro de /admin: Broadcast & Alertas, Escáner de Barra,
-- Cupones y RRPP. Corré esto en el SQL Editor de tu proyecto de Supabase
-- (Project > SQL Editor > New query) una sola vez.

-- ── Broadcast & Alertas ──────────────────────────────────────────────────
-- Avisos que una productora manda a los compradores de un evento puntual
-- (o de todos sus eventos si event_id es null). Se muestran de verdad en
-- /my-tickets para quien tenga una entrada de ese evento.
create table if not exists public.broadcast_alerts (
  id uuid primary key default gen_random_uuid(),
  producer_name text not null,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists broadcast_alerts_event_id_idx on public.broadcast_alerts(event_id);
alter table public.broadcast_alerts enable row level security;

-- ── Escáner de Barra ─────────────────────────────────────────────────────
-- Carta de bebidas por evento (reemplaza el "barMenu" embebido que tenía
-- el viejo formulario de crear evento) y el registro de ventas de barra.
create table if not exists public.bar_menu (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  stock int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists bar_menu_event_id_idx on public.bar_menu(event_id);
alter table public.bar_menu enable row level security;

create table if not exists public.bar_sales (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bar_menu_id uuid not null references public.bar_menu(id) on delete cascade,
  item_name text not null,
  unit_price numeric not null,
  quantity int not null,
  total numeric not null,
  sold_by_email text,
  created_at timestamptz not null default now()
);
create index if not exists bar_sales_event_id_idx on public.bar_sales(event_id);
alter table public.bar_sales enable row level security;

-- Descuento atómico de stock al registrar una venta de barra, mismo motivo
-- que consume_producer_ticket en 004: dos ventas simultáneas del mismo
-- trago no pueden pisarse el stock leyendo el mismo valor viejo.
create or replace function public.record_bar_sale(
  p_bar_menu_id uuid,
  p_quantity int,
  p_sold_by_email text
)
returns table (sale_id uuid, item_name text, unit_price numeric, total numeric)
language plpgsql
as $$
declare
  v_item public.bar_menu%rowtype;
  v_updated int;
  v_sale_id uuid;
begin
  if p_quantity <= 0 then
    raise exception 'La cantidad tiene que ser mayor a 0';
  end if;

  update public.bar_menu
  set stock = stock - p_quantity
  where id = p_bar_menu_id and stock >= p_quantity
  returning * into v_item;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'No hay stock suficiente para esa cantidad';
  end if;

  insert into public.bar_sales (event_id, bar_menu_id, item_name, unit_price, quantity, total, sold_by_email)
  values (v_item.event_id, v_item.id, v_item.name, v_item.price, p_quantity, v_item.price * p_quantity, p_sold_by_email)
  returning id into v_sale_id;

  return query select v_sale_id, v_item.name, v_item.price, v_item.price * p_quantity;
end;
$$;

revoke all on function public.record_bar_sale(uuid, int, text) from public, anon, authenticated;
grant execute on function public.record_bar_sale(uuid, int, text) to service_role;

-- ── Cupones & RRPP ───────────────────────────────────────────────────────
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  producer_name text not null,
  code text not null,
  discount_pct int not null check (discount_pct between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (producer_name, code)
);
alter table public.coupons enable row level security;

create table if not exists public.rrpp_members (
  id uuid primary key default gen_random_uuid(),
  producer_name text not null,
  name text not null,
  code text not null,
  commission_per_ticket numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (producer_name, code)
);
alter table public.rrpp_members enable row level security;

-- A propósito no se crean policies públicas en ninguna de estas 5 tablas:
-- todo pasa por rutas /api/producers/* con la service role key, igual que
-- el resto de las tablas de esta plataforma.
