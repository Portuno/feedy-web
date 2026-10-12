// Espejo de data/Fechas.kt de la app Android.
const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const DIAS_CORTOS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export type Turno = 'manana' | 'tarde' | 'noche'
export const TURNO_ETIQUETA: Record<Turno, string> = { manana: 'EDICIÓN MAÑANA', tarde: 'EDICIÓN TARDE', noche: 'EDICIÓN NOCHE' }

const diaSemana = (d: Date) => (d.getDay() + 6) % 7 // lunes = 0

/** Fecha local YYYY-MM-DD, igual que LocalDate.now().toString() en Android. */
export function hoyISO(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function deISO(fecha: string): Date {
  const [y, m, d] = fecha.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fechaEdicion(fecha: Date): string {
  return `${DIAS[diaSemana(fecha)]} ${fecha.getDate()} DE ${MESES[fecha.getMonth()]} DE ${fecha.getFullYear()}`
}

export function fechaCorta(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${DIAS_CORTOS[diaSemana(d)]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}, ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function aMillis(valor?: string | null): number {
  if (!valor) return Date.now()
  const t = Date.parse(valor.trim().replace(' ', 'T'))
  return Number.isNaN(t) ? Date.now() : t
}

export function hace(ms: number, ahora = Date.now()): string {
  const min = Math.max(0, Math.floor((ahora - ms) / 60000))
  if (min < 1) return 'AHORA'
  if (min < 60) return `HACE ${min} MIN`
  if (min < 60 * 24) return `HACE ${Math.floor(min / 60)} H`
  if (min < 60 * 48) return 'AYER'
  return `HACE ${Math.floor(min / (60 * 24))} D`
}

export function esHoy(ms: number): boolean {
  return hoyISO(new Date(ms)) === hoyISO()
}

export function turnoDe(d = new Date()): Turno {
  const h = d.getHours()
  if (h <= 11) return 'manana'
  if (h <= 18) return 'tarde'
  return 'noche'
}

export const rotulo = (n: number, s: string, p: string) => (n === 1 ? `1 ${s}` : `${n} ${p}`)

export function entradillaDe(cuerpo: string): string {
  const parrafo = cuerpo.split('\n\n')[0].trim()
  if (parrafo.length <= 420) return parrafo
  const idx = parrafo.lastIndexOf(' ', 400)
  const corte = idx > 180 ? idx : 400
  return parrafo.slice(0, corte).trimEnd() + '…'
}

export function primerNombre(nombre: string): string {
  const t = nombre.trim()
  return t.split(' ')[0] || t || 'Alguien'
}

export function firmaDe(autor: string, ciudad: string, cuando: string): string {
  const lugar = ciudad.trim()
  return `POR ${autor.toUpperCase()}${lugar ? ' · ' + lugar.toUpperCase() : ''} · ${cuando}`
}
