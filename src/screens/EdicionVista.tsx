import { Link } from 'react-router-dom'
import type { PortadaDatos } from '../data'
import { deISO, fechaEdicion, firmaDe, hace, rotulo, TURNO_ETIQUETA } from '../fechas'
import { Cuerpo, FileteDoble, Masthead } from '../ui'
import { AvisoEnmarcado } from './Avisos'

export function EdicionVista({ datos, archivo }: { datos: PortadaDatos; archivo?: boolean }) {
  const { diario, edicion, nota, color, aviso, breves, cartas } = datos
  return (
    <>
      <Masthead nombre={diario.nombre} lema={diario.lema} />
      <FileteDoble />
      <div className="fila-edicion etiqueta">
        {edicion ? (
          <>
            {archivo ? <span>N.º {edicion.numero}</span> : <Link to="/archivo">N.º {edicion.numero}</Link>}
            <span>{fechaEdicion(deISO(edicion.fecha))}</span>
            <span>{TURNO_ETIQUETA[edicion.turno]}</span>
          </>
        ) : <span style={{ margin: '0 auto' }}>{fechaEdicion(new Date())}</span>}
      </div>
      <FileteDoble />

      <div className={'rotativa' + (archivo ? ' archivo' : '')}>
        <article className="carril principal">
          {!nota ? (
            <div className="vacio">
              {archivo ? (
                <>
                  <h2 className="titular medio">Esta edición salió sin notas.</h2>
                  <p className="bajada">Quedó en el archivo igual.</p>
                </>
              ) : (
                <>
                  <h2 className="titular medio">Todavía no hay ediciones.</h2>
                  {diario.esPropio ? (
                    <>
                      <p className="bajada">Escribí la primera nota. Eso abre la edición del día.</p>
                      <Link to="/publicar" className="boton-linea">Mandar a imprenta</Link>
                    </>
                  ) : <p className="bajada">Cuando {diario.nombre} publique, lo vas a ver acá.</p>}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="kicker">
                <span>{archivo ? nota.seccion : `Última hora · ${nota.seccion}`}</span>
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

        {!archivo && (
          <aside className={'carril aviso' + (aviso ? '' : ' hueco')}>
            {aviso ? <Link to="/avisos"><AvisoEnmarcado aviso={aviso} /></Link> : <p className="carril-vacio">En esta edición no hay aviso.</p>}
          </aside>
        )}

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
    </>
  )
}
