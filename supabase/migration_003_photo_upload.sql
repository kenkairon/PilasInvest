-- =========================================================
-- Migración 003 — subir foto real del dispositivo (Storage)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------------------------------------------------------
-- Columna para guardar la URL de la foto que el usuario sube
-- junto con su sugerencia (distinto del escaneo OCR, que no
-- guarda nada).
-- ---------------------------------------------------------
alter table model_suggestions add column if not exists image_url text;

-- ---------------------------------------------------------
-- Bucket público de Storage para las fotos de dispositivos
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('device-photos', 'device-photos', true)
on conflict (id) do nothing;

-- Cualquiera puede LEER las fotos (necesario para mostrarlas en el buscador)
drop policy if exists "public read device photos" on storage.objects;
create policy "public read device photos" on storage.objects
  for select using (bucket_id = 'device-photos');

-- Cualquiera puede SUBIR una foto nueva (como con las sugerencias: es
-- insert-only, nadie puede sobrescribir ni borrar fotos ajenas desde el
-- cliente).
drop policy if exists "anyone can upload device photos" on storage.objects;
create policy "anyone can upload device photos" on storage.objects
  for insert with check (bucket_id = 'device-photos');

comment on column model_suggestions.image_url is
  'Foto que el usuario adjuntó al sugerir el dispositivo (bucket device-photos). Si se aprueba, pasa a devices.image_url.';
