import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aplaudir, carta, cargarNota, escuchar, marcarLeida } from '../data'
import { fechaCorta, firmaDe, rotulo } from '../fechas'
import { Cargando, Cuerpo, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'

export default function NotaScreen() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { datos, error, cargando, recargar } = useCarga(() => cargarNota(id), [id])
  const [texto, setTexto] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const diarioId = datos?.diarioId

  useEffect(() => { if (id) marcarLeida(id).catch(() => {}) }, [id])
  useEffect(() => (diarioId ? escuchar(diarioId, recargar) : undefined), [diarioId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Pagina completa><ErrorCaja mensaje={error} /></Pagina>
  if (!datos) return <Pagina completa><p className="vacio">Esa nota no está en el archivo.</p><Link className="link" to="/">Volver</Link></Pagina>
  const { nota, color, cartas, diarioNombre } = datos

  const toggle = async () => { try { await aplaudir(nota.id); recargar() } catch (e) { setErr((e as Error).message) } }
  const enviar = async () => {
    try { await carta(nota.id, texto); setTexto(''); recargar() } catch (e) { setErr((e as Error).message) }
  }

  return (
    <Pagina completa>
      <div className="topbar">
        <button className="link" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))}>← Volver</button>
        <Masthead nombre={diarioNombre} chico />
        <span className="etiqueta suave">Pág. 3</span>
      </div>
      <p className="kicker"><span>{nota.seccion}</span>{nota.leidoPor && <span className="leido">Leído por {nota.leidoPor}</span>}</p>
      <h1 className="titular">{nota.titulo}</h1>
      {nota.bajada && <p className="bajada">{nota.bajada}</p>}
      <p className="firma">{firmaDe(nota.autor, nota.ciudad, fechaCorta(new Date(nota.publicadaEn)))}</p>
      {nota.fotoUrl && <img className="foto ancha" src={nota.fotoUrl} alt="" />}
      {nota.epigrafe && <p className="epigrafe">{nota.epigrafe}</p>}
      <div className={color ? 'columnas' : ''} style={{ marginTop: 12 }}>
        <Cuerpo texto={nota.cuerpo} capitular />
        {color && (
          <aside>
            <p className="etiqueta">Nota de color</p>
            {color.fotoUrl && <img className="foto" src={color.fotoUrl} alt="" />}
            <h3 className="titular chico">{color.titulo}</h3>
            <Cuerpo texto={color.cuerpo} />
          </aside>
        )}
      </div>
      <div className="acciones">
        <button className={nota.aplaudido ? 'activo' : ''} onClick={toggle}>
          👏 {nota.aplaudido ? 'Aplaudiste' : 'Aplaudir'} · {nota.aplausos}
        </button>
        <a href="#cartas">{rotulo(cartas.length, 'carta', 'cartas')}</a>
      </div>
      {err && <ErrorCaja mensaje={err} />}
      <section id="cartas">
        <FileteDoble />
        <h2 className="titular medio">Cartas al editor</h2>
        {cartas.length === 0 && <p className="epigrafe">Todavía nadie escribió. Sé la primera carta.</p>}
        {cartas.map((c) => (
          <div className="carta" key={c.id}>
            <p>“{c.texto}”</p>
            <span className="firma">— {c.autor} · {c.lugar}</span>
          </div>
        ))}
        <label className="campo">
          <span>Escribí una carta</span>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} style={{ minHeight: 90 }} />
        </label>
        <button className="boton-tinta" disabled={!texto.trim()} onClick={enviar}>Mandar carta</button>
      </section>
    </Pagina>
  )
}
