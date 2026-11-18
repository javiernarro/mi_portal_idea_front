import { api_mi_portal } from '@/api'

export interface ICambiarPassword {
  actual: string
  nueva: string
  verificar?: string
}

export const cambiarPassword = async (payload: ICambiarPassword): Promise<string> => {
  const { data } = await api_mi_portal.put<string>('/mi-cuenta/password', {
    actual: payload.actual,
    nueva: payload.nueva,
  })
  return data
}
