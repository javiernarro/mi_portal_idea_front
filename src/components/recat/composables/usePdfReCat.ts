import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import pdfMake from 'pdfmake/build/pdfmake'
import 'pdfmake/build/vfs_fonts'
import moment from 'moment'
import { mismoNombre, type IFichaReCat, type IRequisitoReCat } from '../interfaces/recat'

const AZUL = '#283d98'
const ROJO = '#c0392b'
const VERDE = '#1e8449'
const NARANJA = '#d68910'
const GRIS = '#6b7280'
const FONDO = '#eef0f6'

const fecha = (f: string | null | undefined) => (f ? moment(f).format('DD/MM/YYYY') : '')

const barra = (porcentaje: number, ancho: number, alto = 8, color = AZUL): Content => {
  const lleno = Math.max(0, Math.min(1, porcentaje / 100)) * ancho
  return {
    canvas: [
      { type: 'rect', x: 0, y: 0, w: ancho, h: alto, color: '#d9dcea' },
      ...(lleno > 0 ? [{ type: 'rect' as const, x: 0, y: 0, w: lleno, h: alto, color }] : []),
    ],
  }
}

const titulo = (texto: string, color = AZUL): Content => ({
  table: {
    widths: ['*'],
    body: [
      [
        {
          text: texto,
          bold: true,
          color: 'white',
          fontSize: 9,
          fillColor: color,
          margin: [4, 2, 4, 2],
        },
      ],
    ],
  },
  layout: 'noBorders',
  margin: [0, 12, 0, 4],
})

const tablaSimple = (
  encabezados: string[],
  filas: TableCell[][],
  widths: (string | number)[],
  vacio: string,
): Content => {
  if (!filas.length) {
    return { text: vacio, fontSize: 8, color: GRIS, italics: true, margin: [4, 2, 0, 0] }
  }
  return {
    table: {
      headerRows: 1,
      widths,
      body: [encabezados.map((h) => ({ text: h, fontSize: 7, color: GRIS, bold: true })), ...filas],
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
      vLineWidth: () => 0,
      hLineColor: () => '#d9dcea',
      paddingTop: () => 2,
      paddingBottom: () => 2,
    },
    fontSize: 8,
  }
}

const textoEvidencia = (r: IRequisitoReCat) => {
  if (r.avanceDetalle) return `${r.avanceDetalle.aprobados} de ${r.avanceDetalle.total} aprobados`
  if (!r.acreditado) return r.evidencia
  return mismoNombre(r.acreditado.curso, r.requisito)
    ? r.evidencia
    : `${r.evidencia}: ${r.acreditado.curso}`
}

const categoriaDeBloque = (f: IFichaReCat, numero: number) => {
  const c = f.bloques.find((b) => b.numero === numero)?.categoria
  return c === 'ESPECIALISTA' ? 'Esp.' : (c ?? '')
}

const contenidoFicha = (f: IFichaReCat, primera: boolean): Content[] => {
  const e = f.empleado
  const ind = f.indicadores
  const dato = (etiqueta: string, valor: string, grande = false): TableCell[] => [
    { text: etiqueta, fontSize: 7, color: GRIS, alignment: 'right' },
    { text: valor, bold: true, fontSize: grande ? 11 : 9, color: grande ? AZUL : undefined },
  ]

  return [
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: [
                { text: 'FICHA DE RECATEGORIZACIÓN', bold: true },
                { text: '  |  Plan de Carrera Servicio Técnico' },
              ],
              color: 'white',
              fontSize: 12,
              fillColor: AZUL,
              margin: [6, 5, 6, 5],
            },
          ],
        ],
      },
      layout: 'noBorders',
      pageBreak: primera ? undefined : 'before',
    },
    {
      text: `Centro de Entrenamiento · Komatsu Maquinarias México · Generada el ${moment().format('DD/MM/YYYY HH:mm')}`,
      fontSize: 7,
      italics: true,
      color: GRIS,
      margin: [0, 2, 0, 8],
    },
    {
      columns: [
        {
          width: '*',
          table: {
            widths: [90, '*'],
            body: [
              dato('No. de empleado', e.numero, true),
              dato('Nombre', e.nombre),
              dato('Puesto', e.cargo),
              dato('Sucursal', e.sucursal),
              dato('Categoría actual', e.categoriaTexto, true),
              dato('Próxima categoría', e.siguiente ?? 'Ninguna (categoría máxima)', true),
            ],
          },
          layout: 'noBorders',
        },
        {
          width: 190,
          stack: [
            {
              text: '¿CUMPLE PARA SU PRÓXIMA CATEGORÍA?',
              fontSize: 7,
              color: GRIS,
              alignment: 'center',
            },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      text: f.cumple ? 'CUMPLE' : 'NO CUMPLE',
                      color: 'white',
                      bold: true,
                      fontSize: 18,
                      alignment: 'center',
                      fillColor: f.cumple ? VERDE : ROJO,
                      margin: [0, 18, 0, 18],
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
      ],
      columnGap: 12,
    },
    {
      margin: [0, 10, 0, 0],
      table: {
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['REQUISITOS QUE APLICAN', 'CUMPLIDOS', 'FALTAN', 'VOLVER A TOMAR', 'AVANCE'].map(
            (t) => ({
              text: t,
              fontSize: 7,
              color: GRIS,
              alignment: 'center',
              fillColor: FONDO,
            }),
          ),
          [
            { text: `${ind.requisitos}`, color: AZUL },
            { text: `${ind.cumplidos}`, color: VERDE },
            { text: `${ind.faltan}`, color: ROJO },
            { text: `${ind.volverATomar}`, color: NARANJA },
            { text: `${ind.avance}%`, color: AZUL },
          ].map((c) => ({ ...c, fontSize: 16, bold: true, alignment: 'center', fillColor: FONDO })),
        ],
      },
      layout: 'noBorders',
    },
    { ...(barra(ind.avance, 552) as object), margin: [0, 2, 0, 0] } as Content,

    titulo('AVANCE POR BLOQUE'),
    tablaSimple(
      ['#', 'Bloque', 'Se cumple en cat.', 'Avance', 'Estado', ''],
      f.bloques.map((b) => [
        `${b.numero}`,
        { text: b.nombre, bold: true },
        {
          text: b.categoria === 'ESPECIALISTA' ? 'Especialista' : b.categoria,
          alignment: 'center',
        },
        { text: b.aplica ? `${b.cumplidos} / ${b.requisitos}` : '—', alignment: 'center' },
        {
          text: b.estado,
          alignment: 'center',
          bold: b.estado !== 'No aplica',
          color: b.estado === 'Cumple' ? VERDE : b.estado === 'Falta' ? ROJO : GRIS,
        },
        b.aplica ? barra(b.requisitos ? (b.cumplidos / b.requisitos) * 100 : 0, 110, 7) : '',
      ]),
      [12, '*', 70, 50, 50, 112],
      '',
    ),

    titulo('REQUISITOS FALTANTES (incluye los de categorías anteriores)', ROJO),
    tablaSimple(
      ['#', 'Requisito faltante', 'Bloque', 'Cat.'],
      f.faltantes.map((r, i) => [
        `${i + 1}`,
        {
          text: r.avanceDetalle
            ? `${r.requisito} (${r.avanceDetalle.aprobados} de ${r.avanceDetalle.total})`
            : r.requisito,
          color: ROJO,
          bold: true,
        },
        r.bloqueNombre,
        { text: categoriaDeBloque(f, r.bloque), alignment: 'center' },
      ]),
      [12, '*', 120, 28],
      'Sin requisitos faltantes.',
    ),

    titulo('COMENTARIOS', NARANJA),
    {
      text: f.comentario.texto || 'Sin comentarios.',
      fontSize: 8,
      bold: !!f.comentario.texto,
      color: f.comentario.texto ? undefined : GRIS,
      margin: [4, 0, 0, 0],
    },

    titulo('CAPACITACIONES NO ACREDITADAS — DEBE TOMARLAS DE NUEVO', NARANJA),
    tablaSimple(
      ['#', 'Requisito', 'Curso tomado', 'Fecha', 'Calif.', 'Cat.'],
      f.noAcreditadas.map((r, i) => [
        `${i + 1}`,
        r.requisito,
        r.noAcreditado?.curso ?? '',
        fecha(r.noAcreditado?.fecha),
        { text: `${r.noAcreditado?.calificacion ?? ''}`, alignment: 'center' },
        { text: categoriaDeBloque(f, r.bloque), alignment: 'center' },
      ]),
      [12, '*', 150, 48, 28, 28],
      'Ninguna.',
    ),

    titulo('REQUISITOS CUMPLIDOS', VERDE),
    tablaSimple(
      ['#', 'Requisito', 'Bloque', 'Cat.', 'Fecha', 'Evidencia (curso / modelo)'],
      f.cumplidos.map((r, i) => [
        `${i + 1}`,
        r.requisito,
        r.bloqueNombre,
        { text: categoriaDeBloque(f, r.bloque), alignment: 'center' },
        fecha(r.acreditado?.fecha),
        textoEvidencia(r),
      ]),
      [12, '*', 90, 22, 46, 120],
      'Aún no tiene requisitos cumplidos.',
    ),

    titulo('OPCIONALES (no cuentan para el avance)', GRIS),
    tablaSimple(
      ['#', 'Curso', 'Bloque', '¿Lo tiene?', 'Fecha'],
      f.opcionales.map((r, i) => [
        `${i + 1}`,
        r.requisito,
        r.bloqueNombre,
        {
          text: r.estado === 'Cumplido' ? 'Sí' : 'No',
          bold: true,
          color: r.estado === 'Cumplido' ? VERDE : GRIS,
          alignment: 'center',
        },
        fecha(r.acreditado?.fecha),
      ]),
      [12, '*', 110, 50, 50],
      '',
    ),
    {
      text: f.cumple
        ? 'Siguiente paso: cumple los requisitos de cursos; puede ser considerado para la evaluación anual.'
        : 'Siguiente paso: programar los requisitos faltantes. Al completarlos podrá ser considerado para la evaluación anual.',
      fontSize: 8,
      italics: true,
      color: GRIS,
      margin: [0, 12, 0, 0],
    },
  ]
}

const usePdfReCat = () => {
  const descargarFichas = (fichas: IFichaReCat[]) => {
    if (!fichas.length) return
    const doc: TDocumentDefinitions = {
      pageSize: 'LETTER',
      pageMargins: [30, 30, 30, 36],
      info: { title: 'Fichas de Re Categorización' },
      defaultStyle: { fontSize: 9 },
      footer: (pagina: number, total: number) => ({
        text: `Página ${pagina} de ${total}`,
        alignment: 'right',
        fontSize: 7,
        color: GRIS,
        margin: [0, 10, 30, 0],
      }),
      content: fichas.flatMap((f, i) => contenidoFicha(f, i === 0)),
    }
    const nombre =
      fichas.length === 1
        ? `Ficha ReCat ${fichas[0]!.empleado.numero} ${fichas[0]!.empleado.nombre}`
        : `Fichas ReCat ${fichas.length} tecnicos ${moment().format('YYYY-MM-DD')}`
    pdfMake.createPdf(doc).download(`${nombre}.pdf`)
  }

  return { descargarFichas }
}

export default usePdfReCat
