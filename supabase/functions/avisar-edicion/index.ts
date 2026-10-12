// Aviso de nueva edición.
// Se dispara con un webhook de Supabase: INSERT en public.ediciones.
//
// Secretos (supabase secrets set, no van al repo):
//   VAPID_PUBLIC_KEY   la misma que VITE_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT      mailto:alguien@dominio
//   WEBHOOK_SECRET     opcional, si el webhook manda el header x-webhook-secret
//
// Deploy: supabase functions deploy avisar-edicion --no-verify-jwt
// En el dashboard, Database → Webhooks: INSERT en public.ediciones → esta función.
// El texto de la nota no viaja: solo el nombre del diario y la URL.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

interface FilaPush { id: string; endpoint: string; p256dh: string; auth: string }
interface RegistroEdicion { diario_id?: string }

const wp = webpush as {
  setVapidDetails: (subject: string, publica: string, privada: string) => void
  sendNotification: (
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
  ) => Promise<unknown>
}

function autorizado(req: Request): boolean {
  const secret = Deno.env.get('WEBHOOK_SECRET')
  if (secret && req.headers.get('x-webhook-secret') === secret) return true
  const role = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const auth = req.headers.get('authorization') ?? ''
  return !!role && auth === `Bearer ${role}`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('método', { status: 405 })
  if (!autorizado(req)) return new Response('no', { status: 401 })

  const publica = Deno.env.get('VAPID_PUBLIC_KEY')
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT')
  const url = Deno.env.get('SUPABASE_URL')
  const role = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!publica || !privada || !subject || !url || !role) {
    return Response.json({ error: 'Faltan las claves VAPID o las de Supabase.' }, { status: 500 })
  }

  let body: { type?: string; table?: string; record?: RegistroEdicion }
  try { body = await req.json() } catch { return Response.json({ error: 'cuerpo' }, { status: 400 }) }
  if (body.type && body.type !== 'INSERT') return Response.json({ enviados: 0 })
  if (body.table && body.table !== 'ediciones') return Response.json({ enviados: 0 })
  const diarioId = body.record?.diario_id ?? (body as { diario_id?: string }).diario_id
  if (!diarioId) return Response.json({ error: 'sin diario' }, { status: 400 })

  const admin = createClient(url, role)
  const diario = await admin.from('diarios').select('id,nombre,slug,dueno_id').eq('id', diarioId).maybeSingle()
  if (diario.error || !diario.data) return Response.json({ error: diario.error?.message ?? 'diario' }, { status: 404 })

  const lectores = await admin.from('lectores').select('lector_id').eq('diario_id', diarioId)
  if (lectores.error) return Response.json({ error: lectores.error.message }, { status: 500 })
  const ids = (lectores.data ?? []).map((l) => l.lector_id as string).filter((id) => id !== diario.data.dueno_id)
  if (!ids.length) return Response.json({ enviados: 0 })

  const subs = await admin.from('push_suscripciones').select('id,endpoint,p256dh,auth').in('usuario_id', ids)
  if (subs.error) return Response.json({ error: subs.error.message }, { status: 500 })
  const filas = (subs.data ?? []) as FilaPush[]
  if (!filas.length) return Response.json({ enviados: 0 })

  wp.setVapidDetails(subject, publica, privada)
  const payload = JSON.stringify({
    title: diario.data.nombre as string,
    body: 'Hay una edición nueva.',
    url: `/${diario.data.slug as string}`,
  })

  let enviados = 0
  let borrados = 0
  await Promise.all(filas.map(async (fila) => {
    try {
      await wp.sendNotification(
        { endpoint: fila.endpoint, keys: { p256dh: fila.p256dh, auth: fila.auth } },
        payload,
      )
      enviados++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await admin.from('push_suscripciones').delete().eq('id', fila.id)
        borrados++
      }
    }
  }))

  return Response.json({ enviados, borrados })
})
