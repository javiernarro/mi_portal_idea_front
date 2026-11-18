import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { apiUrl } from '.'

/** Punto 12: la cookie de sesión se envía sola; esto solo deja claro que la petición va con la sesión. */
export const conSesion: RequestInit = { credentials: 'include' }

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
        const r = await fetch(`${apiUrl}/archivos/${encodeURIComponent(n)}`, conSesion)
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
