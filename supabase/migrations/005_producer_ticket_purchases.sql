-- Compras de paquetes de tickets prepago (la productora le paga a OASIS
-- para sumar saldo a producers.prepaid_balance) — separado de "orders",
-- que es la venta de una entrada puntual a un cliente final para un
-- evento. Acá no hay evento ni cliente, es productora -> OASIS.

create table if not exists public.producer_ticket_purchases (
  id uuid primary key default gen_random_uuid(),
  producer_name text not null references public.producers(name),
  pack_id text not null,
  quantity integer not null,
  amount numeric not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reference_code text not null unique,
  receipt_url text,
  requested_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.producer_ticket_purchases enable row level security;
-- Sin policies públicas: solo se lee/escribe server-side con la service
-- role key, igual que el resto de las tablas nuevas de esta migración.

-- Acreditar N tickets al saldo prepago de una productora (al aprobar una
-- compra). No necesita el guard de consume_producer_ticket porque solo
-- suma, nunca puede dejar el saldo negativo.
create or replace function public.add_producer_tickets(p_producer_name text, p_quantity integer)
returns void
language plpgsql
as $$
begin
  update public.producers
  set prepaid_balance = prepaid_balance + p_quantity
  where name = p_producer_name;
end;
$$;

revoke all on function public.add_producer_tickets(text, integer) from public, anon, authenticated;
grant execute on function public.add_producer_tickets(text, integer) to service_role;
