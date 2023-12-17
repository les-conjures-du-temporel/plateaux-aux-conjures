import type { BggGame } from '@/board_game_geek'
import type { Game } from '@/database'

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
 * Accept small typos in the base-32 chars
 */
export function normalizeClubCode(text: string): string | null {
  const normal = text.trim().toUpperCase().replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B')

  if (normal.match(/^[A-Z234567]{4}$/)) {
    return normal
  }
  return null
}

export function buildGameFromBggGame(bggGame: BggGame, ownedByClub: boolean): Game {
  return {
    bgg: bggGame,
    ownedByClub,
    clubCode: ownedByClub ? generateClubCode() : null,
    lastPlayed: null,
    name: bggGame.primaryName,
    totalPlays: 0
  }
}
