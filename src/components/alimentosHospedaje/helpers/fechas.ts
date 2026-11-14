// Fechas como texto "AAAA-MM-DD" (dia calendario), sin zona horaria.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']

const partes = (iso: string) => {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number)
  return { y, m, d }
}

const aUTC = (iso: string) => {
  const { y, m, d } = partes(iso)
  return new Date(Date.UTC(y, m - 1, d))
}

export const aISO = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Convierte "AAAA-MM-DD" a Date local (para v-datepicker). */
export const aFechaLocal = (iso: string) => {
  const { y, m, d } = partes(iso)
  return new Date(y, m - 1, d)
}

export const hoyISO = () => aISO(new Date())

export const sumarDias = (iso: string, n: number) => {
  const d = aUTC(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const diaSemana = (iso: string) => aUTC(iso).getUTCDay()

export const inicioSemana = (iso: string) => sumarDias(iso, -diaSemana(iso))

/** "30-ago" como en la plantilla de alimentos. */
export const fechaCorta = (iso: string) => {
  const d = aUTC(iso)
  return `${String(d.getUTCDate()).padStart(2, '0')}-${MESES[d.getUTCMonth()]}`
}

/** "Domingo 30 ago 2026" */
export const fechaLarga = (iso: string) => {
  const d = aUTC(iso)
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export const rango = (desde: string, hasta: string) => {
  const r: string[] = []
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) r.push(f)
  return r
}
