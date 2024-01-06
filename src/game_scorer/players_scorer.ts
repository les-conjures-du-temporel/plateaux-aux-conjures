import type { Game } from '@/database'

/**
 * Score games based on the recommendation for the number of players from BGG community
 *
 * Return 1 for a game that has it as the "best" configuration, 0.5 for "recommended" and 0 otherwise
 */
export class PlayersScorer {
  // The minimum number of votes on a give question in order to consider its answers
  private static readonly minimumVotes: number = 10
  // The maximum number of players to consider when summarizing poll results.
  // For example, when `10`, polls that end with a question like "more than 6" will have this answer applied to values
  // from 7 through 10. Additionally, polls that have questions like "10", "11" and "more than 11" will have these 3
  // answer combined into a "10". The valid answers will be averaged.
  // This mechanism is used to give reasonable answers to difficult questions like: "is this game compatible with 7+
  // players?". Both the question and the poll will have these unbounded intervals collapsed to a single value.
  private static readonly maxPlayers: number = 10
  private readonly scoreByGameAndPlayers: Map<string, Map<number, number>>

  constructor(games: Game[]) {
    this.scoreByGameAndPlayers = new Map()
    for (const game of games) {
      const scoreByPlayers = PlayersScorer.calculateScoreByPlayers(game)

      this.scoreByGameAndPlayers.set(game.bgg.id, scoreByPlayers)
    }
  }

  private static calculateScoreByPlayers(game: Game): Map<number, number> {
    const scoreByPlayers = new Map()
    let maxPlayers = PlayersScorer.maxPlayers

    for (const poll of game.bgg.playersPolls) {
      const { bestVotes, recommendedVotes, notRecommendedVotes } = poll
      if (bestVotes + recommendedVotes + notRecommendedVotes < PlayersScorer.minimumVotes) {
        // Not enough answers
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
        maxPlayers = Math.max(maxPlayers, poll.players)
      } else {
        // Spread the answer from `N+1` through `maxPlayers`
        scoreByPlayers.set(poll.players + 1, score)
        maxPlayers = Math.max(maxPlayers, poll.players + 1)
        for (let i = poll.players + 2; i <= PlayersScorer.maxPlayers; i++) {
          scoreByPlayers.set(i, score)
        }
      }
    }

    // Average answers above `maxPlayers`
    let sum = 0
    let count = 0
    for (let i = PlayersScorer.maxPlayers; i <= maxPlayers; i++) {
      const score = scoreByPlayers.get(i)
      if (score !== undefined) {
        sum += score
        count += 1
        scoreByPlayers.delete(i)
      }
    }
    if (count > 0) {
      scoreByPlayers.set(PlayersScorer.maxPlayers, sum / count)
    }

    return scoreByPlayers
  }

  score(games: Game[], playersSet: Set<number>): Map<string, number> {
    const scoredGames = new Map()

    for (const game of games) {
      const scoreByPlayers = this.scoreByGameAndPlayers.get(game.bgg.id)
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
