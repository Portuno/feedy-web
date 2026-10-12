import { BottomBar, FileteDoble, Pagina } from '../ui'
export default function Archivo() {
  return (
    <Pagina>
      <h1 className="titular" style={{ textAlign: 'center' }}>Hemeroteca</h1>
      <FileteDoble />
      <p className="vacio bajada">Hemeroteca: próximamente.</p>
      <BottomBar />
    </Pagina>
  )
}
