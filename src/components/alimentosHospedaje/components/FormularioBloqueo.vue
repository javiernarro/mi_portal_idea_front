<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { mensajeOk } from '@/helper/mensajes'
import { useAccionesAH } from '../composables/useAlimentosHospedaje'
import { aFechaLocal, aISO } from '../helpers/fechas'

const props = defineProps<{
  habitacionId: string
  habitacion: string
  compartida: boolean
  camaId: string
  numeroCama: number
  noche: string
}>()
const visible = defineModel<boolean>('visible', { required: true })
const { crearBloqueo } = useAccionesAH()

const alcance = ref<'CAMA' | 'HABITACION'>('CAMA')
const desde = ref<Date>(aFechaLocal(props.noche))
const hasta = ref<Date>(aFechaLocal(props.noche))
const motivo = ref('')

watch(visible, (v) => {
  if (!v) return
  alcance.value = 'CAMA'
  desde.value = aFechaLocal(props.noche)
  hasta.value = aFechaLocal(props.noche)
  motivo.value = ''
})

const alcances = computed(() => [
  { value: 'CAMA', label: `Solo cama ${props.numeroCama}` },
  ...(props.compartida ? [{ value: 'HABITACION', label: `Toda la ${props.habitacion}` }] : []),
])

const valido = computed(
  () => !!motivo.value.trim() && !!desde.value && !!hasta.value && hasta.value >= desde.value,
)

const guardar = async () => {
  const r = await crearBloqueo
    .mutateAsync({
      habitacionId: props.habitacionId,
      camaId: alcance.value === 'CAMA' ? props.camaId : null,
      desde: aISO(desde.value),
      hasta: aISO(hasta.value),
      motivo: motivo.value.trim(),
    })
    .catch(() => null)
  if (!r) return
  visible.value = false
  if (r.afectadas.length) {
    Swal.fire({
      icon: 'warning',
      title: 'Fuera de servicio registrado',
      text: `Estas reservas quedan en el rango y no se movieron: ${r.afectadas
        .map((a) => `${a.folio} (${a.huespedNombre}, cama ${a.camaId})`)
        .join(', ')}.`,
    })
  } else {
    mensajeOk('Fuera de servicio registrado')
  }
}
</script>

<template>
  <v-dialog
    v-model:visible="visible"
    modal
    header="Marcar fuera de servicio"
    class="w-[95vw] md:w-[480px]"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="md:col-span-2">
        <label>Alcance</label>
        <v-select
          fluid
          v-model="alcance"
          :options="alcances"
          optionLabel="label"
          optionValue="value"
        />
      </div>
      <div>
        <label>Desde la noche del</label>
        <v-datepicker fluid showIcon dateFormat="dd/mm/yy" v-model="desde" />
      </div>
      <div>
        <label>Hasta la noche del</label>
        <v-datepicker fluid showIcon dateFormat="dd/mm/yy" v-model="hasta" />
      </div>
      <div class="md:col-span-2">
        <label>Motivo</label>
        <v-inputtext fluid v-model="motivo" maxlength="255" placeholder="Ej. mantenimiento, daño en chapa" />
      </div>
    </div>
    <template #footer>
      <v-button label="Cancelar" severity="secondary" outlined @click="visible = false" />
      <v-button
        label="Guardar"
        icon="pi pi-check"
        :disabled="!valido"
        :loading="crearBloqueo.isPending.value"
        @click="guardar"
      />
    </template>
  </v-dialog>
</template>
