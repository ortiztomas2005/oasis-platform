-- Configuración de stock por tanda: que la productora pueda elegir si se le
-- avisa al público cuánto stock queda, a partir de qué cantidad avisar
-- ("quedan 10"), y marcar una tanda como agotada a mano. Corré esto en el
-- SQL Editor de tu proyecto de Supabase (Project > SQL Editor > New query).

alter table public.ticket_tiers
  add column if not exists show_stock_to_clients boolean not null default true,
  add column if not exists low_stock_threshold int not null default 10;

-- Descuento atómico de 1 lugar en la tanda al emitir un ticket real (antes
-- available_capacity nunca se tocaba después de crear el evento, así que
-- "agotado" no reflejaba ventas reales — cualquier tanda parecía tener
-- stock infinito). Mismo patrón que consume_producer_ticket en 004.
create or replace function public.decrement_tier_capacity(p_tier_id uuid)
returns boolean
language plpgsql
as $$
declare
  v_updated int;
begin
  update public.ticket_tiers
  set available_capacity = available_capacity - 1
  where id = p_tier_id and available_capacity > 0;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Contraparte para devolver el lugar si, después de descontarlo, la
-- emisión del ticket termina fallando por otro motivo (rollback).
create or replace function public.increment_tier_capacity(p_tier_id uuid)
returns void
language plpgsql
as $$
begin
  update public.ticket_tiers
  set available_capacity = available_capacity + 1
  where id = p_tier_id;
end;
$$;

revoke all on function public.decrement_tier_capacity(uuid) from public, anon, authenticated;
revoke all on function public.increment_tier_capacity(uuid) from public, anon, authenticated;
grant execute on function public.decrement_tier_capacity(uuid) to service_role;
grant execute on function public.increment_tier_capacity(uuid) to service_role;
