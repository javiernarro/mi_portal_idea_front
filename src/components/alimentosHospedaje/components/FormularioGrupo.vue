<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import type {
  ICama,
  IClaseSemana,
  IEmpleadoHuesped,
  IHabitacion,
  Motivo,
} from '../interfaces/alimentosHospedaje'
import {
  buscarEmpleados,
  getClasesSemana,
  getParticipantesClase,
  postProponerCamas,
} from '../services/alimentosHospedaje'
import { mostrarError, useAccionesAH, usePermisosAH } from '../composables/useAlimentosHospedaje'
import { MOTIVOS } from '../helpers/estados'
import { aEstancia, estanciaInicial, fechasReales, type FormEstancia } from '../helpers/estancia'
import { fechaCorta } from '../helpers/fechas'
import CamposEstancia from './CamposEstancia.vue'

const props = defineProps<{
  semanaInicio: string
  entradaHora: string
  salidaHora: string
  sucursalLocal: string
  camas: ICama[]
  habitacionPorId: Map<string, IHabitacion>
  preferidas: string[]
}>()
const visible = defineModel<boolean>('visible', { required: true })
const { crearGrupo } = useAccionesAH()
const { esAdmin } = usePermisosAH()

interface Fila {
  empleado: IEmpleadoHuesped
  camaId: string | null
}

const nombre = ref('')
const claseId = ref<number | null>(null)
const clases = ref<IClaseSemana[]>([])
const motivo = ref<Motivo>('CURSO')
const detalleMotivo = ref('')
const formEstancia = ref<FormEstancia>(
  estanciaInicial(props.semanaInicio, props.entradaHora, props.salidaHora),
)
const incluirVip = ref(false)
const filas = ref<Fila[]>([])
const omitidos = ref<string[]>([])
const texto = ref<string | IEmpleadoHuesped>('')
const sugerencias = ref<IEmpleadoHuesped[]>([])
const asignando = ref(false)

watch(visible, async (v) => {
  if (!v) return
  nombre.value = ''
  claseId.value = null
  motivo.value = 'CURSO'
  detalleMotivo.value = ''
  formEstancia.value = estanciaInicial(props.semanaInicio, props.entradaHora, props.salidaHora)
  incluirVip.value = false
  filas.value = []
  omitidos.value = []
  clases.value = (await getClasesSemana(props.semanaInicio).catch(() => [])) ?? []
})

const opcionesClase = computed(() =>
  clases.value.map((c) => ({
    value: c.id,
    label: `#${c.id} ${c.curso} (${fechaCorta(c.fechaInicio)} a ${fechaCorta(c.fechaFinalizacion)}, ${c.alumnos} alumnos)`,
  })),
)

/** Toma los alumnos foráneos de la capacitación; el personal local se omite. */
const tomarDeClase = async () => {
  if (!claseId.value) return
  const p = await getParticipantesClase(claseId.value).catch(mostrarError)
  if (!p) return
  const clase = clases.value.find((c) => c.id === claseId.value)
  if (clase && !nombre.value) nombre.value = clase.curso
  if (clase && !detalleMotivo.value) detalleMotivo.value = clase.curso
  const ya = new Set(filas.value.map((f) => f.empleado.id))
  omitidos.value = p.alumnos.filter((a) => a.local).map((a) => a.nombre)
  for (const a of p.alumnos.filter((x) => !x.local && !ya.has(x.id)))
    filas.value.push({ empleado: a, camaId: null })
}

const buscar = async (e: { query: string }) => {
  const ya = new Set(filas.value.map((f) => f.empleado.id))
  sugerencias.value = (await buscarEmpleados(e.query)).filter((x) => !ya.has(x.id))
}
const etiquetaEmpleado = (x: IEmpleadoHuesped) =>
  `${x.nombre} · ${x.numero ?? 's/n'} · ${x.sucursal || 'Sin sucursal'}`
const agregar = (e: { value: IEmpleadoHuesped }) => {
  filas.value.push({ empleado: e.value, camaId: null })
  texto.value = ''
}
const quitar = (i: number) => filas.value.splice(i, 1)

const estancia = computed(() => aEstancia(formEstancia.value, props.semanaInicio))

const opcionesCama = computed(() =>
  props.camas
    .filter((c) => {
      const h = props.habitacionPorId.get(c.habitacionId)
      return h && h.tipo !== 'bodega'
    })
    .map((c) => {
      const h = props.habitacionPorId.get(c.habitacionId)!
      return { value: c.id, label: h.tipo === 'vip' ? h.nombre : `${h.nombre} · Cama ${c.numero}` }
    }),
)

/** Propone camas contiguas para quienes no tienen cama, respetando las ya elegidas. */
const asignarCamas = async () => {
  const sinCama = filas.value.filter((f) => !f.camaId)
  if (!sinCama.length) return
  asignando.value = true
  const r = await postProponerCamas({
    cantidad: sinCama.length,
    estancia: estancia.value,
    incluirVip: incluirVip.value,
    preferidas: props.preferidas,
    excluir: filas.value.filter((f) => f.camaId).map((f) => f.camaId!),
  }).catch(mostrarError)
  asignando.value = false
  if (!r) return
  sinCama.forEach((f, i) => (f.camaId = r.camas[i] ?? null))
  if (r.mensaje) Swal.fire({ icon: 'warning', title: 'Camas insuficientes', text: r.mensaje })
}

const valido = computed(
  () =>
    !!nombre.value.trim() &&
    fechasReales(formEstancia.value, props.semanaInicio).salida >
      fechasReales(formEstancia.value, props.semanaInicio).entrada &&
    filas.value.length > 0 &&
    filas.value.every((f) => f.camaId && !f.empleado.local) &&
    new Set(filas.value.map((f) => f.camaId)).size === filas.value.length,
)

const guardar = async () => {
  const r = await crearGrupo
    .mutateAsync({
      nombre: nombre.value.trim(),
      claseId: claseId.value,
      estancia: estancia.value,
      motivo: motivo.value,
      detalleMotivo: detalleMotivo.value || null,
      presetAlimentos: formEstancia.value.preset,
      servicios:
        formEstancia.value.preset === 'PERSONALIZADO' ? formEstancia.value.servicios : undefined,
      participantes: filas.value.map((f) => ({ empleadoId: f.empleado.id, camaId: f.camaId! })),
    })
    .catch(() => null)
  if (!r) return
  visible.value = false
  const titulo = `Grupo reservado: ${r.reservas.length} personas`
  const texto = `Solicitud: ${r.folios.join(', ')}`
  Swal.fire({
    icon: r.avisos?.length ? 'warning' : 'success',
    title: titulo,
    text: [texto, ...(r.avisos ?? [])].join('\n'),
  })
}
</script>

<template>
  <v-dialog v-model:visible="visible" modal header="Reserva de grupo" class="w-[95vw] md:w-[860px]">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="md:col-span-2">
        <label>Tomar alumnos de una capacitación de esta semana</label>
        <div class="flex gap-2">
          <v-select
            fluid
            v-model="claseId"
            :options="opcionesClase"
            optionLabel="label"
            optionValue="value"
            filter
            showClear
            placeholder="Opcional"
          />
          <v-button
            label="Tomar"
            icon="pi pi-download"
            :disabled="!claseId"
            @click="tomarDeClase"
          />
        </div>
        <small v-if="omitidos.length" class="text-amber-700 dark:text-amber-300">
          Se omitió al personal de {{ sucursalLocal }} (sin hospedaje): {{ omitidos.join(', ') }}.
        </small>
      </div>

      <div>
        <label>Nombre del grupo</label>
        <v-inputtext fluid v-model="nombre" />
      </div>
      <div>
        <label>Motivo</label>
        <v-select
          fluid
          v-model="motivo"
          :options="MOTIVOS"
          optionLabel="label"
          optionValue="value"
        />
      </div>
      <div class="md:col-span-2">
        <label>Curso o proyecto</label>
        <v-inputtext
          fluid
          v-model="detalleMotivo"
          placeholder="Va en el folio; si se deja vacío se usa el nombre del grupo"
        />
      </div>

      <div class="md:col-span-2">
        <CamposEstancia v-model="formEstancia" :semanaInicio="semanaInicio" :esAdmin="esAdmin" />
      </div>

      <div class="md:col-span-2">
        <label>Agregar persona</label>
        <v-autocomplete
          fluid
          v-model="texto"
          :suggestions="sugerencias"
          :optionLabel="etiquetaEmpleado"
          :minLength="2"
          :delay="300"
          placeholder="Nombre o número de empleado"
          @complete="buscar"
          @option-select="agregar"
        />
      </div>
    </div>

    <v-datatable :value="filas" size="small" showGridlines class="mt-3">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold">Participantes ({{ filas.length }})</span>
          <div class="flex items-center gap-2">
            <v-toggleswitch v-model="incluirVip" inputId="incluirVip" />
            <label for="incluirVip" class="text-sm">Usar VIP</label>
            <v-button
              label="Asignar camas"
              icon="pi pi-th-large"
              size="small"
              severity="secondary"
              :loading="asignando"
              :disabled="!filas.length"
              @click="asignarCamas"
            />
          </div>
        </div>
      </template>
      <template #empty>Agrega personas o tómalas de una capacitación.</template>
      <v-column header="Persona">
        <template #body="{ data }">
          <div class="text-sm font-medium">{{ data.empleado.nombre }}</div>
          <div class="text-xs text-neutral-500 dark:text-zinc-400">
            {{ data.empleado.numero ?? 's/n' }} · {{ data.empleado.sucursal || 'Sin sucursal' }} ·
            {{ data.empleado.ccClave || 'sin centro de costos' }}
          </div>
          <small v-if="data.empleado.local" class="text-red-500"
            >Personal local: sin hospedaje</small
          >
        </template>
      </v-column>
      <v-column header="Cama" class="w-[260px]">
        <template #body="{ data }">
          <v-select
            fluid
            size="small"
            v-model="data.camaId"
            :options="opcionesCama"
            optionLabel="label"
            optionValue="value"
            filter
            placeholder="Sin cama"
          />
        </template>
      </v-column>
      <v-column class="w-[60px]">
        <template #body="{ index }">
          <v-button icon="pi pi-trash" severity="danger" text size="small" @click="quitar(index)" />
        </template>
      </v-column>
    </v-datatable>

    <template #footer>
      <v-button label="Cancelar" severity="secondary" outlined @click="visible = false" />
      <v-button
        label="Reservar grupo"
        icon="pi pi-check"
        :disabled="!valido"
        :loading="crearGrupo.isPending.value"
        @click="guardar"
      />
    </template>
  </v-dialog>
</template>
