# Versión web del diario

Vite + React + TypeScript + Supabase. Usa **la misma base** que la app Android (`~/feedy`): mismas tablas, RLS, RPC `canjear_codigo`, bucket privado `fotos` (`{diario_id}/{id}.jpg`, URLs firmadas de 1 h), una edición por diario y por día, y realtime en notas/avisos/aplausos/cartas. Lo que se publica en la web aparece en la app y al revés.

## Correrla en tu compu
```bash
cd ~/feedy-web
cp .env.example .env.local   # ya viene creado con las claves de ~/feedy/local.properties
npm install
npm run dev                  # http://localhost:5173
```
Para probarla desde el celular en la misma red: `npm run dev -- --host` y abrí la IP que muestra.

`npm run build` genera `dist/`.

## Publicarla en Vercel
1. Subí el repo a GitHub (org Portuno) e importalo en vercel.com → *Add New Project*. Framework: Vite.
2. En *Settings → Environment Variables* cargá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY` (la clave pública; sin ella el aviso push no se puede activar)
3. Deploy. `vercel.json` ya trae el rewrite para que las rutas del SPA (`/nota/...`, `/diarios`) no den 404.

O desde la terminal: `npx vercel` (y `npx vercel --prod`).

## Supabase: sumar el dominio web
En el dashboard, **Authentication → URL Configuration**:
- **Site URL**: `https://TU-DOMINIO.vercel.app`
- **Redirect URLs**: `https://TU-DOMINIO.vercel.app/**` y `http://localhost:5173/**`

Con *Confirm email* apagado no hace falta para entrar, pero sí para cuando se active la confirmación o el reseteo de contraseña.

## Dirección de cada diario
Cada diario tiene un slug (`/lautaro`). Se arma solo al crearlo, también si lo crea la app, y no cambia al renombrarlo. La portada vive en esa URL: sin sesión se ve el login y, al entrar, se vuelve a la misma dirección. Si la cuenta no lee ese diario, la URL no muestra nada.

Antes de usarlo, corré [supabase/migrations/002_slug_y_push.sql](supabase/migrations/002_slug_y_push.sql) en el SQL Editor del mismo proyecto.

Nada de la web se indexa: `noindex` en el HTML, `public/robots.txt` y el header `X-Robots-Tag`.

## Aviso de edición nueva (Web Push)
Cuando se inserta una fila en `ediciones` (desde la web o desde la app), un webhook llama a la Edge Function `avisar-edicion`. Les llega a los lectores de ese diario que hayan activado «Avisame cuando haya edición» en Perfil. No incluye el texto de la nota.

1. Generá un par VAPID (`npx web-push generate-vapid-keys`). La pública va en `VITE_VAPID_PUBLIC_KEY`. La privada no se commitea.
2. `supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… VAPID_SUBJECT=mailto:… WEBHOOK_SECRET=…`
3. `supabase functions deploy avisar-edicion --no-verify-jwt`
4. En el dashboard, Database → Webhooks: INSERT en `public.ediciones` hacia esa función. Si usás `WEBHOOK_SECRET`, mandalo en el header `x-webhook-secret`. Si el webhook invoca la función con la service role, también entra.

En el iPhone el aviso solo llega si el sitio está en la pantalla de inicio.

## Flujo
Registro → se crea solo el diario “{Nombre} Times” → Portada. Sin códigos en el login. Para leer el diario de otra persona: **Perfil → + Leer un diario** con el código de 6 caracteres que genera *Invitar a leer*.
