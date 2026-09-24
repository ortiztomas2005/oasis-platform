-- Si un evento tiene barra en vivo o no. Corré esto en el SQL Editor de tu
-- proyecto de Supabase (Project > SQL Editor > New query).

alter table public.events
  add column if not exists has_bar boolean not null default false;
