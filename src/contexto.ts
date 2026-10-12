import { createContext, useContext } from 'react'
export interface Ctx { diarioId: string; slug: string | null; elegir: (id: string, slug?: string | null) => void }
export const DiarioCtx = createContext<Ctx>({ diarioId: '', slug: null, elegir: () => {} })
export const useDiario = () => useContext(DiarioCtx)
