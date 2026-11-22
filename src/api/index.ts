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

// Punto 11 (P1): al abrir un Empleado, Clase o Curso se guarda su versión; al guardarlo se manda de regreso
// para que el servidor avise si otra persona lo cambió mientras se editaba.
const versiones = new Map<string, string>()
const claveRegistro = (url = '', datos?: unknown) => {
  const m = url.match(/^\/(empleado|clase|curso)(?:\/(\d+))?$/)
  if (!m) return null
  const id =
    m[2] ??
    (datos instanceof FormData ? datos.get('id') : (datos as { id?: unknown } | undefined)?.id)
  return id ? `${m[1]}:${id}` : null
}

api_mi_portal.interceptors.request.use((config) => {
  if (config.method === 'put') {
    const clave = claveRegistro(config.url, config.data)
    const version = clave ? versiones.get(clave) : undefined
    if (version) config.headers.set('X-Version-Registro', version)
  }
  return config
})

api_mi_portal.interceptors.response.use(
  function (response) {
    const clave = claveRegistro(response.config.url)
    if (clave && response.config.method === 'get') {
      const version = response.headers['x-version-registro']
      if (version) versiones.set(clave, String(version))
    } else if (clave && response.config.method === 'put') {
      versiones.delete(clave)
    }
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
