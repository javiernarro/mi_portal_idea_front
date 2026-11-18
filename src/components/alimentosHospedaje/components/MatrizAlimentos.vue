<script setup lang="ts">
import { computed } from 'vue'
import type { IServicio, TiempoComida } from '../interfaces/alimentosHospedaje'
import { TIEMPOS } from '../helpers/estados'
import { esFinDeSemana } from '../helpers/estancia'
import { fechaLarga } from '../helpers/fechas'

const props = defineProps<{
  dias: string[]
  /** Sabado y domingo solo los puede pedir el administrador. */
  esAdmin: boolean
}>()
const servicios = defineModel<IServicio[]>({ required: true })

const filas = computed(() =>
  props.dias.map((fecha) => ({
    fecha,
    finDeSemana: esFinDeSemana(fecha),
    bloqueada: esFinDeSemana(fecha) && !props.esAdmin,
  })),
)

const tiene = (fecha: string, tiempo: TiempoComida) =>
  servicios.value.some((s) => s.fecha === fecha && s.tiempo === tiempo)

const cambiar = (fecha: string, tiempo: TiempoComida, valor: boolean) => {
  const resto = servicios.value.filter((s) => !(s.fecha === fecha && s.tiempo === tiempo))
  servicios.value = valor ? [...resto, { fecha, tiempo }] : resto
}

const total = computed(() => servicios.value.length)
</script>

<template>
  <v-datatable :value="filas" dataKey="fecha" size="small" showGridlines>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <span class="font-semibold">Alimentos por día</span>
        <span class="text-sm text-neutral-500 dark:text-zinc-400">{{ total }} servicios</span>
      </div>
    </template>
    <v-column header="Día">
      <template #body="{ data }">
        <div class="text-sm">{{ fechaLarga(data.fecha) }}</div>
        <small v-if="data.bloqueada" class="text-neutral-500 dark:text-zinc-400">
          Fin de semana: solo el administrador
        </small>
      </template>
    </v-column>
    <v-column v-for="t in TIEMPOS" :key="t.value" :header="t.label" class="w-[90px] text-center">
      <template #body="{ data }">
        <v-checkbox
          binary
          :inputId="`${data.fecha}-${t.value}`"
          :disabled="data.bloqueada"
          :modelValue="tiene(data.fecha, t.value)"
          @update:modelValue="(v: boolean) => cambiar(data.fecha, t.value, v)"
        />
      </template>
    </v-column>
  </v-datatable>
</template>
