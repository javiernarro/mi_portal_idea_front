<script setup lang="ts">
import type { FileUploadUploaderEvent } from 'primevue'
import { ErrorMessage, Field, useForm } from 'vee-validate'
import { esPdf, MENSAJE_SOLO_PDF, schemaArchivos } from '../helpers/schemaArchivos'
import { mensajeWarning, pregunta } from '@/helper/mensajes'
import type { IArchivos } from '../interfaces/arhivos'
import { useRoute } from 'vue-router'
import type { PropsArchivosClase } from '../interfaces/props'

const { guardar, cancelar, pendiente } = defineProps<PropsArchivosClase>()

const { params } = useRoute()

const { handleSubmit, setFieldValue } = useForm<IArchivos>({
  initialValues: {},
  validationSchema: schemaArchivos,
})

const archivos = (e: FileUploadUploaderEvent) => {
  const files: File[] = Array.isArray(e.files) ? e.files : [e.files]

  // Punto 22: solo PDF
  if (files.some((f) => !esPdf(f))) mensajeWarning(MENSAJE_SOLO_PDF)
  setFieldValue('files', files)
}

const submit = handleSubmit(async (values) => {
  // Punto 21: se confirma porque la carga es una sola vez
  await pregunta(
    '¿Estás seguro de cargar los archivos seleccionados?',
    'Este cambio no se puede deshacer.',
    'Aceptar',
    'Cancelar',
  )
  const formData = new FormData()

  values.files.forEach((file) => {
    formData.append('files', file)
  })

  formData.append('claseId', String(params.id))

  guardar?.(formData)
})
</script>

<template>
  <form
    @submit="submit"
    :initialValues="{}"
    :validationSchema="schemaArchivos"
    class="grid grid-cols-1 gap-3"
  >
    <Field name="files">
      <div>
        <v-fileupload
          name="demo[]"
          chooseLabel="Seleccionar archivo"
          cancelLabel="Cancelar"
          :showUploadButton="false"
          :showCancelButton="false"
          uploadLabel="Subir archivos"
          :multiple="true"
          accept=".pdf,application/pdf"
          @select="archivos($event)"
        />
        <ErrorMessage name="files" class="text-red-500" />
      </div>
    </Field>

    <div class="flex justify-end gap-3">
      <v-button
        icon="pi pi-times"
        label="Cancelar"
        severity="danger"
        size="small"
        @click="cancelar"
      />
      <v-button icon="pi pi-save" label="Guardar" size="small" type="submit" :loading="pendiente" />
    </div>
  </form>
</template>

<style scoped></style>
