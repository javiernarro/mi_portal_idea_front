import axios from 'axios'
import Swal from 'sweetalert2'

export const apiUrl = import.meta.env.VITE_API_URL

// Punto 12: la sesión viaja en una cookie HttpOnly que pone el servidor (JavaScript no la puede leer);
// ya no se guarda ni se envía un token desde el navegador.
export const api_mi_portal = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

/** La sesión se cerró en el servidor (inactividad, otro dispositivo, etc.): se avisa y vuelve al inicio. */
export const sesionCerrada = (mensaje?: string) => {
  const habia = localStorage.getItem('empleado') !== null
  localStorage.removeItem('empleado')
  if (!habia || window.location.pathname === '/') return
  Swal.fire({
    icon: 'info',
    title: 'Sesión cerrada',
    text: mensaje || 'Tu sesión se cerró. Inicia sesión de nuevo.',
  }).then(() => window.location.assign('/'))
}

api_mi_portal.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    console.log(error)
    if (error.response?.status === 401 && error.response.data?.name === 'SesionCerrada') {
      sesionCerrada(error.response.data?.mensaje)
      return Promise.reject(error)
    }
    // Punto 10: el servidor pide cambiar la contraseña antes de continuar
    if (error.response?.status === 403 && error.response.data?.name === 'CambioPassword') {
      if (window.location.pathname !== '/cambiar-password')
        window.location.assign('/cambiar-password')
      return Promise.reject(error)
    }
    if (error.response?.status === 403) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: error.response.data.mensaje,
      })
    } else {
      return Promise.reject(error)
    }
  },
)
