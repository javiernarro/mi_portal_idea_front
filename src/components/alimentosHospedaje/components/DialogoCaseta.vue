<script setup lang="ts">
import { ref, watch } from 'vue'
import { mensajeOk, pregunta } from '@/helper/mensajes'
import type { ICaseta } from '../interfaces/alimentosHospedaje'
import { getCaseta, putCaseta } from '../services/alimentosHospedaje'
import { mostrarError } from '../composables/useAlimentosHospedaje'
import { pdfQrCaseta } from '../composables/usePdfAlimentos'

const visible = defineModel<boolean>('visible', { required: true })

const caseta = ref<ICaseta | null>(null)
const coordenadas = ref('')
const radio = ref(200)
const guardando = ref(false)

watch(
  visible,
  async (v) => {
    if (!v) return
    caseta.value = (await getCaseta().catch(mostrarError)) ?? null
    coordenadas.value = caseta.value?.lat != null ? `${caseta.value.lat}, ${caseta.value.lng}` : ''
    radio.value = caseta.value?.radio ?? 200
  },
  { immediate: true },
)

/** Acepta lo que copia Google Maps al hacer clic derecho: "25.4232, -100.9737". */
const leerCoordenadas = () => {
  const m = coordenadas.value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
  return m ? { lat: +m[1]!, lng: +m[2]! } : null
}

const guardar = async (nuevoCodigo = false) => {
  const c = leerCoordenadas()
  if (!c) return
  if (nuevoCodigo) {
    const ok = await pregunta(
      '¿Generar un QR nuevo?',
      'El QR impreso que está hoy en Caseta deja de funcionar.',
    )
    if (!ok) return
  }
  guardando.value = true
  const r = await putCaseta({ ...c, radio: radio.value, nuevoCodigo }).catch(mostrarError)
  guardando.value = false
  if (!r) return
  caseta.value = r
  mensajeOk(nuevoCodigo ? 'QR nuevo generado' : 'Caseta guardada')
}
</script>

<template>
  <v-dialog v-model:visible="visible" modal header="QR de Caseta" class="w-[95vw] md:w-[560px]">
    <div class="flex flex-col gap-3">
      <div class="text-sm text-neutral-600 dark:text-zinc-300">
        Un solo QR en Caseta para la llegada y la salida. El huésped lo escanea con su teléfono y el
        portal revisa que esté en Caseta y que sea su propia reserva.
      </div>
      <div>
        <label>Coordenadas de Caseta</label>
        <v-inputtext fluid v-model="coordenadas" placeholder="25.4232, -100.9737" />
        <small class="text-neutral-500 dark:text-zinc-400">
          En Google Maps, clic derecho sobre Caseta y clic en las coordenadas para copiarlas.
        </small>
      </div>
      <div>
        <label>Radio permitido (metros)</label>
        <v-inputnumber fluid v-model="radio" :min="50" :max="500" suffix=" m" />
      </div>
    </div>

    <template #footer>
      <v-button
        label="QR nuevo"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :disabled="!leerCoordenadas() || !caseta"
        @click="guardar(true)"
      />
      <v-button
        label="Imprimir QR"
        icon="pi pi-print"
        severity="secondary"
        outlined
        :disabled="caseta?.lat == null"
        @click="caseta && pdfQrCaseta(caseta.url)"
      />
      <v-button
        label="Guardar"
        icon="pi pi-check"
        :disabled="!leerCoordenadas()"
        :loading="guardando"
        @click="guardar(false)"
      />
    </template>
  </v-dialog>
</template>
