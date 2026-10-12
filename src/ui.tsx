import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export function Masthead({ nombre, lema, chico }: { nombre: string; lema?: string; chico?: boolean }) {
  return (
    <header className={'masthead' + (chico ? ' chico' : '')}>
      <h1>{nombre || ' '}</h1>
      {lema && !chico ? <p className="lema">{lema}</p> : null}
    </header>
  )
}
export const FileteDoble = () => <div className="filete-doble" />
export const Filete = () => <div className="filete" />

export function Cuerpo({ texto, capitular }: { texto: string; capitular?: boolean }) {
  const ps = texto.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  return <div className={'cuerpo' + (capitular ? ' capitular' : '')}>{ps.map((p, i) => <p key={i}>{p}</p>)}</div>
}

export function Campo(props: { etiqueta: string; valor: string; onChange: (v: string) => void; tipo?: string; multilinea?: boolean; placeholder?: string; autoComplete?: string; maxLength?: number }) {
  return (
    <label className="campo">
      <span>{props.etiqueta}</span>
      {props.multilinea ? (
        <textarea value={props.valor} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input type={props.tipo ?? 'text'} value={props.valor} placeholder={props.placeholder} autoComplete={props.autoComplete} maxLength={props.maxLength} onChange={(e) => props.onChange(e.target.value)} />
      )}
    </label>
  )
}

export function BottomBar() {
  const loc = useLocation()
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'activa' : '')
  return (
    <div className="bottombar">
      <nav>
        <NavLink to="/" end className={cls}>Portada</NavLink>
        <NavLink to="/archivo" className={cls}>Archivo</NavLink>
        <NavLink to="/publicar" className="publicar" aria-label="Publicar" state={{ desde: loc.pathname }}>+</NavLink>
        <NavLink to="/avisos" className={cls}>Avisos</NavLink>
        <NavLink to="/diarios" className={cls}>Perfil</NavLink>
      </nav>
    </div>
  )
}

export const Cargando = () => <div className="cargando">Entrando a la imprenta…</div>
export const ErrorCaja = ({ mensaje }: { mensaje: string }) => <div className="error">{mensaje}</div>

/** Carga asíncrona con estados Cargando / Contenido / Error, y recarga silenciosa. */
export function useCarga<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const vivo = useRef(true)
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    try { const d = await fn(); if (vivo.current) { setDatos(d); setError(null) } }
    catch (e) { if (vivo.current) setError((e as Error).message) }
    finally { if (vivo.current) setCargando(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { vivo.current = true; cargar(); return () => { vivo.current = false } }, [cargar])
  return { datos, error, cargando, recargar: () => cargar(true) }
}

export function Pagina({ children, completa }: { children: ReactNode; completa?: boolean }) {
  return <main className={'hoja' + (completa ? ' completa' : '')}>{children}</main>
}
