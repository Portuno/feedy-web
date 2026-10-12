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
3. Deploy. `vercel.json` ya trae el rewrite para que las rutas del SPA (`/nota/...`, `/diarios`) no den 404.

O desde la terminal: `npx vercel` (y `npx vercel --prod`).

## Supabase: sumar el dominio web
En el dashboard, **Authentication → URL Configuration**:
- **Site URL**: `https://TU-DOMINIO.vercel.app`
- **Redirect URLs**: `https://TU-DOMINIO.vercel.app/**` y `http://localhost:5173/**`

Con *Confirm email* apagado no hace falta para entrar, pero sí para cuando se active la confirmación o el reseteo de contraseña.

## Flujo
Registro → se crea solo el diario “{Nombre} Times” → Portada. Sin códigos en el login. Para leer el diario de otra persona: **Perfil → + Leer un diario** con el código de 6 caracteres que genera *Invitar a leer*.
