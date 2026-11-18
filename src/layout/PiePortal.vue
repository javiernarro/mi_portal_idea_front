<script setup lang="ts">
import Swal from 'sweetalert2'

// fijo: en la pantalla de inicio de sesión va pegado abajo
const { fijo = false } = defineProps<{ fijo?: boolean }>()

// P14 y P15: leyenda de derechos y contacto de ayuda (mismo estilo de texto pequeño del portal)
const anio = 2026 // texto de Javier (P14)
const CONTACTO = 'Contactar con: Javier Narro - Coordinador de Capacitación.'

const mostrarAyuda = () => {
  Swal.fire({ icon: 'info', title: 'Ayuda o Soporte', text: CONTACTO })
}
</script>

<template>
  <footer
    class="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 py-3 px-4 text-center"
    :class="{ 'fixed bottom-0 inset-x-0 z-10': fijo }"
  >
    <small class="text-neutral-500 dark:text-zinc-400">
      © {{ anio }} KOMATSU MAQUINARIAS MEXICO. Todos los derechos reservados.
    </small>
    <small
      class="text-neutral-500 dark:text-zinc-400 underline cursor-pointer"
      role="button"
      tabindex="0"
      v-tooltip.top="CONTACTO"
      @click="mostrarAyuda"
      @keydown.enter="mostrarAyuda"
    >
      Ayuda o Soporte
    </small>
  </footer>
</template>
