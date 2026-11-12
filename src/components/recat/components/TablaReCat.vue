<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ITecnicoReCat } from '../interfaces/recat'
import { useDescargaReCat, useFichaReCat, useTecnicosReCat } from '../composables/useReCat'
import FichaReCat from './FichaReCat.vue'

const { filtrados, tecnicos, sucursales, texto, sucursal, categoria, limpiar, isLoading } =
  useTecnicosReCat()
const { descargar, descargando } = useDescargaReCat()

const opcionesCategoria = [
  { item: 'D', value: 'D' },
  { item: 'C', value: 'C' },
  { item: 'B', value: 'B' },
  { item: 'A', value: 'A' },
  { item: 'Especialista', value: 'ESPECIALISTA' },
]

const seleccion = ref<ITecnicoReCat[]>([])

// Ficha abierta
const empleadoId = ref<number | null>(null)
const visible = computed({
  get: () => empleadoId.value !== null,
  set: (v: boolean) => {
    if (!v) empleadoId.value = null
  },
})
const { ficha, isLoading: cargandoFicha } = useFichaReCat(() => empleadoId.value)
const abrir = (t: ITecnicoReCat) => (empleadoId.value = t.id)
</script>

<template>
  <v-datatable
    :value="filtrados"
    v-model:selection="seleccion"
    dataKey="id"
    showGridlines
    size="small"
    responsiveLayout="scroll"
    rowHover
    paginator
    :rows="20"
    :rowsPerPageOptions="[20, 40, 60, 100]"
    :loading="isLoading"
    sortField="nombre"
    :sortOrder="1"
    @row-click="(e: { data: ITecnicoReCat }) => abrir(e.data)"
    class="cursor-pointer"
  >
    <template #header>
      <div class="flex flex-wrap gap-3 items-center">
        <v-iconfield style="width: 18rem; max-width: 100%">
          <v-inputicon><i class="pi pi-search" /></v-inputicon>
          <v-inputtext fluid v-model="texto" placeholder="Nombre o número de empleado" />
        </v-iconfield>
        <v-floatlabel variant="on" style="width: 16rem; max-width: 100%">
          <v-select
            fluid
            v-model="sucursal"
            :options="sucursales"
            showClear
            filter
            inputId="sucursal"
          />
          <label for="sucursal">Sucursal</label>
        </v-floatlabel>
        <v-floatlabel variant="on" style="width: 11rem; max-width: 100%">
          <v-select
            fluid
            v-model="categoria"
            :options="opcionesCategoria"
            optionLabel="item"
            optionValue="value"
            showClear
            inputId="categoria"
          />
          <label for="categoria">Categoría</label>
        </v-floatlabel>
        <v-button
          icon="pi pi-filter-slash"
          label="Limpiar"
          size="small"
          outlined
          @click="limpiar"
        />
        <span class="text-sm! text-gray-500 dark:text-zinc-400">
          {{ filtrados.length }} de {{ tecnicos.length }} técnicos
        </span>
        <div class="flex gap-2 md:ml-auto">
          <v-button
            icon="pi pi-download"
            :label="`Descargar fichas (${seleccion.length})`"
            size="small"
            :disabled="!seleccion.length"
            :loading="descargando"
            @click="descargar(seleccion.map((x) => x.id))"
          />
        </div>
      </div>
    </template>

    <template #empty> No se encontraron técnicos. </template>

    <v-column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false" />
    <v-column field="numero" header="Número empleado" sortable />
    <v-column field="nombre" header="Nombre" sortable />
    <v-column field="sucursal" header="Sucursal" sortable />
    <v-column field="categoriaTexto" header="Categoría" sortable sortField="categoria" />
    <v-column field="siguiente" header="Próxima" sortable />
    <v-column field="avance" header="Avance" sortable>
      <template #body="{ data }: { data: ITecnicoReCat }">
        <div class="flex items-center gap-2 min-w-32">
          <div class="flex-1 h-2 rounded bg-[#d9dcea] dark:bg-zinc-700 overflow-hidden">
            <div
              class="h-full bg-[#283d98] dark:bg-[#8ea0f0]"
              :style="{ width: data.avance + '%' }"
            />
          </div>
          <span class="w-12 text-right tabular-nums">{{ data.avance }}%</span>
        </div>
      </template>
    </v-column>
    <v-column field="cumplidos" header="Cumplidos" sortable>
      <template #body="{ data }: { data: ITecnicoReCat }"
        >{{ data.cumplidos }} / {{ data.requisitos }}</template
      >
    </v-column>
    <v-column field="faltan" header="Faltan" sortable />
    <v-column field="volverATomar" header="Volver a tomar" sortable />
    <v-column field="cumple" header="Estado" sortable>
      <template #body="{ data }: { data: ITecnicoReCat }">
        <v-tag
          class="w-full"
          :severity="data.cumple ? 'success' : 'danger'"
          :value="data.cumple ? 'CUMPLE' : 'NO CUMPLE'"
        />
      </template>
    </v-column>
    <v-column header="Ficha" :exportable="false">
      <template #body="{ data }: { data: ITecnicoReCat }">
        <div class="flex justify-center">
          <v-button
            icon="pi pi-id-card"
            size="small"
            v-tooltip="'Ver ficha'"
            @click.stop="abrir(data)"
          />
        </div>
      </template>
    </v-column>
  </v-datatable>

  <v-dialog
    v-model:visible="visible"
    modal
    maximizable
    header="Ficha de Re Categorización"
    :style="{ width: '72rem' }"
    :breakpoints="{ '1199px': '90vw', '640px': '100vw' }"
  >
    <div v-if="cargandoFicha || !ficha" class="flex justify-center p-10">
      <v-progressspinner />
    </div>
    <FichaReCat v-else :ficha="ficha" />
    <template #footer>
      <v-button
        icon="pi pi-download"
        label="Descargar PDF"
        size="small"
        :disabled="!ficha"
        :loading="descargando"
        @click="ficha && descargar([ficha.empleado.id])"
      />
    </template>
  </v-dialog>
</template>
