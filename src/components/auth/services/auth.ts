import { api_mi_portal } from '@/api'
import type { IAuth } from '../interfaces/auth'
import { timer } from '@/helper/timer'

export const auth = async (payload: IAuth) => {
  await timer()
  const { data } = await api_mi_portal.post('/auth', payload)

  return data
}

/** Punto 12: cierra la sesión en el servidor (borra la cookie). */
export const salir = async () => {
  await api_mi_portal.post('/salir')
}
