import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { activo, asegurarDiarioPropio, slugDe } from './data'
import { DiarioCtx, useDiario } from './contexto'
import { Cargando, ErrorCaja, Pagina } from './ui'
import Login from './screens/Login'
import Portada from './screens/Portada'
import NotaScreen from './screens/Nota'
import Avisos from './screens/Avisos'
import Publicar from './screens/Publicar'
import Diarios from './screens/Diarios'
import Editar from './screens/Editar'
import Archivo from './screens/Archivo'

function Inicio() {
  const { slug } = useDiario()
  if (!slug) return <Pagina><ErrorCaja mensaje="Este diario todavía no tiene dirección." /></Pagina>
  return <Navigate to={`/${slug}`} replace />
}

export default function App() {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  const [diarioId, setDiarioId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uidSesion = sesion?.user.id
  useEffect(() => {
    if (!uidSesion) { setDiarioId(null); setSlug(null); return }
    let vivo = true
    setError(null)
    asegurarDiarioPropio()
      .then(async (propio) => {
        const id = activo.get() ?? propio
        const s = await slugDe(id)
        if (vivo) { setDiarioId(id); setSlug(s) }
      })
      .catch((e) => vivo && setError((e as Error).message))
    return () => { vivo = false }
  }, [uidSesion])

  useEffect(() => {
    if (!uidSesion || !('serviceWorker' in navigator) || !('Notification' in window)) return
    if (Notification.permission === 'granted') void navigator.serviceWorker.register('/sw.js')
  }, [uidSesion])

  const elegir = useCallback((id: string, s?: string | null) => {
    activo.set(id)
    setDiarioId(id)
    if (s) setSlug(s)
    else void slugDe(id).then(setSlug)
  }, [])

  if (sesion === undefined) return <Cargando />
  // La URL (por ejemplo /lautaro) se queda: al entrar, el router vuelve a esa ruta.
  if (!sesion) return <Routes><Route path="*" element={<Login />} /></Routes>
  if (error) return <Pagina><ErrorCaja mensaje={error} /><button className="link" onClick={() => location.reload()}>Probar otra vez</button></Pagina>
  if (!diarioId) return <Cargando />

  return (
    <DiarioCtx.Provider value={{ diarioId, slug, elegir }}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/nota/:id" element={<NotaScreen />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/publicar" element={<Publicar />} />
        <Route path="/diarios" element={<Diarios />} />
        <Route path="/diarios/editar" element={<Editar />} />
        <Route path="/archivo" element={<Archivo />} />
        <Route path="/:slug" element={<Portada />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DiarioCtx.Provider>
  )
}
