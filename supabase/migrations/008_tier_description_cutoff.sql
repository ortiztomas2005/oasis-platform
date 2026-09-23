-- Descripción breve y hora límite de ingreso por tanda. Corré esto en el
-- SQL Editor de tu proyecto de Supabase (Project > SQL Editor > New query).

alter table public.ticket_tiers
  add column if not exists description text,
  add column if not exists entry_cutoff_time text;
