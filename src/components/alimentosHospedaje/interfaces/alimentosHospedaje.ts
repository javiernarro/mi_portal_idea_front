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
  /** Semanas consecutivas en semana completa (1 a 3). */
  semanas?: number
  entradaFecha?: string
  entradaHora?: string
  salidaFecha?: string
  salidaHora?: string
}

export interface INuevaReserva {
  empleadoId: number
  camaId: string
  /** Para agregar a la persona a la solicitud de un grupo de la semana. */
  grupoId?: number | null
  estancia: IEstancia
  motivo: Motivo
  detalleMotivo?: string | null
  presetAlimentos: Preset
  servicios?: IServicio[]
  notas?: string | null
  excepcionLocal?: boolean
  copiaJefe?: boolean
}

export interface INuevoGrupo {
  nombre: string
  claseId?: number | null
  estancia: IEstancia
  motivo: Motivo
  detalleMotivo?: string | null
  presetAlimentos: Preset
  servicios?: IServicio[]
  notas?: string | null
  excepcionLocal?: boolean
  copiaJefe?: boolean
  copiaInstructores?: boolean
  participantes: { empleadoId: number; camaId: string }[]
}

export interface IResultadoReserva {
  grupoId: number
  /** Folio de cada solicitud semanal creada o modificada (SOHA_AAAAMMDD_CURSO, -2, -3...). */
  folios: string[]
  reservas: { id: number; camaId: string; empleadoId: number }[]
  avisos: string[]
}

/** Solo administrador. */
export interface IEdicionReserva {
  camaId: string
  estancia: IEstancia
  presetAlimentos: Preset
  servicios?: IServicio[]
  notas?: string | null
}

export interface IGrupoSemana {
  id: number
  nombre: string
  motivo: Motivo
  folio: string
  personas: number
}

export interface IClaseSemana {
  id: number
  curso: string
  fechaInicio: string
  fechaFinalizacion: string
  alumnos: number
}

export interface ISolicitudResumen {
  id: number
  grupoId: number
  semanaInicio: string
  fecha: string
  folio: string
  grupo: string
  motivo: Motivo
  claseId: number | null
  huespedes: number
  comensales: number
}

export interface IComensal {
  id: number
  empleadoId: number
  nombre: string
  sucursal: string
  ccClave: string
  esInstructor: boolean
  excepcionLocal: boolean
  servicios: IServicio[]
}

export interface ISolicitudDetalle extends Omit<ISolicitudResumen, 'huespedes' | 'comensales'> {
  fechas: string[]
  huespedes: {
    id: number
    empleadoId: number
    nombre: string
    sucursal: string
    ccClave: string
    camaId: string
    habitacion: string
    cama: number
    tipoHab: string
    entradaFecha: string
    salidaFecha: string
    estado: EstadoReserva
    servicios: IServicio[]
  }[]
  comensales: IComensal[]
}

export interface IFueraServicio {
  semanaInicio: string
  nombre: string
  filas: {
    id: number
    habitacion: string
    camaId: string | null
    cama: number | null
    desde: string
    hasta: string
    motivo: string
    registro: string
  }[]
}

export interface ICaseta {
  lat: number | null
  lng: number | null
  radio: number
  /** El QR impreso vence 4 meses después de generarse (AAAA-MM-DD). */
  vence: string | null
  vencido: boolean
  diasRestantes: number | null
  url: string
}

export interface IMiReserva {
  id: number
  folio: string | null
  habitacion: string
  cama: number | null
  camaId: string
  entradaFecha: string
  entradaHora: string
  salidaFecha: string
  salidaHora: string
  estado: EstadoReserva
  motivo: Motivo
  detalleMotivo: string | null
  checkinEn: string | null
  checkoutEn: string | null
  servicios: IServicio[]
  puedeLlegar: boolean
  puedeSalir: boolean
}

/** Reglamento del hostal que el huésped acepta en cada llegada. */
export interface IReglamento {
  version: string
  titulo: string
  introduccion: string
  subtitulo: string
  normas: string[]
  cierre: string[]
  firma: string[]
  aceptacion: string
}
