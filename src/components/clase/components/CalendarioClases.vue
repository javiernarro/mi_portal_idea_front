<script setup lang="ts">
import { ref, computed } from 'vue'
import useClases from '../composables/useClases'
import router from '@/router'
import type { IClase } from '../interfaces/clase'
import { parseLocalDate } from '@/helper/parseLocalDate'
import moment from 'moment'
import { verificarPermiso } from '@/guards/verificarPermiso'
import useEliminar from '../composables/useEliminar'
import useDesenlazar from '../composables/useDesenlazar'

const { data: clases, inicio, fin, isLoading } = useClases()
const { eliminar } = useEliminar()
const { desenlazar } = useDesenlazar()
const today = new Date()
const view = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()))

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const monthTitle = computed(() =>
  view.value.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
)

// "DD/MM" para mostrar el rango de clases de varios días
const fechaCorta = (fecha?: string | Date) => {
  if (!fecha) return ''
  const d = parseLocalDate(fecha)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

// Colores y etiqueta según el estatus de la clase
const estiloEstatus = (estatus?: string) => {
  const e = estatus?.toLowerCase()
  if (e === 'finalizada')
    return {
      severity: 'success',
      borderClass: 'border-emerald-200 hover:border-emerald-300',
      bgClass: 'bg-emerald-50/70',
      headerBg: 'bg-emerald-100/90 text-emerald-900',
      label: 'Finalizada',
      dotColor: 'bg-emerald-500',
    }
  if (e === 'en curso')
    return {
      severity: 'warn',
      borderClass: 'border-amber-200 hover:border-amber-300',
      bgClass: 'bg-amber-50/70',
      headerBg: 'bg-amber-100/90 text-amber-900',
      label: 'En curso',
      dotColor: 'bg-amber-500',
    }
  return {
    severity: 'info',
    borderClass: 'border-blue-200 hover:border-blue-300',
    bgClass: 'bg-blue-50/70',
    headerBg: 'bg-blue-100/90 text-blue-900',
    label: 'Pendiente',
    dotColor: 'bg-blue-500',
  }
}

const verDetalle = (id: number) => {
  router.push({ name: 'ver-clase', params: { id } })
}

const menuItems = (clase: IClase) => {
  const finalizada = clase.estatus?.toLowerCase() === 'finalizada'
  const enCurso = clase.estatus?.toLowerCase() === 'en curso'
  const enlazada = clase.enlazada

  const items = [
    {
      label: 'Ver detalle',
      icon: 'pi pi-eye',
      command: () => {
        verDetalle(clase.id)
      },
    },
    {
      label: 'Instructores',
      icon: 'pi pi-user-plus',
      command: () => {
        router.push({ name: 'lista-instructores', params: { id: clase.id } })
      },
    },
    {
      label: 'Empleados / Alumnos',
      icon: 'pi pi-users',
      command: () => {
        router.push({ name: 'lista-alumnos', params: { id: clase.id } })
      },
    },
  ]

  if (verificarPermiso('Clases.Modificar.Archivos'))
    items.push({
      label: 'Archivos de clase',
      icon: 'pi pi-file',
      command: () => {
        router.push({ name: 'archivos-clase', params: { id: clase.id } })
      },
    })

  if (verificarPermiso('Clases.Modificar') && !finalizada && !enCurso)
    items.push({
      label: 'Modificar',
      icon: 'pi pi-pencil',
      command: () => {
        router.push({ name: 'modificar-clase', params: { id: clase.id } })
      },
    })

  if (verificarPermiso('Clases.Enlazar') && !enlazada && !enCurso && !finalizada)
    items.push({
      label: 'Enlazar clase',
      icon: 'pi pi-link',
      command: () => {
        router.push({ name: 'enlazar-clase', params: { id: clase.id } })
      },
    })

  if (verificarPermiso('Clases.Desenlazar') && enlazada && !enCurso && !finalizada)
    items.push({
      label: 'Desenlazar',
      icon: 'pi pi-times',
      command: () => {
        desenlazar(clase.id)
      },
    })

  if (verificarPermiso('Clases.Calificar') && finalizada)
    items.push({
      label: clase.calificada ? 'Ver calificaciones' : 'Subir calificaciones',
      icon: 'pi pi-check',
      command: () => {
        router.push({ name: 'calificar-clase', params: { id: clase.id } })
      },
    })

  if (verificarPermiso('Clases.Bitacora'))
    items.push({
      label: 'Ver bitácora',
      icon: 'pi pi-list',
      command: () => {
        router.push({ name: 'bitacora-clase', params: { id: clase.id } })
      },
    })

  if (verificarPermiso('Clases.Eliminar') && !finalizada && !enCurso)
    items.push({
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: () => {
        eliminar(clase)
      },
    })

  return items
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number) {
  const date = new Date(d.getFullYear(), d.getMonth() + n, 1)
  inicio.value = moment(date).format('YYYY-MM-DD')
  fin.value = moment(date).add(1, 'month').endOf('month').format('YYYY-MM-DD')
  return date
}

function prevMonth() {
  view.value = addMonths(view.value, -1)
}

function nextMonth() {
  view.value = addMonths(view.value, 1)
}

function goToday() {
  view.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  inicio.value = moment(view.value).format('YYYY-MM-DD')
  fin.value = moment(view.value).add(1, 'month').endOf('month').format('YYYY-MM-DD')
}

function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isPastDate(d: Date): boolean {
  const dateToCheck = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return dateToCheck < todayDate
}

interface DiaCalendario {
  date: Date
  otherMonth: boolean
  isToday: boolean
  isPast: boolean
  key: string
}

interface Segmento {
  clase: IClase
  startCol: number
  endCol: number
  spanCols: number
  isStart: boolean
  isEnd: boolean
  isMultiDay: boolean
  totalDias: number
}

// Semanas del mes; cada clase se dibuja como una barra que abarca sus días
const semanas = computed(() => {
  const start = startOfMonth(view.value)
  const mondayIndex = (start.getDay() + 6) % 7
  const firstDayToShow = new Date(start)
  firstDayToShow.setDate(start.getDate() - mondayIndex)

  const resultado: Array<{ key: string; days: DiaCalendario[]; segments: Segmento[] }> = []

  const rangos = (clases.value || []).map((clase) => {
    const ini = parseLocalDate(clase.fechaInicio)
    const finClase = clase.fechaFinalizacion ? parseLocalDate(clase.fechaFinalizacion) : ini
    const startD = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate())
    const endD = new Date(finClase.getFullYear(), finClase.getMonth(), finClase.getDate())
    const totalDias = Math.max(
      1,
      Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    )
    return { clase, startD, endD, isMultiDay: totalDias > 1, totalDias }
  })

  for (let w = 0; w < 6; w++) {
    const days: DiaCalendario[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayToShow)
      d.setDate(firstDayToShow.getDate() + (w * 7 + i))
      days.push({
        date: d,
        otherMonth: d.getMonth() !== view.value.getMonth(),
        isToday: isoDate(d) === isoDate(today),
        isPast: isPastDate(d),
        key: `${isoDate(d)}-${w}-${i}`,
      })
    }

    const inicioSemana = new Date(
      days[0]!.date.getFullYear(),
      days[0]!.date.getMonth(),
      days[0]!.date.getDate(),
      0,
      0,
      0,
    )
    const finSemana = new Date(
      days[6]!.date.getFullYear(),
      days[6]!.date.getMonth(),
      days[6]!.date.getDate(),
      23,
      59,
      59,
    )

    const segments: Segmento[] = []
    rangos.forEach(({ clase, startD, endD, isMultiDay, totalDias }) => {
      if (startD <= finSemana && endD >= inicioSemana) {
        let startCol = 1
        let isStart = true
        if (startD < inicioSemana) {
          startCol = 1
          isStart = false
        } else startCol = ((startD.getDay() + 6) % 7) + 1

        let endCol = 7
        let isEnd = true
        if (endD > finSemana) {
          endCol = 7
          isEnd = false
        } else endCol = ((endD.getDay() + 6) % 7) + 1

        const spanCols = Math.max(1, endCol - startCol + 1)
        segments.push({ clase, startCol, endCol, spanCols, isStart, isEnd, isMultiDay, totalDias })
      }
    })

    segments.sort((a, b) =>
      b.spanCols !== a.spanCols ? b.spanCols - a.spanCols : a.startCol - b.startCol,
    )

    resultado.push({ key: `week-${w}-${isoDate(days[0]!.date)}`, days, segments })
  }

  return resultado
})
</script>

<template>
  <div class="w-full mx-auto font-sans relative">
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center absolute inset-0 z-50 bg-white/75 backdrop-blur-xs rounded-xl transition-all"
    >
      <v-progressspinner style="width: 44px; height: 44px" strokeWidth="4" />
      <span class="text-sm font-semibold text-neutral-700 mt-2">Cargando clases...</span>
    </div>

    <header
      class="flex flex-wrap items-center justify-between gap-3 bg-white border border-neutral-200/90 shadow-2xs rounded-xl px-4 py-3 mb-2"
    >
      <div class="flex items-center gap-1.5">
        <v-button
          icon="pi pi-chevron-left"
          text
          rounded
          severity="secondary"
          size="small"
          @click="prevMonth"
          aria-label="Mes anterior"
          v-tooltip.top="'Mes anterior'"
        />
        <v-button
          icon="pi pi-calendar"
          label="Hoy"
          text
          size="small"
          severity="secondary"
          @click="goToday"
          v-tooltip.top="'Ir al mes actual'"
        />
        <v-button
          icon="pi pi-chevron-right"
          text
          rounded
          severity="secondary"
          size="small"
          @click="nextMonth"
          aria-label="Mes siguiente"
          v-tooltip.top="'Mes siguiente'"
        />
        <h2 class="text-lg font-bold capitalize text-neutral-800 tracking-tight ml-2">
          {{ monthTitle }}
        </h2>
      </div>

      <div
        class="flex items-center gap-3 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200/70"
      >
        <div class="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-2xs"></span>
          <span>Pendiente</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs"></span>
          <span>En curso</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
          <span>Finalizada</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <router-link :to="{ name: 'enlazar-clases' }" v-if="verificarPermiso('Clases.Enlazar')">
          <v-button icon="pi pi-link" label="Enlazar clases" size="small" severity="secondary" outlined />
        </router-link>
        <router-link :to="{ name: 'crear-clase' }" v-if="verificarPermiso('Clases.Crear')">
          <v-button icon="pi pi-plus" label="Crear clase" size="small" />
        </router-link>
      </div>
    </header>

    <div
      class="grid grid-cols-7 text-center border border-neutral-200 bg-neutral-50/90 rounded-t-xl overflow-hidden"
    >
      <div
        v-for="(d, index) in weekdays"
        :key="d"
        :class="[
          'py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600',
          index >= 5 ? 'text-neutral-400 bg-neutral-100/40' : '',
        ]"
      >
        {{ d }}
      </div>
    </div>

    <div
      class="border border-neutral-200 rounded-b-xl overflow-hidden shadow-2xs divide-y divide-neutral-200"
    >
      <div
        v-for="semana in semanas"
        :key="semana.key"
        class="relative flex flex-col min-h-[135px] bg-white transition-colors"
      >
        <!-- Fondo de cada día -->
        <div
          class="grid grid-cols-7 absolute inset-0 pointer-events-none divide-x divide-neutral-200/80"
        >
          <div
            v-for="day in semana.days"
            :key="day.key"
            :class="[
              day.otherMonth ? 'bg-neutral-50/50' : 'bg-white',
              day.isToday ? 'bg-primary-50/20' : '',
              day.isPast && !day.otherMonth ? 'bg-neutral-50/30' : '',
            ]"
          ></div>
        </div>

        <!-- Número de cada día -->
        <div class="grid grid-cols-7 z-1 pt-1 px-1 pb-1">
          <div
            v-for="day in semana.days"
            :key="day.key"
            class="flex items-center justify-between px-1.5"
          >
            <span
              v-if="day.isToday"
              v-tooltip.top="'Hoy'"
              class="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-xs"
            >
              {{ day.date.getDate() }}
            </span>
            <span
              v-else
              :class="[
                'text-xs font-semibold px-1 py-0.5',
                day.otherMonth ? 'text-neutral-400' : 'text-neutral-700',
              ]"
            >
              {{ day.date.getDate() }}
            </span>
          </div>
        </div>

        <!-- Clases de la semana -->
        <div class="grid grid-cols-7 gap-x-1 gap-y-1.5 z-2 p-1 flex-1 items-start">
          <div
            v-for="seg in semana.segments"
            :key="`${seg.clase.id}-${seg.startCol}-${semana.key}`"
            :style="{ gridColumnStart: seg.startCol, gridColumnEnd: `span ${seg.spanCols}` }"
            :class="[
              'group relative rounded-lg border transition-all duration-150 shadow-2xs hover:shadow-xs overflow-hidden text-left',
              [
                estiloEstatus(seg.clase.estatus).borderClass,
                estiloEstatus(seg.clase.estatus).bgClass,
                seg.isStart ? '' : 'rounded-l-none',
                seg.isEnd ? '' : 'rounded-r-none',
              ],
            ]"
          >
            <div
              :class="[
                'flex items-center justify-between px-2 py-1 text-[10px] font-semibold border-b border-black/5 gap-1',
                estiloEstatus(seg.clase.estatus).headerBg,
              ]"
            >
              <div class="flex items-center gap-1.5 truncate">
                <span class="font-mono font-bold">#{{ seg.clase.id }}</span>
                <span
                  v-if="seg.clase.enlazada"
                  class="inline-flex items-center text-primary-700"
                  v-tooltip.top="`Enlazada (Padre #${seg.clase.padres?.[0]?.padreId || seg.clase.id})`"
                >
                  <i class="pi pi-link text-[9px]"></i>
                </span>
                <span
                  v-if="seg.isMultiDay"
                  class="text-[9px] font-normal opacity-90 hidden sm:inline"
                >
                  ({{ seg.totalDias }} días: {{ fechaCorta(seg.clase.fechaInicio) }} -
                  {{ fechaCorta(seg.clase.fechaFinalizacion) }})
                </span>
              </div>
              <div class="flex items-center gap-1 font-normal opacity-90 shrink-0">
                <i class="pi pi-clock text-[9px]"></i>
                <span>{{ seg.clase.horaInicio }} - {{ seg.clase.horaFinalizacion }}</span>
              </div>
            </div>
            <div class="p-1">
              <v-splitbutton
                fluid
                dropdownIcon="pi pi-ellipsis-v"
                :model="menuItems(seg.clase)"
                :label="seg.clase.curso?.nombre || 'Clase'"
                :severity="estiloEstatus(seg.clase.estatus).severity"
                size="small"
                class="w-full custom-splitbutton"
                @click="verDetalle(seg.clase.id)"
                v-tooltip.top="
                  `${seg.clase.curso?.nombre || 'Clase'} (${seg.clase.horaInicio} - ${seg.clase.horaFinalizacion})`
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.custom-splitbutton) {
  width: 100%;
}

:deep(.custom-splitbutton .p-splitbutton-button) {
  padding: 0.25rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 500;
  justify-content: flex-start;
  text-align: left;
  overflow: hidden;
}

:deep(.custom-splitbutton .p-splitbutton-button .p-button-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.custom-splitbutton .p-splitbutton-dropdown) {
  padding: 0.25rem 0.35rem;
}
</style>
