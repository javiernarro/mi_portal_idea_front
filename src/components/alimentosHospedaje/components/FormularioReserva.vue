<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { mensajeOk } from '@/helper/mensajes'
import type {
  IEmpleadoHuesped,
  IGrupoSemana,
  IReserva,
  Motivo,
} from '../interfaces/alimentosHospedaje'
import { buscarEmpleados, getGruposSemana } from '../services/alimentosHospedaje'
import { useAccionesAH, usePermisosAH } from '../composables/useAlimentosHospedaje'
import { MOTIVOS } from '../helpers/estados'
import {
  aEstancia,
  estanciaDeReserva,
  estanciaInicial,
  fechasReales,
  type FormEstancia,
} from '../helpers/estancia'
import CamposEstancia from './CamposEstancia.vue'

const props = defineProps<{
  camaId: string
  etiqueta: string
  semanaInicio: string
  entradaHora: string
  salidaHora: string
  sucursalLocal: string
  /** Con reserva: modo edicion (solo administrador). */
  reserva?: IReserva | null
  opcionesCama?: { value: string; label: string }[]
}>()
const visible = defineModel<boolean>('visible', { required: true })

const { crearReserva, editarReserva } = useAccionesAH()
const { esAdmin } = usePermisosAH()
const editando = computed(() => !!props.reserva)
const semana = computed(() => props.reserva?.semanaInicio ?? props.semanaInicio)

const empleado = ref<IEmpleadoHuesped | null>(null)
const texto = ref<string | IEmpleadoHuesped>('')
const sugerencias = ref<IEmpleadoHuesped[]>([])
const motivo = ref<Motivo>('CURSO')
const detalleMotivo = ref('')
const grupoId = ref<number | null>(null)
const grupos = ref<IGrupoSemana[]>([])
const camaId = ref(props.camaId)
const estancia = ref<FormEstancia>(
  estanciaInicial(props.semanaInicio, props.entradaHora, props.salidaHora),
)
const notas = ref('')
const excepcionLocal = ref(false)
const copiaJefe = ref(false)

watch(
  visible,
  async (v) => {
    if (!v) return
    empleado.value = null
    texto.value = ''
    excepcionLocal.value = false
    copiaJefe.value = false
    if (props.reserva) {
      camaId.value = props.reserva.camaId
      estancia.value = estanciaDeReserva(props.reserva)
      notas.value = props.reserva.notas ?? ''
      return
    }
    camaId.value = props.camaId
    motivo.value = 'CURSO'
    detalleMotivo.value = ''
    grupoId.value = null
    estancia.value = estanciaInicial(props.semanaInicio, props.entradaHora, props.salidaHora)
    notas.value = ''
    grupos.value = (await getGruposSemana(props.semanaInicio).catch(() => [])) ?? []
  },
  { immediate: true },
)
// Se monta ya visible al editar: por eso immediate

const opcionesGrupo = computed(() =>
  grupos.value.map((g) => ({ value: g.id, label: `${g.folio} (${g.personas} personas)` })),
)
const grupoElegido = computed(() => grupos.value.find((g) => g.id === grupoId.value))

const buscar = async (e: { query: string }) => {
  sugerencias.value = await buscarEmpleados(e.query)
}
const etiquetaEmpleado = (x: IEmpleadoHuesped) =>
  `${x.nombre} · ${x.numero ?? 's/n'} · ${x.sucursal || 'Sin sucursal'}`

const fechasValidas = computed(() => {
  const { entrada, salida } = fechasReales(estancia.value, semana.value)
  return salida > entrada
})

const valido = computed(() => {
  if (!fechasValidas.value) return false
  if (editando.value) return !!camaId.value
  return (
    !!empleado.value &&
    (!empleado.value.local || excepcionLocal.value) &&
    // Sin grupo, el curso es parte del folio (SOHA_AAAAMMDD_CURSO)
    (!!grupoId.value || motivo.value === 'TRABAJO_SOPORTE' || !!detalleMotivo.value.trim())
  )
})

const avisar = (titulo: string, folios: string[], avisos: string[]) => {
  const texto = folios.length ? `Solicitud: ${folios.join(', ')}` : ''
  if (avisos.length)
    Swal.fire({
      icon: 'warning',
      title: titulo,
      text: [texto, ...avisos].filter(Boolean).join('\n'),
    })
  else if (texto) Swal.fire({ icon: 'success', title: titulo, text: texto })
  else mensajeOk(titulo)
}

const guardar = async () => {
  const servicios = estancia.value.preset === 'PERSONALIZADO' ? estancia.value.servicios : undefined
  if (props.reserva) {
    const r = await editarReserva
      .mutateAsync({
        id: props.reserva.id,
        edicion: {
          camaId: camaId.value,
          estancia: aEstancia(estancia.value, semana.value),
          presetAlimentos: estancia.value.preset,
          servicios,
          notas: notas.value || null,
        },
      })
      .catch(() => null)
    if (!r) return
    visible.value = false
    avisar(
      r.folios.length ? 'Reserva modificada' : 'Sin cambios en la solicitud',
      r.folios,
      r.avisos,
    )
    return
  }
  if (!empleado.value) return
  const r = await crearReserva
    .mutateAsync({
      empleadoId: empleado.value.id,
      camaId: camaId.value,
      grupoId: grupoId.value,
      estancia: aEstancia(estancia.value, semana.value),
      motivo: grupoElegido.value?.motivo ?? motivo.value,
      detalleMotivo: grupoId.value ? null : detalleMotivo.value || null,
      presetAlimentos: estancia.value.preset,
      servicios,
      notas: notas.value || null,
      excepcionLocal: excepcionLocal.value,
      copiaJefe: copiaJefe.value,
    })
    .catch(() => null)
  if (!r) return
  visible.value = false
  avisar('Reserva creada', r.folios, r.avisos)
}
</script>

<template>
  <v-dialog
    v-model:visible="visible"
    modal
    :header="
      editando ? `Modificar reserva · ${reserva?.huespedNombre ?? ''}` : `Reservar ${etiqueta}`
    "
    class="w-[95vw] md:w-[720px]"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <template v-if="editando">
        <div class="md:col-span-2 text-sm text-neutral-600 dark:text-zinc-300">
          {{ reserva?.folio }} · {{ reserva?.huespedSucursal }} · Centro de costos
          {{ reserva?.huespedCcClave || 'sin clave' }}
        </div>
        <div class="md:col-span-2">
          <label>Cama</label>
          <v-select
            fluid
            v-model="camaId"
            :options="opcionesCama ?? []"
            optionLabel="label"
            optionValue="value"
            filter
          />
        </div>
      </template>

      <template v-else>
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
          {{ empleado.cargo || 'Sin cargo' }} · Centro de costos
          {{ empleado.ccClave || 'sin clave' }}
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

        <div class="md:col-span-2">
          <label>Agregar a la solicitud de un grupo de esta semana</label>
          <v-select
            fluid
            v-model="grupoId"
            :options="opcionesGrupo"
            optionLabel="label"
            optionValue="value"
            showClear
            placeholder="No, es una solicitud nueva"
          />
        </div>

        <template v-if="!grupoId">
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
            <label>{{ motivo === 'CURSO' ? 'Curso' : 'Proyecto' }}</label>
            <v-inputtext
              fluid
              v-model="detalleMotivo"
              :placeholder="motivo === 'CURSO' ? 'Va en el folio de la solicitud' : 'Opcional'"
            />
          </div>
        </template>
      </template>

      <div class="md:col-span-2">
        <CamposEstancia
          v-model="estancia"
          :semanaInicio="semana"
          :esAdmin="esAdmin"
          :entradaFija="reserva?.estado === 'EN_CASA'"
        />
      </div>

      <div v-if="!editando && !grupoId" class="md:col-span-2 flex items-center gap-2">
        <v-toggleswitch v-model="copiaJefe" inputId="copiaJefeR" />
        <label for="copiaJefeR">Copia del correo a mi jefe</label>
      </div>

      <div class="md:col-span-2">
        <label>Notas</label>
        <v-textarea fluid v-model="notas" rows="2" autoResize />
      </div>
    </div>

    <template #footer>
      <v-button label="Cancelar" severity="secondary" outlined @click="visible = false" />
      <v-button
        :label="editando ? 'Guardar cambios' : 'Reservar'"
        icon="pi pi-check"
        :disabled="!valido"
        :loading="crearReserva.isPending.value || editarReserva.isPending.value"
        @click="guardar"
      />
    </template>
  </v-dialog>
</template>
