import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { apiUrl } from '.'

/** Encabezado con la sesión: las firmas y evidencias de /archivos ya no se abren sin iniciar sesión. */
export const encabezadoSesion = (): Record<string, string> => {
  try {
    const token = JSON.parse(localStorage.getItem('empleado') ?? 'null')?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

/** URL local (blob) de un archivo protegido, para mostrarlo en un <img>. */
export const useArchivoProtegido = (nombre: Ref<string | null | undefined>) => {
  const url = ref<string | null>(null)
  const liberar = () => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
  }
  watch(
    nombre,
    async (n) => {
      liberar()
      if (!n) return
      try {
        const r = await fetch(`${apiUrl}/archivos/${encodeURIComponent(n)}`, {
          headers: encabezadoSesion(),
        })
        if (r.ok) url.value = URL.createObjectURL(await r.blob())
      } catch {
        url.value = null
      }
    },
    { immediate: true },
  )
  onBeforeUnmount(liberar)
  return url
}
