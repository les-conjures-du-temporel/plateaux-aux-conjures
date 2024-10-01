import type { Game } from '@/database'
import { isGameAvailable } from '@/helpers'

/**
 * Score games based on their BGG average ratings.
 *
 * Return a value between 0 and 1 for each game.
 */
export class BggRatingScorer {
  private readonly minBayesRating: number
  private readonly maxBayesRating: number

  constructor(games: Game[], isFestivalMode: boolean) {
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (const game of games) {
      const bayesAverageRating = game.bgg.bayesAverageRating
      if (isGameAvailable(game, isFestivalMode) && bayesAverageRating) {
        min = Math.min(min, bayesAverageRating)
        max = Math.max(max, bayesAverageRating)
      }
    }
    this.minBayesRating = min
    this.maxBayesRating = max
  }

  score(games: Game[]): Map<string, number> {
    const min = this.minBayesRating
    const max = this.maxBayesRating

    const scoredGames = new Map()
    for (const game of games) {
      const averageRating = game.bgg.bayesAverageRating
      if (averageRating) {
        const score = (averageRating - min) / (max - min)
        scoredGames.set(game.bgg.id, score)
      }
    }

    return scoredGames
  }
}
