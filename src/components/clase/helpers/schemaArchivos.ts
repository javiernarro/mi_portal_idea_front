import * as yup from 'yup'

export const MENSAJE_SOLO_PDF = 'Favor de cargar solamente documentos en formato .PDF'
export const esPdf = (file: File) =>
  /\.pdf$/i.test(file.name) && (file.type === 'application/pdf' || file.type === '')

export const schemaArchivos = yup.object({
  files: yup
    .array()
    .of(
      yup
        .mixed<File>()
        .required()
        .test(
          'fileSize',
          'Cada archivo debe pesar máximo 10MB',
          (file) => !!file && file.size <= 10 * 1024 * 1024,
        )
        // Punto 22: solo PDF
        .test('soloPdf', MENSAJE_SOLO_PDF, (file) => !!file && esPdf(file)),
    )
    .min(1, 'Debes subir al menos un archivo')
    .required('Debes subir al menos un archivo'),
})
