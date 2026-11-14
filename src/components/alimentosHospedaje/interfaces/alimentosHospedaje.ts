export type TiempoComida = 'DES' | 'COM' | 'CEN'
export type Preset = 'TODOS' | 'DES_CEN' | 'NINGUNO' | 'PERSONALIZADO'
export type EstadoReserva = 'RESERVADA' | 'EN_CASA' | 'FINALIZADA' | 'CANCELADA'
export type EstadoCama = 'DISPONIBLE' | 'RESERVADA' | 'OCUPADA' | 'FUERA_SERVICIO' | 'NO_ASIGNABLE'
export type Motivo = 'CURSO' | 'TRABAJO_SOPORTE'

export interface IHabitacion {
  id: string
  nombre: string
  tipo: 'vip' | 'compartida' | 'bodega'
  orden: number
  amenidades: string[]
  nota: string | null
  planoCol: number
  planoRow: number
  planoColSpan: number
  planoRowSpan: number
}

export interface ICama {
  id: string
  habitacionId: string
  numero: number
  tipo: 'individual' | 'litera-abajo' | 'litera-arriba'
  orden: number
}

export interface IPiso {
  habitaciones: IHabitacion[]
  camas: ICama[]
  configuracion: {
    entradaHora: string
    salidaHora: string
    sucursalLocalId: number
    sucursalLocal: string
  }
}

export interface IServicio {
  fecha: string
  tiempo: TiempoComida
}

/** Sin permiso de consulta solo llegan id, cama, fechas y estado. */
export interface IReserva {
  id: number
  camaId: string
  habitacionId: string
  entradaFecha: string
  salidaFecha: string
  estado: EstadoReserva
  folio?: string
  empleadoId?: number
  huespedNumero?: string | null
  huespedNombre?: string
  huespedSucursal?: string
  huespedCcClave?: string
  huespedCcNombre?: string
  huespedCargo?: string | null
  huespedCorreo?: string | null
  grupoId?: number | null
  grupo?: string | null
  modoEstancia?: 'SEMANA_COMPLETA' | 'PERSONALIZADA'
  semanaInicio?: string
  entradaHora?: string
  salidaHora?: string
  motivo?: Motivo
  detalleMotivo?: string | null
  presetAlimentos?: Preset
  excepcionLocal?: boolean
  notas?: string | null
  checkinEn?: string | null
  checkoutEn?: string | null
  servicios?: IServicio[]
  bitacora?: { accion: string; empleado: string; detalle: string | null; createdAt: string }[]
}

export interface IBloqueo {
  id: number
  habitacionId: string
  camaId: string | null
  desde: string
  hasta: string
  motivo: string
}

export interface ISemana {
  semanaInicio: string
  fechas: string[]
  reservas: IReserva[]
  bloqueos: IBloqueo[]
}

export interface IEmpleadoHuesped {
  id: number
  numero: string | null
  nombre: string
  sucursalId: number | null
  sucursal: string
  ccClave: string
  ccNombre: string
  correo: string | null
  cargo: string | null
  tipo: string
  instructor: boolean
  local: boolean
}

export interface IEstancia {
  modo: 'SEMANA_COMPLETA' | 'PERSONALIZADA'
  semanaInicio: string
  entradaFecha?: string
  entradaHora?: string
  salidaFecha?: string
  salidaHora?: string
}

export interface INuevaReserva {
  empleadoId: number
  camaId: string
  estancia: IEstancia
  motivo: Motivo
  detalleMotivo?: string | null
  presetAlimentos: Preset
  notas?: string | null
  excepcionLocal?: boolean
}

export interface INuevoGrupo {
  nombre: string
  claseId?: number | null
  estancia: IEstancia
  motivo: Motivo
  detalleMotivo?: string | null
  presetAlimentos: Preset
  notas?: string | null
  excepcionLocal?: boolean
  participantes: { empleadoId: number; camaId: string }[]
}

export interface IResultadoReserva {
  grupoId: number | null
  reservas: { id: number; folio: string; camaId: string; empleadoId: number }[]
  avisos: string[]
}

export interface IClaseSemana {
  id: number
  curso: string
  fechaInicio: string
  fechaFinalizacion: string
  alumnos: number
}
