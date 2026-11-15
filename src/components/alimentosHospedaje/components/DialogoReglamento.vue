<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { IReglamento } from '../interfaces/alimentosHospedaje'
import { getReglamento } from '../services/alimentosHospedaje'
import { mostrarError } from '../composables/useAlimentosHospedaje'

/**
 * Reglamento del hostal. Con "paraAceptar" se muestra como al instalar un programa: la casilla de
 * aceptación aparece solo al llegar al final del texto y el botón se activa al marcarla.
 */
const props = defineProps<{ paraAceptar?: boolean; cargando?: boolean }>()
const emit = defineEmits<{ aceptar: [version: string] }>()
const visible = defineModel<boolean>('visible', { required: true })

const reglamento = ref<IReglamento | null>(null)
const leidoHastaElFinal = ref(false)
const aceptado = ref(false)
const contenedor = ref<HTMLElement | null>(null)

const revisarFinal = () => {
  const el = contenedor.value
  if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) leidoHastaElFinal.value = true
}

watch(
  visible,
  async (v) => {
    if (!v) return
    leidoHastaElFinal.value = false
    aceptado.value = false
    reglamento.value ??= (await getReglamento().catch(mostrarError)) ?? null
    await nextTick()
    if (contenedor.value) contenedor.value.scrollTop = 0
    revisarFinal()
  },
  { immediate: true },
)
</script>

<template>
  <v-dialog
    v-model:visible="visible"
    modal
    header="Reglamento del Hostal"
    class="w-[95vw] md:w-[640px]"
    :closable="!props.cargando"
  >
    <div
      ref="contenedor"
      class="max-h-[60vh] overflow-y-auto rounded-md border border-neutral-200 dark:border-zinc-700 bg-white text-neutral-800 p-4 text-sm"
      @scroll="revisarFinal"
    >
      <div v-if="!reglamento" class="flex flex-col gap-2">
        <v-skeleton height="24px" />
        <v-skeleton height="240px" />
      </div>
      <template v-else>
        <div class="flex items-center justify-between gap-4 mb-3">
          <img
            src="/reglamento/mi-portal-idea.png"
            alt="Mi Portal IDEA"
            class="h-12 w-auto object-contain"
          />
          <img src="/reglamento/komatsu.png" alt="KOMATSU" class="h-7 w-auto object-contain" />
        </div>
        <div class="font-bold text-center mb-3">{{ reglamento.titulo }}</div>
        <p class="font-semibold mb-3">{{ reglamento.introduccion }}</p>
        <div class="font-semibold mb-2">{{ reglamento.subtitulo }}</div>
        <ol class="list-decimal pl-6 flex flex-col gap-1.5">
          <li v-for="(n, i) in reglamento.normas" :key="i">{{ n }}</li>
        </ol>
        <p v-for="(c, i) in reglamento.cierre" :key="'c' + i" class="font-semibold mt-3">{{ c }}</p>
        <div class="mt-5 text-center leading-6">
          <template v-for="(f, i) in reglamento.firma" :key="'f' + i">
            <div>{{ f }}</div>
            <img
              v-if="i === 0"
              src="/reglamento/firma.png"
              alt="Firma"
              class="h-16 w-auto object-contain mx-auto my-1"
            />
          </template>
        </div>
      </template>
    </div>

    <div v-if="props.paraAceptar" class="mt-3 min-h-8">
      <label v-if="leidoHastaElFinal && reglamento" class="flex items-center gap-2 cursor-pointer">
        <v-checkbox v-model="aceptado" binary input-id="acepto-reglamento" />
        <span>{{ reglamento.aceptacion }}</span>
      </label>
      <small v-else class="text-neutral-500 dark:text-zinc-400">
        Desliza hasta el final del reglamento para poder aceptarlo.
      </small>
    </div>

    <template #footer>
      <v-button
        v-if="props.paraAceptar"
        label="Aceptar y registrar llegada"
        icon="pi pi-sign-in"
        :disabled="!aceptado || !reglamento"
        :loading="props.cargando"
        @click="reglamento && emit('aceptar', reglamento.version)"
      />
      <v-button v-else label="Cerrar" severity="secondary" outlined @click="visible = false" />
    </template>
  </v-dialog>
</template>
