-- A la tabla "tickets" le faltan columnas de auditoría que sí tienen
-- orders, ticket_tiers y events: no hay forma de saber cuándo se escaneó
-- una entrada en puerta, ni cuándo se actualizó por última vez. El código
-- (scan/validate, resale) tuvo que ajustarse para no escribir ahí porque
-- las columnas no existían. Corré esto una vez para agregarlas.

alter table public.tickets
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists scanned_at timestamptz;

-- Nota: después de correr esto, en scan/validate/route.ts conviene volver a
-- agregar `updated_at: now, scanned_at: now` al .update() que marca el
-- ticket como USED (hoy solo persiste el status).
