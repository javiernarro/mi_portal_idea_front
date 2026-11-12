import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { getFichaReCat, getFichasReCat, getTecnicosReCat } from '../services/recat'
import { mensajeError } from '@/helper/mensajes'
import usePdfReCat from './usePdfReCat'

const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()

export const useTecnicosReCat = () => {
  const texto = ref('')
  const sucursal = ref<string | null>(null)
  const categoria = ref<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['getTecnicosReCat'],
    queryFn: getTecnicosReCat,
  })

  const tecnicos = computed(() => data.value ?? [])

  const sucursales = computed(() =>
    [...new Set(tecnicos.value.map((t) => t.sucursal).filter((s) => s))].sort(),
  )

  // Filtros combinables: texto (nombre o número) + sucursal + categoría
  const filtrados = computed(() => {
    const partes = sinAcentos(texto.value).split(' ').filter(Boolean)
    return tecnicos.value.filter((t) => {
      if (sucursal.value && t.sucursal !== sucursal.value) return false
      if (categoria.value && t.categoria !== categoria.value) return false
      if (partes.length) {
        const nombre = sinAcentos(t.nombre)
        const coincide = partes.every((p) => nombre.includes(p) || t.numero.includes(p))
        if (!coincide) return false
      }
      return true
    })
  })

  const limpiar = () => {
    texto.value = ''
    sucursal.value = null
    categoria.value = null
  }

  return {
    tecnicos,
    filtrados,
    sucursales,
    texto,
    sucursal,
    categoria,
    limpiar,
    isLoading: computed(() => isLoading.value),
  }
}

export const useFichaReCat = (empleadoId: () => number | null) => {
  const { data, isLoading } = useQuery({
    queryKey: ['getFichaReCat', computed(empleadoId)],
    queryFn: () => getFichaReCat(empleadoId()!),
    enabled: () => empleadoId() !== null,
  })
  return { ficha: data, isLoading: computed(() => isLoading.value) }
}

export const useDescargaReCat = () => {
  const descargando = ref(false)
  const { descargarFichas } = usePdfReCat()

  const descargar = async (ids: number[]) => {
    if (!ids.length) return
    descargando.value = true
    try {
      const fichas = await getFichasReCat(ids)
      descargarFichas(fichas)
    } catch {
      mensajeError('No se pudieron descargar las fichas')
    } finally {
      descargando.value = false
    }
  }

  return { descargar, descargando }
}
