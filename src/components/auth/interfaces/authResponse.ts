import type { IEmpleado } from '@/components/empleado/interfaces/empleado'

export interface IAuthResponse {
  data: IEmpleado
  token: string
  /** Punto 10: debe cambiar la contraseña que le asignó el Administrador */
  debeCambiarPassword?: boolean
}
