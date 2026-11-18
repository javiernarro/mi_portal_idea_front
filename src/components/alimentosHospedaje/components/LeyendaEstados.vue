<script setup lang="ts">
import { ESTILO_ESTADO } from '../helpers/estados'

const estados = ['DISPONIBLE', 'RESERVADA', 'OCUPADA', 'FUERA_SERVICIO'] as const
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 bg-neutral-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-neutral-200/70 dark:border-zinc-700"
  >
    <div
      v-for="e in estados"
      :key="e"
      class="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-zinc-300"
    >
      <span class="w-2.5 h-2.5 rounded-full shadow-2xs" :class="ESTILO_ESTADO[e].dot"></span>
      <span>{{ ESTILO_ESTADO[e].label }}</span>
    </div>
  </div>
</template>
