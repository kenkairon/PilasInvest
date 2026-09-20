-- =========================================================
-- Migración 004 — segunda foto (opcional) por dispositivo
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =========================================================

alter table model_suggestions add column if not exists image_url_2 text;
alter table devices add column if not exists image_url_2 text;

comment on column model_suggestions.image_url_2 is
  'Segunda foto opcional adjuntada por el usuario. Si se aprueba, pasa a devices.image_url_2.';
comment on column devices.image_url_2 is
  'Segunda foto opcional del dispositivo (además de image_url).';
