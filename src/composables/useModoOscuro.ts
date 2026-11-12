import { ref, watch } from 'vue'

// Modo oscuro solo de la interfaz. Los PDF (DC-3, certificados) no se ven afectados.
const CLAVE = 'mi-portal-modo-oscuro'
const CLASE = 'app-dark'

const leerPreferencia = (): boolean => {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'si') return true
    if (guardado === 'no') return false
  } catch {
    /* sin acceso a localStorage */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

const oscuro = ref<boolean>(leerPreferencia())

const aplicar = (valor: boolean) => {
  document.documentElement.classList.toggle(CLASE, valor)
}

aplicar(oscuro.value)

watch(oscuro, (valor) => {
  aplicar(valor)
  try {
    localStorage.setItem(CLAVE, valor ? 'si' : 'no')
  } catch {
    /* sin acceso a localStorage */
  }
})

const useModoOscuro = () => {
  const alternar = () => {
    oscuro.value = !oscuro.value
  }
  return { oscuro, alternar }
}

export default useModoOscuro
