import { useState, type FormEvent } from 'react'
import { entrar, registrar } from '../data'
import { Campo, ErrorCaja, FileteDoble, Masthead, Pagina } from '../ui'

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'registro'>('registro')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const registro = modo === 'registro'
  const listo = email.includes('@') && pass.length >= 6 && (!registro || nombre.trim().length > 0)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!listo) return
    setEnviando(true); setError(null)
    try { registro ? await registrar(nombre, email, pass) : await entrar(email, pass) }
    catch (err) { setError((err as Error).message) }
    finally { setEnviando(false) }
  }

  return (
    <Pagina completa>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <p className="etiqueta suave" style={{ textAlign: 'center', marginTop: 24 }}>Vol. I · N.º 1 · Edición inaugural</p>
        <Masthead nombre={registro && nombre.trim() ? `${nombre.trim().split(' ')[0]} Times` : 'El Diario'} lema="Las noticias de tu casa, impresas para los tuyos." />
        <FileteDoble />
        <div className="pestanas">
          <button className={registro ? 'activa' : ''} onClick={() => setModo('registro')}>Crear cuenta</button>
          <button className={!registro ? 'activa' : ''} onClick={() => setModo('entrar')}>Entrar</button>
        </div>
        <form onSubmit={enviar}>
          {registro && <Campo etiqueta="Tu nombre" valor={nombre} onChange={setNombre} autoComplete="given-name" />}
          <Campo etiqueta="Email" tipo="email" valor={email} onChange={setEmail} autoComplete="email" />
          <Campo etiqueta="Contraseña" tipo="password" valor={pass} onChange={setPass} autoComplete={registro ? 'new-password' : 'current-password'} />
          {error && <ErrorCaja mensaje={error} />}
          <button className="boton-tinta" type="submit" disabled={!listo || enviando}>
            {enviando ? 'Imprimiendo…' : registro ? 'Imprimir mi diario' : 'Entrar a la redacción'}
          </button>
        </form>
        <p className="epigrafe" style={{ textAlign: 'center', marginTop: 16 }}>
          {registro ? 'Al crear la cuenta se imprime tu diario y entrás directo a la portada.' : '¿Primera vez? Tocá “Crear cuenta”.'}
        </p>
      </div>
    </Pagina>
  )
}
