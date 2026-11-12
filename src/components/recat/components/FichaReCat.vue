<script setup lang="ts">
import moment from 'moment'
import { mismoNombre, type IFichaReCat, type IRequisitoReCat } from '../interfaces/recat'

const props = defineProps<{ ficha: IFichaReCat }>()

const fecha = (f: string | null | undefined) => (f ? moment(f).format('DD/MM/YYYY') : '')
const cat = (n: number) => {
  const c = props.ficha.bloques.find((b) => b.numero === n)?.categoria
  return c === 'ESPECIALISTA' ? 'Esp.' : c
}
const evidencia = (r: IRequisitoReCat) => {
  if (!r.acreditado) return r.evidencia
  return mismoNombre(r.acreditado.curso, r.requisito)
    ? r.evidencia
    : `${r.evidencia}: ${r.acreditado.curso}`
}
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
</script>

<template>
  <div class="flex flex-col gap-5 text-sm!">
    <!-- Encabezado -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
      <div class="md:col-span-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        <span class="text-gray-500 dark:text-zinc-400 text-right">No. de empleado</span>
        <span class="font-bold text-lg! text-[#283d98] dark:text-[#8ea0f0]">{{
          ficha.empleado.numero
        }}</span>
        <span class="text-gray-500 dark:text-zinc-400 text-right">Nombre</span>
        <span class="font-semibold">{{ ficha.empleado.nombre }}</span>
        <span class="text-gray-500 dark:text-zinc-400 text-right">Puesto</span>
        <span>{{ ficha.empleado.cargo }}</span>
        <span class="text-gray-500 dark:text-zinc-400 text-right">Sucursal</span>
        <span>{{ ficha.empleado.sucursal }}</span>
        <span class="text-gray-500 dark:text-zinc-400 text-right">Categoría actual</span>
        <span class="font-bold text-[#283d98] dark:text-[#8ea0f0]">{{
          ficha.empleado.categoriaTexto
        }}</span>
        <span class="text-gray-500 dark:text-zinc-400 text-right">Próxima categoría</span>
        <span class="font-bold text-[#283d98] dark:text-[#8ea0f0]">
          {{ ficha.empleado.siguiente ?? 'Ninguna (categoría máxima)' }}
        </span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs! text-center text-gray-500 dark:text-zinc-400"
          >¿CUMPLE PARA SU PRÓXIMA CATEGORÍA?</span
        >
        <div
          class="flex-1 flex items-center justify-center rounded-md text-white text-2xl! font-bold py-6"
          :class="ficha.cumple ? 'bg-green-700' : 'bg-red-700'"
        >
          {{ ficha.cumple ? 'CUMPLE' : 'NO CUMPLE' }}
        </div>
      </div>
    </div>

    <!-- Indicadores -->
    <div class="rounded-md bg-[#eef0f6] dark:bg-zinc-800 p-3">
      <div class="grid grid-cols-5 text-center">
        <div
          v-for="item in [
            {
              t: 'Requisitos que aplican',
              v: ficha.indicadores.requisitos,
              c: 'text-[#283d98] dark:text-[#8ea0f0]',
            },
            {
              t: 'Cumplidos',
              v: ficha.indicadores.cumplidos,
              c: 'text-green-700 dark:text-green-400',
            },
            { t: 'Faltan', v: ficha.indicadores.faltan, c: 'text-red-700 dark:text-red-400' },
            {
              t: 'Volver a tomar',
              v: ficha.indicadores.volverATomar,
              c: 'text-amber-600 dark:text-amber-400',
            },
            {
              t: 'Avance',
              v: ficha.indicadores.avance + '%',
              c: 'text-[#283d98] dark:text-[#8ea0f0]',
            },
          ]"
          :key="item.t"
        >
          <div class="text-[11px]! uppercase text-gray-500 dark:text-zinc-400">{{ item.t }}</div>
          <div class="text-3xl! font-bold" :class="item.c">{{ item.v }}</div>
        </div>
      </div>
      <div class="h-2 mt-2 rounded bg-[#d9dcea] dark:bg-zinc-700 overflow-hidden">
        <div
          class="h-full bg-[#283d98] dark:bg-[#8ea0f0]"
          :style="{ width: ficha.indicadores.avance + '%' }"
        />
      </div>
    </div>

    <!-- Avance por bloque -->
    <section>
      <h3 class="recat-titulo bg-[#283d98]">AVANCE POR BLOQUE</h3>
      <table class="recat-tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Bloque</th>
            <th class="text-center">Se cumple en cat.</th>
            <th class="text-center">Avance</th>
            <th class="text-center">Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in ficha.bloques" :key="b.numero">
            <td>{{ b.numero }}</td>
            <td class="font-semibold">{{ b.nombre }}</td>
            <td class="text-center">
              {{ b.categoria === 'ESPECIALISTA' ? 'Especialista' : b.categoria }}
            </td>
            <td class="text-center">{{ b.aplica ? `${b.cumplidos} / ${b.requisitos}` : '—' }}</td>
            <td class="text-center">
              <v-tag
                v-if="b.estado !== 'No aplica'"
                :severity="b.estado === 'Cumple' ? 'success' : 'danger'"
                :value="b.estado"
              />
              <span v-else class="text-gray-400">No aplica</span>
            </td>
            <td class="w-40">
              <div
                v-if="b.aplica"
                class="h-2 rounded bg-[#d9dcea] dark:bg-zinc-700 overflow-hidden"
              >
                <div
                  class="h-full bg-[#283d98] dark:bg-[#8ea0f0]"
                  :style="{ width: pct(b.cumplidos, b.requisitos) + '%' }"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Faltantes -->
    <section>
      <h3 class="recat-titulo bg-red-700">
        REQUISITOS FALTANTES (incluye los de categorías anteriores)
      </h3>
      <p v-if="!ficha.faltantes.length" class="recat-vacio">Sin requisitos faltantes.</p>
      <table v-else class="recat-tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Requisito faltante</th>
            <th>Bloque</th>
            <th class="text-center">Cat.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in ficha.faltantes" :key="r.bloque + r.requisito">
            <td>{{ i + 1 }}</td>
            <td class="font-semibold text-red-700 dark:text-red-400">
              {{ r.requisito }}
            </td>
            <td>{{ r.bloqueNombre }}</td>
            <td class="text-center">{{ cat(r.bloque) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- No acreditadas -->
    <section>
      <h3 class="recat-titulo bg-amber-600">
        CAPACITACIONES NO ACREDITADAS — DEBE TOMARLAS DE NUEVO
      </h3>
      <p v-if="!ficha.noAcreditadas.length" class="recat-vacio">Ninguna.</p>
      <table v-else class="recat-tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Requisito</th>
            <th>Curso tomado</th>
            <th>Fecha</th>
            <th class="text-center">Calif.</th>
            <th class="text-center">Cat.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in ficha.noAcreditadas" :key="r.bloque + r.requisito">
            <td>{{ i + 1 }}</td>
            <td>{{ r.requisito }}</td>
            <td>{{ r.noAcreditado?.curso }}</td>
            <td>{{ fecha(r.noAcreditado?.fecha) }}</td>
            <td class="text-center">{{ r.noAcreditado?.calificacion }}</td>
            <td class="text-center">{{ cat(r.bloque) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Cumplidos -->
    <section>
      <h3 class="recat-titulo bg-green-700">REQUISITOS CUMPLIDOS</h3>
      <p v-if="!ficha.cumplidos.length" class="recat-vacio">Aún no tiene requisitos cumplidos.</p>
      <table v-else class="recat-tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Requisito</th>
            <th>Bloque</th>
            <th class="text-center">Cat.</th>
            <th>Fecha</th>
            <th>Evidencia (curso / modelo)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in ficha.cumplidos" :key="r.bloque + r.requisito">
            <td>{{ i + 1 }}</td>
            <td>{{ r.requisito }}</td>
            <td>{{ r.bloqueNombre }}</td>
            <td class="text-center">{{ cat(r.bloque) }}</td>
            <td class="whitespace-nowrap">{{ fecha(r.acreditado?.fecha) }}</td>
            <td>{{ evidencia(r) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Opcionales -->
    <section>
      <h3 class="recat-titulo bg-gray-500">OPCIONALES (no cuentan para el avance)</h3>
      <table class="recat-tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Curso</th>
            <th>Bloque</th>
            <th class="text-center">¿Lo tiene?</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in ficha.opcionales" :key="r.bloque + r.requisito">
            <td>{{ i + 1 }}</td>
            <td>{{ r.requisito }}</td>
            <td>{{ r.bloqueNombre }}</td>
            <td class="text-center">
              <v-tag
                :severity="r.estado === 'Cumplido' ? 'success' : 'secondary'"
                :value="r.estado === 'Cumplido' ? 'Sí' : 'No'"
              />
            </td>
            <td>{{ fecha(r.acreditado?.fecha) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style>
.recat-titulo {
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 2px;
}
.recat-tabla {
  width: 100%;
  border-collapse: collapse;
}
.recat-tabla tr {
  border: 0;
}
.recat-tabla th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.recat-tabla td {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}
.app-dark .recat-tabla th {
  color: #a1a1aa;
  border-color: #3f3f46;
}
.app-dark .recat-tabla td {
  border-color: #27272a;
}
.recat-vacio {
  color: #6b7280;
  font-style: italic;
  padding: 0 0.5rem;
}
</style>
