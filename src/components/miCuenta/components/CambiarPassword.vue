<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate'
import useCambiarPassword from '../composables/useCambiarPassword'
import { debeCambiarPassword, medidorPassword, schemaCambiarPassword } from '../helpers'
import type { ICambiarPassword } from '../services/miCuenta'

const { mutation, isPending } = useCambiarPassword()
const obligatorio = debeCambiarPassword()

const { handleSubmit } = useForm<ICambiarPassword>({
  initialValues: {},
  validationSchema: schemaCambiarPassword,
})

const submit = handleSubmit((values) => mutation.mutate(values))
</script>

<template>
  <div class="flex justify-center p-3">
    <v-card :style="{ 'min-width': 'min(480px, 100%)' }">
      <template #content>
        <div class="flex justify-center flex-col items-center mb-3 mt-3 gap-2">
          <h4 class="text-[24px]! text-black dark:text-zinc-100">Cambiar contraseña</h4>
          <p v-if="obligatorio" class="text-center">
            Por seguridad, debes cambiar la contraseña que te asignaron antes de continuar.
          </p>
          <p class="text-center text-sm">
            Mínimo 10 caracteres, con mayúscula, minúscula y número. No uses la palabra Komatsu, tu
            nombre, número de empleado, CURP ni RFC, ni tus últimas 3 contraseñas.
          </p>
        </div>

        <form @submit="submit" class="grid grid-cols-1 gap-3">
          <Field name="actual" v-slot="{ field, meta, errors }">
            <div>
              <label for="actual">Contraseña actual</label>
              <v-password
                fluid
                :feedback="false"
                :modelValue="field.value"
                @update:modelValue="field.onChange"
                :invalid="meta.touched && errors.length > 0"
                toggleMask
              />
              <ErrorMessage name="actual" class="text-red-500" />
            </div>
          </Field>

          <Field name="nueva" v-slot="{ field, meta, errors }">
            <div>
              <label for="nueva">Nueva contraseña</label>
              <v-password
                fluid
                v-bind="medidorPassword"
                :modelValue="field.value"
                @update:modelValue="field.onChange"
                :invalid="meta.touched && errors.length > 0"
                toggleMask
              />
              <ErrorMessage name="nueva" class="text-red-500" />
            </div>
          </Field>

          <Field name="verificar" v-slot="{ field, meta, errors }">
            <div>
              <label for="verificar">Verificar nueva contraseña</label>
              <v-password
                fluid
                :feedback="false"
                :modelValue="field.value"
                @update:modelValue="field.onChange"
                :invalid="meta.touched && errors.length > 0"
                toggleMask
              />
              <ErrorMessage name="verificar" class="text-red-500" />
            </div>
          </Field>

          <v-button
            type="submit"
            :label="'Guardar'"
            class="bg-[#283d98]! border-[#283d98]! hover:bg-[#3d54b9]! hover:border-[#3d54b9]"
            :loading="isPending"
          />
        </form>
      </template>
    </v-card>
  </div>
</template>
