export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

export function pluralS(n: number, singular: string): string {
  return plural(n, singular, singular + 's')
}

const numberFormatter = Intl.NumberFormat('fr', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
})

export function formatNumber(n: number): string {
  return numberFormatter.format(n)
}

const dateFormatter = Intl.DateTimeFormat('fr')

export function formatDate(d: Date): string {
  return dateFormatter.format(d)
}
