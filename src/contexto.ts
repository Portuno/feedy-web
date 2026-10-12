import { createContext, useContext } from 'react'
export interface Ctx { diarioId: string; elegir: (id: string) => void }
export const DiarioCtx = createContext<Ctx>({ diarioId: '', elegir: () => {} })
export const useDiario = () => useContext(DiarioCtx)
