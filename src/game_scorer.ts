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
  _bggRatingScorer: BggRatingScorer
  _favoriteMatchScorer: FavoriteMatchScorer
  _playTimeScorer: PlayTimeScorer
  _playersScorer: PlayersScorer
  _randomDailyScorer: RandomDailyScorer
  _recentlyPlayedScorer: RecentlyPlayedScorer

  // === Tweaks to the boosting logic ===
  _bggRatingBoost: number = 0.2
  _favoriteMatchBoost: number = 1
  _playTimeBoost: number = 0.5
  _playersBoost: number = 0.5
  _randomDailyBoost: number = 0.25
  _recentlyPlayedBoost: number = 0.25

  // Mark this amount of the top percentage in each score
  _relevancyPercentile: number = 20

  constructor(games: Game[]) {
    console.time('new GameScorer')

    this._bggRatingScorer = new BggRatingScorer(games)
    this._favoriteMatchScorer = new FavoriteMatchScorer(games)
    this._playTimeScorer = new PlayTimeScorer()
    this._playersScorer = new PlayersScorer(games)
    this._randomDailyScorer = new RandomDailyScorer(games)
    this._recentlyPlayedScorer = new RecentlyPlayedScorer()

    console.timeEnd('new GameScorer')
  }

  score(
    games: Game[],
    favoriteGames: Game[],
    playersSet: Set<number>,
    playTimeCriteria: Interval[]
  ): ScoredGame[] {
    console.time('GameScorer.score')
    const bggRatingScoreByGame = this._bggRatingScorer.score(games)
    const favoriteMatchScoreByGame = this._favoriteMatchScorer.score(games, favoriteGames)
    const playTimeScoreByGame = this._playTimeScorer.score(games, playersSet, playTimeCriteria)
    const playersScoreByGame = this._playersScorer.score(games, playersSet)
    const randomDailyScoreByGame = this._randomDailyScorer.score(games)
    const recentlyPlayedScoreByGame = this._recentlyPlayedScorer.score(games)

    const scoredGames: ScoredGame[] = []
    for (const game of games) {
      const gameId = game.bgg.id
      const bggRatingScore = bggRatingScoreByGame.get(gameId) || 0
      const favoriteMatchScore = favoriteMatchScoreByGame.get(gameId) || 0
      const playTimeScore = playTimeScoreByGame.get(gameId) || 0
      const playersScore = playersScoreByGame.get(gameId) || 0
      const randomDailyScore = randomDailyScoreByGame.get(gameId) || 0
      const recentlyPlayedScore = recentlyPlayedScoreByGame.get(gameId) || 0

      if (favoriteGames.length > 0 && favoriteMatchScore === 0) {
        // Ignore games that have nothing in common
        continue
      }

      const score =
        bggRatingScore * this._bggRatingBoost +
        favoriteMatchScore * this._favoriteMatchBoost +
        playTimeScore * this._playTimeBoost +
        playersScore * this._playersBoost +
        randomDailyScore * this._randomDailyBoost +
        recentlyPlayedScore * this._recentlyPlayedBoost

      scoredGames.push({
        game,
        bggRatingScore,
        favoriteMatchScore,
        playTimeScore,
        playersScore,
        randomDailyScore,
        recentlyPlayedScore,
        score,
        relevantScores: []
      })
    }

    scoredGames.sort((a, b) => b.score - a.score)

    // Detect which components were the most relevant
    this._detectRelevant(scoredGames, 'bggRating', (game) => game.bggRatingScore)
    this._detectRelevant(scoredGames, 'favoriteMatch', (game) => game.favoriteMatchScore)
    this._detectRelevant(scoredGames, 'playTime', (game) => game.playTimeScore)
    this._detectRelevant(scoredGames, 'players', (game) => game.playersScore)
    this._detectRelevant(scoredGames, 'randomDaily', (game) => game.randomDailyScore)
    this._detectRelevant(scoredGames, 'recentlyPlayed', (game) => game.recentlyPlayedScore)

    console.timeEnd('GameScorer.score')
    return scoredGames
  }

  _detectRelevant(
    scoredGames: ScoredGame[],
    kind: ScoreKind,
    getValue: (game: ScoredGame) => number
  ): void {
    const sortedScores = scoredGames.map(getValue).sort((a, b) => a - b)
    const relevancyIndex = Math.floor(
      (sortedScores.length - 1) * (1 - this._relevancyPercentile / 100)
    )
    const thresholdScore = sortedScores[relevancyIndex]

    for (const scoredGame of scoredGames) {
      if (getValue(scoredGame) > thresholdScore) {
        scoredGame.relevantScores.push(kind)
      }
    }
  }
}
