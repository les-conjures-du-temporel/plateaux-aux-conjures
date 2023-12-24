import type { Game } from '@/database'

export type Interval = [number, number]

/**
 * Score games based on the likelihood that they respect the play time requested
 *
 * Return 1 for a game that is likely to respect it and 0 for a game that is unlikely.
 *
 * This is based on a simple model: for each game with an interval of play time and players, the minimum play time is
 * correct for the minimum players and the maximum play time is correct for the maximum players.
 *
 * For example, a game with players 2 - 6 and play time 30 - 60 will be assumed to be:
 * - 2 = 30
 * - 3 = 37.5
 * - 4 = 45
 * - 5 = 52.5
 * - 6 = 60
 *
 * When querying for a game with play time of 20 - 40 for 2 players, it's likely since 20 <= 30 <= 40.
 * However, the same game for 5 players its unlikely since 52.5 > 40.
 */
export class PlayTimeScorer {
  // The score when the value is not known
  _unknownScore = 0.5

  score(games: Game[], playersSet: Set<number>, playTimeCriteria: Interval[]): Map<string, number> {
    const scoredGames = new Map()

    for (const game of games) {
      scoredGames.set(game.bgg.id, this._scoreGame(game, playersSet, playTimeCriteria))
    }

    return scoredGames
  }

  /**
   * Return 1 if the play time is likely to be respected for the given number of players, 0 if not and `null` if
   * unknown.
   */
  _scoreGame(game: Game, playersSet: Set<number>, playTimeCriteria: Interval[]): number {
    const { minPlayers, maxPlayers, minPlayTimeMinutes, maxPlayTimeMinutes } = game.bgg
    if (!minPlayers || !maxPlayers || !minPlayTimeMinutes || !maxPlayTimeMinutes) {
      return this._unknownScore
    }

    let rawScore = 0
    let counts = 0
    for (const players of playersSet) {
      if (players < minPlayers || players > maxPlayers) {
        continue
      }

      const ratio = (players - minPlayers) / (maxPlayers - minPlayers)
      const estimatedPlayTime =
        minPlayTimeMinutes + (maxPlayTimeMinutes - minPlayTimeMinutes) * ratio
      for (const [minBound, maxBound] of playTimeCriteria) {
        if (estimatedPlayTime >= minBound && estimatedPlayTime <= maxBound) {
          rawScore += 1
        }
      }

      counts += playTimeCriteria.length
    }

    return counts === 0 ? this._unknownScore : rawScore / counts
  }
}
