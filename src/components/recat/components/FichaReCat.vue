<script setup lang="ts">
import moment from 'moment'
import {
  mismoNombre,
  type IBloqueReCat,
  type IFichaReCat,
  type IRequisitoReCat,
} from '../interfaces/recat'

const props = defineProps<{ ficha: IFichaReCat }>()

const fecha = (f: string | null | undefined) => (f ? moment(f).format('DD/MM/YYYY') : '')
const textoCategoria = (c: string | undefined) => (c === 'ESPECIALISTA' ? 'Especialista' : c)
const cat = (r: IRequisitoReCat) =>
  textoCategoria(props.ficha.bloques.find((b) => b.numero === r.bloque)?.categoria)
const evidencia = (r: IRequisitoReCat) => {
  if (!r.acreditado) return r.evidencia
  return mismoNombre(r.acreditado.curso, r.requisito)
    ? r.evidencia
    : `${r.evidencia}: ${r.acreditado.curso}`
}
const severidadBloque = (b: IBloqueReCat) =>
  b.estado === 'Cumple' ? 'success' : b.estado === 'Falta' ? 'danger' : 'secondary'
</script>

<template>
  <div class="flex flex-col gap-4">
    <v-fieldset legend="Datos del técnico">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div><b>No. de empleado:</b> {{ ficha.empleado.numero }}</div>
        <div><b>Nombre:</b> {{ ficha.empleado.nombre }}</div>
        <div><b>Puesto:</b> {{ ficha.empleado.cargo }}</div>
        <div><b>Sucursal:</b> {{ ficha.empleado.sucursal }}</div>
        <div><b>Categoría actual:</b> {{ ficha.empleado.categoriaTexto }}</div>
        <div><b>Próxima categoría:</b> {{ ficha.empleado.siguiente ?? 'Categoría máxima' }}</div>
        <div class="hidden md:block"></div>
        <div><b>Jefe inmediato:</b> {{ ficha.empleado.jefeInmediato || 'Sin asignar' }}</div>
      </div>
    </v-fieldset>

    <v-datatable :value="[ficha.indicadores]" showGridlines size="small">
      <v-column field="requisitos" header="Requisitos que aplican" />
      <v-column field="cumplidos" header="Cumplidos" />
      <v-column field="faltan" header="Faltan" />
      <v-column field="volverATomar" header="Volver a tomar" />
      <v-column field="avance" header="Avance">
        <template #body="{ data }">{{ data.avance }}%</template>
      </v-column>
    </v-datatable>

    <v-fieldset legend="Avance por bloque">
      <v-datatable :value="ficha.bloques" showGridlines size="small">
        <v-column field="numero" header="#" />
        <v-column field="nombre" header="Bloque" />
        <v-column header="Se cumple en cat.">
          <template #body="{ data }">{{ textoCategoria(data.categoria) }}</template>
        </v-column>
        <v-column header="Avance">
          <template #body="{ data }">{{
            data.aplica ? `${data.cumplidos} / ${data.requisitos}` : '—'
          }}</template>
        </v-column>
        <v-column header="Estado">
          <template #body="{ data }">
            <v-tag class="w-full" :severity="severidadBloque(data)" :value="data.estado" />
          </template>
        </v-column>
      </v-datatable>
    </v-fieldset>

    <v-fieldset legend="Requisitos faltantes (incluye los de categorías anteriores)">
      <v-datatable :value="ficha.faltantes" showGridlines size="small">
        <template #empty> Sin requisitos faltantes. </template>
        <v-column header="#">
          <template #body="{ index }">{{ index + 1 }}</template>
        </v-column>
        <v-column field="requisito" header="Requisito faltante" />
        <v-column field="bloqueNombre" header="Bloque" />
        <v-column header="Cat.">
          <template #body="{ data }">{{ cat(data) }}</template>
        </v-column>
      </v-datatable>
    </v-fieldset>

    <v-fieldset legend="Capacitaciones no acreditadas (debe tomarlas de nuevo)">
      <v-datatable :value="ficha.noAcreditadas" showGridlines size="small">
        <template #empty> Ninguna. </template>
        <v-column header="#">
          <template #body="{ index }">{{ index + 1 }}</template>
        </v-column>
        <v-column field="requisito" header="Requisito" />
        <v-column field="noAcreditado.curso" header="Curso tomado" />
        <v-column header="Fecha">
          <template #body="{ data }">{{ fecha(data.noAcreditado?.fecha) }}</template>
        </v-column>
        <v-column field="noAcreditado.calificacion" header="Calificación" />
        <v-column header="Cat.">
          <template #body="{ data }">{{ cat(data) }}</template>
        </v-column>
      </v-datatable>
    </v-fieldset>

    <v-fieldset legend="Requisitos cumplidos">
      <v-datatable :value="ficha.cumplidos" showGridlines size="small">
        <template #empty> Aún no tiene requisitos cumplidos. </template>
        <v-column header="#">
          <template #body="{ index }">{{ index + 1 }}</template>
        </v-column>
        <v-column field="requisito" header="Requisito" />
        <v-column field="bloqueNombre" header="Bloque" />
        <v-column header="Cat.">
          <template #body="{ data }">{{ cat(data) }}</template>
        </v-column>
        <v-column header="Fecha">
          <template #body="{ data }">{{ fecha(data.acreditado?.fecha) }}</template>
        </v-column>
        <v-column header="Evidencia (curso / modelo)">
          <template #body="{ data }">{{ evidencia(data) }}</template>
        </v-column>
      </v-datatable>
    </v-fieldset>

    <v-fieldset legend="Opcionales (no cuentan para el avance)">
      <v-datatable :value="ficha.opcionales" showGridlines size="small">
        <v-column field="requisito" header="Curso" />
        <v-column field="bloqueNombre" header="Bloque" />
        <v-column header="¿Lo tiene?">
          <template #body="{ data }">
            <v-tag
              class="w-full"
              :severity="data.estado === 'Cumplido' ? 'success' : 'secondary'"
              :value="data.estado === 'Cumplido' ? 'Si' : 'No'"
            />
          </template>
        </v-column>
        <v-column header="Fecha">
          <template #body="{ data }">{{ fecha(data.acreditado?.fecha) }}</template>
        </v-column>
      </v-datatable>
    </v-fieldset>
  </div>
</template>

<style scoped></style>
