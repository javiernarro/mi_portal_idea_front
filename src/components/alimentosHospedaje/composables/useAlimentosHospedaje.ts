import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, type Ref } from 'vue'
import type { AxiosError } from 'axios'
import { mensajeError } from '@/helper/mensajes'
import { verificarPermiso } from '@/guards/verificarPermiso'
import {
  deleteBloqueo,
  getPiso,
  getReserva,
  getSemana,
  patchEstado,
  postBloqueo,
  postGrupo,
  postReserva,
} from '../services/alimentosHospedaje'
import type {
  EstadoCama,
  IBloqueo,
  ICama,
  IHabitacion,
  INuevaReserva,
  INuevoGrupo,
  IReserva,
} from '../interfaces/alimentosHospedaje'
import { hoyISO, inicioSemana, sumarDias } from '../helpers/fechas'

export const usePermisosAH = () => ({
  puedeConsultar: verificarPermiso('AlimentosHospedaje.Consultar'),
  puedeModificar: verificarPermiso('AlimentosHospedaje.Modificar'),
})

/** Muestra el mensaje que manda el servidor (reglas de camas, personal local, etc.). */
export const mostrarError = (error: unknown) => {
  const e = error as AxiosError<{ mensaje?: string }>
  mensajeError(e?.response?.data?.mensaje ?? 'No se pudo completar la operación.')
}

export const usePiso = () => {
  const { data, isLoading } = useQuery({ queryKey: ['ahPiso'], queryFn: getPiso })
  const habitaciones = computed<IHabitacion[]>(() => data.value?.habitaciones ?? [])
  const camas = computed<ICama[]>(() => data.value?.camas ?? [])
  const habitacionPorId = computed(() => new Map(habitaciones.value.map((h) => [h.id, h])))
  const camasDe = (habitacionId: string) =>
    camas.value.filter((c) => c.habitacionId === habitacionId)
  const etiquetaCama = (camaId: string) => {
    const c = camas.value.find((x) => x.id === camaId)
    const h = c && habitacionPorId.value.get(c.habitacionId)
    if (!c || !h) return camaId
    return h.tipo === 'vip' ? h.nombre : `${h.nombre} · Cama ${c.numero}`
  }
  return {
    piso: data,
    habitaciones,
    camas,
    habitacionPorId,
    camasDe,
    etiquetaCama,
    isLoading: computed(() => isLoading.value),
  }
}

export const useSemana = () => {
  const semanaInicio = ref(inicioSemana(hoyISO()))
  // Noche que se ve en el plano (por defecto hoy si cae en la semana, si no el domingo)
  const noche = ref(hoyISO() < sumarDias(semanaInicio.value, 6) ? hoyISO() : semanaInicio.value)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['ahSemana', semanaInicio],
    queryFn: () => getSemana(semanaInicio.value),
  })

  const irASemana = (fecha: string) => {
    semanaInicio.value = inicioSemana(fecha)
    noche.value = semanaInicio.value
  }
  const anterior = () => irASemana(sumarDias(semanaInicio.value, -7))
  const siguiente = () => irASemana(sumarDias(semanaInicio.value, 7))
  const hoy = () => {
    irASemana(hoyISO())
    noche.value = hoyISO()
  }

  const reservas = computed<IReserva[]>(() => data.value?.reservas ?? [])
  const bloqueos = computed<IBloqueo[]>(() => data.value?.bloqueos ?? [])
  const fechas = computed(
    () =>
      data.value?.fechas ?? Array.from({ length: 7 }, (_, i) => sumarDias(semanaInicio.value, i)),
  )

  return {
    semanaInicio,
    noche,
    fechas,
    reservas,
    bloqueos,
    irASemana,
    anterior,
    siguiente,
    hoy,
    isLoading: computed(() => isLoading.value || isFetching.value),
  }
}

/** Estado de cada cama en una noche (misma regla que el servidor). */
export const useEstadoCamas = (
  camas: Ref<ICama[]>,
  habitacionPorId: Ref<Map<string, IHabitacion>>,
  reservas: Ref<IReserva[]>,
  bloqueos: Ref<IBloqueo[]>,
) => {
  const reservaEn = (camaId: string, noche: string) =>
    reservas.value.find(
      (r) =>
        r.estado !== 'CANCELADA' &&
        r.camaId === camaId &&
        noche >= r.entradaFecha &&
        noche < r.salidaFecha,
    )
  const bloqueoEn = (cama: ICama, noche: string) =>
    bloqueos.value.find(
      (b) =>
        b.habitacionId === cama.habitacionId &&
        (!b.camaId || b.camaId === cama.id) &&
        noche >= b.desde &&
        noche <= b.hasta,
    )
  const estado = (camaId: string, noche: string): EstadoCama => {
    const cama = camas.value.find((c) => c.id === camaId)
    const hab = cama && habitacionPorId.value.get(cama.habitacionId)
    if (!cama || !hab || hab.tipo === 'bodega') return 'NO_ASIGNABLE'
    if (bloqueoEn(cama, noche)) return 'FUERA_SERVICIO'
    const r = reservaEn(camaId, noche)
    if (!r) return 'DISPONIBLE'
    return r.estado === 'RESERVADA' ? 'RESERVADA' : 'OCUPADA'
  }
  return { estado, reservaEn, bloqueoEn }
}

export const useReserva = (id: () => number | null) => {
  const { data, isLoading } = useQuery({
    queryKey: ['ahReserva', computed(() => id())],
    queryFn: () => getReserva(id()!),
    enabled: computed(() => !!id() && usePermisosAH().puedeConsultar),
  })
  return { reserva: data, isLoading: computed(() => isLoading.value) }
}

export const useAccionesAH = () => {
  const queryClient = useQueryClient()
  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['ahSemana'] })
    queryClient.invalidateQueries({ queryKey: ['ahReserva'] })
  }

  const crearReserva = useMutation({
    mutationFn: (r: INuevaReserva) => postReserva(r),
    onSuccess: refrescar,
    onError: mostrarError,
  })
  const crearGrupo = useMutation({
    mutationFn: (g: INuevoGrupo) => postGrupo(g),
    onSuccess: refrescar,
    onError: mostrarError,
  })
  const cambiarEstado = useMutation({
    mutationFn: (p: { id: number; accion: 'checkin' | 'checkout' | 'cancelar'; motivo?: string }) =>
      patchEstado(p.id, p.accion, p.motivo),
    onSuccess: refrescar,
    onError: mostrarError,
  })
  const crearBloqueo = useMutation({
    mutationFn: (b: Omit<IBloqueo, 'id'>) => postBloqueo(b),
    onSuccess: refrescar,
    onError: mostrarError,
  })
  const quitarBloqueo = useMutation({
    mutationFn: (id: number) => deleteBloqueo(id),
    onSuccess: refrescar,
    onError: mostrarError,
  })
  return { crearReserva, crearGrupo, cambiarEstado, crearBloqueo, quitarBloqueo }
}
