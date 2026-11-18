import * as yup from 'yup'

// Punto 10: las mismas reglas que revisa el servidor (el servidor además revisa datos personales e historial)
export const LARGO_MINIMO = 10
export const reglaPassword = yup
  .string()
  .nullable()
  .required('El campo es requerido.')
  .min(LARGO_MINIMO, `Debe tener al menos ${LARGO_MINIMO} caracteres.`)
  .matches(/[A-ZÁÉÍÓÚÑ]/, 'Debe tener al menos una mayúscula.')
  .matches(/[a-záéíóúñ]/, 'Debe tener al menos una minúscula.')
  .matches(/[0-9]/, 'Debe tener al menos un número.')
  .test('sin-komatsu', 'No puede contener la palabra "Komatsu".', (v) => !/komatsu/i.test(v ?? ''))

// Medidor de seguridad: "fuerte" solo cuando cumple las reglas del portal
export const medidorPassword = {
  promptLabel: 'Escribe una contraseña',
  weakLabel: 'Débil',
  mediumLabel: 'Regular',
  strongLabel: 'Fuerte',
  mediumRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$',
  strongRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{10,}$',
}

export const schemaCambiarPassword = yup.object({
  actual: yup.string().nullable().required('El campo es requerido.'),
  nueva: reglaPassword,
  verificar: yup
    .string()
    .nullable()
    .required('El campo es requerido.')
    .oneOf([yup.ref('nueva')], 'Las contraseñas no coinciden.'),
})

/** true si el inicio de sesión indicó que debe cambiar la contraseña antes de continuar. */
export const debeCambiarPassword = () => {
  try {
    return !!JSON.parse(localStorage.getItem('empleado') ?? 'null')?.debeCambiarPassword
  } catch {
    return false
  }
}

export const marcarPasswordCambiada = () => {
  try {
    const e = JSON.parse(localStorage.getItem('empleado') ?? 'null')
    if (e) localStorage.setItem('empleado', JSON.stringify({ ...e, debeCambiarPassword: false }))
  } catch {
    /* sin sesión guardada */
  }
}
