import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buscarPorSlug, canjear, cargarPortada, escuchar, slugDe } from '../data'
import { deISO, fechaEdicion, firmaDe, hace, rotulo, TURNO_ETIQUETA } from '../fechas'
import { useDiario } from '../contexto'
import { BottomBar, Cargando, Cuerpo, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'
import { AvisoEnmarcado } from './Avisos'

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
  const { diario, edicion, nota, color, aviso, breves, cartas } = datos

  return (
    <Pagina ancha>
      <Masthead nombre={diario.nombre} lema={diario.lema} />
      <FileteDoble />
      <div className="fila-edicion etiqueta">
        {edicion ? (
          <>
            <span>N.º {edicion.numero}</span>
            <span>{fechaEdicion(deISO(edicion.fecha))}</span>
            <span>{TURNO_ETIQUETA[edicion.turno]}</span>
          </>
        ) : <span style={{ margin: '0 auto' }}>{fechaEdicion(new Date())}</span>}
      </div>
      <FileteDoble />

      <div className="rotativa">
        <article className="carril principal">
          {!nota ? (
            <div className="vacio">
              <h2 className="titular medio">Todavía no hay ediciones.</h2>
              {diario.esPropio ? (
                <>
                  <p className="bajada">Escribí la primera nota.</p>
                  <Link to="/publicar" className="boton-linea">Mandar a imprenta</Link>
                </>
              ) : <p className="bajada">Cuando {diario.nombre} publique, lo vas a ver acá.</p>}
            </div>
          ) : (
            <>
              <div className="kicker">
                <span>Última hora · {nota.seccion}</span>
                {nota.leidoPor && <span className="leido">Leído por {nota.leidoPor}</span>}
              </div>
              <Link to={`/nota/${nota.id}`}><h2 className="titular">{nota.titulo}</h2></Link>
              {nota.bajada && <p className="bajada">{nota.bajada}</p>}
              <p className="firma">{firmaDe(nota.autor, nota.ciudad, hace(nota.publicadaEn))}</p>
              {nota.fotoUrl && <Link to={`/nota/${nota.id}`}><img className="foto ancha" src={nota.fotoUrl} alt="" /></Link>}
              {nota.epigrafe && <p className="epigrafe">{nota.epigrafe}</p>}
              <Link to={`/nota/${nota.id}`}><Cuerpo texto={nota.entradilla} capitular /></Link>
              <div className="acciones">
                <Link to={`/nota/${nota.id}`} className={nota.aplaudido ? 'activo' : ''}>Aplausos · {nota.aplausos}</Link>
                <Link to={`/nota/${nota.id}#cartas`}>{rotulo(cartas, 'carta', 'cartas')}</Link>
                <Link to={`/nota/${nota.id}`}>Leer nota</Link>
              </div>
            </>
          )}
        </article>

        <aside className={'carril color' + (color ? '' : ' hueco')}>
          {color ? (
            <>
              <p className="etiqueta">Nota de color</p>
              {color.fotoUrl && <img className="foto" src={color.fotoUrl} alt="" style={{ aspectRatio: '1' }} />}
              <h3 className="titular chico">{color.titulo}</h3>
              <Cuerpo texto={color.entradilla} />
            </>
          ) : <p className="carril-vacio">En esta edición no hay nota de color.</p>}
        </aside>

        <aside className={'carril aviso' + (aviso ? '' : ' hueco')}>
          {aviso ? <Link to="/avisos"><AvisoEnmarcado aviso={aviso} /></Link> : <p className="carril-vacio">En esta edición no hay aviso.</p>}
        </aside>

        <section className={'carril breves' + (breves.length ? '' : ' hueco')}>
          {breves.length > 0 ? (
            <>
              <p className="etiqueta">Noticias breves</p>
              <div className="breves">
                {breves.map((b) => (
                  <Link key={b.id} to={`/nota/${b.id}`}>
                    {b.fotoUrl && <img className="foto" src={b.fotoUrl} alt="" />}
                    <h4 className="titular chico">{b.titulo}</h4>
                  </Link>
                ))}
              </div>
            </>
          ) : <p className="carril-vacio">En esta edición no hay breves.</p>}
        </section>
      </div>
      <BottomBar />
    </Pagina>
  )
}
