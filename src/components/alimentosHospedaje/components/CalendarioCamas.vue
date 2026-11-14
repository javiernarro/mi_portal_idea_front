<script setup lang="ts">
import { computed } from 'vue'
import type { EstadoCama, ICama, IHabitacion, IReserva } from '../interfaces/alimentosHospedaje'
import { ESTILO_ESTADO, TIPO_CAMA } from '../helpers/estados'
import { DIAS_CORTOS, diaSemana, fechaCorta } from '../helpers/fechas'

const props = defineProps<{
  camas: ICama[]
  habitacionPorId: Map<string, IHabitacion>
  fechas: string[]
  estado: (camaId: string, noche: string) => EstadoCama
  reservaEn: (camaId: string, noche: string) => IReserva | undefined
  seleccionada: string | null
  noche: string
}>()

const emit = defineEmits<{ seleccionar: [camaId: string, noche: string] }>()

// Noches de domingo a sabado (en estancias de varias semanas se duerme el fin de semana)
const noches = computed(() => props.fechas)

const filas = computed(() =>
  props.camas
    .filter((c) => props.habitacionPorId.get(c.habitacionId)?.tipo !== 'bodega')
    .map((c) => {
      const h = props.habitacionPorId.get(c.habitacionId)!
      return { cama: c, habitacion: h.nombre, vip: h.tipo === 'vip' }
    }),
)

const texto = (camaId: string, noche: string) => {
  const r = props.reservaEn(camaId, noche)
  if (!r?.huespedNombre) return ''
  return r.huespedNombre.split(' ').slice(0, 2).join(' ')
}
</script>

<template>
  <v-datatable
    :value="filas"
    dataKey="cama.id"
    showGridlines
    size="small"
    scrollable
    scrollHeight="600px"
  >
    <v-column header="Habitación" frozen class="min-w-[150px]">
      <template #body="{ data }">
        <div class="text-sm font-medium">{{ data.habitacion }}</div>
        <div v-if="!data.vip" class="text-xs text-neutral-500 dark:text-zinc-400">
          Cama {{ data.cama.numero }} · {{ TIPO_CAMA[data.cama.tipo] }}
        </div>
      </template>
    </v-column>
    <v-column v-for="n in noches" :key="n" class="p-1! min-w-[110px]">
      <template #header>
        <div class="text-center w-full" :class="n === noche ? 'text-[#0059ff]' : ''">
          <div class="text-xs font-bold">{{ DIAS_CORTOS[diaSemana(n)] }}</div>
          <div class="text-xs">{{ fechaCorta(n) }}</div>
        </div>
      </template>
      <template #body="{ data }">
        <button
          type="button"
          @click="emit('seleccionar', data.cama.id, n)"
          class="w-full h-8 rounded-md border text-[11px] truncate px-1 cursor-pointer"
          :class="[
            ESTILO_ESTADO[estado(data.cama.id, n)].caja,
            ESTILO_ESTADO[estado(data.cama.id, n)].texto,
            seleccionada === data.cama.id && n === noche ? 'ring-2 ring-[#0059ff]' : '',
          ]"
          :title="ESTILO_ESTADO[estado(data.cama.id, n)].label"
        >
          {{ texto(data.cama.id, n) }}
        </button>
      </template>
    </v-column>
  </v-datatable>
</template>
