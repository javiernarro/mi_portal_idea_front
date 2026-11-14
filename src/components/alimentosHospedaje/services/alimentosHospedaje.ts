import { api_mi_portal } from '@/api'
import type {
  IBloqueo,
  IClaseSemana,
  IEdicionReserva,
  IEmpleadoHuesped,
  IEstancia,
  IGrupoSemana,
  INuevaReserva,
  INuevoGrupo,
  IPiso,
  IReserva,
  IResultadoReserva,
  ISemana,
} from '../interfaces/alimentosHospedaje'

const base = '/alimentos-hospedaje'

export const getPiso = async (): Promise<IPiso> => {
  const { data } = await api_mi_portal.get<IPiso>(`${base}/piso`)
  return data
}

export const getSemana = async (fecha: string): Promise<ISemana> => {
  const { data } = await api_mi_portal.get<ISemana>(`${base}/semana`, { params: { fecha } })
  return data
}

export const getReserva = async (id: number): Promise<IReserva> => {
  const { data } = await api_mi_portal.get<IReserva>(`${base}/reservas/${id}`)
  return data
}

export const buscarEmpleados = async (texto: string): Promise<IEmpleadoHuesped[]> => {
  const { data } = await api_mi_portal.get<IEmpleadoHuesped[]>(`${base}/empleados`, {
    params: { texto },
  })
  return data
}

export const getClasesSemana = async (fecha: string): Promise<IClaseSemana[]> => {
  const { data } = await api_mi_portal.get<IClaseSemana[]>(`${base}/clases`, { params: { fecha } })
  return data
}

export const getParticipantesClase = async (
  claseId: number,
): Promise<{ alumnos: IEmpleadoHuesped[]; instructores: IEmpleadoHuesped[] }> => {
  const { data } = await api_mi_portal.get(`${base}/clases/${claseId}/participantes`)
  return data
}

export const postReserva = async (reserva: INuevaReserva): Promise<IResultadoReserva> => {
  const { data } = await api_mi_portal.post<IResultadoReserva>(`${base}/reservas`, reserva)
  return data
}

export const getGruposSemana = async (fecha: string): Promise<IGrupoSemana[]> => {
  const { data } = await api_mi_portal.get<IGrupoSemana[]>(`${base}/grupos`, { params: { fecha } })
  return data
}

/** Solo administrador: cama, fechas, alimentos y notas. */
export const patchReserva = async (
  id: number,
  edicion: IEdicionReserva,
): Promise<{ id: number; folios: string[]; avisos: string[] }> => {
  const { data } = await api_mi_portal.patch(`${base}/reservas/${id}`, edicion)
  return data
}

export const postGrupo = async (grupo: INuevoGrupo): Promise<IResultadoReserva> => {
  const { data } = await api_mi_portal.post<IResultadoReserva>(`${base}/grupos`, grupo)
  return data
}

export const postProponerCamas = async (payload: {
  cantidad: number
  estancia: IEstancia
  incluirVip?: boolean
  preferidas?: string[]
  excluir?: string[]
}): Promise<{ camas: string[]; mensaje: string | null }> => {
  const { data } = await api_mi_portal.post(`${base}/proponer-camas`, payload)
  return data
}

export const patchEstado = async (
  id: number,
  accion: 'checkin' | 'checkout' | 'cancelar',
  motivoCancelacion?: string,
) => {
  const { data } = await api_mi_portal.patch(`${base}/reservas/${id}/${accion}`, {
    motivoCancelacion,
  })
  return data
}

export const postBloqueo = async (
  bloqueo: Omit<IBloqueo, 'id'>,
): Promise<{
  id: number
  afectadas: { folio: string; huespedNombre: string; camaId: string }[]
}> => {
  const { data } = await api_mi_portal.post(`${base}/bloqueos`, bloqueo)
  return data
}

export const deleteBloqueo = async (id: number) => {
  const { data } = await api_mi_portal.delete(`${base}/bloqueos/${id}`)
  return data
}
