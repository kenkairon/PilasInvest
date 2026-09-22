-- =========================================================
-- Migración 005 — agregar foto directo desde la búsqueda,
-- sin pasar por /admin, pero de forma acotada:
--   - Solo en dispositivos VERIFICADOS (los que ya se ven en la búsqueda).
--   - Solo si el dispositivo TODAVÍA NO TIENE foto (evita que cualquiera
--     reemplace o borre una foto que ya subió otra persona).
--   - Solo puede tocar las columnas image_url / image_url_2, nada más
--     (no puede cambiar marca, modelo, pila, ni "verified").
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- Permiso a nivel de columna: el rol "anon" (el que usa la anon key)
-- solo puede escribir estas dos columnas de devices, ninguna otra.
grant update (image_url, image_url_2) on devices to anon;

-- Policy de RLS: solo aplica sobre filas verificadas y sin foto todavía.
drop policy if exists "public can add missing photo" on devices;
create policy "public can add missing photo" on devices
  for update
  using (verified = true and image_url is null)
  with check (verified = true);
