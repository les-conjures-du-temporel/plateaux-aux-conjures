/**
 * A day represented as a plain string in YYYY-MM-DD.
 *
 * Using a plain string makes it easier to send and receive from database and remote function calls.
 */
export type Day = string


/**
 * Reformat date from `YYYY-MM-DD` into French style `DD/MM/YYYY`
 */
export function dayToHumanString(day: Day): string {
  const match = day.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)
  if (!match) {
    return day
  }
  const [, year, month, dayOfMonth] = match
  return `${dayOfMonth}/${month}/${year}`
}

/**
 * Parse a day into a JS `Date` instance set as local midnight of that day
 */
export function dayToJsDate(day: Day): Date | null {
  const match = day?.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)
  if (!match) {
    return null
  }
  const [, yearStr, monthStr, dayStr] = match
  try {
    const year = Number.parseInt(yearStr)
    const month = Number.parseInt(monthStr)
    const dayOfMonth = Number.parseInt(dayStr)

    return new Date(year, month - 1, dayOfMonth)
  } catch (_) {
    return null
  }
}

export function today(): Day {
  const now = new Date()
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${dayOfMonth}`
}