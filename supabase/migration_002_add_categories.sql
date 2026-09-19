-- =========================================================
-- Migración 002 — de "solo relojes" a "cualquier dispositivo"
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- (después de haber corrido la versión original de schema.sql,
-- la que solo tenía watch_models)
-- =========================================================

-- ---------------------------------------------------------
-- Categorías de dispositivo
-- ---------------------------------------------------------
create table if not exists device_categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  icon text not null default 'circuit-board',
  sort_order int not null default 100,
  created_at timestamptz default now()
);

alter table device_categories enable row level security;

create policy "public read device_categories" on device_categories
  for select using (true);

insert into device_categories (name, slug, icon, sort_order) values
  ('Relojes', 'relojes', 'watch', 1),
  ('Básculas y pesas', 'basculas', 'scale', 2),
  ('Cámaras', 'camaras', 'camera', 3),
  ('Controles remotos', 'controles', 'radio', 4),
  ('Juguetes y gadgets', 'juguetes', 'toy-brick', 5),
  ('Otros dispositivos', 'otros', 'circuit-board', 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------
-- Renombrar watch_models -> devices y generalizar columnas
-- ---------------------------------------------------------
alter table watch_models rename to devices;
alter table devices rename column module_number to model_code;
alter table devices rename column is_automatic to no_battery;

alter table devices add column if not exists category_id bigint references device_categories(id);

-- Todo lo que ya existía era un reloj: lo asignamos a la categoría 'relojes'
update devices set category_id = (select id from device_categories where slug = 'relojes')
where category_id is null;

alter table devices alter column category_id set not null;

create index if not exists idx_devices_category on devices (category_id);

comment on column devices.model_code is
  'Identificador libre del modelo: número de módulo (relojes Casio), número de modelo, SKU, etc.';
comment on column devices.no_battery is
  'true si el dispositivo no usa pila reemplazable (automático, cableado, recargable fijo, etc.)';

-- Las policies de RLS se mantienen tras el rename de tabla; las recreamos
-- con nombre actualizado solo por claridad.
drop policy if exists "public read verified watch_models" on devices;
create policy "public read verified devices" on devices
  for select using (verified = true);

-- ---------------------------------------------------------
-- model_suggestions: nuevas columnas para categoría y código genérico
-- ---------------------------------------------------------
alter table model_suggestions add column if not exists category_name text;
alter table model_suggestions rename column module_number to model_code;
