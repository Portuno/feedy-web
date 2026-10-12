import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { activo, asegurarDiarioPropio } from './data'
import { DiarioCtx } from './contexto'
import { Cargando, ErrorCaja, Pagina } from './ui'
import Login from './screens/Login'
import Portada from './screens/Portada'
import NotaScreen from './screens/Nota'
import Avisos from './screens/Avisos'
import Publicar from './screens/Publicar'
import Diarios from './screens/Diarios'
import Editar from './screens/Editar'
import Archivo from './screens/Archivo'

export default function App() {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  const [diarioId, setDiarioId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uidSesion = sesion?.user.id
  useEffect(() => {
    if (!uidSesion) { setDiarioId(null); return }
    let vivo = true
    setError(null)
    asegurarDiarioPropio()
      .then((propio) => { if (vivo) setDiarioId(activo.get() ?? propio) })
      .catch((e) => vivo && setError((e as Error).message))
    return () => { vivo = false }
  }, [uidSesion])

  if (sesion === undefined) return <Cargando />
  if (!sesion) return <Routes><Route path="*" element={<Login />} /></Routes>
  if (error) return <Pagina><ErrorCaja mensaje={error} /><button className="link" onClick={() => location.reload()}>Probar otra vez</button></Pagina>
  if (!diarioId) return <Cargando />

  const elegir = (id: string) => { activo.set(id); setDiarioId(id) }
  return (
    <DiarioCtx.Provider value={{ diarioId, elegir }}>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/nota/:id" element={<NotaScreen />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/publicar" element={<Publicar />} />
        <Route path="/diarios" element={<Diarios />} />
        <Route path="/diarios/editar" element={<Editar />} />
        <Route path="/archivo" element={<Archivo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DiarioCtx.Provider>
  )
}
