<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { mensajeOk } from '@/helper/mensajes'
import type { IEmpleadoHuesped, IEstancia, Motivo, Preset } from '../interfaces/alimentosHospedaje'
import { buscarEmpleados } from '../services/alimentosHospedaje'
import { useAccionesAH } from '../composables/useAlimentosHospedaje'
import { MOTIVOS, PRESETS } from '../helpers/estados'
import { fechaLarga, sumarDias } from '../helpers/fechas'

const props = defineProps<{
  camaId: string
  etiqueta: string
  semanaInicio: string
  entradaHora: string
  salidaHora: string
  sucursalLocal: string
}>()
const visible = defineModel<boolean>('visible', { required: true })

const { crearReserva } = useAccionesAH()

const empleado = ref<IEmpleadoHuesped | null>(null)
const texto = ref<string | IEmpleadoHuesped>('')
const sugerencias = ref<IEmpleadoHuesped[]>([])
const motivo = ref<Motivo>('CURSO')
const detalleMotivo = ref('')
const modo = ref<'SEMANA_COMPLETA' | 'PERSONALIZADA'>('SEMANA_COMPLETA')
const entradaFecha = ref(props.semanaInicio)
const entradaHora = ref(props.entradaHora)
const salidaFecha = ref(sumarDias(props.semanaInicio, 5))
const salidaHora = ref(props.salidaHora)
const preset = ref<Preset>('TODOS')
const notas = ref('')
const excepcionLocal = ref(false)

watch(visible, (v) => {
  if (!v) return
  empleado.value = null
  texto.value = ''
  motivo.value = 'CURSO'
  detalleMotivo.value = ''
  modo.value = 'SEMANA_COMPLETA'
  entradaFecha.value = props.semanaInicio
  entradaHora.value = props.entradaHora
  salidaFecha.value = sumarDias(props.semanaInicio, 5)
  salidaHora.value = props.salidaHora
  preset.value = 'TODOS'
  notas.value = ''
  excepcionLocal.value = false
})

const buscar = async (e: { query: string }) => {
  sugerencias.value = await buscarEmpleados(e.query)
}
const etiquetaEmpleado = (x: IEmpleadoHuesped) =>
  `${x.nombre} · ${x.numero ?? 's/n'} · ${x.sucursal || 'Sin sucursal'}`

const dias = (desde: number, hasta: number) =>
  Array.from({ length: hasta - desde + 1 }, (_, i) => {
    const f = sumarDias(props.semanaInicio, desde + i)
    return { value: f, label: fechaLarga(f) }
  })
const opcionesEntrada = computed(() => dias(0, 5))
const opcionesSalida = computed(() => dias(1, 6))
const opcionesSalidaCompleta = computed(() => dias(5, 6))
const modos = [
  { value: 'SEMANA_COMPLETA', label: 'Semana completa' },
  { value: 'PERSONALIZADA', label: 'Fechas personalizadas' },
]

const estancia = computed<IEstancia>(() =>
  modo.value === 'SEMANA_COMPLETA'
    ? { modo: 'SEMANA_COMPLETA', semanaInicio: props.semanaInicio, salidaFecha: salidaFecha.value }
    : {
        modo: 'PERSONALIZADA',
        semanaInicio: props.semanaInicio,
        entradaFecha: entradaFecha.value,
        entradaHora: entradaHora.value,
        salidaFecha: salidaFecha.value,
        salidaHora: salidaHora.value,
      },
)

const valido = computed(
  () =>
    !!empleado.value &&
    (!empleado.value.local || excepcionLocal.value) &&
    salidaFecha.value > entradaFecha.value,
)

const guardar = async () => {
  if (!empleado.value) return
  const r = await crearReserva
    .mutateAsync({
      empleadoId: empleado.value.id,
      camaId: props.camaId,
      estancia: estancia.value,
      motivo: motivo.value,
      detalleMotivo: detalleMotivo.value || null,
      presetAlimentos: preset.value,
      notas: notas.value || null,
      excepcionLocal: excepcionLocal.value,
    })
    .catch(() => null)
  if (!r) return
  visible.value = false
  const folio = r.reservas[0]?.folio ?? ''
  if (r.avisos?.length) {
    Swal.fire({ icon: 'warning', title: `Reserva ${folio} creada`, text: r.avisos.join('\n') })
  } else {
    mensajeOk(`Reserva ${folio} creada`)
  }
}
</script>

<template>
  <v-dialog
    v-model:visible="visible"
    modal
    :header="`Reservar ${etiqueta}`"
    class="w-[95vw] md:w-[640px]"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="md:col-span-2">
        <label>Persona (registrada en el portal)</label>
        <v-autocomplete
          fluid
          v-model="texto"
          :suggestions="sugerencias"
          :optionLabel="etiquetaEmpleado"
          :minLength="2"
          :delay="300"
          placeholder="Nombre o número de empleado"
          @complete="buscar"
          @option-select="(e: { value: IEmpleadoHuesped }) => (empleado = e.value)"
        />
      </div>

      <div v-if="empleado" class="md:col-span-2 text-sm text-neutral-600 dark:text-zinc-300">
        {{ empleado.cargo || 'Sin cargo' }} · Centro de costos {{ empleado.ccClave || 'sin clave' }}
        {{ empleado.ccNombre ? '(' + empleado.ccNombre + ')' : '' }}
      </div>

      <div
        v-if="empleado?.local"
        class="md:col-span-2 rounded-md border border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/50 p-2 text-sm text-amber-900 dark:text-amber-100"
      >
        Es personal de {{ sucursalLocal }}. El hospedaje es solo para personal foráneo.
        <div class="flex items-center gap-2 mt-2">
          <v-toggleswitch v-model="excepcionLocal" inputId="excepcionLocal" />
          <label for="excepcionLocal">Autorizar como excepción (solo administrador)</label>
        </div>
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
      <div>
        <label>Curso o proyecto</label>
        <v-inputtext fluid v-model="detalleMotivo" placeholder="Opcional" />
      </div>

      <div class="md:col-span-2">
        <label>Estancia</label>
        <v-select fluid v-model="modo" :options="modos" optionLabel="label" optionValue="value" />
      </div>

      <template v-if="modo === 'SEMANA_COMPLETA'">
        <div>
          <label>Entrada</label>
          <v-inputtext fluid disabled :modelValue="`${fechaLarga(semanaInicio)}, ${entradaHora}`" />
        </div>
        <div>
          <label>Salida ({{ salidaHora }})</label>
          <v-select
            fluid
            v-model="salidaFecha"
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
            v-model="entradaFecha"
            :options="opcionesEntrada"
            optionLabel="label"
            optionValue="value"
          />
        </div>
        <div>
          <label>Hora de entrada</label>
          <v-inputtext fluid v-model="entradaHora" type="time" />
        </div>
        <div>
          <label>Día de salida</label>
          <v-select
            fluid
            v-model="salidaFecha"
            :options="opcionesSalida"
            optionLabel="label"
            optionValue="value"
          />
        </div>
        <div>
          <label>Hora de salida</label>
          <v-inputtext fluid v-model="salidaHora" type="time" />
        </div>
      </template>

      <div class="md:col-span-2">
        <label>Alimentos</label>
        <v-select
          fluid
          v-model="preset"
          :options="PRESETS"
          optionLabel="label"
          optionValue="value"
        />
      </div>
      <div class="md:col-span-2">
        <label>Notas</label>
        <v-textarea fluid v-model="notas" rows="2" autoResize />
      </div>
    </div>

    <template #footer>
      <v-button label="Cancelar" severity="secondary" outlined @click="visible = false" />
      <v-button
        label="Reservar"
        icon="pi pi-check"
        :disabled="!valido"
        :loading="crearReserva.isPending.value"
        @click="guardar"
      />
    </template>
  </v-dialog>
</template>
