<script setup lang="ts">
import { ref } from 'vue'
import router from '@/router'
import FormularioArchivosClase from '../components/FormularioArchivosClase.vue'
import useGuardarArchivosClase from '../composables/useGuardarArchivosClase'
import TablaArchivosClase from '../components/TablaArchivosClase.vue'
import { useRoute } from 'vue-router'
import { verificarPermiso } from '@/guards/verificarPermiso'

const visible = ref<boolean>(true)
// Solo los perfiles con permiso para subir archivos ven el formulario de carga;
// los demas (p. ej. Consulta o Jefe) solo ven y descargan la lista.
const puedeSubir = verificarPermiso('Clases.Subir.Archivos')
const { params } = useRoute()

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
  </v-dialog>
</template>

<style scoped></style>
