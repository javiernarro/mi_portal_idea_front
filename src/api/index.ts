import axios from 'axios'
import Swal from 'sweetalert2'

export const apiUrl = import.meta.env.VITE_API_URL

export const api_mi_portal = axios.create({
  baseURL: apiUrl,
})

api_mi_portal.interceptors.request.use(
  (config) => {
    const data = JSON.parse(localStorage.getItem('empleado')!)

    if (data?.token) {
      config.headers.Authorization = `Bearer ${data.token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api_mi_portal.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    console.log(error)
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
