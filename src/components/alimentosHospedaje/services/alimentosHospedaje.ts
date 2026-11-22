import { api_mi_portal } from '@/api'
import type {
  IBloqueo,
  ICaseta,
  IReglamento,
  IFueraServicio,
  IMiReserva,
  IServicio,
  ISolicitudDetalle,
  ISolicitudResumen,
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

// ---------- Solicitudes, comensales, fuera de servicio y Caseta ----------

export const getSolicitudes = async (fecha: string): Promise<ISolicitudResumen[]> => {
  const { data } = await api_mi_portal.get<ISolicitudResumen[]>(`${base}/solicitudes`, {
    params: { fecha },
  })
  return data
}

export const getSolicitud = async (id: number): Promise<ISolicitudDetalle> => {
  const { data } = await api_mi_portal.get<ISolicitudDetalle>(`${base}/solicitudes/${id}`)
  return data
}

/** Descarga un archivo del servidor con el nombre que manda (el folio). */
const descargar = async (url: string, params?: Record<string, string>) => {
  const r = await api_mi_portal.get(url, { params, responseType: 'blob' })
  if (!r) return
  const nombre =
    /filename="?([^"]+)"?/.exec(r.headers['content-disposition'] ?? '')?.[1] ?? 'archivo.xlsx'
  const liga = document.createElement('a')
  liga.href = URL.createObjectURL(r.data as Blob)
  liga.download = nombre
  liga.click()
  URL.revokeObjectURL(liga.href)
}

export const descargarExcelSolicitud = (id: number) => descargar(`${base}/solicitudes/${id}/excel`)

export const descargarExcelFueraServicio = (fecha: string) =>
  descargar(`${base}/fuera-de-servicio/excel`, { fecha })

export const getFueraServicio = async (fecha: string): Promise<IFueraServicio> => {
  const { data } = await api_mi_portal.get<IFueraServicio>(`${base}/fuera-de-servicio`, {
    params: { fecha },
  })
  return data
}

export const postComensal = async (
  solicitudId: number,
  comensal: { empleadoId: number; servicios: IServicio[] },
): Promise<{ id: number; folios: string[] }> => {
  const { data } = await api_mi_portal.post(
    `${base}/solicitudes/${solicitudId}/comensales`,
    comensal,
  )
  return data
}

export const putComensal = async (
  id: number,
  servicios: IServicio[],
): Promise<{ id: number; folios: string[] }> => {
  const { data } = await api_mi_portal.put(`${base}/comensales/${id}`, { servicios })
  return data
}

export const deleteComensal = async (id: number): Promise<{ id: number; folios: string[] }> => {
  const { data } = await api_mi_portal.delete(`${base}/comensales/${id}`)
  return data
}

export const getCaseta = async (): Promise<ICaseta> => {
  const { data } = await api_mi_portal.get<ICaseta>(`${base}/caseta`)
  return data
}

export const putCaseta = async (caseta: {
  lat: number
  lng: number
  radio: number
  nuevoCodigo?: boolean
}): Promise<ICaseta> => {
  const { data } = await api_mi_portal.put<ICaseta>(`${base}/caseta`, caseta)
  return data
}

// ---------- Mi hospedaje (huésped) ----------

export const getMiHospedaje = async (): Promise<IMiReserva[]> => {
  const { data } = await api_mi_portal.get<IMiReserva[]>('/mi-hospedaje')
  return data
}

export const postRegistroCaseta = async (registro: {
  codigo: string
  accion: 'llegada' | 'salida'
  lat: number
  lng: number
  precision: number
  reglamento?: string
}): Promise<{ id: number; estado: string }> => {
  const { data } = await api_mi_portal.post('/mi-hospedaje/registro', registro)
  return data
}

/** paraAceptar: el servidor anota que se abrió para aceptarlo (punto 15). */
export const getReglamento = async (paraAceptar = false): Promise<IReglamento> => {
  const { data } = await api_mi_portal.get<IReglamento>('/mi-hospedaje/reglamento', {
    params: paraAceptar ? { aceptar: 1 } : undefined,
  })
  return data
}

/** Avisa al servidor que el reglamento se recorrió hasta el final (punto 15). */
export const postReglamentoLeido = async () => {
  await api_mi_portal.post('/mi-hospedaje/reglamento/leido')
}
