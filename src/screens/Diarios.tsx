import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { activarPush, avisosLectura, canjear, cortarPush, crearInvitacion, estadoPush, salir, slugDe, tablero, type Diario, type EstadoPush } from '../data'
import { useDiario } from '../contexto'
import { BottomBar, Cargando, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'

function Tarjeta({ d, alAbrir }: { d: Diario; alAbrir: () => void }) {
  return (
    <button className="recuadro" style={{ width: '100%', textAlign: 'left' }} onClick={alAbrir}>
      <Masthead nombre={d.nombre} chico />
      <p className="firma" style={{ textAlign: 'center', margin: '6px 0 0' }}>
        {d.esPropio ? 'Lo hacés vos' : `Lo hace ${d.creadoPor}`} · {d.edicionesPublicadas} ediciones
        {d.ultimaEdicionHace ? ` · última ${d.ultimaEdicionHace.toLowerCase()}` : ''}
      </p>
    </button>
  )
}

export default function Diarios() {
  const nav = useNavigate()
  const { elegir } = useDiario()
  const { datos, error, cargando, recargar } = useCarga(() => tablero(), [])
  const [codigo, setCodigo] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [canje, setCanje] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [push, setPush] = useState<EstadoPush | 'cargando'>('cargando')
  const [pushOcupado, setPushOcupado] = useState(false)

  useEffect(() => { estadoPush().then(setPush).catch(() => setPush('no')) }, [])

  if (cargando && !datos) return <><Cargando /><BottomBar /></>
  if (!datos) return <Pagina><ErrorCaja mensaje={error ?? 'No pude cargar tus diarios.'} /><BottomBar /></Pagina>
  const { propio, lecturas, corresponsal } = datos
  const abrir = (d: Diario) => { elegir(d.id, d.slug); nav(`/${d.slug}`) }

  async function invitar() {
    if (!propio) return
    setErr(null)
    try {
      const c = await crearInvitacion(propio.id)
      setCodigo(c)
      const url = `${location.origin}/${propio.slug}`
      const texto = `Te invito a leer ${propio.nombre}. Entrá en ${url} con tu cuenta y, si todavía no lo leés, escribí el código ${c}.`
      if (navigator.share) { await navigator.share({ title: propio.nombre, text: texto }).catch(() => {}) }
      else { await navigator.clipboard.writeText(texto); setAviso('Copiamos la invitación. Pegala donde quieras.') }
    } catch (e) { setErr((e as Error).message) }
  }

  async function leer() {
    setErr(null)
    try {
      const id = await canjear(canje)
      const s = await slugDe(id)
      setCanje('')
      if (!s) throw new Error('Ese diario todavía no tiene dirección.')
      elegir(id, s)
      nav(`/${s}`)
    } catch (e) { setErr((e as Error).message) }
  }

  async function cambiarPush(quiere: boolean) {
    setErr(null)
    setPushOcupado(true)
    try {
      if (quiere) { await activarPush(); setPush('on') }
      else { await cortarPush(); setPush('off') }
    } catch (e) { setErr((e as Error).message); setPush(await estadoPush().catch(() => 'off' as EstadoPush)) }
    finally { setPushOcupado(false) }
  }

  return (
    <Pagina>
      <h1 className="titular" style={{ textAlign: 'center' }}>Mis diarios</h1>
      <FileteDoble />
      <div className="enmarcado" style={{ textAlign: 'center' }}>
        <h2 className="titular medio" style={{ margin: 0 }}>{corresponsal.nombre}</h2>
        <p className="epigrafe">{corresponsal.linea}</p>
        <div className="stats">
          <div><b>{corresponsal.notas}</b><span className="etiqueta">Notas</span></div>
          <div><b>{corresponsal.aplausos}</b><span className="etiqueta">Aplausos</span></div>
          <div><b>{corresponsal.cartas}</b><span className="etiqueta">Cartas</span></div>
        </div>
      </div>

      <p className="etiqueta">Tu diario</p>
      {propio && (
        <>
          <Tarjeta d={propio} alAbrir={() => abrir(propio)} />
          <p className="epigrafe" style={{ textAlign: 'center' }}>{location.host}/{propio.slug}</p>
          <p className="epigrafe">{propio.compartidoCon ? `Lo lee ${propio.compartidoCon}.` : 'Todavía no lo lee nadie.'}</p>
          <div className="fila">
            <button className="boton-linea" style={{ flex: 1 }} onClick={invitar}>Invitar a leer</button>
            <Link className="boton-linea" style={{ flex: 1 }} to="/diarios/editar">Editar</Link>
          </div>
          {codigo && <div className="recuadro" style={{ textAlign: 'center' }}><span className="etiqueta">Código de invitación</span><h2 className="titular" style={{ letterSpacing: '.2em' }}>{codigo}</h2><p className="epigrafe">{location.origin}/{propio.slug}</p><p className="epigrafe">Vale una vez, por 30 días.</p></div>}
          {aviso && <p className="epigrafe">{aviso}</p>}
        </>
      )}

      <FileteDoble />
      <p className="etiqueta">Diarios que leés</p>
      {lecturas.length === 0 && <p className="epigrafe">Todavía no leés ningún diario.</p>}
      {lecturas.map((d) => <Tarjeta key={d.id} d={d} alAbrir={() => abrir(d)} />)}

      <div className="punteado">
        <span className="etiqueta">+ Leer un diario</span>
        <label className="campo" style={{ maxWidth: 260, margin: '10px auto' }}>
          <span>Código de 6 caracteres</span>
          <input value={canje} maxLength={6} style={{ textAlign: 'center', letterSpacing: '.3em', textTransform: 'uppercase' }} onChange={(e) => setCanje(e.target.value.toUpperCase())} />
        </label>
        <button className="boton-linea" disabled={canje.trim().length !== 6} onClick={leer}>Empezar a leer</button>
      </div>
      {err && <ErrorCaja mensaje={err} />}

      <FileteDoble />
      <label className="fila" style={{ margin: '12px 0' }}>
        <span><span className="etiqueta">Avisos de lectura</span><br /><span className="epigrafe">Que sepan cuándo leíste su nota.</span></span>
        <input type="checkbox" checked={corresponsal.avisosLectura} onChange={async (e) => { await avisosLectura(e.target.checked).catch((x) => setErr(x.message)); recargar() }} />
      </label>
      <label className="fila" style={{ margin: '12px 0' }}>
        <span>
          <span className="etiqueta">Avisame cuando haya edición</span><br />
          <span className="epigrafe">
            {push === 'on'
              ? 'Activado en este navegador. Llega aunque la página esté cerrada.'
              : push === 'no'
                ? 'Este navegador no avisa con la página cerrada.'
                : push === 'denegado'
                  ? 'El navegador bloqueó los avisos. Habilitalos en el candado de la barra.'
                  : 'Llega aunque tengas la página cerrada. En el iPhone, solo si el sitio está en el inicio.'}
          </span>
        </span>
        <input
          type="checkbox"
          checked={push === 'on'}
          disabled={push === 'no' || push === 'denegado' || push === 'cargando' || pushOcupado}
          onChange={(e) => cambiarPush(e.target.checked)}
        />
      </label>
      <button className="link" onClick={() => salir()}>Cerrar sesión</button>
      <BottomBar />
    </Pagina>
  )
}
