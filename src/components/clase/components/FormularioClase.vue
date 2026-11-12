<script setup lang="ts">
import useAreasTematicasPorNombre from '@/components/areaTematica/composables/useAreasTematicasPorNombre'
import type { IAreaTematica } from '@/components/areaTematica/interfaces/area_tematica'
import useCursosPorNombre from '@/components/curso/composables/useCursosPorNombre'
import type { ICurso } from '@/components/curso/interfaces/curso'
import BusquedaEmpleados from '@/components/empleado/components/BusquedaEmpleados.vue'
import type { IEmpleado } from '@/components/empleado/interfaces/empleado'
import useEmpresasPorNombre from '@/components/empresa/composables/useEmpresasPorNombre'
import type { IEmpresa } from '@/components/empresa/interfaces/empresa'
import useModelosPorNombre from '@/components/modelo/composables/useModelosPorNombre'
import useOcupacionesPorNombre from '@/components/ocupacion/composables/useOcupacionesPorNombre'
import type { IOcupacion } from '@/components/ocupacion/interfaces/ocupacion'
import useOrdenes from '@/components/orden/composables/useOrdenes'
import useUbicaciones from '@/components/ubicacion/composables/useUbicaciones'
import useDatos from '@/composables/useDatos'
import { formatearNombre } from '@/helper/formatearNombre'
import { parseLocalDate } from '@/helper/parseLocalDate'
import moment from 'moment'
import { ErrorMessage, Field, useForm } from 'vee-validate'
import { computed, onMounted, watch } from 'vue'
import { schema } from '../helpers/schema'
import type { IClase } from '../interfaces/clase'
import type { Props } from '../interfaces/props'

const { clase, guardar } = defineProps<Props>()
const { empresas, buscarEmpresa } = useEmpresasPorNombre()
const { tipoClase, tipoCurso, tieneOrden } = useDatos()
const { ubicaciones } = useUbicaciones()
const { cursos, buscarCurso } = useCursosPorNombre()
const { ocupaciones, buscarOcupacion } = useOcupacionesPorNombre()
const { areasTematicas, buscarAreaTematica } = useAreasTematicasPorNombre()
const { ordenes, estatus } = useOrdenes()
const { modelos, buscarModelo } = useModelosPorNombre()

estatus.value = clase?.estatus === undefined ? 'Liberada' : 'Cerrada'

// Normaliza cualquier valor de hora a "HH:mm" (acepta Date, "H:mm", "HH:mm:ss" y formatos de moment)
const normalizarHora = (valor: unknown, horasExtra = 0): string => {
  if (!valor) return moment().add(horasExtra, 'hour').format('HH:mm')
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return moment().add(horasExtra, 'hour').format('HH:mm')
    const h = String(valor.getHours()).padStart(2, '0')
    const m = String(valor.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  if (typeof valor === 'string') {
    const texto = valor.trim()
    if (/^\d{1,2}:\d{2}$/.test(texto)) {
      const partes = texto.split(':')
      return `${partes[0]!.padStart(2, '0')}:${partes[1]}`
    }
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(texto)) {
      const partes = texto.split(':')
      return `${partes[0]!.padStart(2, '0')}:${partes[1]}`
    }
  }
  const fecha = moment(valor as string, [
    'HH:mm',
    'HH:mm:ss',
    'h:mm A',
    'h:mm a',
    'hh:mm A',
    'hh:mm a',
    'YYYY-MM-DD HH:mm:ss',
    moment.ISO_8601,
  ])
  return fecha.isValid() ? fecha.format('HH:mm') : moment().add(horasExtra, 'hour').format('HH:mm')
}

// Normaliza cualquier valor de fecha a "YYYY-MM-DD"
const normalizarFecha = (valor: unknown): string => {
  if (!valor) return moment().format('YYYY-MM-DD')
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return moment().format('YYYY-MM-DD')
    const y = valor.getFullYear()
    const m = String(valor.getMonth() + 1).padStart(2, '0')
    const d = String(valor.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const texto = String(valor).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  const fecha = moment(texto, ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY/MM/DD', moment.ISO_8601])
  return fecha.isValid() ? fecha.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
}

const initialValues = computed(() => {
  return clase
    ? {
        ...schema.getDefault(),
        ...clase,
        fechaInicio: parseLocalDate(clase.fechaInicio),
        horaInicio: normalizarHora(clase.horaInicio, 1),
        fechaFinalizacion: parseLocalDate(clase.fechaFinalizacion),
        horaFinalizacion: normalizarHora(clase.horaFinalizacion, 2),
        cursoId: clase.cursoId,
        representanteEmpresaId: clase.representanteEmpresaId,
        representanteEmpleadosId: clase.representanteEmpleadosId,
      }
    : {
        ...schema.getDefault(),
        fechaInicio: new Date(),
        horaInicio: moment().add(1, 'hour').format('HH:mm'),
        fechaFinalizacion: new Date(),
        horaFinalizacion: moment().add(2, 'hour').format('HH:mm'),
        instructores: [],
        alumnos: [],
      }
})

const { handleSubmit, values, setFieldValue } = useForm<IClase>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues: initialValues.value as any,
  validationSchema: schema,
})

const horaAMinutos = (valor: unknown): number | null => {
  if (!valor) return null
  if (valor instanceof Date) return valor.getHours() * 60 + valor.getMinutes()
  const partes = String(valor).trim().split(':')
  if (partes.length >= 2) {
    const h = parseInt(partes[0]!, 10)
    const m = parseInt(partes[1]!, 10)
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m
  }
  return null
}

// Duración = días de la clase × horas por día
const calcularDuracion = () => {
  if (!values.fechaInicio || !values.horaInicio || !values.fechaFinalizacion || !values.horaFinalizacion)
    return
  const inicio = moment(values.fechaInicio).startOf('day')
  const dias = moment(values.fechaFinalizacion).startOf('day').diff(inicio, 'days') + 1
  if (dias <= 0) {
    setFieldValue('duracion', '0h 0m')
    return
  }
  const minInicio = horaAMinutos(values.horaInicio)
  const minFin = horaAMinutos(values.horaFinalizacion)
  if (minInicio === null || minFin === null) return
  const minutosPorDia = minFin - minInicio
  if (minutosPorDia <= 0) {
    setFieldValue('duracion', '0h 0m')
    return
  }
  const total = dias * minutosPorDia
  const horas = Math.floor(total / 60)
  const minutos = total % 60
  setFieldValue('duracion', `${horas}h ${minutos}m`)
}

watch(
  [
    () => values.fechaInicio,
    () => values.horaInicio,
    () => values.fechaFinalizacion,
    () => values.horaFinalizacion,
  ],
  () => {
    calcularDuracion()
  },
  { deep: true },
)

const seleccionarRepresentanteEmpresa = (empleado: IEmpleado) => {
  setFieldValue('representanteEmpresaId', empleado.id)
}

const seleccionarRepresentanteEmpleados = (empleado: IEmpleado) => {
  setFieldValue('representanteEmpleadosId', empleado.id)
}

const submit = handleSubmit((values: IClase) => {
  const datos = {
    ...values,
    fechaInicio: normalizarFecha(values.fechaInicio),
    fechaFinalizacion: normalizarFecha(values.fechaFinalizacion),
    horaInicio: normalizarHora(values.horaInicio, 1),
    horaFinalizacion: normalizarHora(values.horaFinalizacion, 2),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guardar?.(datos as any)
})

onMounted(() => {
  calcularDuracion()
})
</script>

<template>
  <form
    @submit="submit"
    :initial-values="initialValues"
    :validation-schema="schema"
    class="grid grid-cols-1 gap-3"
  >
    <Field name="tieneOrden" v-slot="{ field, meta, errors }">
      <div>
        <label for="tieneOrden">Tiene orden de trabajo</label>
        <v-select
          fluid
          optionLabel="item"
          optionValue="value"
          :options="tieneOrden"
          :modelValue="field.value"
          @update:modelValue="field.onChange"
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="tieneOrden" class="text-red-500" />
      </div>
    </Field>

    <Field name="ordenId" v-slot="{ field, meta, errors }" v-if="values.tieneOrden">
      <div>
        <label for="ordenId">Orden</label>
        <v-select
          fluid
          filter
          :options="ordenes"
          :modelValue="field.value"
          optionLabel="referencia"
          optionValue="id"
          @update:modelValue="field.onChange"
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="ordenId" class="text-red-500" />
      </div>
    </Field>

    <Field name="empresaId" v-slot="{ meta, errors }">
      <div>
        <label for="empresaId">Empresa</label>
        <v-autocomplete
          fluid
          :modelValue="clase?.empresa?.razonSocial"
          :suggestions="empresas"
          @complete="buscarEmpresa"
          optionLabel="razonSocial"
          @update:modelValue="
            (empresa: IEmpresa) => {
              if (typeof empresa === 'object') {
                setFieldValue('empresaId', empresa.id)
              }
            }
          "
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="empresaId" class="text-red-500" />
      </div>
    </Field>

    <div class="grid grid-cols-2 gap-3">
      <Field name="fechaInicio" v-slot="{ field, meta, errors }">
        <div>
          <label for="fechaInicio">Fecha de inicio</label>
          <v-datepicker
            fluid
            showIcon
            dateFormat="dd/mm/yy"
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            v-on:value-change="calcularDuracion"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <!-- :minDate="values.fechaInicio" -->
          <ErrorMessage name="fechaInicio" class="text-red-500" />
        </div>
      </Field>

      <Field name="horaInicio" v-slot="{ field, meta, errors }">
        <div>
          <label for="horaInicio">Hora de inicio</label>
          <v-inputtext
            id="horaInicio"
            type="time"
            fluid
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="horaInicio" class="text-red-500" />
        </div>
      </Field>

      <Field name="fechaFinalizacion" v-slot="{ field, meta, errors }">
        <div>
          <label for="fechaFinalizacion">Fecha de finalizacion</label>
          <v-datepicker
            id="fechaFinalizacion"
            fluid
            showIcon
            dateFormat="dd/mm/yy"
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            v-on:value-change="calcularDuracion"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <!-- :minDate="values.fechaInicio" -->
          <ErrorMessage name="fechaFinalizacion" class="text-red-500" />
        </div>
      </Field>

      <Field name="horaFinalizacion" v-slot="{ field, meta, errors }">
        <div>
          <label for="horaFinalizacion">Hora de finalización</label>
          <v-inputtext
            id="horaFinalizacion"
            type="time"
            fluid
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="horaFinalizacion" class="text-red-500" />
        </div>
      </Field>

      <Field name="duracion" v-slot="{ field, meta, errors }">
        <div class="col-span-2">
          <label for="duracion">Duracion</label>
          <v-inputtext
            fluid
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="true"
          />
          <ErrorMessage name="duracion" class="text-red-500" />
        </div>
      </Field>
    </div>

    <Field name="tipo_clase" v-slot="{ field, meta, errors }">
      <div>
        <label for="tipo_clase">Tipo de clase</label>
        <v-select
          fluid
          optionLabel="item"
          optionValue="value"
          :options="tipoClase"
          :modelValue="field.value"
          @update:modelValue="field.onChange"
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="tipo_clase" class="text-red-500" />
      </div>
    </Field>

    <Field name="tipo_curso" v-slot="{ field, meta, errors }">
      <div>
        <label for="tipo_curso">Tipo de curso</label>
        <v-select
          fluid
          optionLabel="item"
          optionValue="value"
          :options="tipoCurso"
          :modelValue="field.value"
          @update:modelValue="field.onChange"
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="tipo_curso" class="text-red-500" />
      </div>
    </Field>

    <!-- numero de alumnos -->
    <div class="grid grid-cols-2 gap-3">
      <Field name="minimoAlumnos" v-slot="{ field, meta, errors }">
        <div>
          <label for="minimoAlumnos">Minimo alumnos</label>
          <v-inputtext
            fluid
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="minimoAlumnos" class="text-red-500" />
        </div>
      </Field>

      <Field name="maximoAlumnos" v-slot="{ field, meta, errors }">
        <div>
          <label for="maximoAlumnos">Maximo de alumnos</label>
          <v-inputtext
            fluid
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="maximoAlumnos" class="text-red-500" />
        </div>
      </Field>
    </div>
    <!-- numero de alumnos -->

    <div class="grid grid-cols-2 gap-3">
      <Field name="cursoId" v-slot="{ meta, errors }">
        <div>
          <label for="cursoId">Curso</label>
          <v-autocomplete
            fluid
            :modelValue="clase?.curso.nombre"
            :suggestions="cursos"
            @complete="buscarCurso"
            optionLabel="nombre"
            @update:modelValue="
              (curso: ICurso) => {
                if (typeof curso === 'object') {
                  setFieldValue('cursoId', curso.id)
                }
              }
            "
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="cursoId" class="text-red-500" />
        </div>
      </Field>
      <Field name="modeloId" v-slot="{ meta, errors }">
        <div>
          <label for="modeloId">Modelo</label>
          <v-autocomplete
            fluid
            :modelValue="clase?.modelo?.nombre"
            :suggestions="modelos"
            @complete="buscarModelo"
            optionLabel="nombre"
            @update:modelValue="
              (curso: ICurso) => {
                if (typeof curso === 'object') {
                  setFieldValue('modeloId', curso.id)
                }
              }
            "
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="modeloId" class="text-red-500" />
        </div>
      </Field>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <Field name="ubicacionId" v-slot="{ field, meta, errors }">
        <div>
          <label for="ubicacionId">Ubicacion</label>
          <v-select
            fluid
            :options="ubicaciones"
            optionLabel="nombre"
            optionValue="id"
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="ubicacionId" class="text-red-500" />
        </div>
      </Field>

      <Field name="sala" v-slot="{ field, meta, errors }">
        <div>
          <label for="sala">Sala</label>
          <v-inputtext
            fluid
            :modelValue="field.value"
            @update:modelValue="field.onChange"
            :invalid="meta.touched && errors.length > 0"
            :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          />
          <ErrorMessage name="sala" class="text-red-500" />
        </div>
      </Field>
    </div>

    <!-- <TablaRequerimientosCurso :requerimientosCurso="clase?.curso!.requerimientosCursos!" /> -->

    <Field name="ocupacionId" v-slot="{ meta, errors }">
      <div>
        <label for="ocupacionId">Ocupacion especifica</label>
        <v-autocomplete
          fluid
          :modelValue="clase?.ocupacion.nombre"
          :suggestions="ocupaciones"
          @complete="buscarOcupacion"
          optionLabel="nombre"
          @update:modelValue="
            (ocupacion: IOcupacion) => {
              if (typeof ocupacion === 'object') {
                setFieldValue('ocupacionId', ocupacion.id)
              }
            }
          "
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="ocupacionId" class="text-red-500" />
      </div>
    </Field>

    <Field name="areaTematicaId" v-slot="{ meta, errors }">
      <div>
        <label for="areaTematicaId">Area tematica</label>
        <v-autocomplete
          fluid
          :modelValue="clase?.areaTematica.nombre"
          :suggestions="areasTematicas"
          @complete="buscarAreaTematica"
          optionLabel="nombre"
          @update:modelValue="
            (areaTematica: IAreaTematica) => {
              if (typeof areaTematica === 'object') {
                setFieldValue('areaTematicaId', areaTematica.id)
              }
            }
          "
          :invalid="meta.touched && errors.length > 0"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
        />
        <ErrorMessage name="areaTematicaId" class="text-red-500" />
      </div>
    </Field>

    <Field name="representanteEmpresaId" v-slot="{ meta, errors }">
      <div>
        <label for="representanteEmpresaId">Representante empresa</label>
        <BusquedaEmpleados
          :nombre="formatearNombre(clase?.representanteEmpresa!)"
          :seleccionar-empleado="seleccionarRepresentanteEmpresa"
          :boton="false"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          :invalid="meta.touched && errors.length > 0"
        />
        <ErrorMessage name="representanteEmpresaId" class="text-red-500" />
      </div>
    </Field>

    <Field name="representanteEmpleadosId" v-slot="{ meta, errors }">
      <div>
        <label for="representanteEmpleadosId">Representante trabajadores</label>
        <BusquedaEmpleados
          :nombre="formatearNombre(clase?.representanteEmpleados!)"
          :seleccionar-empleado="seleccionarRepresentanteEmpleados"
          :boton="false"
          :disabled="clase?.estatus === 'en curso' || clase?.estatus === 'finalizada'"
          :invalid="meta.touched && errors.length > 0"
        />
        <ErrorMessage name="representanteEmpleadosId" class="text-red-500" />
      </div>
    </Field>

    <div class="flex justify-end gap-3">
      <v-button
        icon="pi pi-times"
        label="Cancelar"
        severity="danger"
        size="small"
        text
        @click="cancelar"
      />

      <v-button
        icon="pi pi-save"
        label="Guardar"
        size="small"
        type="submit"
        :loading="pendiente"
        v-if="(clase?.estatus === 'pendiente' || clase?.estatus === undefined) && ver === false"
      />
    </div>
  </form>
</template>

<style scoped></style>
