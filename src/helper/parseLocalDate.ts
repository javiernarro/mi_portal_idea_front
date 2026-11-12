// Convierte una fecha ("YYYY-MM-DD", ISO o Date) a un Date local sin hora.
// Si el valor está vacío o es inválido, regresa la fecha de hoy.
export const parseLocalDate = (dateInput: string | Date | null | undefined): Date => {
  if (!dateInput) return new Date()

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime())
      ? new Date()
      : new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
  }

  const dateString = String(dateInput).trim()
  if (dateString.toLowerCase().includes('invalid') || dateString === '') return new Date()

  const parts = dateString.split('T')[0]?.split('-')
  if (parts?.length === 3) {
    const year = parseInt(parts[0]!, 10)
    const month = parseInt(parts[1]!, 10) - 1 // Los meses en JS son 0-indexed
    const day = parseInt(parts[2]!, 10)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) return new Date(year, month, day)
  }

  const fallback = new Date(dateString)
  return isNaN(fallback.getTime()) ? new Date() : fallback
}
