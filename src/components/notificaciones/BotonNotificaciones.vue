<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getNotificaciones, getPendientes, marcarLeidas, type INotificacion } from './servicios'

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
    pendientes.value = false
  }
}

const ir = (n: INotificacion) => {
  panel.value.hide()
  if (n.enlace) router.push(n.enlace)
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
    class="relative flex items-center justify-center w-10 h-10 rounded-full cursor-pointer text-[#283d9a] dark:text-[#8ea0f0] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
    :aria-label="pendientes ? 'Notificaciones (hay nuevas)' : 'Notificaciones'"
    @click="abrir"
  >
    <i class="pi pi-inbox text-xl!" />
    <span
      v-if="pendientes"
      class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse"
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
        <button
          v-for="n in lista"
          :key="n.id"
          type="button"
          class="text-left px-2 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-zinc-800 cursor-pointer flex gap-2"
          @click="ir(n)"
        >
          <span
            class="mt-1.5 w-2 h-2 rounded-full shrink-0"
            :class="n.leidaEn ? 'bg-transparent' : 'bg-red-500'"
          ></span>
          <span class="flex flex-col">
            <span class="text-sm font-medium text-neutral-800 dark:text-zinc-100">{{
              n.titulo
            }}</span>
            <span class="text-sm text-neutral-600 dark:text-zinc-300">{{ n.mensaje }}</span>
            <span class="text-xs text-neutral-400 dark:text-zinc-500">{{ hace(n.createdAt) }}</span>
          </span>
        </button>
      </div>
    </div>
  </v-popover>
</template>
