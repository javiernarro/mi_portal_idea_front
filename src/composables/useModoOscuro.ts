import { ref, watch } from 'vue'

// Modo oscuro solo de la interfaz. Los PDF (DC-3, certificados) no se ven afectados.
//
// Reglas:
// - Predeterminado: CLARO (primera vez, otro usuario, incognito o sin sesion).
//   No se copia el tema del sistema operativo ni del navegador.
// - La preferencia se guarda en ESTE navegador y POR USUARIO (no en la base de datos).
// - Al iniciar sesion se aplica la preferencia de ese usuario; al salir vuelve a claro.
const PREFIJO = 'mi-portal-tema:'
const CLAVE_ANTERIOR = 'mi-portal-modo-oscuro' // version previa (global, sin usuario)
const CLASE = 'app-dark'

const idUsuarioActual = (): string | null => {
  try {
    const guardado = localStorage.getItem('empleado')
    if (!guardado) return null
    const id = JSON.parse(guardado)?.data?.id
    return id === undefined || id === null ? null : String(id)
  } catch {
    return null
  }
}

const leerPreferencia = (idUsuario: string | null): boolean => {
  if (!idUsuario) return false
  try {
    return localStorage.getItem(PREFIJO + idUsuario) === 'oscuro'
  } catch {
    return false
  }
}

const guardarPreferencia = (idUsuario: string | null, valor: boolean) => {
  if (!idUsuario) return
  try {
    localStorage.setItem(PREFIJO + idUsuario, valor ? 'oscuro' : 'claro')
  } catch {
    /* sin acceso a localStorage: el tema solo dura mientras la pagina este abierta */
  }
}

try {
  localStorage.removeItem(CLAVE_ANTERIOR)
} catch {
  /* sin acceso a localStorage */
}

const oscuro = ref<boolean>(leerPreferencia(idUsuarioActual()))

const aplicar = (valor: boolean) => {
  document.documentElement.classList.toggle(CLASE, valor)
}

aplicar(oscuro.value)
watch(oscuro, aplicar)

/** Al iniciar sesion: aplica la preferencia guardada de ese usuario (o claro si no tiene). */
export const aplicarTemaDelUsuario = () => {
  oscuro.value = leerPreferencia(idUsuarioActual())
}

/** Al cerrar sesion: vuelve a claro sin borrar la preferencia del usuario. */
export const restablecerTemaClaro = () => {
  oscuro.value = false
}

const useModoOscuro = () => {
  const alternar = () => {
    oscuro.value = !oscuro.value
    guardarPreferencia(idUsuarioActual(), oscuro.value)
  }
  return { oscuro, alternar }
}

export default useModoOscuro
