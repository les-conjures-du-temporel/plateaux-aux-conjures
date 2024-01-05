import type { BggGame } from '@/board_game_geek'
import type { Game } from '@/database'
import { Notify } from 'quasar'

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

/**
 * Reformat date from `YYYY-MM-DD` into French style `DD/MM/YYYY`
 */
export function formatDate(date: string): string {
  const match = date.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)
  if (!match) {
    return date
  }
  const [_, year, month, day] = match
  return `${day}/${month}/${year}`
}

export async function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
}

/**
 * The club code is made of 4 base-32 chars.
 */
export function generateClubCode(): string {
  const base32Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * base32Characters.length)
    result += base32Characters[index]
  }
  return result
}

/**
 * Accept small typos in the base-32 chars used in a club code
 */
export function normalizeClubCode(text: string): string | null {
  const normal = normalizeBase32Code(text)

  if (normal.match(/^[A-Z234567]{4}$/)) {
    return normal
  }
  return null
}

/**
 * Accept small typos in the base-32 chars
 */
export function normalizeBase32Code(text: string): string {
  return text
    .toUpperCase()
    .replace(/\s/g, '')
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/8/g, 'B')
}

export function buildGameFromBggGame(bggGame: BggGame, ownedByClub: boolean, name?: string): Game {
  return {
    bgg: bggGame,
    ownedByClub,
    clubCode: ownedByClub ? generateClubCode() : null,
    lastPlayed: null,
    name: name || bggGame.primaryName,
    totalPlays: 0
  }
}

export function notifyError(error: Error, message?: string): void {
  Notify.create({
    type: 'negative',
    position: 'top',
    message: message ?? 'Erreur de chargement, essaie de rafraîchir la page'
  })

  console.error(error)
}

export function notifyWarn(error: Error, position: 'top' | 'bottom' = 'top'): void {
  Notify.create({
    type: 'warning',
    position,
    message: 'Erreur de chargement'
  })

  console.warn(error)
}

export function notifySuccess(message: string): void {
  Notify.create({
    type: 'positive',
    position: 'top',
    message: message
  })
}
