import type { EstadoCama, EstadoReserva, Motivo, Preset } from '../interfaces/alimentosHospedaje'

// Mismos colores que la leyenda de Capacitaciones: verde, ámbar y azul; gris para fuera de servicio.
export const ESTILO_ESTADO: Record<
  EstadoCama,
  { label: string; dot: string; caja: string; texto: string }
> = {
  DISPONIBLE: {
    label: 'Disponible',
    dot: 'bg-emerald-500',
    caja: 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:hover:border-emerald-600 dark:bg-emerald-950/50',
    texto: 'text-emerald-900 dark:text-emerald-100',
  },
  RESERVADA: {
    label: 'Reservada',
    dot: 'bg-amber-500',
    caja: 'border-amber-200 hover:border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:hover:border-amber-600 dark:bg-amber-950/50',
    texto: 'text-amber-900 dark:text-amber-100',
  },
  OCUPADA: {
    label: 'Ocupada',
    dot: 'bg-blue-500',
    caja: 'border-blue-200 hover:border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:hover:border-blue-600 dark:bg-blue-950/50',
    texto: 'text-blue-900 dark:text-blue-100',
  },
  FUERA_SERVICIO: {
    label: 'Fuera de servicio',
    dot: 'bg-neutral-400',
    caja: 'border-neutral-300 bg-neutral-100 dark:border-zinc-600 dark:bg-zinc-800',
    texto: 'text-neutral-600 dark:text-zinc-300',
  },
  NO_ASIGNABLE: {
    label: 'No asignable',
    dot: 'bg-neutral-200',
    caja: 'border-neutral-200 bg-neutral-50 dark:border-zinc-700 dark:bg-zinc-900',
    texto: 'text-neutral-400 dark:text-zinc-500',
  },
}

export const ESTADOS_RESERVA: Record<EstadoReserva, { label: string; severity: string }> = {
  RESERVADA: { label: 'Reservada', severity: 'warn' },
  EN_CASA: { label: 'Hospedado', severity: 'info' },
  FINALIZADA: { label: 'Salida registrada', severity: 'success' },
  CANCELADA: { label: 'Cancelada', severity: 'secondary' },
}

export const MOTIVOS: { value: Motivo; label: string }[] = [
  { value: 'CURSO', label: 'Curso de Capacitación' },
  { value: 'TRABAJO_SOPORTE', label: 'Trabajo / Soporte Operativo' },
]

export const PRESETS: { value: Preset; label: string }[] = [
  { value: 'TODOS', label: 'Todos los tiempos (lunes a viernes)' },
  { value: 'DES_CEN', label: 'Solo desayuno y cena' },
  { value: 'NINGUNO', label: 'Ningún alimento' },
]

export const TIPO_CAMA: Record<string, string> = {
  individual: 'Individual',
  'litera-abajo': 'Litera abajo',
  'litera-arriba': 'Litera arriba',
}
