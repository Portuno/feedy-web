import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buscarPorSlug, canjear, cargarPortada, escuchar, slugDe } from '../data'
import { useDiario } from '../contexto'
import { BottomBar, Cargando, ErrorCaja, Pagina, useCarga } from '../ui'
import { EdicionVista } from './EdicionVista'

function MesaAjena() {
  const nav = useNavigate()
  const { elegir } = useDiario()
  const [canje, setCanje] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function leer() {
    setErr(null)
    setEnviando(true)
    try {
      const id = await canjear(canje)
      const s = await slugDe(id)
      if (!s) throw new Error('Ese diario todavía no tiene dirección.')
      elegir(id, s)
      nav(`/${s}`, { replace: true })
    } catch (e) { setErr((e as Error).message) }
    finally { setEnviando(false) }
  }

  return (
    <Pagina>
      <h1 className="titular" style={{ textAlign: 'center' }}>Este diario no está en tu mesa.</h1>
      <p className="bajada" style={{ textAlign: 'center' }}>La dirección sola no abre nada. Si te invitaron, escribí el código.</p>
      <div className="punteado">
        <span className="etiqueta">Código de 6 caracteres</span>
        <label className="campo" style={{ maxWidth: 260, margin: '10px auto' }}>
          <span>Código</span>
          <input value={canje} maxLength={6} style={{ textAlign: 'center', letterSpacing: '.3em', textTransform: 'uppercase' }} onChange={(e) => setCanje(e.target.value.toUpperCase())} />
        </label>
        <button className="boton-linea" disabled={canje.trim().length !== 6 || enviando} onClick={leer}>Empezar a leer</button>
      </div>
      {err && <ErrorCaja mensaje={err} />}
      <p style={{ textAlign: 'center' }}><Link to="/diarios" className="link">Volver a mis diarios</Link></p>
      <BottomBar />
    </Pagina>
  )
}

export default function Portada() {
  const { slug: slugUrl } = useParams()
  const { diarioId, slug, elegir } = useDiario()
  const [fuera, setFuera] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  const coincide = !slugUrl || slug === slugUrl
  const id = coincide ? diarioId : ''
  const { datos, error, cargando, recargar } = useCarga(() => (id ? cargarPortada(id) : Promise.resolve(null)), [id])

  useEffect(() => {
    if (!slugUrl || slugUrl === slug) { setFuera(false); setFallo(null); return }
    let vivo = true
    setFuera(false)
    setFallo(null)
    buscarPorSlug(slugUrl)
      .then((d) => {
        if (!vivo) return
        if (!d) setFuera(true)
        else elegir(d.id, d.slug)
      })
      .catch((e) => vivo && setFallo((e as Error).message))
    return () => { vivo = false }
  }, [slugUrl, slug, elegir])

  useEffect(() => { if (!id) return; return escuchar(id, recargar) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (datos) document.title = datos.diario.nombre }, [datos])

  if (fallo) return <Pagina><ErrorCaja mensaje={fallo} /><BottomBar /></Pagina>
  if (fuera && slug !== slugUrl) return <MesaAjena />
  if (!coincide || (cargando && !datos)) return <><Cargando /><BottomBar /></>
  if (error && !datos) return <Pagina><ErrorCaja mensaje={error} /><BottomBar /></Pagina>
  if (!datos) return null
  return (
    <Pagina ancha>
      <EdicionVista datos={datos} />
      <BottomBar />
    </Pagina>
  )
}
