import { getCertificadosPdf } from '../services/pdf'
import { useMutation } from '@tanstack/vue-query'
import type { IClaseEmpleado } from '@/components/clase/interfaces/clase_empleado'
import { zipSync } from 'fflate'
import moment from 'moment'
import usePdf from './usePdf'

// Caracteres que Windows no acepta en nombres de archivo (y "/" que crearía carpetas dentro del .zip)
const limpiarNombre = (nombre: string) =>
  nombre
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

/** Descarga un archivo armado en el navegador (no pasa por el servidor). */
const guardarArchivo = (bytes: Uint8Array, nombre: string, tipo: string) => {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * "Descargar todo" de DC-3:
 * - 1 seleccionado: se descarga directo el .pdf.
 * - 2 o más: un solo .zip con un PDF por curso (el navegador pregunta dónde guardar una sola vez).
 * El servidor solo entrega los datos (revisa permisos y cuenta las descargas); los PDF y el .zip se arman aquí.
 */
const usePdfsCertificados = () => {
  const { descargar, bytesPdf } = usePdf()

  const armarZip = async (data: IClaseEmpleado[]) => {
    const archivos: Record<string, [Uint8Array, { level: 0 }]> = {}
    const personas = new Set<string>()
    // Uno por uno para no saturar la memoria del navegador
    for (const certificado of data) {
      const { nombre, persona, bytes } = await bytesPdf(certificado)
      personas.add(limpiarNombre(persona))
      // El mismo curso tomado dos veces: se numera para no perder ninguno
      const base = limpiarNombre(nombre)
      let archivo = `${base}.pdf`
      for (let n = 2; archivos[archivo]; n++) archivo = `${base} (${n}).pdf`
      // Los PDF ya vienen comprimidos: se guardan tal cual (más rápido, mismo tamaño)
      archivos[archivo] = [bytes, { level: 0 }]
    }
    const fecha = moment().format('YYYY-MM-DD')
    const quien = personas.size === 1 ? `${[...personas][0]} ` : ''
    guardarArchivo(zipSync(archivos), `DC-3 ${quien}${fecha}.zip`, 'application/zip')
  }

  const certificados = useMutation({
    mutationKey: ['getCertificadosPdf'],
    mutationFn: async (payload: number[]) => {
      const data = await getCertificadosPdf(payload)
      if (data.length === 1) await descargar(data[0]!)
      else if (data.length > 1) await armarZip(data)
      return data
    },
  })

  const descargarCertificados = (payload: number[]) => {
    certificados.mutate(payload)
  }

  return {
    descargarCertificados,
    descargando: certificados.isPending,
  }
}

export default usePdfsCertificados
