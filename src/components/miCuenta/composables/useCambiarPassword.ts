import { useMutation } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed } from 'vue'
import type { IErrors } from '@/interfaces/errors'
import { mensajeError, mensajeOk } from '@/helper/mensajes'
import router from '@/router'
import { timer } from '@/helper/timer'
import { cambiarPassword } from '../services/miCuenta'
import { marcarPasswordCambiada } from '../helpers'

const useCambiarPassword = () => {
  const mutation = useMutation({
    mutationKey: ['cambiarPassword'],
    mutationFn: cambiarPassword,
    onSuccess: async (payload: string) => {
      marcarPasswordCambiada()
      mensajeOk(payload)
      await timer()
      router.push('/home')
    },
    onError: (error: AxiosError) => {
      const data = error.response?.data as IErrors
      mensajeError(data?.errors?.[0]?.message ?? 'No se pudo cambiar la contraseña.')
    },
  })

  return {
    isPending: computed(() => mutation.isPending.value),
    mutation,
  }
}

export default useCambiarPassword
