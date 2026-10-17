import { Link, useParams } from 'react-router-dom'
import { cargarEdicion, listarArchivo } from '../data'
import { deISO, fechaEdicion, rotulo, TURNO_ETIQUETA } from '../fechas'
import { useDiario } from '../contexto'
import { BottomBar, Cargando, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'
import { EdicionVista } from './EdicionVista'

function Lista() {
  const { diarioId } = useDiario()
  const { datos, error, cargando } = useCarga(() => (diarioId ? listarArchivo(diarioId) : Promise.resolve(null)), [diarioId])
  if (cargando && !datos) return <><Cargando /><BottomBar /></>
  if (error && !datos) return <Pagina><ErrorCaja mensaje={error} /><BottomBar /></Pagina>
  if (!datos) return null
  const { diario, lineas } = datos
  return (
    <Pagina>
      <p className="etiqueta" style={{ textAlign: 'center', marginBottom: 0 }}>Hemeroteca</p>
      <Masthead nombre={diario.nombre} lema={diario.lema} chico />
      <FileteDoble />
      {lineas.length === 0 ? (
        <div className="vacio">
          <h2 className="titular medio">El archivo está en blanco.</h2>
          <p className="bajada">Cada nota abre la edición de ese día. Después queda acá, con su número y su fecha.</p>
          {diario.esPropio && <Link to="/publicar" className="boton-linea">Mandar a imprenta</Link>}
        </div>
      ) : (
        <>
          <p className="firma" style={{ textAlign: 'center' }}>{rotulo(lineas.length, 'edición', 'ediciones')}</p>
          <div className="hemeroteca">
            {lineas.map((l) => (
              <Link key={l.edicion.id} to={`/archivo/${l.edicion.id}`}>
                <div className="fila-edicion etiqueta">
                  <span>N.º {l.edicion.numero}</span>
                  <span>{fechaEdicion(deISO(l.edicion.fecha))}</span>
                  <span>{TURNO_ETIQUETA[l.edicion.turno]}</span>
                </div>
                <h2 className="titular chico">{l.titular ?? 'Edición sin notas'}</h2>
                <p className="firma">{rotulo(l.notas, 'nota', 'notas')}</p>
              </Link>
            ))}
          </div>
        </>
      )}
      <BottomBar />
    </Pagina>
  )
}

function Una({ id }: { id: string }) {
  const { datos, error, cargando } = useCarga(() => cargarEdicion(id), [id])
  if (cargando && !datos) return <><Cargando /><BottomBar /></>
  if (error && !datos) return <Pagina><ErrorCaja mensaje={error} /><BottomBar /></Pagina>
  if (!datos) {
    return (
      <Pagina>
        <p className="vacio">Esa edición no está en el archivo.</p>
        <p style={{ textAlign: 'center' }}><Link className="link" to="/archivo">Volver a la hemeroteca</Link></p>
        <BottomBar />
      </Pagina>
    )
  }
  return (
    <Pagina ancha>
      <div className="topbar">
        <Link className="link" to="/archivo">← Archivo</Link>
        <span className="etiqueta" style={{ textAlign: 'center' }}>Hemeroteca</span>
        <span />
      </div>
      <EdicionVista datos={datos} archivo />
      <BottomBar />
    </Pagina>
  )
}

export default function Archivo() {
  const { id } = useParams()
  return id ? <Una id={id} /> : <Lista />
}
