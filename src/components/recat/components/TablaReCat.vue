<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ITecnicoReCat } from '../interfaces/recat'
import { useDescargaReCat, useFichaReCat, useTecnicosReCat } from '../composables/useReCat'
import FichaReCat from './FichaReCat.vue'
import { verificarPermiso } from '@/guards/verificarPermiso'

// Sin este permiso no se muestran las opciones de descarga
const puedeDescargar = verificarPermiso('ConsultaReCat.Descargar')

const { filtrados, sucursales, texto, sucursal, categoria, isLoading } = useTecnicosReCat()
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
    :rowsPerPageOptions="[20, 40, 60]"
    :loading="isLoading"
    sortField="nombre"
    :sortOrder="1"
  >
    <template #header>
      <div className="grid grid-cols-12 gap-4">
        <div class="col-span-2">
          <v-iconfield>
            <v-inputicon>
              <i class="pi pi-search" />
            </v-inputicon>
            <v-inputtext fluid v-model="texto" placeholder="Buscar..." />
          </v-iconfield>
        </div>
        <div className="col-span-2 col-start-3 row-start-1">
          <v-floatlabel variant="on">
            <v-select fluid v-model="sucursal" :options="sucursales" showClear filter />
            <label for="sucursal">Sucursal</label>
          </v-floatlabel>
        </div>
        <div className="col-span-2 col-start-5 row-start-1">
          <v-floatlabel variant="on">
            <v-select
              fluid
              v-model="categoria"
              :options="opcionesCategoria"
              optionLabel="item"
              optionValue="value"
              showClear
            />
            <label for="categoria">Categoría</label>
          </v-floatlabel>
        </div>
        <div v-if="puedeDescargar" className="col-span-2 col-start-11 row-start-1">
          <v-button
            icon="pi pi-download"
            :label="`Descargar fichas (${seleccion.length})`"
            size="small"
            class="w-full"
            :disabled="!seleccion.length"
            :loading="descargando"
            @click="descargar(seleccion.map((x) => x.id))"
          />
        </div>
      </div>
    </template>

    <template #empty> No se encontraron datos. </template>
    <template #loading>
      <div class="flex flex-col items-center justify-center">
        <v-progressspinner />
        <span class="text-3xl! text-white">Cargando datos...</span>
      </div>
    </template>

    <v-column
      v-if="puedeDescargar"
      selectionMode="multiple"
      headerStyle="width: 3rem"
      :exportable="false"
    />
    <v-column field="numero" header="Número empleado" sortable />
    <v-column field="nombre" header="Nombre" sortable />
    <v-column field="sucursal" header="Sucursal" sortable />
    <v-column field="categoriaTexto" header="Categoría" sortable sortField="categoria" />
    <v-column field="siguiente" header="Próxima" sortable />
    <v-column field="avance" header="Avance" sortable>
      <template #body="{ data }: { data: ITecnicoReCat }">{{ data.avance }}%</template>
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
    <v-column header="Acciones" :exportable="false">
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
    :style="{ width: '70%' }"
    header="Ficha de Re Categorización"
    :modal="true"
  >
    <div v-if="cargandoFicha || !ficha" class="flex justify-center">
      <v-progressspinner />
    </div>
    <FichaReCat v-else :ficha="ficha" />
    <template v-if="puedeDescargar" #footer>
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
