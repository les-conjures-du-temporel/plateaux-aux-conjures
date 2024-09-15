import { BggRatingScorer } from '@/game_scorer/bgg_rating_scorer'
import { FavoriteMatchScorer } from '@/game_scorer/favorite_match_scorer'
import { type Interval, PlayTimeScorer } from '@/game_scorer/play_time_scorer'
import { PlayersScorer } from '@/game_scorer/players_scorer'
import { RandomDailyScorer } from '@/game_scorer/random_daily_scorer'
import { RecentlyPlayedScorer } from '@/game_scorer/recently_played_scorer'
import type { Game } from '@/database'

export type ScoreKind =
  | 'players'
  | 'playTime'
  | 'favoriteMatch'
  | 'bggRating'
  | 'randomDaily'
  | 'recentlyPlayed'
export type ScoredGame = {
  game: Game
  playersScore: number
  playTimeScore: number
  favoriteMatchScore: number
  bggRatingScore: number
  randomDailyScore: number
  recentlyPlayedScore: number
  // The sum of all boosts
  score: number
  // The components that are particularly relevant
  relevantScores: ScoreKind[]
}

/**
 * A class that is used to score the game suggestions, based on game match with criteria, similarity, rating, etc
 *
 * The score is the sum of "boosts". Each boost is linked to a category and have a maximum value, which are manually
 * tweaked.
 */
export class GameScorer {
  private readonly bggRatingScorer: BggRatingScorer
  private readonly favoriteMatchScorer: FavoriteMatchScorer
  private readonly playTimeScorer: PlayTimeScorer
  private readonly playersScorer: PlayersScorer
  private readonly randomDailyScorer: RandomDailyScorer
  private readonly recentlyPlayedScorer: RecentlyPlayedScorer

  // === Tweaks to the boosting logic ===
  private readonly bggRatingBoost: number = 0.2
  private readonly favoriteMatchBoost: number = 1
  private readonly playTimeBoost: number = 0.5
  private readonly playersBoost: number = 0.5
  private readonly randomDailyBoost: number = 0.25
  private readonly recentlyPlayedBoost: number = 0.75

  // Mark this amount of the top percentage in each score
  private readonly relevancyPercentile: number = 20

  constructor(games: Game[]) {
    this.bggRatingScorer = new BggRatingScorer(games)
    this.favoriteMatchScorer = new FavoriteMatchScorer(games)
    this.playTimeScorer = new PlayTimeScorer()
    this.playersScorer = new PlayersScorer(games)
    this.randomDailyScorer = new RandomDailyScorer(games)
    this.recentlyPlayedScorer = new RecentlyPlayedScorer()
  }

  score(
    games: Game[],
    favoriteGames: Game[],
    playersSet: Set<number>,
    playTimeCriteria: Interval | null
  ): ScoredGame[] {
    const bggRatingScoreByGame = this.bggRatingScorer.score(games)
    const favoriteMatchScoreByGame = this.favoriteMatchScorer.score(games, favoriteGames)
    const playTimeScoreByGame = this.playTimeScorer.score(games, playersSet, playTimeCriteria)
    const playersScoreByGame = this.playersScorer.score(games, playersSet)
    const randomDailyScoreByGame = this.randomDailyScorer.score(games)
    const recentlyPlayedScoreByGame = this.recentlyPlayedScorer.score(games)

    const scoredGames: ScoredGame[] = []
    for (const game of games) {
      const gameId = game.bgg.id
      const bggRatingScore = bggRatingScoreByGame.get(gameId) || 0
      const favoriteMatchScore = favoriteMatchScoreByGame.get(gameId) || 0
      const playTimeScore = playTimeScoreByGame.scored.get(gameId) || 0
      const playersScore = playersScoreByGame.scored.get(gameId) || 0
      const randomDailyScore = randomDailyScoreByGame.scored.get(gameId) || 0
      const recentlyPlayedScore = recentlyPlayedScoreByGame.scored.get(gameId) || 0

      if (favoriteGames.length > 0 && favoriteMatchScore === 0) {
        // Ignore games that have nothing in common
        continue
      }

      const score =
        bggRatingScore * this.bggRatingBoost +
        favoriteMatchScore * this.favoriteMatchBoost +
        playTimeScore * this.playTimeBoost +
        playersScore * this.playersBoost +
        randomDailyScore * this.randomDailyBoost +
        recentlyPlayedScore * this.recentlyPlayedBoost

      const relevantScores: ScoreKind[] = []
      if (playTimeScoreByGame.relevant.has(gameId)) {
        relevantScores.push('playTime')
      }
      if (playersScoreByGame.relevant.has(gameId)) {
        relevantScores.push('players')
      }
      if (randomDailyScoreByGame.relevant.has(gameId)) {
        relevantScores.push('randomDaily')
      }
      if (recentlyPlayedScoreByGame.relevant.has(gameId)) {
        relevantScores.push('recentlyPlayed')
      }

      scoredGames.push({
        game,
        bggRatingScore,
        favoriteMatchScore,
        playTimeScore,
        playersScore,
        randomDailyScore,
        recentlyPlayedScore,
        score,
        relevantScores
      })
    }

    scoredGames.sort((a, b) => b.score - a.score)

    // Detect components that were relevant relative to others
    this.detectRelevant(scoredGames, 'bggRating', (game) => game.bggRatingScore)
    this.detectRelevant(scoredGames, 'favoriteMatch', (game) => game.favoriteMatchScore)

    return scoredGames
  }

  private detectRelevant(
    scoredGames: ScoredGame[],
    kind: ScoreKind,
    getValue: (game: ScoredGame) => number
  ): void {
    const sortedScores = scoredGames.map(getValue).sort((a, b) => a - b)
    const relevancyIndex = Math.floor(
      (sortedScores.length - 1) * (1 - this.relevancyPercentile / 100)
    )
    const thresholdScore = sortedScores[relevancyIndex]

    for (const scoredGame of scoredGames) {
      if (getValue(scoredGame) > thresholdScore) {
        scoredGame.relevantScores.push(kind)
      }
    }
  }
}
