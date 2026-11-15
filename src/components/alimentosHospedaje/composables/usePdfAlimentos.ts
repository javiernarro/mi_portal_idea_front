import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import pdfMake from 'pdfmake/build/pdfmake'
import 'pdfmake/build/vfs_fonts'
import type {
  IFueraServicio,
  IServicio,
  ISolicitudDetalle,
  TiempoComida,
} from '../interfaces/alimentosHospedaje'
import { DIAS_CORTOS, diaSemana, fechaCorta, fechaLarga, sumarDias } from '../helpers/fechas'

// Mismos colores que los demás PDF del portal
const AZUL = '#0e1371'
const GRIS = '#6b7280'
const TIEMPOS: TiempoComida[] = ['DES', 'COM', 'CEN']

const encabezado = (titulo: string, subtitulo: string): Content => ({
  table: {
    widths: ['*'],
    body: [
      [
        {
          stack: [
            { text: titulo, bold: true, fontSize: 11 },
            { text: subtitulo, fontSize: 8, margin: [0, 2, 0, 0] },
          ],
          color: 'white',
          fillColor: AZUL,
          margin: [6, 4, 6, 4],
        },
      ],
    ],
  },
  layout: 'noBorders',
  margin: [0, 0, 0, 8],
})

const celda = (text: string | number, extra: Record<string, unknown> = {}): TableCell => ({
  text: String(text),
  fontSize: 6.5,
  ...extra,
})

const marcas = (servicios: IServicio[], fechas: string[]) =>
  fechas.flatMap((f) =>
    TIEMPOS.map((t) =>
      celda(servicios.some((s) => s.fecha === f && s.tiempo === t) ? 'x' : '', {
        alignment: 'center',
      }),
    ),
  )

/** Solicitud de alimentos en PDF: mismas columnas que la plantilla (domingo a viernes; sábado si se pidió). */
export const pdfSolicitud = (s: ISolicitudDetalle) => {
  const todos = [
    ...s.huespedes.flatMap((h) => h.servicios),
    ...s.comensales.flatMap((c) => c.servicios),
  ]
  const fechas = s.fechas.filter((f, i) => i < 6 || todos.some((x) => x.fecha === f))
  const encabezados: TableCell[][] = [
    [
      celda('HAB', { bold: true, rowSpan: 2 }),
      celda('CAMA', { bold: true, rowSpan: 2 }),
      celda('NOMBRE', { bold: true, rowSpan: 2 }),
      celda('SUCURSAL', { bold: true, rowSpan: 2 }),
      celda('CENTRO DE COSTOS', { bold: true, rowSpan: 2 }),
      ...fechas.flatMap((f) => [
        celda(`${DIAS_CORTOS[diaSemana(f)]} ${fechaCorta(f)}`, {
          bold: true,
          colSpan: 3,
          alignment: 'center',
        }),
        '',
        '',
      ]),
    ],
    [
      '',
      '',
      '',
      '',
      '',
      ...fechas.flatMap(() => TIEMPOS.map((t) => celda(t, { bold: true, alignment: 'center' }))),
    ],
  ]
  const filas: TableCell[][] = s.huespedes.map((h) => [
    celda(
      h.tipoHab === 'vip' ? h.habitacion.replace(/^VIP\s*/i, '') : h.habitacion.replace(/\D+/g, ''),
    ),
    celda(h.tipoHab === 'vip' ? '' : h.cama),
    celda(h.nombre),
    celda(h.sucursal),
    celda(h.ccClave),
    ...marcas(h.servicios, fechas),
  ])
  const comensales: TableCell[][] = s.comensales.map((c) => [
    celda(c.esInstructor ? 'Instructor' : 'Sin hospedaje', { colSpan: 2, color: GRIS }),
    '',
    celda(c.nombre),
    celda(c.sucursal),
    celda(c.ccClave),
    ...marcas(c.servicios, fechas),
  ])
  const total = (f: string, t: TiempoComida) =>
    todos.filter((x) => x.fecha === f && x.tiempo === t).length
  const totales: TableCell[] = [
    celda('TOTAL', { bold: true, colSpan: 5 }),
    '',
    '',
    '',
    '',
    ...fechas.flatMap((f) =>
      TIEMPOS.map((t) => celda(total(f, t), { bold: true, alignment: 'center' })),
    ),
  ]
  const vacio = (texto: string): TableCell[] => [
    celda(texto, { colSpan: 5 + fechas.length * 3, color: GRIS, italics: true }),
    ...Array(4 + fechas.length * 3).fill(''),
  ]
  const separador: TableCell[] = [
    celda('ALIMENTOS ADICIONALES SIN HOSPEDAJE', {
      bold: true,
      color: 'white',
      fillColor: AZUL,
      colSpan: 5 + fechas.length * 3,
    }),
    ...Array(4 + fechas.length * 3).fill(''),
  ]
  const doc: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [24, 24, 24, 24],
    info: { title: s.folio },
    content: [
      encabezado(
        'RELACIÓN DE ALIMENTOS CENTRO DE ENTRENAMIENTO',
        `${s.folio} · ${s.grupo} · Semana del ${fechaLarga(s.semanaInicio)} al ${fechaLarga(sumarDias(s.semanaInicio, 6))}`,
      ),
      {
        table: {
          headerRows: 2,
          widths: [22, 22, '*', 60, 50, ...fechas.flatMap(() => [14, 14, 14])],
          body: [
            ...encabezados,
            ...(filas.length ? filas : [vacio('Sin huéspedes en esta semana.')]),
            separador,
            ...(comensales.length ? comensales : [vacio('Sin comensales adicionales.')]),
            totales,
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#c5c9dc',
          vLineColor: () => '#c5c9dc',
          fillColor: (i: number) => (i < 2 ? '#eef0f6' : null),
        },
      },
    ],
    defaultStyle: { fontSize: 7 },
  }
  pdfMake.createPdf(doc).download(`${s.folio}.pdf`)
}

export const pdfFueraServicio = (r: IFueraServicio) => {
  const doc: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [36, 36, 36, 36],
    info: { title: r.nombre },
    content: [
      encabezado(
        'CAMAS FUERA DE SERVICIO',
        `Semana del ${fechaLarga(r.semanaInicio)} al ${fechaLarga(sumarDias(r.semanaInicio, 6))}`,
      ),
      r.filas.length
        ? {
            table: {
              headerRows: 1,
              widths: [80, 40, 55, 55, '*', 80],
              body: [
                ['Habitación', 'Cama', 'Desde', 'Hasta', 'Motivo', 'Registró'].map((h) =>
                  celda(h, { bold: true, fontSize: 8, color: GRIS }),
                ),
                ...r.filas.map((f) =>
                  [
                    f.habitacion,
                    f.camaId ? String(f.cama) : 'Toda',
                    fechaCorta(f.desde),
                    fechaCorta(f.hasta),
                    f.motivo,
                    f.registro,
                  ].map((t) => celda(t, { fontSize: 8 })),
                ),
              ],
            },
            layout: 'lightHorizontalLines',
          }
        : { text: 'Sin camas fuera de servicio esta semana.', color: GRIS, italics: true },
    ],
  }
  pdfMake.createPdf(doc).download(`${r.nombre}.pdf`)
}

/** Hoja para imprimir y colocar en Caseta: un solo QR para llegada y salida. */
export const pdfQrCaseta = (url: string) => {
  const doc: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [48, 60, 48, 48],
    info: { title: 'QR Caseta' },
    content: [
      encabezado('CENTRO DE ENTRENAMIENTO · HOSPEDAJE', 'Registro de llegada y salida'),
      {
        text: 'Escanea este código con la cámara de tu teléfono',
        alignment: 'center',
        fontSize: 16,
        bold: true,
        color: AZUL,
        margin: [0, 24, 0, 16],
      },
      { qr: url, fit: 300, alignment: 'center', foreground: AZUL },
      {
        ol: [
          'Entra con tu usuario de Mi Portal IDEA.',
          'Permite que el portal use la ubicación de tu teléfono.',
          'Toca "Registrar llegada" o "Registrar salida".',
        ],
        fontSize: 12,
        margin: [80, 28, 40, 0],
      },
      {
        text: 'Solo funciona en Caseta y con tu propia reserva.',
        alignment: 'center',
        color: GRIS,
        fontSize: 10,
        margin: [0, 24, 0, 0],
      },
    ],
  }
  pdfMake.createPdf(doc).download('QR_CASETA_HOSPEDAJE.pdf')
}
