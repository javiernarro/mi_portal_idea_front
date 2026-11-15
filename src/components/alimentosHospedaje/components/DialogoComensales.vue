<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { mensajeOk, pregunta } from '@/helper/mensajes'
import type {
  IComensal,
  IEmpleadoHuesped,
  IServicio,
  ISolicitudDetalle,
} from '../interfaces/alimentosHospedaje'
import {
  buscarEmpleados,
  deleteComensal,
  getSolicitud,
  postComensal,
  putComensal,
} from '../services/alimentosHospedaje'
import { mostrarError, usePermisosAH } from '../composables/useAlimentosHospedaje'
import { serviciosDePreset } from '../helpers/estancia'
import MatrizAlimentos from './MatrizAlimentos.vue'

const props = defineProps<{ solicitudId: number }>()
const visible = defineModel<boolean>('visible', { required: true })
const { esAdmin } = usePermisosAH()
const queryClient = useQueryClient()

const detalle = ref<ISolicitudDetalle | null>(null)
const editando = ref<IComensal | null>(null)
const servicios = ref<IServicio[]>([])
const nuevo = ref<IEmpleadoHuesped | null>(null)
const texto = ref<string | IEmpleadoHuesped>('')
const sugerencias = ref<IEmpleadoHuesped[]>([])
const guardando = ref(false)

const cargar = async () => {
  detalle.value = (await getSolicitud(props.solicitudId).catch(mostrarError)) ?? null
}
watch(
  visible,
  (v) => {
    if (!v) return
    editando.value = null
    nuevo.value = null
    texto.value = ''
    cargar()
  },
  { immediate: true },
)

// Dias de lunes a viernes (y fin de semana solo para el administrador)
const dias = computed(() => detalle.value?.fechas ?? [])

const buscar = async (e: { query: string }) => {
  const ya = new Set(detalle.value?.comensales.map((c) => c.empleadoId))
  sugerencias.value = (await buscarEmpleados(e.query)).filter((x) => !ya.has(x.id))
}
const etiquetaEmpleado = (x: IEmpleadoHuesped) =>
  `${x.nombre} · ${x.numero ?? 's/n'} · ${x.sucursal || 'Sin sucursal'}${x.instructor ? ' · Instructor' : ''}`

const elegirNuevo = (e: { value: IEmpleadoHuesped }) => {
  nuevo.value = e.value
  editando.value = null
  // Propuesta: comida de lunes a viernes, como a los instructores
  servicios.value = serviciosDePreset('TODOS', dias.value).filter((s) => s.tiempo === 'COM')
}
const editar = (c: IComensal) => {
  editando.value = c
  nuevo.value = null
  servicios.value = [...c.servicios]
}

const terminar = async (folios: string[] | undefined, mensaje: string) => {
  if (!folios) return
  mensajeOk(`${mensaje} · ${folios.join(', ')}`)
  editando.value = null
  nuevo.value = null
  texto.value = ''
  queryClient.invalidateQueries({ queryKey: ['ahSolicitudes'] })
  await cargar()
}

const guardar = async () => {
  guardando.value = true
  if (nuevo.value) {
    const r = await postComensal(props.solicitudId, {
      empleadoId: nuevo.value.id,
      servicios: servicios.value,
    }).catch(mostrarError)
    await terminar(r?.folios, 'Comensal agregado')
  } else if (editando.value) {
    const r = await putComensal(editando.value.id, servicios.value).catch(mostrarError)
    await terminar(r?.folios, 'Alimentos actualizados')
  }
  guardando.value = false
}

const quitar = async (c: IComensal) => {
  const ok = await pregunta('¿Quitar de la solicitud?', c.nombre)
  if (!ok) return
  const r = await deleteComensal(c.id).catch(mostrarError)
  await terminar(r?.folios, 'Comensal quitado')
}
</script>

<template>
  <v-dialog
    v-model:visible="visible"
    modal
    :header="`Comensales sin hospedaje · ${detalle?.folio ?? ''}`"
    class="w-[95vw] md:w-[760px]"
  >
    <div class="flex flex-col gap-3">
      <v-datatable :value="detalle?.comensales ?? []" size="small" showGridlines>
        <template #empty>Sin comensales adicionales.</template>
        <v-column header="Persona">
          <template #body="{ data }">
            <div class="text-sm font-medium">{{ data.nombre }}</div>
            <div class="text-xs text-neutral-500 dark:text-zinc-400">
              {{ data.sucursal || 'Sin sucursal' }} · {{ data.ccClave || 'sin centro de costos' }}
              {{ data.esInstructor ? '· Instructor' : '' }}
            </div>
          </template>
        </v-column>
        <v-column header="Alimentos" class="w-[100px] text-center">
          <template #body="{ data }">{{ data.servicios.length }}</template>
        </v-column>
        <v-column class="w-[110px]">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end">
              <v-button icon="pi pi-pencil" text size="small" @click="editar(data)" />
              <v-button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click="quitar(data)"
              />
            </div>
          </template>
        </v-column>
      </v-datatable>

      <div>
        <label>Agregar persona sin hospedaje</label>
        <v-autocomplete
          fluid
          v-model="texto"
          :suggestions="sugerencias"
          :optionLabel="etiquetaEmpleado"
          :minLength="2"
          :delay="300"
          placeholder="Nombre o número de empleado"
          @complete="buscar"
          @option-select="elegirNuevo"
        />
        <small class="text-neutral-500 dark:text-zinc-400">
          Instructores siempre. Personal local que no es instructor: solo el administrador.
        </small>
      </div>

      <template v-if="nuevo || editando">
        <div class="text-sm font-semibold">{{ (nuevo ?? editando)?.nombre }}</div>
        <MatrizAlimentos v-model="servicios" :dias="dias" :esAdmin="esAdmin" />
      </template>
    </div>

    <template #footer>
      <v-button label="Cerrar" severity="secondary" outlined @click="visible = false" />
      <v-button
        v-if="nuevo || editando"
        :label="nuevo ? 'Agregar' : 'Guardar alimentos'"
        icon="pi pi-check"
        :disabled="!servicios.length"
        :loading="guardando"
        @click="guardar"
      />
    </template>
  </v-dialog>
</template>
