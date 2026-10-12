import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cargarPortada, escuchar } from '../data'
import { deISO, fechaEdicion, firmaDe, hace, rotulo, TURNO_ETIQUETA } from '../fechas'
import { useDiario } from '../contexto'
import { BottomBar, Cargando, Cuerpo, ErrorCaja, FileteDoble, Filete, Masthead, Pagina, useCarga } from '../ui'
import { AvisoEnmarcado } from './Avisos'

export default function Portada() {
  const { diarioId } = useDiario()
  const { datos, error, cargando, recargar } = useCarga(() => cargarPortada(diarioId), [diarioId])
  useEffect(() => escuchar(diarioId, recargar), [diarioId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (datos) document.title = datos.diario.nombre }, [datos])

  if (cargando && !datos) return <><Cargando /><BottomBar /></>
  if (error && !datos) return <Pagina><ErrorCaja mensaje={error} /><BottomBar /></Pagina>
  if (!datos) return null
  const { diario, edicion, nota, color, aviso, breves, cartas } = datos

  return (
    <Pagina>
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
        <article>
          <div className="kicker">
            <span>Última hora · {nota.seccion}</span>
            {nota.leidoPor && <span className="leido">Leído por {nota.leidoPor}</span>}
          </div>
          <Link to={`/nota/${nota.id}`}><h2 className="titular">{nota.titulo}</h2></Link>
          {nota.bajada && <p className="bajada">{nota.bajada}</p>}
          <p className="firma">{firmaDe(nota.autor, nota.ciudad, hace(nota.publicadaEn))}</p>
          <div className={color ? 'columnas' : ''}>
            <div>
              {nota.fotoUrl && <Link to={`/nota/${nota.id}`}><img className="foto ancha" src={nota.fotoUrl} alt="" /></Link>}
              {nota.epigrafe && <p className="epigrafe">{nota.epigrafe}</p>}
              <Link to={`/nota/${nota.id}`}><Cuerpo texto={nota.entradilla} capitular /></Link>
            </div>
            {color && (
              <aside>
                <p className="etiqueta">Nota de color</p>
                {color.fotoUrl && <img className="foto" src={color.fotoUrl} alt="" style={{ aspectRatio: '1' }} />}
                <h3 className="titular chico">{color.titulo}</h3>
                <Cuerpo texto={color.entradilla} />
              </aside>
            )}
          </div>
          <div className="acciones">
            <Link to={`/nota/${nota.id}`} className={nota.aplaudido ? 'activo' : ''}>👏 {nota.aplausos}</Link>
            <Link to={`/nota/${nota.id}#cartas`}>{rotulo(cartas, 'carta', 'cartas')}</Link>
            <Link to={`/nota/${nota.id}`}>Leer nota</Link>
          </div>
        </article>
      )}

      {aviso && <Link to="/avisos"><AvisoEnmarcado aviso={aviso} /></Link>}

      {breves.length > 0 && (
        <section>
          <Filete />
          <p className="etiqueta">Noticias breves</p>
          <div className="breves">
            {breves.map((b) => (
              <Link key={b.id} to={`/nota/${b.id}`}>
                {b.fotoUrl && <img className="foto" src={b.fotoUrl} alt="" />}
                <h4 className="titular chico">{b.titulo}</h4>
              </Link>
            ))}
          </div>
        </section>
      )}
      <BottomBar />
    </Pagina>
  )
}
