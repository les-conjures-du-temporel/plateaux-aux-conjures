import type { Database, Game } from '@/database'

export type BoostKind =
  | 'players'
  | 'playTime'
  | 'favoriteMatch'
  | 'bggRating'
  | 'randomDaily'
  | 'recentlyPlayed'
export type ScoredGame = {
  game: Game
  playersBoost: number
  playTimeBoost: number
  favoriteMatchBoost: number
  bggRatingBoost: number
  randomDailyBoost: number
  recentlyPlayedBoost: number
  // The sum of all boosts
  score: number
  // The boosts that are particularly relevant
  relevantBoosts: BoostKind[]
}

/**
 * A class that is used to score the game suggestions, based on game match with criteria, similarity, rating, etc
 *
 * The score is the sum of "boosts". Each boost is linked to a category and have a maximum value, which are manually
 * tweaked.
 */
export class GameScorer {
  _db: Database

  // === Tweaks to the boosting logic ===
  _playersBoost: number = 0.5
  _playTimeBoost: number = 0.5
  _favoriteMatchBoost: number = 1
  _bggRatingBoost: number = 0.5
  _randomDailyBoost: number = 0.5
  _playedLastMonthBoost: number = 0.25
  _playedLastSixMonthsBoost: number = 0.5

  constructor(db: Database) {
    this._db = db
  }

  async score(games: Game[], favoriteGames: Game[]): Promise<ScoredGame[]> {}
}
