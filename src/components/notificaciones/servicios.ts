import { api_mi_portal } from '@/api'

export interface INotificacion {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  enlace: string | null
  leidaEn: string | null
  createdAt: string
  /** Aviso fijo: se mantiene hasta que se resuelva la situación */
  fija?: boolean
}

export const getNotificaciones = async (): Promise<INotificacion[]> => {
  const { data } = await api_mi_portal.get<INotificacion[]>('/notificaciones')
  return data
}

export const getPendientes = async (): Promise<boolean> => {
  const { data } = await api_mi_portal.get<{ pendientes: boolean }>('/notificaciones/pendientes')
  return !!data?.pendientes
}

export const marcarLeidas = async () => {
  await api_mi_portal.patch('/notificaciones/leer')
}
