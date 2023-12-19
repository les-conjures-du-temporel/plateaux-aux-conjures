import type { Database, Game } from '@/database'

export type ScoredGame = { game: Game; score: number }

/**
 * A class that is used to score the game suggestions, based on game similarity, rating, etc
 */
export class GameScorer {
  _db: Database
  _termsByGame: Map<string, Set<string>> | null = null
  _weightByTerm: Map<string, number> | null = null
  _minMaxBayesRating: [number, number] | null = null

  constructor(db: Database) {
    this._db = db
  }

  /**
   * Score the game based on the list of favorite games. Also apply a bias based on the BGG rating.
   *
   * TODO give bonus for recent play and random boost by day
   */
  async scoreGames(games: Game[], favoriteGames: Game[]): Promise<ScoredGame[]> {
    const weightByTerm = await this._getWeightByTerm()
    const termsByGame = await this._getTermsByGame()
    const [minBayesRating, maxBayesRating] = await this._getMinMaxBayesRating()

    const favoriteTerms = new Map()
    for (const favoriteGame of favoriteGames) {
      for (const term of this._getTermsForGame(favoriteGame)) {
        favoriteTerms.set(term, weightByTerm.get(term) || 0)
      }
    }

    const scoredGames = []
    for (const game of games) {
      const gameTerms = termsByGame.get(game.bgg.id)
      if (!gameTerms) {
        console.warn(`Could not find pre-calculated terms for game ${game.bgg.id}`)
        continue
      }

      let score = 0
      for (const [favoriteTerm, weight] of favoriteTerms.entries()) {
        if (gameTerms.has(favoriteTerm)) {
          score += weight
        }
      }

      if (game.bgg.bayesAverageRating) {
        // Add 0..1 based on the rating
        score += (game.bgg.bayesAverageRating - minBayesRating) / (maxBayesRating - minBayesRating)
      }

      scoredGames.push({ game, score })
    }

    return scoredGames
  }

  /**
   * Return the extremes of "bayes average rating", used to rank the games on BGG.
   * Note that only games owned by the club are considered
   */
  async _getMinMaxBayesRating(): Promise<[number, number]> {
    if (!this._minMaxBayesRating) {
      const games = await this._db.getGamesWithCache()
      let min = Number.POSITIVE_INFINITY
      let max = Number.NEGATIVE_INFINITY
      for (const game of games) {
        const bayesAverageRating = game.bgg.bayesAverageRating
        if (game.ownedByClub && bayesAverageRating) {
          min = Math.min(min, bayesAverageRating)
          max = Math.max(max, bayesAverageRating)
        }
      }
      this._minMaxBayesRating = [min, max]
    }

    return this._minMaxBayesRating
  }

  /**
   * Calculate a score based on the "inverse document frequency" principle: the idea is to give more
   * weight to terms that are more selective, that is, appear on a lesser number of games.
   *
   * A term that appears in all games has value of zero. A term that appears in one single game has
   * value of one.
   */
  async _getWeightByTerm(): Promise<Map<string, number>> {
    if (!this._weightByTerm) {
      const termsByGame = await this._getTermsByGame()
      const gamesByTerm: Map<string, number> = new Map()
      for (const terms of termsByGame.values()) {
        for (const term of terms) {
          const count = gamesByTerm.get(term) || 0
          gamesByTerm.set(term, count + 1)
        }
      }

      const weightByTerm = new Map()
      const totalGames = termsByGame.size
      for (const [term, count] of gamesByTerm) {
        weightByTerm.set(term, 1 - Math.log(count) / Math.log(totalGames))
      }

      this._weightByTerm = weightByTerm
    }

    return this._weightByTerm
  }

  /**
   * Generate the set of terms for all games owned by the club
   */
  async _getTermsByGame(): Promise<Map<string, Set<string>>> {
    if (!this._termsByGame) {
      const games = await this._db.getGamesWithCache()
      const termsByGame = new Map()

      for (const game of games) {
        if (game.ownedByClub) {
          termsByGame.set(game.bgg.id, this._getTermsForGame(game))
        }
      }
      this._termsByGame = termsByGame
    }

    return this._termsByGame
  }

  _getTermsForGame(game: Game): Set<string> {
    const terms: Set<string> = new Set()
    for (const category of game.bgg.categories) {
      terms.add(`category:${category}`)
    }
    for (const mechanic of game.bgg.mechanics) {
      terms.add(`mechanic:${mechanic}`)
    }
    for (const designer of game.bgg.designers) {
      terms.add(`designer:${designer}`)
    }
    for (const artist of game.bgg.artists) {
      terms.add(`artist:${artist}`)
    }
    return terms
  }
}
