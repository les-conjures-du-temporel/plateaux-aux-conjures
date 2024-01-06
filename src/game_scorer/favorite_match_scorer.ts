import type { Game } from '@/database'

/**
 * Score the game based on the similarity with the list of favorite games.
 *
 * Return a value between 0 and 1 for each game.
 */
export class FavoriteMatchScorer {
  private readonly termsByGame: Map<string, Set<string>>
  private readonly weightByTerm: Map<string, number>

  constructor(games: Game[]) {
    this.termsByGame = FavoriteMatchScorer.getTermsByGame(games)
    this.weightByTerm = FavoriteMatchScorer.getWeightByTerm(games)
  }

  score(games: Game[], favoriteGames: Game[]): Map<string, number> {
    const weightByTerm = this.weightByTerm
    const termsByGame = this.termsByGame

    // Create a bag of terms from the favorite games
    const favoriteTerms = new Map()
    for (const favoriteGame of favoriteGames) {
      for (const term of FavoriteMatchScorer.getTermsForGame(favoriteGame)) {
        const termWeight = weightByTerm.get(term) || 0
        const previousValue = favoriteTerms.get(term) || 0
        favoriteTerms.set(term, previousValue + termWeight)
      }
    }

    let maximumScore = 0
    const rawScoredGames = new Map()
    for (const game of games) {
      let rawScore = 0
      const gameTerms = termsByGame.get(game.bgg.id)
      if (!gameTerms) {
        console.warn(`Could not find pre-calculated terms for game ${game.bgg.id}`)
        continue
      }

      for (const [favoriteTerm, weight] of favoriteTerms.entries()) {
        if (gameTerms.has(favoriteTerm)) {
          rawScore += weight
        }
      }

      maximumScore = Math.max(maximumScore, rawScore)
      rawScoredGames.set(game.bgg.id, rawScore)
    }

    if (maximumScore === 0) {
      maximumScore = 1
    }
    const scoredGames = new Map()
    for (const [gameId, rawScore] of rawScoredGames) {
      scoredGames.set(gameId, rawScore / maximumScore)
    }

    return scoredGames
  }

  /**
   * Calculate a score based on the "inverse document frequency" principle: the idea is to give more
   * weight to terms that are more selective, that is, appear on a lesser number of games.
   *
   * A term that appears in all games has value of zero. A term that appears in one single game has
   * value of one.
   */
  private static getWeightByTerm(games: Game[]): Map<string, number> {
    const termsByGame = this.getTermsByGame(games)
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

    return weightByTerm
  }

  /**
   * Generate the set of terms for all games owned by the club
   */
  private static getTermsByGame(games: Game[]): Map<string, Set<string>> {
    const termsByGame = new Map()

    for (const game of games) {
      if (game.ownedByClub) {
        termsByGame.set(game.bgg.id, this.getTermsForGame(game))
      }
    }
    return termsByGame
  }

  private static getTermsForGame(game: Game): Set<string> {
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
