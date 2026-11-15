<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import Swal from 'sweetalert2'
import NavBar from '@/layout/NavBar.vue'
import type { IMiReserva } from '@/components/alimentosHospedaje/interfaces/alimentosHospedaje'
import {
  getMiHospedaje,
  postRegistroCaseta,
} from '@/components/alimentosHospedaje/services/alimentosHospedaje'
import { mostrarError } from '@/components/alimentosHospedaje/composables/useAlimentosHospedaje'
import { ESTADOS_RESERVA, TIEMPOS } from '@/components/alimentosHospedaje/helpers/estados'
import { fechaLarga, rango } from '@/components/alimentosHospedaje/helpers/fechas'

const route = useRoute()
const queryClient = useQueryClient()
const { data, isLoading } = useQuery({ queryKey: ['miHospedaje'], queryFn: getMiHospedaje })
const reservas = computed<IMiReserva[]>(() => data.value ?? [])

// Código del QR de Caseta (viene en la liga que abre el teléfono)
const codigo = computed(() => {
  const c = route.query.caseta ?? sessionStorage.getItem('ah-caseta')
  return typeof c === 'string' && c ? c : null
})
const registrando = ref<number | null>(null)

const ubicacion = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Este teléfono no comparte su ubicación.'))
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    })
  })

const registrar = async (r: IMiReserva, accion: 'llegada' | 'salida') => {
  if (!codigo.value) return
  registrando.value = r.id
  try {
    const pos = await ubicacion()
    const res = await postRegistroCaseta({
      codigo: codigo.value,
      accion,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      precision: pos.coords.accuracy,
    })
    if (res) {
      sessionStorage.removeItem('ah-caseta')
      Swal.fire({
        icon: 'success',
        title: accion === 'llegada' ? '¡Bienvenido!' : '¡Buen viaje!',
        text:
          accion === 'llegada'
            ? `Llegada registrada. Tu lugar: ${lugar(r)}.`
            : 'Salida registrada. Gracias.',
      })
      queryClient.invalidateQueries({ queryKey: ['miHospedaje'] })
    }
  } catch (e) {
    const geo = e as GeolocationPositionError
    if (typeof geo?.code === 'number')
      Swal.fire({
        icon: 'warning',
        title: 'Sin ubicación',
        text: 'Permite que el portal use la ubicación de tu teléfono y vuelve a intentar.',
      })
    else mostrarError(e)
  } finally {
    registrando.value = null
  }
}

const lugar = (r: IMiReserva) => (r.cama ? `${r.habitacion} · Cama ${r.cama}` : r.habitacion)
const comidas = (r: IMiReserva) =>
  rango(r.entradaFecha, r.salidaFecha)
    .map((f) => ({
      fecha: f,
      tiempos: TIEMPOS.filter((t) => r.servicios.some((s) => s.fecha === f && s.tiempo === t.value))
        .map((t) => t.label)
        .join(', '),
    }))
    .filter((d) => d.tiempos)
</script>

<template>
  <NavBar titulo="Mi hospedaje" />

  <v-card>
    <template #content>
      <div class="flex flex-col gap-4">
        <div
          v-if="codigo"
          class="rounded-md border border-blue-200 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/50 p-3 text-sm text-blue-900 dark:text-blue-100"
        >
          <i class="pi pi-qrcode" /> Estás en Caseta. Toca "Registrar llegada" o "Registrar salida"
          y permite el uso de tu ubicación.
        </div>

        <div v-if="isLoading" class="flex flex-col gap-2">
          <v-skeleton height="140px" />
        </div>
        <div v-else-if="!reservas.length" class="text-neutral-600 dark:text-zinc-300">
          No tienes hospedaje asignado en el Centro de Entrenamiento.
        </div>

        <div
          v-for="r in reservas"
          :key="r.id"
          class="rounded-lg border border-neutral-200 dark:border-zinc-700 p-4 flex flex-col gap-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-lg font-bold text-neutral-800 dark:text-zinc-100">
                {{ lugar(r) }}
              </div>
              <div class="text-sm text-neutral-500 dark:text-zinc-400 break-all">
                {{ r.folio }}
              </div>
            </div>
            <v-tag
              :value="ESTADOS_RESERVA[r.estado].label"
              :severity="ESTADOS_RESERVA[r.estado].severity"
            />
          </div>

          <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <span class="text-neutral-500 dark:text-zinc-400">Entrada</span>
            <span>{{ fechaLarga(r.entradaFecha) }}, {{ r.entradaHora }}</span>
            <span class="text-neutral-500 dark:text-zinc-400">Salida</span>
            <span>{{ fechaLarga(r.salidaFecha) }}, {{ r.salidaHora }}</span>
            <template v-if="r.detalleMotivo">
              <span class="text-neutral-500 dark:text-zinc-400">Motivo</span>
              <span>{{ r.detalleMotivo }}</span>
            </template>
          </div>

          <div v-if="comidas(r).length" class="text-sm">
            <div class="font-semibold mb-1">Alimentos</div>
            <div v-for="d in comidas(r)" :key="d.fecha" class="text-neutral-600 dark:text-zinc-300">
              {{ fechaLarga(d.fecha) }}: {{ d.tiempos }}
            </div>
          </div>

          <div class="text-sm text-neutral-600 dark:text-zinc-300">
            <b>Reglamento del Centro de Entrenamiento:</b> pendiente, el administrador lo agregará
            aquí.
          </div>

          <div class="flex flex-wrap gap-2">
            <v-button
              v-if="r.puedeLlegar"
              label="Registrar llegada"
              icon="pi pi-sign-in"
              :disabled="!codigo"
              :loading="registrando === r.id"
              @click="registrar(r, 'llegada')"
            />
            <v-button
              v-if="r.puedeSalir"
              label="Registrar salida"
              icon="pi pi-sign-out"
              :disabled="!codigo"
              :loading="registrando === r.id"
              @click="registrar(r, 'salida')"
            />
            <small
              v-if="(r.puedeLlegar || r.puedeSalir) && !codigo"
              class="self-center text-neutral-500 dark:text-zinc-400"
            >
              Para registrar, escanea el QR de Caseta con tu teléfono.
            </small>
          </div>
        </div>
      </div>
    </template>
  </v-card>
</template>
