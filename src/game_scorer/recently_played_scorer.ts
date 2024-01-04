import type { Game } from '@/database'

/**
 * Boost games that were played recently
 */
export class RecentlyPlayedScorer {
  _playedLastMonthScore: number = 1
  _playedLastSixMonthsScore: number = 0.5

  score(games: Game[]): Map<string, number> {
    const now = Date.now()
    const scoredGames = new Map()
    for (const game of games) {
      const lastPlayed = parseDate(game.lastPlayed)
      if (lastPlayed) {
        const time = now - lastPlayed.getTime()
        const months = time / 3600e3 / 24 / 30

        if (months <= 1) {
          scoredGames.set(game.bgg.id, this._playedLastMonthScore)
        } else if (months <= 6) {
          scoredGames.set(game.bgg.id, this._playedLastSixMonthsScore)
        }
      }
    }
    return scoredGames
  }
}

function parseDate(date: string | null): Date | null {
  const match = date?.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)
  if (!match) {
    return null
  }
  const [_, yearStr, monthStr, dayStr] = match
  try {
    const year = Number.parseInt(yearStr)
    const month = Number.parseInt(monthStr)
    const day = Number.parseInt(dayStr)

    return new Date(year, month - 1, day)
  } catch (_) {
    return null
  }
}
