# Pila Finder

Buscador de pilas por categoría de dispositivo (relojes, básculas, cámaras, controles remotos, juguetes y más), marca y modelo. Next.js (App Router) + Supabase + GitHub Actions.

## 1. Supabase

**Proyecto nuevo:**
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** → pega el contenido de `supabase/schema.sql` → **Run**.
   Esto crea las tablas (`device_categories`, `brands`, `battery_types`, `devices`,
   `model_suggestions`), las políticas de RLS y datos semilla.

**Si ya tenías la versión anterior (solo relojes, tabla `watch_models`):**
2. Ve a **SQL Editor** → pega el contenido de `supabase/migration_002_add_categories.sql` → **Run**.
   Esto renombra `watch_models` a `devices`, agrega `device_categories`, y
   migra tus datos existentes asignándolos a la categoría "Relojes". No vuelvas
   a correr `schema.sql` en este caso.

3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (solo para `/admin` y el workflow de sugerencias, nunca al navegador)

## 2. Local

```bash
cp .env.local.example .env.local   # y rellena las claves
npm install
npm run dev
```

Abre http://localhost:3000

## 3. Cargar dispositivos verificados

`devices` empieza vacía a propósito — solo se muestran filas con `verified = true`.
La forma normal de cargarlos es aprobando sugerencias desde `/admin` (ver
siguiente sección), pero también puedes insertar directo por SQL:

```sql
insert into devices (category_id, brand_id, model_name, model_code, battery_type_id, verified)
values (
  (select id from device_categories where slug = 'relojes'),
  (select id from brands where slug = 'casio'),
  'F-91W',
  '3159',
  (select id from battery_types where code = 'CR2016'),
  true
);
```

Categorías incluidas por defecto: `relojes`, `basculas`, `camaras`, `controles`,
`juguetes`, `otros`. Puedes agregar más directamente en `device_categories`
(columna `icon` debe ser una de las claves definidas en `lib/icons.ts`, o
agrega el mapeo correspondiente ahí si usas un ícono nuevo de lucide-react).

## 3b. Escanear una foto en vez de escribir

Junto al buscador hay un botón **"Escanear foto"** que abre la cámara del
dispositivo. El flujo completo pasa en el navegador:

1. El usuario toma o elige una foto (del código grabado en el reloj/aparato).
2. `tesseract.js` (OCR) corre **dentro del navegador** sobre esa imagen.
3. Se extraen los textos que parecen códigos (combinaciones de letras y
   números) y se buscan contra `devices` con la misma función de búsqueda
   de siempre.
4. La imagen se descarta apenas termina el OCR (`URL.revokeObjectURL`) —
   nunca se sube a un servidor ni se guarda en Supabase ni en ningún otro
   lado. Solo el texto extraído sale del componente.

Como el OCR sobre fotos de cámara es ruidoso, se muestran varios candidatos
como chips (`components/PhotoScanButton.tsx` prioriza los que combinan
letras y números, más parecidos a un código real) para que el usuario
pruebe el correcto si el primero no da resultados. La primera vez que se usa,
el navegador descarga el modelo de OCR (unos pocos MB) desde un CDN público;
después queda cacheado.

## 4. Panel de administración (`/admin`)

Permite revisar las sugerencias de usuarios (de cualquier categoría, no solo
relojes) y publicarlas en `devices` sin tocar el SQL Editor a mano.

1. En Supabase ve a **Authentication → Users → Add user** y créate una cuenta
   (email + contraseña). No hace falta que se registre solo — la creas tú.
2. En tu `.env.local` (y en las variables de entorno de Vercel) agrega:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...   # Project Settings → API → service_role
   ADMIN_EMAILS=tu-email@ejemplo.com
   ```
   `ADMIN_EMAILS` acepta varios correos separados por comas.
3. Entra a `/admin/login` con esas credenciales. `middleware.ts` protege
   todo lo que esté bajo `/admin`: si no estás logueado con un email de la
   lista, te redirige al login automáticamente.
4. En `/admin` verás las sugerencias pendientes. Por cada una:
   - eliges la **categoría** (chips con ícono, se intenta preseleccionar según
     lo que el usuario escribió),
   - eliges (o creas al vuelo con "+ nueva") la **marca**,
   - eliges (o creas al vuelo) el **tipo de pila**, o marcas "No lleva pila"
     si es mecánico/cableado,
   - confirmas nombre de modelo y código.

   Al aprobar, la fila se crea directamente en `devices` con `verified = true`
   y la sugerencia pasa a `status = 'approved'`.

5. Desde `/admin` hay un link **"Ver y editar dispositivos ya publicados"** que
   lleva a `/admin/devices`: ahí ves todo lo que ya está en producción, puedes
   **filtrar** por marca/modelo/código, **editar** cualquier campo (categoría,
   marca, pila, nombre, código, solar/sin pila) o **eliminarlo** por completo
   si se cargó algo por error. Eliminar pide confirmación en dos pasos
   ("¿Seguro? → Sí, eliminar") para evitar borrados accidentales.

6. `/admin/catalog` deja **editar o eliminar marcas y tipos de pila** ya
   existentes (útil si te equivocaste al escribir "Timex" como "Timx", o
   creaste "CR2016" dos veces). Reglas de seguridad:
   - Una **marca** no se puede eliminar si algún dispositivo la usa (se
     bloquea con un mensaje indicando cuántos) — así se evita borrar en
     cascada dispositivos sin querer.
   - Un **tipo de pila** sí se puede eliminar aunque esté en uso: los
     dispositivos que la tenían simplemente quedan sin pila asignada, y la
     confirmación te avisa cuántos se verían afectados antes de borrar.

La `service_role` key **nunca llega al navegador**: solo se usa dentro de
`lib/supabase/admin.ts`, importado únicamente desde Server Actions que ya
verificaron con `requireAdmin()` que quien llama tiene permiso.

## 5. Deploy con GitHub Actions

El repo incluye dos workflows en `.github/workflows/`:

- **`deploy.yml`**: en cada push a `main`, instala, lintea, compila y despliega a Vercel.
  Necesita estos secrets en **Settings → Secrets and variables → Actions**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (de tu cuenta de Vercel)

  Además, agrega `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_EMAILS` directamente en
  **Vercel → Project Settings → Environment Variables** (no en GitHub Secrets),
  ya que esas dos las necesita la app en tiempo de ejecución, no en el build.
- **`pending-suggestions.yml`**: cada lunes revisa cuántas sugerencias siguen pendientes
  de moderar y deja un aviso en la pestaña Actions. Necesita además:
  - `SUPABASE_SERVICE_ROLE_KEY`

Si prefieres desplegar en otro sitio (Netlify, servidor propio, etc.), reemplaza el job
`deploy` de `deploy.yml` por el paso de deploy correspondiente; el job `build` es agnóstico
de dónde termines publicando.

## 6. Estructura

```
app/
  page.tsx             página principal (Server Component)
  actions.ts            Server Actions: categorías, búsqueda, envío de sugerencias
  layout.tsx / globals.css
  admin/
    page.tsx            dashboard de sugerencias pendientes
    actions.ts           Server Actions: aprobar/rechazar, marcas/pilas,
                          y listar/editar/eliminar dispositivos publicados
    login/page.tsx        formulario de login
    devices/page.tsx       gestión de dispositivos ya publicados (editar/eliminar)
    catalog/page.tsx        gestión de marcas y tipos de pila (editar/eliminar)
components/
  CategoryTabs.tsx       chips de categoría con ícono (usado en búsqueda y sugerencia)
  SearchPanel.tsx        input + tabs + escaneo por foto + resultados (Client Component)
  PhotoScanButton.tsx     captura de cámara + OCR en el navegador (sin subir la foto)
  ResultRow.tsx           una fila de resultado (categoría, marca, modelo, pila)
  SuggestDeviceForm.tsx   formulario de "no está mi dispositivo", con selector de categoría
  admin/
    AdminNav.tsx            navegación entre las 3 secciones de /admin
    SuggestionList.tsx     estado local de la lista de pendientes
    SuggestionRow.tsx       formulario de aprobación por sugerencia (incluye categoría)
    DeviceList.tsx          lista filtrable de dispositivos publicados
    DeviceRow.tsx            editar (inline) o eliminar (con confirmación) un dispositivo
    BrandManager.tsx         crear/editar/eliminar marcas (bloquea si están en uso)
    BatteryManager.tsx       crear/editar/eliminar tipos de pila (avisa cuántos afecta)
    LogoutButton.tsx
lib/
  auth.ts                requireAdmin(): verifica que el usuario esté en ADMIN_EMAILS
  icons.ts                mapa de icon key (string en la DB) → componente lucide-react
  supabase/
    client.ts             cliente Supabase para el navegador (anon key)
    server.ts              cliente Supabase para Server Components/Actions (anon key)
    admin.ts                cliente con service_role key, solo server-side
    middleware.ts            refresco de sesión usado por middleware.ts
middleware.ts             protege /admin/* redirigiendo al login si no hay sesión admin
supabase/
  schema.sql             esquema completo para proyectos nuevos
  migration_002_add_categories.sql  migración para proyectos que ya tenían solo relojes
```

## Notas de seguridad

- El navegador solo usa la `anon` key. La seguridad real vive en las **policies de RLS**
  del `schema.sql`: lectura pública solo de `devices` con `verified = true`,
  e inserción (sin lectura) en `model_suggestions`.
- La `service_role` key solo se usa desde GitHub Actions y desde las Server Actions
  de `/admin` (nunca desde el cliente) y no debe llevar el prefijo `NEXT_PUBLIC_`.
