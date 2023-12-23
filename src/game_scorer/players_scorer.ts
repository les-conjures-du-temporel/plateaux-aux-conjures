import type { Game } from '@/database'

/**
 * Score games based on the recommendation for the number of players from BGG community
 *
 * Return 1 for a game that has it as the "best" configuration, 0.5 for "recommended" and 0 otherwise
 */
export class PlayersScorer {
  // The minimum number of votes on a give question in order to consider its answers
  static _minimumVotes: number = 10
  static _maxPlayers: number = 10
  _scoreByGameAndPlayers: Map<string, Map<number, number>>

  constructor(games: Game[]) {
    this._scoreByGameAndPlayers = new Map()
    for (const game of games) {
      const scoreByPlayers = PlayersScorer._calculateScoreByPlayers(game)

      this._scoreByGameAndPlayers.set(game.bgg.id, scoreByPlayers)
    }
  }

  static _calculateScoreByPlayers(game: Game): Map<number, number> {
    const scoreByPlayers = new Map()

    for (const poll of game.bgg.playersPolls) {
      const { bestVotes, recommendedVotes, notRecommendedVotes } = poll
      if (bestVotes + recommendedVotes + notRecommendedVotes < PlayersScorer._minimumVotes) {
        continue
      }

      let score
      if (bestVotes >= recommendedVotes && bestVotes >= notRecommendedVotes) {
        score = 1
      } else if (recommendedVotes >= bestVotes && recommendedVotes >= notRecommendedVotes) {
        score = 0.5
      } else {
        score = 0
      }

      if (!poll.isMoreThan) {
        scoreByPlayers.set(poll.players, score)
      } else {
        scoreByPlayers.set(poll.players + 1, score)
        for (let i = poll.players + 2; i <= PlayersScorer._maxPlayers; i++) {
          scoreByPlayers.set(i, score)
        }
      }
    }

    console.log(new Map(scoreByPlayers.entries()))
    const maxPlayers = Array.from(scoreByPlayers.keys()).reduce((a, b) => Math.max(a, b))
    console.log(maxPlayers)
    let sum = 0
    let count = 0
    for (let i = PlayersScorer._maxPlayers; i <= maxPlayers; i++) {
      const score = scoreByPlayers.get(i)
      if (score !== undefined) {
        sum += score
        count += 1
      }
      scoreByPlayers.delete(i)
    }
    if (count > 0) {
      scoreByPlayers.set(PlayersScorer._maxPlayers, sum / count)
    }
    return scoreByPlayers
  }

  score(games: Game[], playersSet: Set<number>): Map<string, number> {
    const scoredGames = new Map()

    for (const game of games) {
      const scoreByPlayers = this._scoreByGameAndPlayers.get(game.bgg.id)
      if (scoreByPlayers) {
        let rawScore = 0
        for (const players of playersSet) {
          rawScore += scoreByPlayers.get(players) || 0
        }
        scoredGames.set(game.bgg.id, rawScore / playersSet.size)
      }
    }

    return scoredGames
  }
}
