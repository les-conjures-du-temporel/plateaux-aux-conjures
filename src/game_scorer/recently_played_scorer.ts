import type { Game } from '@/database'

/**
 * Boost games that were played recently
 */
export class RecentlyPlayedScorer {
  private readonly playedLastMonthScore: number = 1
  private readonly playedLastSixMonthsScore: number = 0.5

  score(games: Game[]): { scored: Map<string, number>; relevant: Set<string> } {
    const now = Date.now()
    const scored = new Map()
    const relevant: Set<string> = new Set()
    for (const game of games) {
      const lastPlayed = parseDate(game.lastPlayed)
      if (lastPlayed) {
        const time = now - lastPlayed.getTime()
        const months = time / 3600e3 / 24 / 30

        const gameId = game.bgg.id
        if (months <= 1) {
          scored.set(gameId, this.playedLastMonthScore)
          relevant.add(gameId)
        } else if (months <= 6) {
          scored.set(gameId, this.playedLastSixMonthsScore)
        }
      }
    }
    return { scored, relevant }
  }
}

function parseDate(date: string | null): Date | null {
  const match = date?.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)
  if (!match) {
    return null
  }
  const [, yearStr, monthStr, dayStr] = match
  try {
    const year = Number.parseInt(yearStr)
    const month = Number.parseInt(monthStr)
    const day = Number.parseInt(dayStr)

    return new Date(year, month - 1, day)
  } catch (_) {
    return null
  }
}
