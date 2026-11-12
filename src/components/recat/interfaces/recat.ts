export type CategoriaReCat = 'D' | 'C' | 'B' | 'A' | 'ESPECIALISTA'

export interface IEmpleadoReCat {
  id: number
  numero: string
  nombre: string
  cargo: string
  sucursalId: number | null
  sucursal: string
  categoria: CategoriaReCat
  categoriaTexto: string
  siguiente: string | null
}

export interface IIndicadoresReCat {
  requisitos: number
  cumplidos: number
  faltan: number
  volverATomar: number
  avance: number
}

export interface ITecnicoReCat extends IEmpleadoReCat, IIndicadoresReCat {
  cumple: boolean
}

export interface ICursoTomado {
  curso: string
  fecha: string | null
  calificacion: number | null
  claseId: number
}

export interface IRequisitoReCat {
  bloque: number
  bloqueNombre: string
  requisito: string
  evidencia: string
  opcional: boolean
  estado: 'Cumplido' | 'Falta' | 'Volver a tomar'
  acreditado: ICursoTomado | null
  noAcreditado: ICursoTomado | null
  avanceDetalle?: { aprobados: number; total: number; faltan: string[] }
}

export interface IBloqueReCat {
  numero: number
  nombre: string
  categoria: CategoriaReCat
  evidencia: string
  aplica: boolean
  requisitos: number
  cumplidos: number
  estado: 'Cumple' | 'Falta' | 'No aplica'
}

export interface IFichaReCat {
  empleado: IEmpleadoReCat
  indicadores: IIndicadoresReCat
  cumple: boolean
  bloques: IBloqueReCat[]
  faltantes: IRequisitoReCat[]
  noAcreditadas: IRequisitoReCat[]
  cumplidos: IRequisitoReCat[]
  opcionales: IRequisitoReCat[]
  comentario: { texto: string; actualizado: string | null }
}

// Compara nombres de curso sin acentos, mayúsculas ni espacios dobles
export const mismoNombre = (a: string, b: string) => {
  const n = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()
  return n(a) === n(b)
}
