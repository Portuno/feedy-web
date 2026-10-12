import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { publicar, tablero, type TipoAviso, type TipoPublicacion } from '../data'
import { useDiario } from '../contexto'
import { Campo, Cargando, ErrorCaja, FileteDoble, Masthead, Pagina, useCarga } from '../ui'

export default function Publicar() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { elegir } = useDiario()
  const ctx = useCarga(() => tablero(), [])
  const [tipo, setTipo] = useState<TipoPublicacion>(params.get('tipo') === 'aviso' ? 'aviso' : 'nota')
  const [tipoAviso, setTipoAviso] = useState<TipoAviso>('novedad')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [epigrafe, setEpigrafe] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [alCostado, setAlCostado] = useState(false)
  const [tituloColor, setTituloColor] = useState('')
  const [cuerpoColor, setCuerpoColor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  if (ctx.cargando && !ctx.datos) return <Cargando />
  const propio = ctx.datos?.propio
  if (!propio) return <Pagina completa><ErrorCaja mensaje={ctx.error ?? 'Primero imprimí tu diario.'} /></Pagina>

  const listo = titulo.trim() && cuerpo.trim() && !enviando
  async function mandar() {
    if (!propio || !listo) return
    setEnviando(true); setError(null)
    try {
      await publicar({ tipo, titulo, cuerpo, epigrafe, foto, notaAlCostado: alCostado, tituloColor, cuerpoColor, tipoAviso, diarioId: propio.id, autor: ctx.datos!.corresponsal.nombre })
      elegir(propio.id)
      nav(tipo === 'aviso' ? '/avisos' : '/', { replace: true })
    } catch (e) { setError((e as Error).message); setEnviando(false) }
  }

  return (
    <Pagina completa>
      <div className="topbar">
        <button className="link" onClick={() => nav(-1)}>✕ Cerrar</button>
        <Masthead nombre={propio.nombre} chico />
        <span />
      </div>
      <h1 className="titular" style={{ textAlign: 'center' }}>Mandar a imprenta</h1>
      <p className="epigrafe" style={{ textAlign: 'center' }}>
        Sale en la edición de hoy{propio.compartidoCon ? ` y la lee ${propio.compartidoCon}` : ''}.
      </p>
      <div className="pestanas">
        {(['nota', 'color', 'aviso'] as const).map((t) => (
          <button key={t} className={tipo === t ? 'activa' : ''} onClick={() => setTipo(t)}>
            {t === 'nota' ? 'Nota' : t === 'color' ? 'Nota de color' : 'Aviso'}
          </button>
        ))}
      </div>
      {tipo === 'aviso' && (
        <div>
          {(['novedad', 'idea', 'propuesta'] as const).map((t) => (
            <button key={t} className={'chip' + (tipoAviso === t ? ' activa' : '')} onClick={() => setTipoAviso(t)}>{t}</button>
          ))}
        </div>
      )}
      <div className="recuadro" style={{ textAlign: 'center' }}>
        {preview ? <img className="foto" src={preview} alt="" style={{ marginBottom: 10 }} /> : <p className="epigrafe">La foto es lo único a color.</p>}
        <label className="boton-linea" style={{ cursor: 'pointer' }}>
          {foto ? 'Cambiar' : 'Agregar foto'}
          <input type="file" accept="image/*" hidden onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
        </label>
        {foto && <button className="link" style={{ marginLeft: 12 }} onClick={() => setFoto(null)}>Sacar</button>}
      </div>
      {foto && tipo !== 'aviso' && <Campo etiqueta="Epígrafe" valor={epigrafe} onChange={setEpigrafe} />}
      <Campo etiqueta={tipo === 'aviso' ? 'Título del aviso' : 'Titular'} valor={titulo} onChange={setTitulo} />
      <Campo etiqueta={tipo === 'aviso' ? 'Texto' : 'Cuerpo'} valor={cuerpo} onChange={setCuerpo} multilinea />
      {tipo === 'nota' && (
        <>
          <label className="fila etiqueta" style={{ justifyContent: 'flex-start', gap: 8, margin: '10px 0' }}>
            <input type="checkbox" checked={alCostado} onChange={(e) => setAlCostado(e.target.checked)} /> Sumar nota de color al costado
          </label>
          {alCostado && (
            <>
              <Campo etiqueta="Título de la nota de color" valor={tituloColor} onChange={setTituloColor} />
              <Campo etiqueta="Texto de la nota de color" valor={cuerpoColor} onChange={setCuerpoColor} multilinea />
            </>
          )}
        </>
      )}
      {error && <ErrorCaja mensaje={error} />}
      <FileteDoble />
      <button className="boton-tinta" disabled={!listo} onClick={mandar}>{enviando ? 'Imprimiendo…' : 'Mandar a imprenta'}</button>
    </Pagina>
  )
}
