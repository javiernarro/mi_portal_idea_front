import * as yup from 'yup'
import { reglaPassword } from '@/components/miCuenta/helpers'

export const schema = yup.object({
  usuario: yup.string().default('').required('El usuario es requerido.'),
  password: yup.string().default('').required('La contraseña es requerida.'),
})

export const schemaOlvidada = yup.object({
  email: yup
    .string()
    .email('Ingresa un email valido')
    .nullable()
    .required('El campo es requerido.'),
})

// Punto 10: mismas reglas que el servidor y las dos contraseñas deben coincidir
export const schemaRecuperar = yup.object({
  password: reglaPassword,
  verificarPassword: yup
    .string()
    .nullable()
    .required('El campo es requerido.')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden.'),
})
