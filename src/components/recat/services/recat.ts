import { api_mi_portal } from '@/api'
import type { IFichaReCat, ITecnicoReCat } from '../interfaces/recat'

export const getTecnicosReCat = async (): Promise<ITecnicoReCat[]> => {
  const { data } = await api_mi_portal.get<ITecnicoReCat[]>('/recat')
  return data
}

export const getFichaReCat = async (empleadoId: number): Promise<IFichaReCat> => {
  const { data } = await api_mi_portal.get<IFichaReCat>(`/recat/${empleadoId}`)
  return data
}

export const getFichasReCat = async (ids: number[]): Promise<IFichaReCat[]> => {
  const { data } = await api_mi_portal.post<IFichaReCat[]>('/recat/fichas', { ids })
  return data
}

export const guardarComentarioReCat = async (empleadoId: number, comentario: string) => {
  const { data } = await api_mi_portal.put<{ texto: string; actualizado: string }>(
    `/recat/${empleadoId}/comentario`,
    { comentario },
  )
  return data
}
