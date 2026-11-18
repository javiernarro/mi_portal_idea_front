<script setup lang="ts">
import type { EstadoCama, ICama, IHabitacion, IReserva } from '../interfaces/alimentosHospedaje'
import { ESTILO_ESTADO, TIPO_CAMA } from '../helpers/estados'

const props = defineProps<{
  habitaciones: IHabitacion[]
  camasDe: (habitacionId: string) => ICama[]
  estado: (camaId: string, noche: string) => EstadoCama
  reservaEn: (camaId: string, noche: string) => IReserva | undefined
  noche: string
  seleccionada: string | null
}>()

const emit = defineEmits<{ seleccionar: [camaId: string] }>()

// Áreas del piso que no se asignan (referencia del plano)
const areas = [
  { nombre: 'Baños generales', col: 1, row: 1, colSpan: 1, rowSpan: 1 },
  { nombre: 'Escaleras · Salida', col: 2, row: 1, colSpan: 3, rowSpan: 1 },
  { nombre: 'Estancia · Comedor', col: 2, row: 2, colSpan: 3, rowSpan: 2 },
]

const posicion = (x: { col: number; row: number; colSpan: number; rowSpan: number }) => ({
  gridColumn: `${x.col} / span ${x.colSpan}`,
  gridRow: `${x.row} / span ${x.rowSpan}`,
})

const posHab = (h: IHabitacion) =>
  posicion({ col: h.planoCol, row: h.planoRow, colSpan: h.planoColSpan, rowSpan: h.planoRowSpan })

const titulo = (c: ICama) => {
  const r = props.reservaEn(c.id, props.noche)
  return `Cama ${c.numero} · ${TIPO_CAMA[c.tipo]}${r?.huespedNombre ? ' · ' + r.huespedNombre : ''}`
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="grid grid-cols-7 auto-rows-[minmax(96px,auto)] gap-2 min-w-[720px]">
      <div
        v-for="a in areas"
        :key="a.nombre"
        :style="posicion(a)"
        class="rounded-lg border border-dashed border-neutral-300 dark:border-zinc-700 flex items-center justify-center text-xs text-neutral-500 dark:text-zinc-400 text-center p-2"
      >
        {{ a.nombre }}
      </div>

      <div
        v-for="h in habitaciones"
        :key="h.id"
        :style="posHab(h)"
        class="rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 flex flex-col gap-1.5"
      >
        <div class="flex items-center justify-between gap-1">
          <span class="text-sm font-semibold text-neutral-800 dark:text-zinc-100">{{
            h.nombre
          }}</span>
          <i
            v-if="h.nota && h.tipo === 'compartida'"
            class="pi pi-exclamation-triangle text-amber-500 text-xs"
            v-tooltip.top="h.nota"
          />
        </div>
        <div v-if="h.tipo === 'bodega'" class="text-xs text-neutral-400 dark:text-zinc-500">
          {{ h.nota || 'Bodega' }}
        </div>
        <div v-else class="flex flex-wrap gap-1.5">
          <button
            v-for="c in camasDe(h.id)"
            :key="c.id"
            type="button"
            :title="titulo(c)"
            @click="emit('seleccionar', c.id)"
            class="min-w-9 h-9 px-2 rounded-md border text-xs font-semibold transition-colors cursor-pointer"
            :class="[
              ESTILO_ESTADO[estado(c.id, noche)].caja,
              ESTILO_ESTADO[estado(c.id, noche)].texto,
              seleccionada === c.id
                ? 'ring-2 ring-offset-1 ring-[#0059ff] dark:ring-offset-zinc-900'
                : '',
            ]"
          >
            {{ h.tipo === 'vip' ? h.id : c.numero }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
