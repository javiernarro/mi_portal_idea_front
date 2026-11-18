<script setup lang="ts">
import { computed, ref } from 'vue'
import useArchivosClase from '../composables/useArchivosClase'
import router from '@/router'
import FormularioArchivosClase from '../components/FormularioArchivosClase.vue'
import useGuardarArchivosClase from '../composables/useGuardarArchivosClase'
import TablaArchivosClase from '../components/TablaArchivosClase.vue'
import { useRoute } from 'vue-router'
import { verificarPermiso } from '@/guards/verificarPermiso'

const visible = ref<boolean>(true)
const { params } = useRoute()
const { archivosClase, isLoading } = useArchivosClase(+params.id!)
const esAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem('empleado') ?? 'null')?.data?.perfil?.nombre === 'ADMIN'
  } catch {
    return false
  }
}
// Solo los perfiles con permiso para subir archivos ven el formulario de carga;
// los demas (p. ej. Consulta o Jefe) solo ven y descargan la lista.
// Punto 21: la carga es una sola vez; despues solo el Administrador puede agregar mas.
const puedeSubir = computed(
  () =>
    verificarPermiso('Clases.Subir.Archivos') &&
    !isLoading.value &&
    (esAdmin() || archivosClase.value.length === 0),
)

const { guardarArchivosClaseMutation, isPending } = useGuardarArchivosClase()

const guardar = (payload: FormData) => {
  guardarArchivosClaseMutation.mutate(payload)
}

const cancelar = () => {
  visible.value = false
}
</script>

<template>
  <v-dialog
    v-model:visible="visible"
    :style="{ width: '50%' }"
    v-on:after-hide="router.back()"
    header="Archivos de la capacitacion"
    :modal="true"
  >
    <FormularioArchivosClase
      v-if="puedeSubir"
      :guardar="guardar"
      :cancelar="cancelar"
      :pendiente="isPending"
    />
    <TablaArchivosClase :id="+params.id!" :class="{ 'mt-3': puedeSubir }" />
    <div v-if="!puedeSubir" class="flex justify-end mt-3">
      <v-button
        icon="pi pi-times"
        label="Cerrar"
        severity="danger"
        size="small"
        @click="cancelar"
      />
    </div>
  </v-dialog>
</template>

<style scoped></style>
