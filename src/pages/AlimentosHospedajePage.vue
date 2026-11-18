<script setup lang="ts">
import { computed, ref } from 'vue'
import NavBar from '@/layout/NavBar.vue'
import PlanoPiso from '@/components/alimentosHospedaje/components/PlanoPiso.vue'
import CalendarioCamas from '@/components/alimentosHospedaje/components/CalendarioCamas.vue'
import DetalleCama from '@/components/alimentosHospedaje/components/DetalleCama.vue'
import LeyendaEstados from '@/components/alimentosHospedaje/components/LeyendaEstados.vue'
import FormularioReserva from '@/components/alimentosHospedaje/components/FormularioReserva.vue'
import FormularioBloqueo from '@/components/alimentosHospedaje/components/FormularioBloqueo.vue'
import FormularioGrupo from '@/components/alimentosHospedaje/components/FormularioGrupo.vue'
import PanelSolicitudes from '@/components/alimentosHospedaje/components/PanelSolicitudes.vue'
import DialogoCaseta from '@/components/alimentosHospedaje/components/DialogoCaseta.vue'
import {
  useEstadoCamas,
  usePermisosAH,
  usePiso,
  useSemana,
} from '@/components/alimentosHospedaje/composables/useAlimentosHospedaje'
import type { IReserva } from '@/components/alimentosHospedaje/interfaces/alimentosHospedaje'
import {
  DIAS_CORTOS,
  diaSemana,
  fechaCorta,
  sumarDias,
} from '@/components/alimentosHospedaje/helpers/fechas'

const { puedeModificar, puedeConsultar, esAdmin } = usePermisosAH()
const verCaseta = ref(false)
const { piso, habitaciones, camas, habitacionPorId, camasDe, etiquetaCama, isLoading } = usePiso()
const {
  semanaInicio,
  noche,
  fechas,
  reservas,
  bloqueos,
  anterior,
  siguiente,
  hoy,
  isLoading: cargandoSemana,
} = useSemana()
const { estado, reservaEn, bloqueoEn } = useEstadoCamas(camas, habitacionPorId, reservas, bloqueos)

const seleccionada = ref<string | null>(null)
const vista = ref<'plano' | 'calendario' | 'solicitudes'>('plano')
const verReserva = ref(false)
const verBloqueo = ref(false)
const verGrupo = ref(false)
const verEdicion = ref(false)
const reservaEditar = ref<IReserva | null>(null)

// Noches de domingo a sabado: en estancias de 2 o 3 semanas se duerme tambien el fin de semana
const noches = computed(() => fechas.value)

const opcionesCama = computed(() =>
  camas.value
    .filter((c) => habitacionPorId.value.get(c.habitacionId)?.tipo !== 'bodega')
    .map((c) => ({ value: c.id, label: etiquetaCama(c.id) })),
)
const editar = (r: IReserva) => {
  reservaEditar.value = r
  verEdicion.value = true
}

const cama = computed(() => camas.value.find((c) => c.id === seleccionada.value))
const habitacion = computed(() =>
  cama.value ? habitacionPorId.value.get(cama.value.habitacionId) : undefined,
)

const seleccionar = (camaId: string, n?: string) => {
  seleccionada.value = camaId
  if (n) noche.value = n
}

const resumen = computed(() => {
  const asignables = camas.value.filter(
    (c) => habitacionPorId.value.get(c.habitacionId)?.tipo !== 'bodega',
  )
  const conteo = { DISPONIBLE: 0, RESERVADA: 0, OCUPADA: 0, FUERA_SERVICIO: 0, NO_ASIGNABLE: 0 }
  for (const c of asignables) conteo[estado(c.id, noche.value)]++
  return { total: asignables.length, ...conteo }
})

const vistas = [
  { value: 'plano', label: 'Plano' },
  { value: 'calendario', label: 'Calendario' },
  ...(puedeConsultar ? [{ value: 'solicitudes', label: 'Solicitudes' }] : []),
]
</script>

<template>
  <NavBar titulo="Alimentos y Hospedaje" />

  <v-card>
    <template #content>
      <div class="flex flex-col gap-4">
        <!-- Semana y noche -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <v-button
              icon="pi pi-chevron-left"
              severity="secondary"
              outlined
              size="small"
              @click="anterior"
            />
            <v-button
              icon="pi pi-chevron-right"
              severity="secondary"
              outlined
              size="small"
              @click="siguiente"
            />
            <v-button label="Hoy" severity="secondary" outlined size="small" @click="hoy" />
            <h2 class="text-lg font-bold text-neutral-800 dark:text-zinc-100 tracking-tight ml-2">
              Semana del {{ fechaCorta(semanaInicio) }} al
              {{ fechaCorta(sumarDias(semanaInicio, 6)) }}
            </h2>
            <v-progressspinner
              v-if="cargandoSemana"
              style="width: 20px; height: 20px"
              strokeWidth="6"
            />
          </div>
          <LeyendaEstados />
          <div class="flex items-center gap-2">
            <v-select
              v-model="vista"
              :options="vistas"
              optionLabel="label"
              optionValue="value"
              size="small"
            />
            <v-button
              v-if="esAdmin && puedeModificar"
              label="QR de Caseta"
              icon="pi pi-qrcode"
              size="small"
              severity="secondary"
              outlined
              @click="verCaseta = true"
            />
            <v-button
              v-if="puedeModificar"
              label="Reserva de grupo"
              icon="pi pi-users"
              size="small"
              @click="verGrupo = true"
            />
          </div>
        </div>

        <div v-if="vista !== 'solicitudes'" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-neutral-600 dark:text-zinc-300">Noche:</span>
          <v-button
            v-for="n in noches"
            :key="n"
            :label="`${DIAS_CORTOS[diaSemana(n)]} ${fechaCorta(n)}`"
            size="small"
            :outlined="n !== noche"
            :severity="n === noche ? undefined : 'secondary'"
            @click="noche = n"
          />
          <span class="text-sm text-neutral-500 dark:text-zinc-400 ml-auto">
            {{ resumen.DISPONIBLE }} libres · {{ resumen.RESERVADA }} reservadas ·
            {{ resumen.OCUPADA }} ocupadas · {{ resumen.FUERA_SERVICIO }} fuera de servicio ·
            {{ resumen.total }} camas
          </span>
        </div>

        <PanelSolicitudes v-if="vista === 'solicitudes'" :semanaInicio="semanaInicio" />

        <div v-else-if="isLoading" class="grid grid-cols-7 gap-2">
          <v-skeleton v-for="i in 14" :key="i" height="96px" />
        </div>

        <div v-else class="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
          <div class="min-w-0">
            <PlanoPiso
              v-if="vista === 'plano'"
              :habitaciones="habitaciones"
              :camasDe="camasDe"
              :estado="estado"
              :reservaEn="reservaEn"
              :noche="noche"
              :seleccionada="seleccionada"
              @seleccionar="seleccionar"
            />
            <CalendarioCamas
              v-else
              :camas="camas"
              :habitacionPorId="habitacionPorId"
              :fechas="fechas"
              :estado="estado"
              :reservaEn="reservaEn"
              :seleccionada="seleccionada"
              :noche="noche"
              @seleccionar="seleccionar"
            />
          </div>

          <div
            class="rounded-lg border border-neutral-200 dark:border-zinc-700 p-3 2xl:sticky 2xl:top-2"
          >
            <DetalleCama
              v-if="cama && habitacion"
              :cama="cama"
              :habitacion="habitacion"
              :noche="noche"
              :estado="estado(cama.id, noche)"
              :reserva="reservaEn(cama.id, noche)"
              :bloqueo="bloqueoEn(cama, noche)"
              @reservar="verReserva = true"
              @bloquear="verBloqueo = true"
              @editar="editar"
            />
            <div v-else class="text-sm text-neutral-500 dark:text-zinc-400">
              Selecciona una cama en el plano o en el calendario para ver su detalle.
            </div>
          </div>
        </div>
      </div>
    </template>
  </v-card>

  <FormularioReserva
    v-if="cama && piso"
    v-model:visible="verReserva"
    :camaId="cama.id"
    :etiqueta="etiquetaCama(cama.id)"
    :semanaInicio="semanaInicio"
    :entradaHora="piso.configuracion.entradaHora"
    :salidaHora="piso.configuracion.salidaHora"
    :sucursalLocal="piso.configuracion.sucursalLocal"
  />
  <FormularioReserva
    v-if="reservaEditar && piso"
    v-model:visible="verEdicion"
    :camaId="reservaEditar.camaId"
    :etiqueta="etiquetaCama(reservaEditar.camaId)"
    :semanaInicio="reservaEditar.semanaInicio ?? semanaInicio"
    :entradaHora="piso.configuracion.entradaHora"
    :salidaHora="piso.configuracion.salidaHora"
    :sucursalLocal="piso.configuracion.sucursalLocal"
    :reserva="reservaEditar"
    :opcionesCama="opcionesCama"
  />
  <DialogoCaseta v-if="verCaseta" v-model:visible="verCaseta" />
  <FormularioBloqueo
    v-if="cama && habitacion"
    v-model:visible="verBloqueo"
    :habitacionId="habitacion.id"
    :habitacion="habitacion.nombre"
    :compartida="habitacion.tipo === 'compartida'"
    :camaId="cama.id"
    :numeroCama="cama.numero"
    :noche="noche"
  />
  <FormularioGrupo
    v-if="piso && puedeModificar"
    v-model:visible="verGrupo"
    :semanaInicio="semanaInicio"
    :entradaHora="piso.configuracion.entradaHora"
    :salidaHora="piso.configuracion.salidaHora"
    :sucursalLocal="piso.configuracion.sucursalLocal"
    :camas="camas"
    :habitacionPorId="habitacionPorId"
    :preferidas="seleccionada ? [seleccionada] : []"
  />
</template>
