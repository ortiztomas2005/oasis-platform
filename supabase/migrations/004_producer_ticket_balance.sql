-- Descuento atómico del saldo prepago de tickets de una productora. Se usa
-- una función de Postgres (no un SELECT + UPDATE desde la app) para que
-- dos ventas simultáneas no puedan leer el mismo saldo y descontar mal —
-- el UPDATE con la condición prepaid_balance > 0 en el WHERE es atómico.

create or replace function public.consume_producer_ticket(p_producer_name text)
returns boolean
language plpgsql
as $$
declare
  v_updated int;
begin
  update public.producers
  set prepaid_balance = prepaid_balance - 1
  where name = p_producer_name and prepaid_balance > 0;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Contraparte para devolver el ticket al saldo si, después de descontarlo,
-- la emisión del ticket termina fallando por otro motivo (rollback).
create or replace function public.refund_producer_ticket(p_producer_name text)
returns void
language plpgsql
as $$
begin
  update public.producers
  set prepaid_balance = prepaid_balance + 1
  where name = p_producer_name;
end;
$$;

revoke all on function public.consume_producer_ticket(text) from public, anon, authenticated;
revoke all on function public.refund_producer_ticket(text) from public, anon, authenticated;
grant execute on function public.consume_producer_ticket(text) to service_role;
grant execute on function public.refund_producer_ticket(text) to service_role;
