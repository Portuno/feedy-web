import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { avisosLectura, canjear, crearInvitacion, salir, tablero, type Diario } from '../data'
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

  if (cargando && !datos) return <><Cargando /><BottomBar /></>
  if (!datos) return <Pagina><ErrorCaja mensaje={error ?? 'No pude cargar tus diarios.'} /><BottomBar /></Pagina>
  const { propio, lecturas, corresponsal } = datos
  const abrir = (id: string) => { elegir(id); nav('/') }

  async function invitar() {
    if (!propio) return
    setErr(null)
    try {
      const c = await crearInvitacion(propio.id)
      setCodigo(c)
      const texto = `Te invito a leer ${propio.nombre}. Abrí la app, andá a Mis diarios → Leer un diario y escribí el código ${c}.`
      if (navigator.share) { await navigator.share({ title: propio.nombre, text: texto }).catch(() => {}) }
      else { await navigator.clipboard.writeText(texto); setAviso('Copiamos la invitación. Pegala donde quieras.') }
    } catch (e) { setErr((e as Error).message) }
  }

  async function leer() {
    setErr(null)
    try { const id = await canjear(canje); setCanje(''); abrir(id) } catch (e) { setErr((e as Error).message) }
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
          <Tarjeta d={propio} alAbrir={() => abrir(propio.id)} />
          <p className="epigrafe">{propio.compartidoCon ? `Lo lee ${propio.compartidoCon}.` : 'Todavía no lo lee nadie.'}</p>
          <div className="fila">
            <button className="boton-linea" style={{ flex: 1 }} onClick={invitar}>Invitar a leer</button>
            <Link className="boton-linea" style={{ flex: 1 }} to="/diarios/editar">Editar</Link>
          </div>
          {codigo && <div className="recuadro" style={{ textAlign: 'center' }}><span className="etiqueta">Código de invitación</span><h2 className="titular" style={{ letterSpacing: '.2em' }}>{codigo}</h2><p className="epigrafe">Vale una vez, por 30 días.</p></div>}
          {aviso && <p className="epigrafe">{aviso}</p>}
        </>
      )}

      <FileteDoble />
      <p className="etiqueta">Diarios que leés</p>
      {lecturas.length === 0 && <p className="epigrafe">Todavía no leés ningún diario.</p>}
      {lecturas.map((d) => <Tarjeta key={d.id} d={d} alAbrir={() => abrir(d.id)} />)}

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
      <button className="link" onClick={() => salir()}>Cerrar sesión</button>
      <BottomBar />
    </Pagina>
  )
}
