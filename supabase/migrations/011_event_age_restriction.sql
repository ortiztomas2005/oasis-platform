-- Restricción de edad por evento: si es apto para menores o solo para
-- mayores de 18, y la edad mínima permitida cuando NO es exclusivo para
-- mayores (ej: "apto para todo público", "+13", "+16"). Corré esto en el
-- SQL Editor de tu proyecto de Supabase (Project > SQL Editor > New query).
--
-- is_adults_only default true: los eventos ya creados antes de esta
-- migración no tenían esta pregunta, así que no hay forma de saber su
-- clasificación real — se asume "solo mayores" (el default más
-- conservador, ya que esos eventos pueden tener barra habilitada desde
-- antes y no queremos que una migración les apague algo sin avisar). Los
-- eventos NUEVOS sí piden la respuesta de forma obligatoria desde el
-- formulario — no hay un default real para esos, el form no deja
-- avanzar sin elegir.
alter table public.events
  add column if not exists is_adults_only boolean not null default true,
  add column if not exists min_age smallint;

-- Si un evento no es exclusivo para mayores, no puede tener barra
-- habilitada — el servidor ya hace cumplir esto en cada ruta que toca
-- has_bar, pero este check lo deja garantizado también a nivel de base
-- de datos, por si algún día se escribe directo con SQL.
alter table public.events
  drop constraint if exists events_no_bar_for_minors;
alter table public.events
  add constraint events_no_bar_for_minors
  check (is_adults_only = true or has_bar = false);
