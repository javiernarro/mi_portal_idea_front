<script setup lang="ts">
import { computed, watch } from 'vue'
import { PRESETS } from '../helpers/estados'
import {
  esFinDeSemana,
  fechasReales,
  MAX_SEMANAS,
  serviciosDePreset,
  viernesFinal,
  type FormEstancia,
} from '../helpers/estancia'
import { fechaLarga, rango, sumarDias } from '../helpers/fechas'
import MatrizAlimentos from './MatrizAlimentos.vue'

const props = defineProps<{
  semanaInicio: string
  esAdmin: boolean
  /** La persona ya llegó: no se cambia la entrada. */
  entradaFija?: boolean
}>()
const f = defineModel<FormEstancia>({ required: true })

const modos = [
  { value: 'SEMANA_COMPLETA', label: 'Semana completa' },
  { value: 'PERSONALIZADA', label: 'Fechas personalizadas' },
]
const opcionesSemanas = Array.from({ length: MAX_SEMANAS }, (_, i) => ({
  value: i + 1,
  label: i === 0 ? '1 semana' : `${i + 1} semanas consecutivas`,
}))

const opcion = (fecha: string) => ({ value: fecha, label: fechaLarga(fecha) })
const opcionesEntrada = computed(() =>
  rango(props.semanaInicio, sumarDias(props.semanaInicio, 5)).map(opcion),
)
const opcionesSalida = computed(() =>
  rango(sumarDias(f.value.entradaFecha, 1), sumarDias(props.semanaInicio, 7 * MAX_SEMANAS - 1)).map(
    opcion,
  ),
)
const opcionesSalidaCompleta = computed(() => {
  const viernes = viernesFinal(props.semanaInicio, f.value.semanas)
  return [opcion(viernes), opcion(sumarDias(viernes, 1))]
})

const cambiarSemanas = (n: number) => {
  f.value = { ...f.value, semanas: n, salidaFecha: viernesFinal(props.semanaInicio, n) }
}
const cambiarModo = (modo: FormEstancia['modo']) => {
  if (modo === 'SEMANA_COMPLETA')
    f.value = {
      ...f.value,
      modo,
      entradaFecha: props.semanaInicio,
      salidaFecha: viernesFinal(props.semanaInicio, f.value.semanas),
    }
  else f.value = { ...f.value, modo }
}

/** Dias de presencia (entrada a salida): las filas de la matriz de alimentos. */
const dias = computed(() => {
  const { entrada, salida } = fechasReales(f.value, props.semanaInicio)
  return salida > entrada ? rango(entrada, salida) : []
})
const semanasEstancia = computed(() => Math.ceil(dias.value.length / 7))
const incluyeFinDeSemana = computed(() => dias.value.some(esFinDeSemana))

// Al elegir "Personalizado" se parte de todos los tiempos de lunes a viernes
const cambiarPreset = (preset: FormEstancia['preset']) => {
  f.value = {
    ...f.value,
    preset,
    servicios:
      preset === 'PERSONALIZADO' && !f.value.servicios.length
        ? serviciosDePreset('TODOS', dias.value)
        : f.value.servicios,
  }
}

// Si cambian las fechas se quitan los alimentos que quedan fuera de la estancia
watch(dias, (d) => {
  const validos = new Set(d)
  const quedan = f.value.servicios.filter((s) => validos.has(s.fecha))
  if (quedan.length !== f.value.servicios.length) f.value = { ...f.value, servicios: quedan }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div>
      <label>Estancia</label>
      <v-select
        fluid
        :modelValue="f.modo"
        :options="modos"
        optionLabel="label"
        optionValue="value"
        :disabled="entradaFija"
        @update:modelValue="cambiarModo"
      />
    </div>
    <div v-if="f.modo === 'SEMANA_COMPLETA'">
      <label>Duración</label>
      <v-select
        fluid
        :modelValue="f.semanas"
        :options="opcionesSemanas"
        optionLabel="label"
        optionValue="value"
        @update:modelValue="cambiarSemanas"
      />
    </div>
    <div v-else class="hidden md:block"></div>

    <template v-if="f.modo === 'SEMANA_COMPLETA'">
      <div>
        <label>Entrada</label>
        <v-inputtext fluid disabled :modelValue="`${fechaLarga(semanaInicio)}, ${f.entradaHora}`" />
      </div>
      <div>
        <label>Salida ({{ f.salidaHora }})</label>
        <v-select
          fluid
          v-model="f.salidaFecha"
          :options="opcionesSalidaCompleta"
          optionLabel="label"
          optionValue="value"
        />
      </div>
    </template>
    <template v-else>
      <div>
        <label>Día de entrada</label>
        <v-select
          fluid
          v-model="f.entradaFecha"
          :options="opcionesEntrada"
          optionLabel="label"
          optionValue="value"
          :disabled="entradaFija"
        />
      </div>
      <div>
        <label>Hora de entrada</label>
        <v-inputtext fluid v-model="f.entradaHora" type="time" :disabled="entradaFija" />
      </div>
      <div>
        <label>Día de salida</label>
        <v-select
          fluid
          v-model="f.salidaFecha"
          :options="opcionesSalida"
          optionLabel="label"
          optionValue="value"
        />
      </div>
      <div>
        <label>Hora de salida</label>
        <v-inputtext fluid v-model="f.salidaHora" type="time" />
      </div>
    </template>

    <small v-if="semanasEstancia > 1" class="md:col-span-2 text-neutral-500 dark:text-zinc-400">
      La persona se queda {{ semanasEstancia }} semanas, incluidos los fines de semana. Se genera
      una solicitud por cada semana.
    </small>

    <div class="md:col-span-2">
      <label>Alimentos</label>
      <v-select
        fluid
        :modelValue="f.preset"
        :options="PRESETS"
        optionLabel="label"
        optionValue="value"
        @update:modelValue="cambiarPreset"
      />
      <small
        v-if="incluyeFinDeSemana && f.preset !== 'PERSONALIZADO'"
        class="text-neutral-500 dark:text-zinc-400"
      >
        Sin alimentos en fin de semana.
        {{ esAdmin ? 'Para pedirlos elige "Personalizado".' : '' }}
      </small>
    </div>
    <div v-if="f.preset === 'PERSONALIZADO'" class="md:col-span-2">
      <MatrizAlimentos v-model="f.servicios" :dias="dias" :esAdmin="esAdmin" />
    </div>
  </div>
</template>
