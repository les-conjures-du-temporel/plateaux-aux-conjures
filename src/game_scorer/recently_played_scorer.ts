import type { Game } from '@/database'
import { dayToJsDate, pastDay } from '@/day'
import { RECENT_GAMES_DAYS } from '@/database'

/**
 * Boost games that were played recently
 */
export class RecentlyPlayedScorer {
  private readonly newClubGameScore: number = 1
  private readonly playedLastMonthScore: number = 0.9
  private readonly playedLastSixMonthsScore: number = 0.5

  score(games: Game[]): { scored: Map<string, number>; relevant: Set<string> } {
    const now = Date.now()
    const scored = new Map()
    const relevant: Set<string> = new Set()
    const recentPast = pastDay(RECENT_GAMES_DAYS)
    for (const game of games) {
      const gameId = game.bgg.id

      const lastPlayed = game.lastPlayed ? dayToJsDate(game.lastPlayed) : null
      if (game.ownedSince && game.ownedSince >= recentPast) {
        scored.set(gameId, this.newClubGameScore)
        relevant.add(gameId)
      } else if (lastPlayed) {
        const time = now - lastPlayed.getTime()
        const months = time / 3600e3 / 24 / 30

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
