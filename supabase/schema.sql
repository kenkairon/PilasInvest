-- =========================================================
-- Pila Finder — esquema de base de datos para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
--
-- Si ya habías corrido una versión anterior de este archivo (solo
-- relojes, tabla watch_models), NO vuelvas a correr este archivo:
-- usa en su lugar supabase/migration_002_add_categories.sql
-- =========================================================

create extension if not exists "pg_trgm"; -- búsqueda por similitud de texto

-- ---------------------------------------------------------
-- Categorías de dispositivo (relojes, básculas, cámaras, ...)
-- "icon" es una clave que el frontend mapea a un ícono de
-- lucide-react (ver lib/icons.ts), no un SVG guardado.
-- "sort_order" controla el orden en que aparecen los chips/tabs.
-- ---------------------------------------------------------
create table if not exists device_categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  icon text not null default 'circuit-board',
  sort_order int not null default 100,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- Marcas (Casio, Seiko, Xiaomi, Tanita, ...)
-- ---------------------------------------------------------
create table if not exists brands (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- Catálogo de tipos de pila (independiente de categoría/marca)
-- ---------------------------------------------------------
create table if not exists battery_types (
  id bigint generated always as identity primary key,
  code text not null unique,              -- 'SR626SW'
  common_names text[] not null default '{}', -- {'377','AG4','LR626'}
  chemistry text check (chemistry in ('silver_oxide','lithium','alkaline','rechargeable')),
  voltage numeric(4,2),
  diameter_mm numeric(5,2),
  height_mm numeric(5,2),
  typical_use text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_battery_types_common_names on battery_types using gin (common_names);

-- ---------------------------------------------------------
-- Dispositivos verificados (lo que consulta el buscador público)
-- ---------------------------------------------------------
create table if not exists devices (
  id bigint generated always as identity primary key,
  category_id bigint not null references device_categories(id),
  brand_id bigint not null references brands(id) on delete cascade,
  model_name text not null,               -- 'F-91W' / 'Tanita HD-660'
  model_code text,                        -- número de módulo, modelo, SKU, etc.
  battery_type_id bigint references battery_types(id) on delete set null,
  is_solar boolean not null default false,
  no_battery boolean not null default false, -- automático, cableado, recargable fijo...
  image_url text,
  image_url_2 text,
  verified boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_devices_category on devices (category_id);
create index if not exists idx_devices_brand on devices (brand_id);
create index if not exists idx_devices_model_trgm on devices using gin (model_name gin_trgm_ops);
create index if not exists idx_devices_code_trgm on devices using gin (model_code gin_trgm_ops);

comment on column devices.model_code is
  'Identificador libre del modelo: número de módulo (relojes Casio), número de modelo, SKU, etc.';
comment on column devices.no_battery is
  'true si el dispositivo no usa pila reemplazable (automático, cableado, recargable fijo, etc.)';

-- ---------------------------------------------------------
-- Sugerencias de usuarios (buzón de moderación)
-- ---------------------------------------------------------
create table if not exists model_suggestions (
  id bigint generated always as identity primary key,
  category_name text,
  brand_name text not null,
  model_name text not null,
  model_code text,
  battery_code_reported text,
  image_url text,
  image_url_2 text,
  email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

comment on column model_suggestions.image_url is
  'Foto que el usuario adjuntó al sugerir el dispositivo (bucket device-photos). Si se aprueba, pasa a devices.image_url.';

-- ---------------------------------------------------------
-- updated_at automático en devices
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_devices_updated_at on devices;
create trigger trg_devices_updated_at
before update on devices
for each row execute function set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table device_categories enable row level security;
alter table brands enable row level security;
alter table battery_types enable row level security;
alter table devices enable row level security;
alter table model_suggestions enable row level security;

-- Lectura pública de catálogo (usa la anon key desde Next.js)
create policy "public read device_categories" on device_categories
  for select using (true);

create policy "public read brands" on brands
  for select using (true);

create policy "public read battery_types" on battery_types
  for select using (true);

create policy "public read verified devices" on devices
  for select using (verified = true);

-- Cualquiera puede sugerir un dispositivo (insert-only, sin poder leer lo ajeno)
create policy "public insert suggestions" on model_suggestions
  for insert with check (true);

-- Nadie puede leer/editar/borrar sugerencias desde el cliente:
-- eso se hace desde /admin con la service_role key (nunca expuesta al navegador),
-- así que no se crean policies de select/update aquí.

-- ---------------------------------------------------------
-- Bucket público de Storage para fotos de dispositivos
-- (adjuntadas por el usuario al sugerir un modelo)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('device-photos', 'device-photos', true)
on conflict (id) do nothing;

create policy "public read device photos" on storage.objects
  for select using (bucket_id = 'device-photos');

create policy "anyone can upload device photos" on storage.objects
  for insert with check (bucket_id = 'device-photos');

-- =========================================================
-- Datos semilla
-- =========================================================
insert into device_categories (name, slug, icon, sort_order) values
  ('Relojes', 'relojes', 'watch', 1),
  ('Básculas y pesas', 'basculas', 'scale', 2),
  ('Cámaras', 'camaras', 'camera', 3),
  ('Controles remotos', 'controles', 'radio', 4),
  ('Juguetes y gadgets', 'juguetes', 'toy-brick', 5),
  ('Otros dispositivos', 'otros', 'circuit-board', 6)
on conflict (slug) do nothing;

insert into battery_types (code, common_names, chemistry, voltage, diameter_mm, height_mm, typical_use)
values
  ('SR626SW', '{377,AG4,LR626,SR66}', 'silver_oxide', 1.55, 6.8, 2.6, 'La mayoría de relojes analógicos de vestir'),
  ('SR621SW', '{364,AG1}', 'silver_oxide', 1.55, 6.8, 2.1, 'Relojes finos / de vestir'),
  ('SR920SW', '{371,AG6}', 'silver_oxide', 1.55, 9.5, 2.1, 'Cronógrafos, cuarzo de consumo medio'),
  ('CR2016', '{BR2016,DL2016}', 'lithium', 3.0, 20.0, 1.6, 'La mayoría de Casio digitales (F-91W, DW-5600)'),
  ('CR2025', '{BR2025,DL2025}', 'lithium', 3.0, 20.0, 2.5, 'Casio AE-1200, Ironman clásico'),
  ('CR2032', '{BR2032,DL2032}', 'lithium', 3.0, 20.0, 3.2, 'Digitales más grandes, básculas de cocina, controles remotos'),
  ('LR44', '{AG13,A76,357A,303}', 'alkaline', 1.5, 11.6, 5.4, 'Casio digitales económicos, básculas, juguetes pequeños'),
  ('AAA', '{LR03}', 'alkaline', 1.5, 10.5, 44.5, 'Básculas de baño, controles remotos, cámaras compactas'),
  ('AA', '{LR6}', 'alkaline', 1.5, 14.5, 50.5, 'Básculas grandes, linternas, controles remotos'),
  ('CR2', '{DLCR2}', 'lithium', 3.0, 15.6, 27.0, 'Cámaras compactas'),
  ('CR123A', '{DL123A}', 'lithium', 3.0, 17.0, 34.5, 'Cámaras, algunos medidores/sensores')
on conflict (code) do nothing;

insert into brands (name, slug) values
  ('Casio', 'casio'),
  ('Seiko', 'seiko'),
  ('Citizen', 'citizen'),
  ('Timex', 'timex'),
  ('Swatch', 'swatch'),
  ('Tanita', 'tanita'),
  ('Camry', 'camry'),
  ('Canon', 'canon'),
  ('Nikon', 'nikon')
on conflict (name) do nothing;
