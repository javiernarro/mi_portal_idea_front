<script setup lang="ts">
import { computed } from 'vue'
import { mensajeOk, observaciones, pregunta } from '@/helper/mensajes'
import type {
  EstadoCama,
  IBloqueo,
  ICama,
  IHabitacion,
  IReserva,
} from '../interfaces/alimentosHospedaje'
import { useAccionesAH, usePermisosAH, useReserva } from '../composables/useAlimentosHospedaje'
import { ESTADOS_RESERVA, ESTILO_ESTADO, MOTIVOS, PRESETS, TIPO_CAMA } from '../helpers/estados'
import { fechaCorta, fechaLarga } from '../helpers/fechas'

const props = defineProps<{
  cama: ICama
  habitacion: IHabitacion
  noche: string
  estado: EstadoCama
  reserva: IReserva | undefined
  bloqueo: IBloqueo | undefined
}>()
const emit = defineEmits<{ reservar: []; bloquear: [] }>()

const { puedeConsultar, puedeModificar } = usePermisosAH()
const { cambiarEstado, quitarBloqueo } = useAccionesAH()
const { reserva: detalle } = useReserva(() => props.reserva?.id ?? null)

const r = computed(() =>
  detalle.value && detalle.value.id === props.reserva?.id ? detalle.value : props.reserva,
)
const motivo = computed(() => MOTIVOS.find((m) => m.value === r.value?.motivo)?.label)
const alimentos = computed(
  () => PRESETS.find((p) => p.value === r.value?.presetAlimentos)?.label ?? 'Personalizado',
)

const accion = async (a: 'checkin' | 'checkout' | 'cancelar') => {
  if (!r.value) return
  let motivoCancelacion: string | undefined
  if (a === 'cancelar') {
    motivoCancelacion = (await observaciones('Motivo de la cancelación')) as string
    if (!motivoCancelacion) return
  } else {
    const ok = await pregunta(
      a === 'checkin' ? '¿Registrar llegada?' : '¿Registrar salida?',
      `${r.value.huespedNombre ?? ''} · ${r.value.folio ?? ''}`,
    )
    if (!ok) return
  }
  const res = await cambiarEstado
    .mutateAsync({ id: r.value.id, accion: a, motivo: motivoCancelacion })
    .catch(() => null)
  if (res)
    mensajeOk(
      a === 'checkin'
        ? 'Llegada registrada'
        : a === 'checkout'
          ? 'Salida registrada'
          : 'Reserva cancelada',
    )
}

const quitar = async () => {
  if (!props.bloqueo) return
  const ok = await pregunta('¿Quitar fuera de servicio?', props.bloqueo.motivo)
  if (!ok) return
  const res = await quitarBloqueo.mutateAsync(props.bloqueo.id).catch(() => null)
  if (res) mensajeOk('Cama disponible de nuevo')
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <div class="text-lg font-bold text-neutral-800 dark:text-zinc-100">
          {{
            habitacion.tipo === 'vip'
              ? habitacion.nombre
              : `${habitacion.nombre} · Cama ${cama.numero}`
          }}
        </div>
        <div class="text-sm text-neutral-500 dark:text-zinc-400">
          {{ TIPO_CAMA[cama.tipo] }} · Noche del {{ fechaLarga(noche) }}
        </div>
      </div>
      <div
        class="flex items-center gap-1.5 text-xs font-medium"
        :class="ESTILO_ESTADO[estado].texto"
      >
        <span class="w-2.5 h-2.5 rounded-full" :class="ESTILO_ESTADO[estado].dot"></span>
        {{ ESTILO_ESTADO[estado].label }}
      </div>
    </div>

    <div v-if="habitacion.amenidades.length" class="text-xs text-neutral-500 dark:text-zinc-400">
      {{ habitacion.amenidades.join(' · ') }}
    </div>
    <div v-if="habitacion.nota" class="text-xs text-amber-700 dark:text-amber-300">
      <i class="pi pi-info-circle text-xs" /> {{ habitacion.nota }}
    </div>

    <!-- Fuera de servicio -->
    <template v-if="bloqueo">
      <div class="text-sm">
        <b>Fuera de servicio:</b> {{ bloqueo.motivo }}<br />
        Noches del {{ fechaCorta(bloqueo.desde) }} al {{ fechaCorta(bloqueo.hasta) }}
        {{ bloqueo.camaId ? '' : '(toda la habitación)' }}
      </div>
      <v-button
        v-if="puedeModificar"
        class="self-start"
        label="Quitar fuera de servicio"
        icon="pi pi-replay"
        severity="secondary"
        outlined
        size="small"
        :loading="quitarBloqueo.isPending.value"
        @click="quitar"
      />
    </template>

    <!-- Reserva -->
    <template v-else-if="r">
      <div v-if="!puedeConsultar" class="text-sm text-neutral-600 dark:text-zinc-300">
        Cama {{ ESTILO_ESTADO[estado].label.toLowerCase() }} del {{ fechaCorta(r.entradaFecha) }} al
        {{ fechaCorta(r.salidaFecha) }}.
      </div>
      <template v-else>
        <div class="flex items-center gap-2">
          <span class="font-semibold">{{ r.folio }}</span>
          <v-tag
            :value="ESTADOS_RESERVA[r.estado].label"
            :severity="ESTADOS_RESERVA[r.estado].severity"
          />
          <v-tag v-if="r.excepcionLocal" value="Excepción local" severity="secondary" />
        </div>
        <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <span class="text-neutral-500 dark:text-zinc-400">Huésped</span>
          <span class="font-medium">{{ r.huespedNombre }} ({{ r.huespedNumero ?? 's/n' }})</span>
          <span class="text-neutral-500 dark:text-zinc-400">Sucursal</span
          ><span>{{ r.huespedSucursal }}</span>
          <span class="text-neutral-500 dark:text-zinc-400">Centro de costos</span>
          <span
            >{{ r.huespedCcClave }} {{ r.huespedCcNombre ? '· ' + r.huespedCcNombre : '' }}</span
          >
          <span class="text-neutral-500 dark:text-zinc-400">Cargo</span
          ><span>{{ r.huespedCargo || '—' }}</span>
          <span class="text-neutral-500 dark:text-zinc-400">Entrada</span>
          <span>{{ fechaLarga(r.entradaFecha) }}, {{ r.entradaHora }}</span>
          <span class="text-neutral-500 dark:text-zinc-400">Salida</span>
          <span>{{ fechaLarga(r.salidaFecha) }}, {{ r.salidaHora }}</span>
          <span class="text-neutral-500 dark:text-zinc-400">Motivo</span>
          <span>{{ motivo }}{{ r.detalleMotivo ? ' · ' + r.detalleMotivo : '' }}</span>
          <template v-if="r.grupo">
            <span class="text-neutral-500 dark:text-zinc-400">Grupo</span><span>{{ r.grupo }}</span>
          </template>
          <span class="text-neutral-500 dark:text-zinc-400">Alimentos</span>
          <span>{{ alimentos }} ({{ r.servicios?.length ?? 0 }} servicios)</span>
          <template v-if="r.notas">
            <span class="text-neutral-500 dark:text-zinc-400">Notas</span><span>{{ r.notas }}</span>
          </template>
        </div>
      </template>

      <div v-if="puedeModificar" class="flex flex-wrap gap-2">
        <v-button
          v-if="r.estado === 'RESERVADA'"
          label="Registrar llegada"
          icon="pi pi-sign-in"
          size="small"
          :loading="cambiarEstado.isPending.value"
          @click="accion('checkin')"
        />
        <v-button
          v-if="r.estado === 'EN_CASA'"
          label="Registrar salida"
          icon="pi pi-sign-out"
          size="small"
          :loading="cambiarEstado.isPending.value"
          @click="accion('checkout')"
        />
        <v-button
          v-if="r.estado === 'RESERVADA' || r.estado === 'EN_CASA'"
          label="Cancelar reserva"
          icon="pi pi-times"
          severity="danger"
          outlined
          size="small"
          @click="accion('cancelar')"
        />
      </div>
    </template>

    <!-- Libre -->
    <template v-else-if="estado === 'DISPONIBLE'">
      <div class="text-sm text-neutral-600 dark:text-zinc-300">Cama libre esta noche.</div>
      <div v-if="puedeModificar" class="flex flex-wrap gap-2">
        <v-button label="Reservar" icon="pi pi-plus" size="small" @click="emit('reservar')" />
        <v-button
          label="Fuera de servicio"
          icon="pi pi-ban"
          severity="secondary"
          outlined
          size="small"
          @click="emit('bloquear')"
        />
      </div>
    </template>
  </div>
</template>
