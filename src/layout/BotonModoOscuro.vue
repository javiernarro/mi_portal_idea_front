<script setup lang="ts">
import useModoOscuro from '@/composables/useModoOscuro'

const { oscuro, alternar } = useModoOscuro()
</script>

<template>
  <button
    type="button"
    role="switch"
    class="interruptor"
    :class="{ 'interruptor--oscuro': oscuro }"
    :aria-checked="oscuro"
    :aria-label="oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    v-tooltip.top="oscuro ? 'Modo claro' : 'Modo oscuro'"
    @click="alternar"
  >
    <span class="interruptor__perilla" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
.interruptor {
  --amarillo: #fbb124;
  position: relative;
  width: 46px;
  height: 24px;
  padding: 0;
  border: 1px solid #e2e2e2;
  border-radius: 999px;
  background: #efefef;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

.interruptor:focus-visible {
  outline: 2px solid var(--amarillo);
  outline-offset: 2px;
}

/* Sol: círculo amarillo a la izquierda */
.interruptor__perilla {
  position: absolute;
  top: 3px;
  left: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--amarillo);
  box-shadow: none;
  transition:
    left 0.3s ease,
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.interruptor--oscuro {
  background: #1c1c1c;
  border-color: #52525b;
}

/* Luna: media luna amarilla a la derecha */
.interruptor--oscuro .interruptor__perilla {
  left: 25px;
  background: transparent;
  box-shadow: inset -5px 0 0 0 var(--amarillo);
}

@media (prefers-reduced-motion: reduce) {
  .interruptor,
  .interruptor__perilla {
    transition: none;
  }
}
</style>
