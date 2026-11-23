<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import BotonNotificaciones from '@/components/notificaciones/BotonNotificaciones.vue'
import BotonModoOscuro from './BotonModoOscuro.vue'
import useAuth from '@/components/auth/composables/useAuth'

interface Props {
  titulo: string
}

defineProps<Props>()

const authSotore = useAuthStore()
const { nombreEmpleado, autenticado } = storeToRefs(authSotore)

// Menú de la cuenta: se abre al tocar el nombre. Reúne Cambiar contraseña, Tema y Salir,
// para que el menú lateral solo tenga las secciones del portal.
const router = useRouter()
const { logout } = useAuth()
const menuCuenta = ref()
const abierto = ref(false)

const alternar = (e: Event) => menuCuenta.value.toggle(e)

const cambiarPassword = () => {
  menuCuenta.value.hide()
  router.push('/cambiar-password')
}

const salir = () => {
  menuCuenta.value.hide()
  logout()
}
</script>

<template>
  <v-menubar :model="[]" v-if="autenticado" class="mb-3">
    <template #start>
      <span class="text-xl!">{{ titulo }}</span>
    </template>
    <template #end>
      <div class="flex items-center gap-2 p-2">
        <BotonNotificaciones />
        <button
          type="button"
          class="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-[#283d9a]! dark:text-[#8ea0f0]! hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
          aria-haspopup="menu"
          :aria-expanded="abierto"
          @click="alternar"
        >
          <span class="text-xl! text-left">{{ nombreEmpleado }}</span>
          <i
            class="pi pi-chevron-down transition-transform duration-300"
            :class="{ 'rotate-180': abierto }"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </template>
  </v-menubar>

  <v-popover ref="menuCuenta" @show="abierto = true" @hide="abierto = false">
    <div class="w-[300px] max-w-[85vw] flex flex-col -m-1" role="menu">
      <!-- Mi cuenta: mismo azul que los grupos abiertos del menú lateral -->
      <div class="flex items-center gap-3 px-4 py-3 rounded-md bg-[#283d9a] text-white">
        <i class="pi pi-user" aria-hidden="true"></i>
        <span class="font-medium">Mi cuenta</span>
      </div>

      <button
        type="button"
        role="menuitem"
        class="flex items-center gap-3 px-4 py-3 mt-1 rounded-md text-left cursor-pointer text-neutral-800 dark:text-zinc-100 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
        @click="cambiarPassword"
      >
        <i class="pi pi-lock" aria-hidden="true"></i>
        <span>Cambiar contraseña</span>
      </button>

      <div
        class="flex items-center justify-between gap-3 px-4 py-3 text-neutral-800 dark:text-zinc-100"
      >
        <span class="flex items-center gap-3">
          <i class="pi pi-palette" aria-hidden="true"></i>
          <span>Tema</span>
        </span>
        <span class="flex flex-col items-center gap-1">
          <span class="text-xs text-neutral-500 dark:text-zinc-400">Claro/Oscuro</span>
          <BotonModoOscuro />
        </span>
      </div>

      <v-button
        label="Salir"
        severity="danger"
        icon="pi pi-power-off"
        class="w-full mt-1"
        @click="salir"
      />
    </div>
  </v-popover>
</template>

<style scoped></style>
