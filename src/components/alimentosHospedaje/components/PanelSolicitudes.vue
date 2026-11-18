<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { ISolicitudResumen } from '../interfaces/alimentosHospedaje'
import {
  descargarExcelFueraServicio,
  descargarExcelSolicitud,
  getFueraServicio,
  getSolicitud,
  getSolicitudes,
} from '../services/alimentosHospedaje'
import { mostrarError, usePermisosAH } from '../composables/useAlimentosHospedaje'
import { pdfFueraServicio, pdfSolicitud } from '../composables/usePdfAlimentos'
import { fechaCorta } from '../helpers/fechas'
import DialogoComensales from './DialogoComensales.vue'

const props = defineProps<{ semanaInicio: string }>()
const { puedeModificar } = usePermisosAH()

const { data: solicitudes, isLoading } = useQuery({
  queryKey: ['ahSolicitudes', () => props.semanaInicio],
  queryFn: () => getSolicitudes(props.semanaInicio),
})

const ocupado = ref<string | null>(null)
const ejecutar = async (clave: string, fn: () => Promise<unknown>) => {
  ocupado.value = clave
  await fn().catch(mostrarError)
  ocupado.value = null
}
const excel = (s: ISolicitudResumen) => ejecutar(`x${s.id}`, () => descargarExcelSolicitud(s.id))
const pdf = (s: ISolicitudResumen) =>
  ejecutar(`p${s.id}`, async () => {
    const d = await getSolicitud(s.id)
    if (d) pdfSolicitud(d)
  })
const excelFuera = () => ejecutar('fx', () => descargarExcelFueraServicio(props.semanaInicio))
const pdfFuera = () =>
  ejecutar('fp', async () => {
    const r = await getFueraServicio(props.semanaInicio)
    if (r) pdfFueraServicio(r)
  })

const verComensales = ref(false)
const solicitudId = ref<number | null>(null)
const abrirComensales = (s: ISolicitudResumen) => {
  solicitudId.value = s.id
  verComensales.value = true
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <v-datatable :value="solicitudes ?? []" :loading="isLoading" size="small" showGridlines>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold">Solicitudes de alimentos de la semana</span>
          <div class="flex gap-2">
            <v-button
              label="Fuera de servicio · Excel"
              icon="pi pi-file-excel"
              size="small"
              severity="secondary"
              outlined
              :loading="ocupado === 'fx'"
              @click="excelFuera"
            />
            <v-button
              label="PDF"
              icon="pi pi-file-pdf"
              size="small"
              severity="secondary"
              outlined
              :loading="ocupado === 'fp'"
              @click="pdfFuera"
            />
          </div>
        </div>
      </template>
      <template #empty>No hay solicitudes esta semana.</template>
      <v-column header="Folio">
        <template #body="{ data }">
          <span class="font-semibold break-all">{{ data.folio }}</span>
          <!-- Punto 20: se queda en el historial, marcada cuando ya no tiene personas -->
          <div v-if="!data.huespedes && !data.comensales" class="mt-1">
            <v-tag value="Cancelada, sin personas" severity="secondary" />
          </div>
        </template>
      </v-column>
      <v-column field="grupo" header="Grupo" />
      <v-column header="Inicia" class="w-[90px]">
        <template #body="{ data }">{{ fechaCorta(data.fecha) }}</template>
      </v-column>
      <v-column field="huespedes" header="Huéspedes" class="w-[100px] text-center" />
      <v-column field="comensales" header="Sin hospedaje" class="w-[110px] text-center" />
      <v-column class="w-[300px]">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-2 justify-end">
            <v-button
              v-if="puedeModificar"
              label="Comensales"
              icon="pi pi-users"
              size="small"
              severity="secondary"
              outlined
              @click="abrirComensales(data)"
            />
            <v-button
              label="Excel"
              icon="pi pi-file-excel"
              size="small"
              severity="secondary"
              outlined
              :loading="ocupado === `x${data.id}`"
              @click="excel(data)"
            />
            <v-button
              label="PDF"
              icon="pi pi-file-pdf"
              size="small"
              severity="secondary"
              outlined
              :loading="ocupado === `p${data.id}`"
              @click="pdf(data)"
            />
          </div>
        </template>
      </v-column>
    </v-datatable>
    <small class="text-neutral-500 dark:text-zinc-400">
      El archivo se llama como el folio. Cada cambio en la solicitud agrega -2, -3 al folio.
    </small>

    <DialogoComensales
      v-if="solicitudId"
      v-model:visible="verComensales"
      :solicitudId="solicitudId"
    />
  </div>
</template>
