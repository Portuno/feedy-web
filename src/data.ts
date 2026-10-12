// Capa de datos: espejo 1:1 de app/src/main/java/com/portuno/feedy/data/*.kt
// Mismas tablas, columnas, rutas de fotos ({diario_id}/{id}.jpg), edición por día y RPC.
import { supabase } from './supabase'
import { aMillis, entradillaDe, esHoy, hace, hoyISO, primerNombre, turnoDe, type Turno } from './fechas'

const BUCKET = 'fotos'
const LADO = 1600
const CLAVE_ACTIVO = 'feedy.diario'

// ---------- Filas (Filas.kt) ----------
export interface PerfilFila { id: string; nombre: string; avatar_url?: string | null; avisos_lectura: boolean; creado_en?: string | null }
export interface DiarioFila { id: string; dueno_id: string; nombre: string; lema: string; ciudad: string; slug: string; creado_en?: string | null }
export interface LectorFila { diario_id: string; lector_id: string; avisos_lectura?: boolean }
export interface EdicionFila { id: string; diario_id: string; numero: number; fecha: string; turno: Turno; portada_nota_id?: string | null }
export interface NotaFila {
  id: string; diario_id: string; autor_id: string; tipo: 'nota' | 'color'; titulo: string; bajada: string; cuerpo: string
  foto_url?: string | null; epigrafe?: string | null; firma?: string | null; seccion?: string | null
  edicion_id?: string | null; nota_principal_id?: string | null; publicada_en?: string | null
}
export interface AvisoFila {
  id: string; diario_id: string; autor_id: string; tipo: TipoAviso; titulo: string; texto: string
  foto_url?: string | null; publicado_en?: string | null; estado?: string | null
}
interface RespuestaFila { id: string; aviso_id: string; lector_id: string; texto: string; creada_en?: string | null }
interface AplausoFila { nota_id: string; lector_id: string; creado_en?: string | null }
interface CartaFila { id: string; nota_id: string; autor_id: string; texto: string; creada_en?: string | null }
interface LecturaFila { nota_id: string; lector_id: string; leida_en?: string | null }

// ---------- Modelos (Modelos.kt) ----------
export type TipoAviso = 'novedad' | 'idea' | 'propuesta'
export type TipoPublicacion = 'nota' | 'color' | 'aviso'

export interface Diario {
  id: string; slug: string; nombre: string; lema: string; ciudad: string; esPropio: boolean; creadoPor: string
  compartidoCon: string | null; leeTodasLasNoches: boolean; edicionesPublicadas: number; aplausosHoy: number; ultimaEdicionHace: string | null
}
export interface Edicion { id: string; diarioId: string; numero: number; fecha: string; turno: Turno; portadaNotaId: string | null }
export interface Nota {
  id: string; diarioId: string; edicionId: string; tipo: 'nota' | 'color'; titulo: string; bajada: string; entradilla: string; cuerpo: string
  fotoUrl: string | null; epigrafe: string; autor: string; ciudad: string; publicadaEn: number; seccion: string
  notaPrincipalId: string | null; aplausos: number; aplaudido: boolean; leidoPor: string | null; autorId: string
}
export interface Aviso {
  id: string; diarioId: string; tipo: TipoAviso; detalleKicker: string; titulo: string; texto: string; fotoUrl: string | null
  firma: string; respuesta: string | null; destacado: boolean; publicadaEn: number; puedoResponder: boolean; estado: string | null
}
export interface Carta { id: string; notaId: string; texto: string; autor: string; lugar: string }
export interface Breve { id: string; titulo: string; fotoUrl: string | null }
export interface Corresponsal { nombre: string; linea: string; notas: number; aplausos: number; cartas: number; avisosLectura: boolean }
export interface PortadaDatos { diario: Diario; edicion: Edicion | null; nota: Nota | null; color: Nota | null; aviso: Aviso | null; breves: Breve[]; cartas: number }
export interface NotaVista { diarioNombre: string; diarioId: string; nota: Nota; color: Nota | null; cartas: Carta[]; esPropio: boolean }
export interface Tablero { propio: Diario | null; lecturas: Diario[]; corresponsal: Corresponsal }

// ---------- utilidades ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ok<T>(r: { data: any; error: { message: string; code?: string } | null }): T {
  if (r.error) throw new Error(traducir(r.error.message))
  return (r.data ?? ([] as unknown)) as T
}
export function traducir(m: string): string {
  if (/Invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.'
  if (/already registered|already exists/i.test(m)) return 'Ya hay una cuenta con ese email. Entrá.'
  if (/Password should be/i.test(m)) return 'La contraseña tiene que tener al menos 6 caracteres.'
  if (/Email not confirmed/i.test(m)) return 'Falta confirmar el correo. Apagá Confirm email en Supabase y volvé a registrarte.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión con la imprenta. Probá otra vez.'
  return m
}
const esDuplicado = (e: { message?: string; code?: string } | null) =>
  !!e && (e.code === '23505' || /duplicate/i.test(e.message ?? ''))

let uidActual: string | null = null
supabase.auth.onAuthStateChange((_e, s) => { uidActual = s?.user.id ?? null })
export async function uid(): Promise<string> {
  if (uidActual) return uidActual
  const { data } = await supabase.auth.getSession()
  uidActual = data.session?.user.id ?? null
  if (!uidActual) throw new Error('No hay sesión')
  return uidActual
}

// ---------- Diario activo (SharedPreferences "diario") ----------
export const activo = {
  get: () => localStorage.getItem(CLAVE_ACTIVO),
  set: (id: string) => localStorage.setItem(CLAVE_ACTIVO, id),
  olvidar: () => localStorage.removeItem(CLAVE_ACTIVO),
}

// ---------- Auth (AuthRepository.kt) ----------
export async function entrar(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw new Error(traducir(error.message))
}

export async function registrar(nombre: string, email: string, password: string) {
  const correo = email.trim()
  const r = await supabase.auth.signUp({ email: correo, password, options: { data: { nombre: nombre.trim() } } })
  if (r.error) throw new Error(traducir(r.error.message))
  if (!r.data.session) {
    const s = await supabase.auth.signInWithPassword({ email: correo, password })
    if (s.error || !s.data.session) {
      throw new Error('Te creamos la cuenta, pero falta confirmar el correo. En Supabase, Authentication → Providers → Email, apagá Confirm email y volvé a entrar.')
    }
  }
}

export async function salir() {
  activo.olvidar()
  await supabase.auth.signOut()
}

export async function perfil(): Promise<PerfilFila> {
  const id = await uid()
  const filas = ok<PerfilFila[]>(await supabase.from('profiles').select('*').eq('id', id).limit(1))
  if (!filas[0]) throw new Error('No encontré tu ficha de corresponsal.')
  return filas[0]
}

export async function avisosLectura(valor: boolean) {
  const id = await uid()
  ok(await supabase.from('profiles').update({ avisos_lectura: valor }).eq('id', id))
  ok(await supabase.from('lectores').update({ avisos_lectura: valor }).eq('lector_id', id))
}

// ---------- Diarios (DiarioRepository.kt) ----------
export const LEMA_POR_DEFECTO = 'Las noticias de la casa'

export async function crearDiario(nombre: string, lema: string, ciudad: string): Promise<string> {
  const id = crypto.randomUUID()
  ok(await supabase.from('diarios').insert({ id, dueno_id: await uid(), nombre: nombre.trim(), lema: lema.trim(), ciudad: ciudad.trim() }))
  activo.set(id)
  return id
}

/** Nuevo flujo: si no tenés diario propio, se crea "{Nombre} Times" y vas directo a la portada. */
export async function asegurarDiarioPropio(): Promise<string> {
  const yo = await uid()
  const propios = ok<{ id: string }[]>(await supabase.from('diarios').select('id').eq('dueno_id', yo).order('creado_en', { ascending: false }).limit(1))
  if (propios[0]) {
    if (!activo.get()) activo.set(propios[0].id)
    return propios[0].id
  }
  let nombre = ''
  try { nombre = (await perfil()).nombre } catch { /* el trigger puede tardar un instante */ }
  if (!nombre) {
    const { data } = await supabase.auth.getUser()
    nombre = (data.user?.user_metadata?.nombre as string) || data.user?.email?.split('@')[0] || 'Corresponsal'
  }
  return crearDiario(`${primerNombre(nombre)} Times`, LEMA_POR_DEFECTO, '')
}

export async function actualizarDiario(id: string, nombre: string, lema: string, ciudad: string) {
  ok(await supabase.from('diarios').update({ nombre: nombre.trim(), lema: lema.trim(), ciudad: ciudad.trim() }).eq('id', id))
}

export async function tablero(): Promise<Tablero> {
  const yo = await uid()
  const p = await perfil()
  const propios = ok<DiarioFila[]>(await supabase.from('diarios').select('*').eq('dueno_id', yo).order('creado_en', { ascending: false }))
  const comoLector = ok<LectorFila[]>(await supabase.from('lectores').select('*').eq('lector_id', yo))
  const ajenos = comoLector.length
    ? ok<DiarioFila[]>(await supabase.from('diarios').select('*').in('id', comoLector.map((l) => l.diario_id)))
    : []
  const todos = [...propios, ...ajenos].filter((d, i, a) => a.findIndex((x) => x.id === d.id) === i)
  const ids = todos.map((d) => d.id)
  const lectores = ids.length ? ok<LectorFila[]>(await supabase.from('lectores').select('*').in('diario_id', ids)) : []
  const perfilesIds = [...new Set([...todos.map((d) => d.dueno_id), ...lectores.map((l) => l.lector_id), yo])]
  const perfiles = new Map(ok<PerfilFila[]>(await supabase.from('profiles').select('*').in('id', perfilesIds)).map((x) => [x.id, x]))
  const notas = ids.length
    ? ok<{ id: string; diario_id: string; publicada_en: string; autor_id: string }[]>(await supabase.from('notas').select('id,diario_id,publicada_en,autor_id').in('diario_id', ids))
    : []
  const ediciones = ids.length ? ok<EdicionFila[]>(await supabase.from('ediciones').select('id,diario_id,numero,fecha,turno').in('diario_id', ids)) : []
  const notaIds = notas.map((n) => n.id)
  const aplausos = notaIds.length ? ok<AplausoFila[]>(await supabase.from('aplausos').select('*').in('nota_id', notaIds)) : []
  const cartas = notaIds.length ? ok<CartaFila[]>(await supabase.from('cartas').select('id,nota_id,autor_id').in('nota_id', notaIds)) : []
  const misIds = new Set(notas.filter((n) => n.autor_id === yo).map((n) => n.id))
  const anio = p.creado_en?.slice(0, 4) ?? String(new Date().getFullYear())
  const ciudadLinea = propios[0]?.ciudad?.trim() || 'la ciudad'

  const diarios: Diario[] = todos.map((fila) => {
    const esPropio = fila.dueno_id === yo
    const lect = lectores.filter((l) => l.diario_id === fila.id)
    const nombres = lect.map((l) => perfiles.get(l.lector_id)?.nombre).filter(Boolean).map((n) => primerNombre(n!))
    const compartido = nombres.length === 0 ? null : nombres.length === 1 ? nombres[0] : nombres.length === 2 ? `${nombres[0]} y ${nombres[1]}` : `${nombres[0]} y otros`
    const ns = notas.filter((n) => n.diario_id === fila.id)
    const nIds = new Set(ns.map((n) => n.id))
    const ultima = ns.length ? Math.max(...ns.map((n) => aMillis(n.publicada_en))) : null
    return {
      id: fila.id, slug: fila.slug, nombre: fila.nombre, lema: fila.lema, ciudad: fila.ciudad, esPropio,
      creadoPor: esPropio ? 'vos' : primerNombre(perfiles.get(fila.dueno_id)?.nombre ?? 'alguien'),
      compartidoCon: compartido,
      leeTodasLasNoches: lect.some((l) => l.avisos_lectura),
      edicionesPublicadas: ediciones.filter((e) => e.diario_id === fila.id).length,
      aplausosHoy: aplausos.filter((a) => nIds.has(a.nota_id) && esHoy(aMillis(a.creado_en))).length,
      ultimaEdicionHace: ultima ? hace(ultima) : null,
    }
  })
  const propio = diarios.find((d) => d.esPropio) ?? null
  const lecturas = diarios.filter((d) => !d.esPropio)
  const guardado = activo.get()
  const siguiente = guardado && diarios.some((d) => d.id === guardado) ? guardado : propio?.id ?? lecturas[0]?.id ?? null
  if (siguiente && siguiente !== guardado) activo.set(siguiente)
  return {
    propio, lecturas,
    corresponsal: {
      nombre: p.nombre || 'Corresponsal',
      linea: `Corresponsal en ${ciudadLinea} desde ${anio}`,
      notas: misIds.size,
      aplausos: aplausos.filter((a) => misIds.has(a.nota_id)).length,
      cartas: cartas.filter((c) => misIds.has(c.nota_id)).length,
      avisosLectura: p.avisos_lectura,
    },
  }
}

// ---------- Fotos (FotoStorage.kt) ----------
export async function comprimir(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const lado = Math.max(bmp.width, bmp.height)
  const f = lado > LADO ? LADO / lado : 1
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * f))
  c.height = Math.max(1, Math.round(bmp.height * f))
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Esa foto no se puede imprimir.'))), 'image/jpeg', 0.82))
}

async function subir(ruta: string, blob: Blob) {
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(error.message)
}

async function firmar(rutas: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>()
  const propias = [...new Set(rutas.map((r) => r.trim()).filter((r) => r && !r.startsWith('http')))]
  rutas.filter((r) => r.startsWith('http')).forEach((r) => m.set(r, r))
  if (!propias.length) return m
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(propias, 60 * 60)
  data?.forEach((d, i) => { if (d.signedUrl) m.set(propias[i] ?? d.path ?? '', d.signedUrl) })
  return m
}
const urlDe = (r: string | null | undefined, f: Map<string, string>) => (r ? f.get(r) ?? (r.startsWith('http') ? r : null) : null)

// ---------- Notas (NotaRepository.kt) ----------
async function nombres(ids: string[]): Promise<Map<string, string>> {
  const u = [...new Set(ids.filter(Boolean))]
  if (!u.length) return new Map()
  return new Map(ok<PerfilFila[]>(await supabase.from('profiles').select('id,nombre').in('id', u)).map((p) => [p.id, p.nombre]))
}

async function diarioDe(id: string): Promise<Diario> {
  const f = ok<DiarioFila[]>(await supabase.from('diarios').select('*').eq('id', id).limit(1))[0]
  if (!f) throw new Error('Ese diario no está en el archivo.')
  return {
    id: f.id, slug: f.slug, nombre: f.nombre, lema: f.lema, ciudad: f.ciudad, esPropio: f.dueno_id === (await uid()),
    creadoPor: '', compartidoCon: null, leeTodasLasNoches: false, edicionesPublicadas: 0, aplausosHoy: 0, ultimaEdicionHace: null,
  }
}

async function armarNotas(filas: NotaFila[], ciudad: string): Promise<Nota[]> {
  if (!filas.length) return []
  const ids = filas.map((f) => f.id)
  const yo = await uid()
  const aplausos = ok<AplausoFila[]>(await supabase.from('aplausos').select('*').in('nota_id', ids))
  const lecturas = ok<LecturaFila[]>(await supabase.from('lecturas').select('*').in('nota_id', ids))
  const perfiles = await nombres([...filas.map((f) => f.autor_id), ...lecturas.map((l) => l.lector_id)])
  const firmadas = await firmar(filas.map((f) => f.foto_url).filter(Boolean) as string[])
  return filas.map((f) => {
    const ls = lecturas.filter((l) => l.nota_id === f.id && l.lector_id !== f.autor_id).sort((a, b) => aMillis(b.leida_en) - aMillis(a.leida_en))
    const quien = ls[0] ? perfiles.get(ls[0].lector_id) : undefined
    return {
      id: f.id, diarioId: f.diario_id, edicionId: f.edicion_id ?? '', tipo: f.tipo === 'color' ? 'color' : 'nota',
      titulo: f.titulo, bajada: f.bajada, entradilla: entradillaDe(f.cuerpo), cuerpo: f.cuerpo,
      fotoUrl: urlDe(f.foto_url, firmadas), epigrafe: f.epigrafe ?? '',
      autor: f.firma?.trim() ? f.firma : perfiles.get(f.autor_id) ?? '', ciudad,
      publicadaEn: aMillis(f.publicada_en), seccion: f.seccion?.trim() || 'SOCIEDAD',
      notaPrincipalId: f.nota_principal_id ?? null,
      aplausos: aplausos.filter((a) => a.nota_id === f.id).length,
      aplaudido: aplausos.some((a) => a.nota_id === f.id && a.lector_id === yo),
      leidoPor: quien ? primerNombre(quien).toUpperCase() : null,
      autorId: f.autor_id,
    } satisfies Nota
  })
}

function avisoDe(f: AvisoFila, perfiles: Map<string, string>, firmadas: Map<string, string>, destacado: boolean, yo: string, respuestas: RespuestaFila[]): Aviso {
  const autor = perfiles.get(f.autor_id) ?? 'Alguien'
  const ultima = [...respuestas].sort((a, b) => aMillis(b.creada_en) - aMillis(a.creada_en))[0]
  const kicker = f.tipo === 'idea' ? 'PROYECTO' : f.tipo === 'propuesta' ? 'PLAN' : 'HOY'
  return {
    id: f.id, diarioId: f.diario_id, tipo: f.tipo, detalleKicker: kicker, titulo: f.titulo, texto: f.texto,
    fotoUrl: urlDe(f.foto_url, firmadas),
    firma: `PUBLICADO POR ${autor.toUpperCase()} · ${hace(aMillis(f.publicado_en))}`,
    respuesta: ultima ? `RESPONDE ${primerNombre(perfiles.get(ultima.lector_id) ?? 'Alguien').toUpperCase()}: “${ultima.texto.toUpperCase()}”` : null,
    destacado, publicadaEn: aMillis(f.publicado_en), estado: f.estado ?? null,
    puedoResponder: f.tipo === 'propuesta' && f.autor_id !== yo && !respuestas.some((r) => r.lector_id === yo),
  }
}

async function ultimaEdicion(diarioId: string): Promise<Edicion | null> {
  const f = ok<EdicionFila[]>(await supabase.from('ediciones').select('*').eq('diario_id', diarioId).order('fecha', { ascending: false }).limit(1))[0]
  return f ? { id: f.id, diarioId: f.diario_id, numero: f.numero, fecha: f.fecha.slice(0, 10), turno: f.turno, portadaNotaId: f.portada_nota_id ?? null } : null
}

export async function cargarPortada(diarioId: string): Promise<PortadaDatos> {
  const diario = await diarioDe(diarioId)
  const edicion = await ultimaEdicion(diarioId)
  const yo = await uid()
  const avFilas = ok<AvisoFila[]>(await supabase.from('avisos').select('*').eq('diario_id', diarioId).order('publicado_en', { ascending: false }).limit(1))
  const aviso = avFilas[0]
    ? avisoDe(avFilas[0], await nombres([avFilas[0].autor_id]), await firmar(avFilas.map((a) => a.foto_url).filter(Boolean) as string[]), true, yo, [])
    : null
  if (!edicion) return { diario, edicion: null, nota: null, color: null, aviso, breves: [], cartas: 0 }
  const filas = ok<NotaFila[]>(await supabase.from('notas').select('*').eq('edicion_id', edicion.id).order('publicada_en', { ascending: false }))
  const armadas = await armarNotas(filas, diario.ciudad)
  const masReciente = (xs: Nota[]) => xs.reduce<Nota | null>((m, n) => (!m || n.publicadaEn > m.publicadaEn ? n : m), null)
  const principal = armadas.find((n) => n.id === edicion.portadaNotaId && n.tipo === 'nota') ?? masReciente(armadas.filter((n) => n.tipo === 'nota')) ?? masReciente(armadas)
  const color = principal ? armadas.find((n) => n.tipo === 'color' && n.notaPrincipalId === principal.id && n.id !== principal.id) ?? null : null
  const breves = armadas.filter((n) => n.id !== principal?.id && n.id !== color?.id).slice(0, 2).map((n) => ({ id: n.id, titulo: n.titulo, fotoUrl: n.fotoUrl }))
  const cartas = principal ? ok<{ id: string }[]>(await supabase.from('cartas').select('id').eq('nota_id', principal.id)).length : 0
  return { diario, edicion, nota: principal, color, aviso, breves, cartas }
}

export async function cargarNota(notaId: string): Promise<NotaVista | null> {
  const fila = ok<NotaFila[]>(await supabase.from('notas').select('*').eq('id', notaId).limit(1))[0]
  if (!fila) return null
  const diario = await diarioDe(fila.diario_id)
  const relacionadas = fila.edicion_id ? ok<NotaFila[]>(await supabase.from('notas').select('*').eq('edicion_id', fila.edicion_id)) : [fila]
  const armadas = await armarNotas(relacionadas, diario.ciudad)
  const nota = armadas.find((n) => n.id === notaId)
  if (!nota) return null
  const color = armadas.find((n) => n.tipo === 'color' && n.notaPrincipalId === nota.id && n.id !== nota.id)
    ?? armadas.find((n) => nota.notaPrincipalId != null && n.id === nota.notaPrincipalId && n.tipo === 'color') ?? null
  const cFilas = ok<CartaFila[]>(await supabase.from('cartas').select('*').eq('nota_id', nota.id).order('creada_en', { ascending: false }))
  const perf = await nombres(cFilas.map((c) => c.autor_id))
  const cartas = cFilas.map((c) => ({
    id: c.id, notaId: c.nota_id, texto: c.texto,
    autor: primerNombre(perf.get(c.autor_id) ?? 'Alguien').toUpperCase(),
    lugar: (diario.ciudad.trim() || 'DESDE LA REDACCIÓN').toUpperCase(),
  }))
  return { diarioNombre: diario.nombre, diarioId: diario.id, nota, color: color?.id === nota.id ? null : color, cartas, esPropio: diario.esPropio }
}

async function edicionDelDia(diarioId: string): Promise<EdicionFila> {
  const hoy = hoyISO()
  const buscar = async () => ok<EdicionFila[]>(await supabase.from('ediciones').select('*').eq('diario_id', diarioId).eq('fecha', hoy).limit(1))[0]
  const existente = await buscar()
  if (existente) return existente
  const ultima = ok<EdicionFila[]>(await supabase.from('ediciones').select('id,diario_id,numero,fecha,turno').eq('diario_id', diarioId).order('numero', { ascending: false }).limit(1))[0]
  const nueva = { id: crypto.randomUUID(), diario_id: diarioId, numero: (ultima?.numero ?? 0) + 1, fecha: hoy, turno: turnoDe() }
  const { error } = await supabase.from('ediciones').insert(nueva)
  if (error) {
    const otra = await buscar() // carrera con la app: unique (diario_id, fecha)
    if (otra) return otra
    throw new Error(error.message)
  }
  return { ...nueva, portada_nota_id: null }
}

export interface Publicacion {
  tipo: TipoPublicacion; titulo: string; cuerpo: string; epigrafe: string; foto: File | null
  notaAlCostado: boolean; tituloColor: string; cuerpoColor: string; tipoAviso: TipoAviso; diarioId: string; autor: string
}

export async function publicar(p: Publicacion) {
  const yo = await uid()
  if (p.tipo === 'aviso') return publicarAviso(p.diarioId, p.tipoAviso, p.titulo, p.cuerpo, p.foto)
  const edicion = await edicionDelDia(p.diarioId)
  const notaId = crypto.randomUUID()
  let ruta: string | null = null
  if (p.foto) { ruta = `${p.diarioId}/${notaId}.jpg`; await subir(ruta, await comprimir(p.foto)) }
  const esColor = p.tipo === 'color'
  ok(await supabase.from('notas').insert({
    id: notaId, diario_id: p.diarioId, autor_id: yo, tipo: esColor ? 'color' : 'nota', titulo: p.titulo.trim(), bajada: '',
    cuerpo: p.cuerpo.trim(), foto_url: ruta, epigrafe: p.epigrafe.trim(), firma: p.autor,
    seccion: esColor ? 'NOTA DE COLOR' : 'SOCIEDAD', edicion_id: edicion.id,
    nota_principal_id: esColor ? edicion.portada_nota_id ?? null : null,
  }))
  if (!esColor) {
    ok(await supabase.from('ediciones').update({ portada_nota_id: notaId }).eq('id', edicion.id))
    if (p.notaAlCostado && p.tituloColor.trim() && p.cuerpoColor.trim()) {
      ok(await supabase.from('notas').insert({
        id: crypto.randomUUID(), diario_id: p.diarioId, autor_id: yo, tipo: 'color', titulo: p.tituloColor.trim(), bajada: '',
        cuerpo: p.cuerpoColor.trim(), foto_url: null, epigrafe: '', firma: p.autor, seccion: 'NOTA DE COLOR',
        edicion_id: edicion.id, nota_principal_id: notaId,
      }))
    }
  }
}

export async function aplaudir(notaId: string) {
  const yo = await uid()
  const ya = ok<AplausoFila[]>(await supabase.from('aplausos').select('*').eq('nota_id', notaId).eq('lector_id', yo).limit(1))
  if (!ya.length) ok(await supabase.from('aplausos').insert({ nota_id: notaId, lector_id: yo }))
  else ok(await supabase.from('aplausos').delete().eq('nota_id', notaId).eq('lector_id', yo))
}

export async function carta(notaId: string, texto: string) {
  const t = texto.trim()
  if (!t) return
  ok(await supabase.from('cartas').insert({ id: crypto.randomUUID(), nota_id: notaId, autor_id: await uid(), texto: t }))
}

export async function marcarLeida(notaId: string) {
  const { error } = await supabase.from('lecturas').insert({ nota_id: notaId, lector_id: await uid() })
  if (error && !esDuplicado(error)) throw new Error(error.message)
}

// ---------- Avisos (AvisoRepository.kt) ----------
export async function listarAvisos(diarioId: string): Promise<{ nombreDiario: string; esPropio: boolean; avisos: Aviso[] }> {
  const yo = await uid()
  const d = ok<DiarioFila[]>(await supabase.from('diarios').select('*').eq('id', diarioId).limit(1))[0]
  const filas = ok<AvisoFila[]>(await supabase.from('avisos').select('*').eq('diario_id', diarioId).order('publicado_en', { ascending: false }))
  const resp = filas.length ? ok<RespuestaFila[]>(await supabase.from('respuestas_aviso').select('*').in('aviso_id', filas.map((f) => f.id))) : []
  const perf = await nombres([...filas.map((f) => f.autor_id), ...resp.map((r) => r.lector_id)])
  const firmadas = await firmar(filas.map((f) => f.foto_url).filter(Boolean) as string[])
  return {
    nombreDiario: d?.nombre ?? '', esPropio: d?.dueno_id === yo,
    avisos: filas.map((f, i) => avisoDe(f, perf, firmadas, i === 0, yo, resp.filter((r) => r.aviso_id === f.id))),
  }
}

export async function publicarAviso(diarioId: string, tipo: TipoAviso, titulo: string, texto: string, foto: File | null) {
  const id = crypto.randomUUID()
  let ruta: string | null = null
  if (foto) { ruta = `${diarioId}/${id}.jpg`; await subir(ruta, await comprimir(foto)) }
  ok(await supabase.from('avisos').insert({
    id, diario_id: diarioId, autor_id: await uid(), tipo, titulo: titulo.trim(), texto: texto.trim(), foto_url: ruta,
    estado: tipo === 'propuesta' ? 'abierta' : null,
  }))
}

export async function responderAviso(avisoId: string, texto: string) {
  const t = texto.trim()
  if (!t) return
  ok(await supabase.from('respuestas_aviso').insert({ id: crypto.randomUUID(), aviso_id: avisoId, lector_id: await uid(), texto: t }))
}

// ---------- Invitaciones (InvitacionRepository.kt) ----------
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generar(): string {
  const r = crypto.getRandomValues(new Uint32Array(6))
  return Array.from(r, (n) => ALFABETO[n % ALFABETO.length]).join('')
}

export async function crearInvitacion(diarioId: string): Promise<string> {
  await uid()
  for (let i = 0; i < 4; i++) {
    const codigo = generar()
    const { error } = await supabase.from('invitaciones').insert({ id: crypto.randomUUID(), diario_id: diarioId, codigo })
    if (!error) return codigo
    if (!esDuplicado(error)) throw new Error(error.message)
  }
  throw new Error('No pude generar un código. Probá otra vez.')
}

export async function canjear(codigo: string): Promise<string> {
  await uid()
  const { data, error } = await supabase.rpc('canjear_codigo', { p_codigo: codigo.trim().toUpperCase() })
  if (error) throw new Error(error.message)
  activo.set(data as string)
  return data as string
}

// ---------- Tiempo real (TiempoReal.kt) ----------
export async function slugDe(id: string): Promise<string | null> {
  const fila = ok<{ slug: string }[]>(await supabase.from('diarios').select('slug').eq('id', id).limit(1))[0]
  return fila?.slug ?? null
}

export async function buscarPorSlug(slug: string): Promise<{ id: string; slug: string } | null> {
  const limpio = slug.trim().toLowerCase()
  if (!limpio) return null
  const fila = ok<{ id: string; slug: string }[]>(await supabase.from('diarios').select('id,slug').eq('slug', limpio).limit(1))[0]
  return fila ?? null
}

// ---------- Web Push ----------
export type EstadoPush = 'no' | 'off' | 'denegado' | 'on'

function claveVapid(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function estadoPush(): Promise<EstadoPush> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no'
  if (Notification.permission === 'denied') return 'denegado'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

export async function activarPush(): Promise<void> {
  const key = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim()
  if (!key) throw new Error('Falta la clave pública de avisos (VITE_VAPID_PUBLIC_KEY).')
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Este navegador no avisa con la página cerrada.')
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('El navegador no dejó activar los avisos.')
  const reg = await navigator.serviceWorker.register('/sw.js')
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveVapid(key) as BufferSource })
  const json = sub.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('No pude guardar el aviso en este navegador.')
  ok(await supabase.from('push_suscripciones').upsert(
    { usuario_id: await uid(), endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
    { onConflict: 'usuario_id,endpoint' },
  ))
}

export async function cortarPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  ok(await supabase.from('push_suscripciones').delete().eq('usuario_id', await uid()).eq('endpoint', endpoint))
}

export function escuchar(diarioId: string, alCambiar: () => void): () => void {
  const canal = supabase
    .channel(`feedy-web-${diarioId}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notas', filter: `diario_id=eq.${diarioId}` }, alCambiar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos', filter: `diario_id=eq.${diarioId}` }, alCambiar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'aplausos' }, alCambiar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cartas' }, alCambiar)
    .subscribe()
  return () => { supabase.removeChannel(canal) }
}
