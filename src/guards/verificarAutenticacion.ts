import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { verificarEmpleado } from './verificarEmpleado'
import { verificarPermiso } from './verificarPermiso'
import { nombreEmpleado } from './nombreEmpleado'
import { debeCambiarPassword } from '@/components/miCuenta/helpers'

export const verificarAutenticacion = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const isAutenticated = await verificarEmpleado()
  const authStore = useAuthStore()

  // Punto 10: con contraseña asignada por el Administrador, solo puede ir a cambiarla
  if (isAutenticated && debeCambiarPassword() && to.name !== 'cambiar-password') {
    authStore.setAutenticado(true)
    return next('/cambiar-password')
  }

  if (to.matched.some((record) => record.meta.ruta_permitida)) {
    const permiso = to.meta.ruta_permitida as string
    if (verificarPermiso(permiso)) {
      next()
    } else {
      next('/unauthorized')
    }
  } else {
    if (!isAutenticated && to.name !== 'auth') {
      // QR de Caseta sin sesion: se guarda el codigo para volver a Mi hospedaje despues de entrar
      if (to.path === '/mi-hospedaje' && typeof to.query.caseta === 'string')
        sessionStorage.setItem('ah-caseta', to.query.caseta)
      next('/')
    } else if (isAutenticated && to.name === 'auth') {
      next('/home')
    } else {
      next()
    }
  }

  if (isAutenticated) {
    authStore.setAutenticado(true)
    const empleado = await nombreEmpleado()
    authStore.setNombreEmpleado(empleado)
  } else {
    authStore.setAutenticado(false)
  }
}
