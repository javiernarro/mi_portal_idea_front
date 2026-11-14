// Estado del formulario de estancia y alimentos (mismas reglas que el servidor).
import type {
  IEstancia,
  IReserva,
  IServicio,
  Preset,
  TiempoComida,
} from '../interfaces/alimentosHospedaje'
import { diaSemana, inicioSemana, rango, sumarDias } from './fechas'

export const MAX_SEMANAS = 3

export interface FormEstancia {
  modo: 'SEMANA_COMPLETA' | 'PERSONALIZADA'
  semanas: number
  entradaFecha: string
  entradaHora: string
  salidaFecha: string
  salidaHora: string
  preset: Preset
  servicios: IServicio[]
}

/** Viernes de la ultima semana (semana completa de N semanas). */
export const viernesFinal = (semanaInicio: string, semanas: number) =>
  sumarDias(semanaInicio, 7 * (semanas - 1) + 5)

export const estanciaInicial = (
  semanaInicio: string,
  entradaHora: string,
  salidaHora: string,
): FormEstancia => ({
  modo: 'SEMANA_COMPLETA',
  semanas: 1,
  entradaFecha: semanaInicio,
  entradaHora,
  salidaFecha: viernesFinal(semanaInicio, 1),
  salidaHora,
  preset: 'TODOS',
  servicios: [],
})

/** Para editar: toma los datos guardados de la reserva. */
export const estanciaDeReserva = (r: IReserva): FormEstancia => {
  const semanaInicio = r.semanaInicio ?? inicioSemana(r.entradaFecha)
  const semanas = Math.min(
    MAX_SEMANAS,
    Math.floor((rango(semanaInicio, r.salidaFecha).length - 1) / 7) + 1,
  )
  return {
    modo: r.modoEstancia ?? 'PERSONALIZADA',
    semanas,
    entradaFecha: r.entradaFecha,
    entradaHora: r.entradaHora ?? '12:00',
    salidaFecha: r.salidaFecha,
    salidaHora: r.salidaHora ?? '18:00',
    preset: r.presetAlimentos ?? 'TODOS',
    servicios: [...(r.servicios ?? [])],
  }
}

export const aEstancia = (f: FormEstancia, semanaInicio: string): IEstancia =>
  f.modo === 'SEMANA_COMPLETA'
    ? { modo: 'SEMANA_COMPLETA', semanaInicio, semanas: f.semanas, salidaFecha: f.salidaFecha }
    : {
        modo: 'PERSONALIZADA',
        semanaInicio,
        entradaFecha: f.entradaFecha,
        entradaHora: f.entradaHora,
        salidaFecha: f.salidaFecha,
        salidaHora: f.salidaHora,
      }

/** Fechas reales de entrada y salida segun el modo. */
export const fechasReales = (f: FormEstancia, semanaInicio: string) =>
  f.modo === 'SEMANA_COMPLETA'
    ? { entrada: semanaInicio, salida: f.salidaFecha }
    : { entrada: f.entradaFecha, salida: f.salidaFecha }

export const esFinDeSemana = (iso: string) => {
  const d = diaSemana(iso)
  return d === 0 || d === 6
}

/** Servicios de un preset en los dias de lunes a viernes de la estancia. */
export const serviciosDePreset = (preset: Preset, dias: string[]): IServicio[] => {
  if (preset === 'NINGUNO' || preset === 'PERSONALIZADO') return []
  const tiempos: TiempoComida[] = preset === 'TODOS' ? ['DES', 'COM', 'CEN'] : ['DES', 'CEN']
  return dias
    .filter((d) => !esFinDeSemana(d))
    .flatMap((fecha) => tiempos.map((tiempo) => ({ fecha, tiempo })))
}
