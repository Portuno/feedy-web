import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { actualizarDiario, tablero } from '../data'
import { Campo, Cargando, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'

export default function Editar() {
  const nav = useNavigate()
  const { datos, cargando } = useCarga(() => tablero(), [])
  const [nombre, setNombre] = useState('')
  const [lema, setLema] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const propio = datos?.propio
  useEffect(() => { if (propio) { setNombre(propio.nombre); setLema(propio.lema); setCiudad(propio.ciudad) } }, [propio])
  if (cargando && !datos) return <Cargando />
  if (!propio) return <Pagina completa><ErrorCaja mensaje="No encontré tu diario." /></Pagina>
  const guardar = async () => {
    try { await actualizarDiario(propio.id, nombre, lema, ciudad); nav('/diarios') } catch (e) { setErr((e as Error).message) }
  }
  return (
    <Pagina completa>
      <div className="topbar"><button className="link" onClick={() => nav(-1)}>← Volver</button><span className="etiqueta" style={{ textAlign: 'center' }}>Editar diario</span><span /></div>
      <Masthead nombre={nombre} lema={lema} />
      <FileteDoble />
      <Campo etiqueta="Nombre de tu diario" valor={nombre} onChange={setNombre} />
      <Campo etiqueta="Lema" valor={lema} onChange={setLema} />
      <Campo etiqueta="Ciudad" valor={ciudad} onChange={setCiudad} />
      {propio.slug && <p className="epigrafe">La dirección queda fija: {location.origin}/{propio.slug}</p>}
      {err && <ErrorCaja mensaje={err} />}
      <button className="boton-tinta" disabled={!nombre.trim()} onClick={guardar}>Guardar</button>
    </Pagina>
  )
}
