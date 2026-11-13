<script setup lang="ts">
import type { IClaseEmpleado } from '@/components/clase/interfaces/clase_empleado'
import type { PropsTabla } from '../interface/propsTabla'
import { computed, ref } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { pregunta } from '@/helper/mensajes'
import usePdfsCertificados from '../composables/usePdfsCertificados'
import { verificarPermiso } from '@/guards/verificarPermiso'

const { misCursos } = defineProps<PropsTabla>()

// Comentarios aceptados SOLO en esta consulta: no se guardan en la base de datos.
// Cada vez que se vuelve a consultar, hay que aceptarlos de nuevo.
const aceptados = ref(new Set<number>())
const tieneComentarios = (x: IClaseEmpleado) => x.comentarios !== null
const comentariosPendientes = (x: IClaseEmpleado) =>
  tieneComentarios(x) && !aceptados.value.has(x.id!)
const puedeDescargar = (x: IClaseEmpleado) =>
  !!x.aprobado && !!x.clase?.calificada && !comentariosPendientes(x)
const aceptarComentarios = (x: IClaseEmpleado) => {
  pregunta('Comentarios del instructor', `${x.comentarios}`).then(() => {
    aceptados.value = new Set(aceptados.value).add(x.id!)
  })
}
const { descargarCertificados } = usePdfsCertificados()

const certificadosSeleccionados = ref<IClaseEmpleado[]>([])

const descargar = () => {
  const certificados = certificadosSeleccionados.value
    .map((x) => {
      if (puedeDescargar(x)) {
        return x.id
      }
    })
    .filter((id): id is number => id !== undefined)
  descargarCertificados(certificados)
}

const selectableItems = computed(() => {
  return misCursos?.filter((item) => puedeDescargar(item)) || []
})

const allSelected = computed(() => {
  if (selectableItems.value.length === 0) return false
  return selectableItems.value.every((item) =>
    certificadosSeleccionados.value.some((selected) => selected.claseId === item.claseId),
  )
})

const estatusClase = (estatus: string) => {
  const estatusSplit = estatus.split('')
  estatusSplit[0] = estatusSplit[0]!.toUpperCase()
  return estatusSplit.join('')
}

const isSelected = (data: IClaseEmpleado) => {
  return certificadosSeleccionados.value.some((item) => item.claseId === data.claseId)
}

const toggleSelection = (data: IClaseEmpleado) => {
  const index = certificadosSeleccionados.value.findIndex((item) => item.claseId === data.claseId)
  if (index > -1) {
    certificadosSeleccionados.value.splice(index, 1)
  } else {
    certificadosSeleccionados.value.push(data)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    certificadosSeleccionados.value = []
  } else {
    certificadosSeleccionados.value = [...selectableItems.value]
  }
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  'clase.curso.nombre': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
})
</script>

<template>
  <v-datatable
    :value="misCursos"
    showGridlines
    size="small"
    class="p-datatable-sm"
    responsiveLayout="scroll"
    v-model:filters="filters"
    :globalFilterFields="['clase.curso.nombre']"
    paginator
    :rows="10"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    :loading="cargando"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <v-iconfield>
          <v-inputicon>
            <i class="pi pi-search" />
          </v-inputicon>
          <v-inputtext v-model="filters['global'].value" placeholder="Buscar..." />
        </v-iconfield>
      </div>
    </template>

    <template #empty>
      <span>No se encontraron cursos.</span>
    </template>
    <template #loading>
      <div class="flex flex-col items-center justify-center">
        <v-progressspinner />
        <span class="text-3xl! text-white">Cargando datos...</span>
      </div>
    </template>

    <!-- <v-column header="Clase" sortable>
      <template #body="{ data }: { data: IClaseEmpleado }">
        {{ data.clase!.id }}
      </template>
    </v-column> -->
    <v-column header="Curso" sortable>
      <template #body="{ data }: { data: IClaseEmpleado }">
        {{ data.clase!.curso.nombre }}
      </template>
    </v-column>
    <v-column header="Fecha" sortable>
      <template #body="{ data }: { data: IClaseEmpleado }">
        {{ data.clase!.fechaInicio }}
      </template>
    </v-column>
    <v-column header="Progreso" sortable>
      <template #body="{ data }: { data: IClaseEmpleado }">
        <v-tag :value="estatusClase(data.clase!.estatus)" severity="info" class="w-full" />
      </template>
    </v-column>

    <v-column header="Calificacion" sortable>
      <template #body="{ data }: { data: IClaseEmpleado }">
        {{ data.calificacion }}
      </template>
    </v-column>
    <v-column header="Estado" sortable>
      <template #body="{ data }: { data: IClaseEmpleado }">
        <v-tag
          :value="data.aprobado ? 'Acreditado' : 'No acreditado'"
          :severity="data.aprobado ? 'success' : 'danger'"
          class="w-full!"
          v-if="data.clase!.calificada"
        />
        <v-tag value="Sin calificar" severity="warn" class="w-full" v-else />
      </template>
    </v-column>

    <v-column header="Comentarios" :style="{ width: '300px' }">
      <template #body="{ data }: { data: IClaseEmpleado }">
        <v-textarea fluid v-model="data.comentarios" disabled />
      </template>
    </v-column>

    <v-column header="Descargar DC3" v-if="verificarPermiso('Empleados.Descargar.DC3')">
      <template #body="{ data }: { data: IClaseEmpleado }">
        <div class="flex justify-center">
          <router-link
            :to="{
              name: !empleado ? 'certificado-pdf' : 'certificado-empleado-pdf',
              params: { id: data.id },
            }"
            v-if="puedeDescargar(data)"
          >
            <v-button icon="pi pi-file-pdf" severity="danger" size="small" />
          </router-link>
          <v-button
            icon="pi pi-check"
            size="small"
            @click="aceptarComentarios(data)"
            v-if="comentariosPendientes(data) && data.clase?.calificada"
          />
        </div>
      </template>
    </v-column>

    <v-column headerStyle="width: 3rem" v-if="verificarPermiso('Empleados.Descargar.DC3')">
      <template #header>
        <v-checkbox
          v-if="selectableItems.length > 0"
          :modelValue="allSelected"
          @update:modelValue="toggleSelectAll"
          binary
        />
      </template>
      <template #body="{ data }: { data: IClaseEmpleado }">
        <v-checkbox
          v-if="puedeDescargar(data) && verificarPermiso('Empleados.Descargar.DC3')"
          :modelValue="isSelected(data)"
          @update:modelValue="toggleSelection(data)"
          binary
        />
      </template>
    </v-column>
  </v-datatable>
  <div class="flex justify-end mt-2">
    <v-button
      icon="pi pi-download"
      label="Descragar todo"
      size="small"
      type="button"
      @click="descargar"
      :disabled="certificadosSeleccionados.length === 0"
    />
  </div>
</template>

<style scoped></style>
