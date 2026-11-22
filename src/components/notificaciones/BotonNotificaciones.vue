<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getNotificaciones, getPendientes, marcarLeidas, type INotificacion } from './servicios'
import { verificarPermiso } from '@/guards/verificarPermiso'

// Bandeja de notificaciones: sin número, solo un punto rojo cuando hay algo sin leer.
const router = useRouter()
const panel = ref()
const pendientes = ref(false)
const lista = ref<INotificacion[]>([])
const cargando = ref(false)
let reloj: ReturnType<typeof setInterval> | undefined

const revisar = async () => {
  pendientes.value = await getPendientes().catch(() => false)
}

onMounted(() => {
  revisar()
  reloj = setInterval(revisar, 60_000)
})
onBeforeUnmount(() => clearInterval(reloj))

const abrir = async (e: Event) => {
  panel.value.toggle(e)
  cargando.value = true
  lista.value = (await getNotificaciones().catch(() => [])) ?? []
  cargando.value = false
  if (pendientes.value) {
    await marcarLeidas().catch(() => null)
    // Los avisos fijos no se apagan al leerlos: el punto sigue mientras haya alguno
    pendientes.value = lista.value.some((n) => n.fija)
  }
}

// Bloques por tipo de notificación (el tipo empieza con la categoría: "hospedaje.llegada", "cursos.inscripcion"...)
// Cada bloque usa el mismo ícono que su sección en el menú del portal.
const CATEGORIAS = [
  { clave: 'hospedaje', titulo: 'Hospedaje y alimentos', icono: 'pi pi-building' },
  { clave: 'cursos', titulo: 'Cursos e inscripciones', icono: 'pi pi-star' },
  { clave: 'instructores', titulo: 'Instructores', icono: 'pi pi-graduation-cap' },
  // Alertas de seguridad (solo las recibe el Administrador): bloqueos, dos dispositivos, descargas, reactivaciones
  { clave: 'seguridad', titulo: 'Seguridad', icono: 'pi pi-shield' },
] as const
const OTRAS = { clave: 'otras', titulo: 'Otras', icono: 'pi pi-inbox' }

const bloques = computed(() => {
  const grupos = [...CATEGORIAS, OTRAS].map((c) => ({
    ...c,
    items: [] as INotificacion[],
  }))
  for (const n of lista.value) {
    const clave = n.tipo.split('.')[0]
    ;(grupos.find((g) => g.clave === clave) ?? grupos[grupos.length - 1]!).items.push(n)
  }
  // Los avisos fijos van primero en su bloque, y los bloques con avisos fijos van hasta arriba
  const conFijas = (g: { items: INotificacion[] }) => Number(g.items.some((n) => n.fija))
  for (const g of grupos) g.items.sort((a, b) => Number(!!b.fija) - Number(!!a.fija))
  return grupos.filter((g) => g.items.length).sort((a, b) => conFijas(b) - conFijas(a))
})

// Avisos guardados antes de que tuvieran sección: se llevan a la sección de su tipo
const ENLACE_POR_TIPO: Record<string, string> = { cursos: '/lista-clases', seguridad: '/empleados' }

/** A dónde lleva la notificación, solo si el perfil puede ver esa sección (si no, queda como mensaje). */
const destino = (n: INotificacion) => {
  const enlace = n.enlace ?? ENLACE_POR_TIPO[n.tipo.split('.')[0]!]
  if (!enlace) return null
  const ruta = router.resolve(enlace)
  if (!ruta.matched.length || ruta.matched.some((r) => r.path.includes(':pathMatch'))) return null
  const permitida = ruta.matched.every(
    (r) => !r.meta.ruta_permitida || verificarPermiso(r.meta.ruta_permitida as string),
  )
  return permitida ? enlace : null
}

const ir = (n: INotificacion) => {
  panel.value.hide()
  const enlace = destino(n)
  if (enlace) router.push(enlace)
}

// "hace 5 minutos", "hace 2 horas"... (la fecha llega en hora local del servidor)
const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const hace = (f: string) => {
  const s = Math.round((new Date(f.replace(' ', 'T')).getTime() - Date.now()) / 1000)
  const pasos: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
  ]
  let v = s
  for (const [n, u] of pasos) {
    if (Math.abs(v) < n) return relativo.format(v, u)
    v = Math.round(v / n)
  }
  return relativo.format(v, 'year')
}
</script>

<template>
  <button
    type="button"
    class="relative flex items-center justify-center h-10 px-1.5 rounded-full cursor-pointer text-[#283d9a] dark:text-[#8ea0f0] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
    :aria-label="pendientes ? 'Notificaciones (hay nuevas)' : 'Notificaciones'"
    @click="abrir"
  >
    <!-- Ícono de notificaciones: logo de Mi Portal IDEA (en modo obscuro, en el azul claro del portal) -->
    <img src="/iconos/notificaciones.svg" alt="" class="h-7 w-auto dark:hidden" />
    <img src="/iconos/notificaciones-obscuro.svg" alt="" class="h-7 w-auto hidden dark:block" />
    <span
      v-if="pendientes"
      class="absolute top-0.5 right-0 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse"
    ></span>
  </button>

  <v-popover ref="panel">
    <div class="w-[340px] max-w-[85vw] flex flex-col">
      <div class="font-semibold text-neutral-800 dark:text-zinc-100 pb-2">Notificaciones</div>
      <div v-if="cargando" class="flex justify-center py-4">
        <v-progressspinner style="width: 24px; height: 24px" strokeWidth="6" />
      </div>
      <div
        v-else-if="!lista.length"
        class="text-sm text-neutral-500 dark:text-zinc-400 py-4 text-center"
      >
        No tienes notificaciones.
      </div>
      <div v-else class="flex flex-col max-h-[420px] overflow-y-auto -mx-2">
        <template v-for="b in bloques" :key="b.clave">
          <div
            class="sticky top-0 z-10 flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#283d9a] dark:text-[#8ea0f0] bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-700"
          >
            <i :class="b.icono" />
            <span>{{ b.titulo }}</span>
          </div>
          <button
            v-for="n in b.items"
            :key="n.id"
            type="button"
            :class="[
              'text-left px-2 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-zinc-800 flex gap-2',
              destino(n) ? 'cursor-pointer' : 'cursor-default',
            ]"
            @click="ir(n)"
          >
            <span
              class="mt-1.5 w-2 h-2 rounded-full shrink-0"
              :class="n.fija || !n.leidaEn ? 'bg-red-500' : 'bg-transparent'"
            ></span>
            <span class="flex flex-col">
              <span class="flex items-center gap-2">
                <span class="text-sm font-medium text-neutral-800 dark:text-zinc-100">{{
                  n.titulo
                }}</span>
                <v-tag v-if="n.fija" value="Pendiente" severity="warn" class="text-xs" />
              </span>
              <span class="text-sm text-neutral-600 dark:text-zinc-300">{{ n.mensaje }}</span>
              <span v-if="!n.fija" class="text-xs text-neutral-400 dark:text-zinc-500">{{
                hace(n.createdAt)
              }}</span>
            </span>
          </button>
        </template>
      </div>
    </div>
  </v-popover>
</template>
