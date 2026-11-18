import { computed, ref, watch } from 'vue'
import type { IArchivoClase } from '../interfaces/archivo_clase'
import { useQuery } from '@tanstack/vue-query'
import { getArchivosClase } from '../services/clase'

const useArchivosClase = (id: number) => {
  const archivosClase = ref<IArchivoClase[]>([])

  const { data, isLoading } = useQuery({
    // Con el id: antes se mostraba por un momento la lista de otra clase
    queryKey: ['getArchivosClase', id],
    queryFn: () => getArchivosClase(id),
  })

  watch(data, (payload) => {
    if (payload) {
      archivosClase.value = payload
    }
  })

  return {
    archivosClase,
    isLoading: computed(() => isLoading.value),
  }
}

export default useArchivosClase
