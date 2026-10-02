-- Personalización del mail de confirmación de entradas por productora:
-- logo propio, color de marca, texto de pie de mail, información
-- importante para el asistente (cómo llegar, cómo es el ingreso) y un
-- email de contacto propio para que las respuestas del cliente lleguen
-- directo a la productora (vía Reply-To, ver core/services/email.ts).
-- Corré esto en el SQL Editor de tu proyecto de Supabase.
--
-- No se puede mandar el mail literalmente "desde" el email de cada
-- productora (ningún proveedor lo permite sin que esa productora verifique
-- su propio dominio — es protección anti-spoofing). El remitente sigue
-- siendo el dominio verificado de Live Experience, pero el nombre mostrado
-- y el Reply-To sí reflejan a la productora.
alter table public.producers
  add column if not exists contact_email text,
  add column if not exists email_logo_url text,
  add column if not exists email_brand_color text,
  add column if not exists email_footer_text text,
  add column if not exists email_extra_info text;
