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
      if (game.lastPlayed) {
        const time = now - game.lastPlayed.getTime()
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
