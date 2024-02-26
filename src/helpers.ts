import type { BggGame } from '@/board_game_geek'
import type { Game } from '@/database'
import { Notify } from 'quasar'
import { today } from '@/day'

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

export async function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
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
    name: name || bggGame.primaryName,
    bgg: bggGame,
    ownedByClub,
    ownedSince: ownedByClub ? today() : null,
    lastPlayed: null,
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
