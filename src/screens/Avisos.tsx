import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { escuchar, listarAvisos, responderAviso, type Aviso } from '../data'
import { useDiario } from '../contexto'
import { BottomBar, Cargando, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'

export function AvisoEnmarcado({ aviso }: { aviso: Aviso }) {
  return (
    <div className="enmarcado">
      <p className="kicker" style={{ marginTop: 0 }}><span>Aviso · {aviso.tipo}</span><span className="suave">{aviso.detalleKicker}</span></p>
      <h3 className="titular medio" style={{ margin: '2px 0 6px' }}>{aviso.titulo}</h3>
      {aviso.fotoUrl && <img className="foto" src={aviso.fotoUrl} alt="" style={{ margin: '8px 0' }} />}
      {aviso.texto && <p style={{ margin: '0 0 8px' }}>{aviso.texto}</p>}
      <p className="firma" style={{ marginBottom: 0 }}>{aviso.firma}</p>
      {aviso.respuesta && <p className="etiqueta" style={{ marginTop: 8 }}>{aviso.respuesta}</p>}
    </div>
  )
}

function AvisoItem({ aviso, alResponder }: { aviso: Aviso; alResponder: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const responder = async (t: string) => {
    try { await responderAviso(aviso.id, t); setAbierto(false); alResponder() } catch (e) { setErr((e as Error).message) }
  }
  const cuerpo = (
    <>
      <p className="kicker" style={{ marginTop: 0 }}><span>{aviso.tipo}</span><span className="suave">{aviso.detalleKicker}</span></p>
      <h3 className={'titular ' + (aviso.destacado ? 'medio' : 'chico')}>{aviso.titulo}</h3>
      {aviso.fotoUrl && <img className="foto" src={aviso.fotoUrl} alt="" style={{ margin: '8px 0' }} />}
      {aviso.texto && <p style={{ margin: '0 0 8px' }}>{aviso.texto}</p>}
      <p className="firma">{aviso.firma}</p>
      {aviso.respuesta && <p className="etiqueta">{aviso.respuesta}</p>}
      {aviso.puedoResponder && !abierto && (
        <div className="fila" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <button className="boton-linea" onClick={() => responder('Me anoto')}>Me anoto</button>
          <button className="link" onClick={() => setAbierto(true)}>Responder otra cosa</button>
        </div>
      )}
      {abierto && (
        <div>
          <label className="campo"><span>Tu respuesta</span><input value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
          <button className="boton-tinta" disabled={!texto.trim()} onClick={() => responder(texto)}>Responder</button>
        </div>
      )}
      {err && <ErrorCaja mensaje={err} />}
    </>
  )
  return aviso.destacado ? <div className="enmarcado">{cuerpo}</div> : <div className="recuadro">{cuerpo}</div>
}

export default function Avisos() {
  const { diarioId } = useDiario()
  const { datos, error, cargando, recargar } = useCarga(() => listarAvisos(diarioId), [diarioId])
  useEffect(() => escuchar(diarioId, recargar), [diarioId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Pagina>
      <Masthead nombre={datos?.nombreDiario ?? ''} chico />
      <FileteDoble />
      <h1 className="titular" style={{ textAlign: 'center' }}>Avisos y proyectos</h1>
      <p className="epigrafe" style={{ textAlign: 'center' }}>Novedades, ideas y propuestas de la casa.</p>
      {cargando && !datos && <Cargando />}
      {error && <ErrorCaja mensaje={error} />}
      {datos && datos.avisos.length === 0 && <p className="vacio epigrafe">Todavía no hay avisos.</p>}
      {datos?.avisos.map((a) => <AvisoItem key={a.id} aviso={a} alResponder={recargar} />)}
      {datos?.esPropio && (
        <Link to="/publicar?tipo=aviso" className="punteado">
          <span className="etiqueta">+ Publicar un aviso</span>
          <p className="epigrafe" style={{ margin: '4px 0 0' }}>Una novedad, una idea o una propuesta.</p>
        </Link>
      )}
      <BottomBar />
    </Pagina>
  )
}
