import type { Game } from '@/database'

/**
 * Randomly chose a fraction of the game every day to "promote"
 */
export class RandomDailyScorer {
  static selectProbability: number = 10
  private readonly selectedGameIds: Set<string>

  constructor(games: Game[]) {
    const today = new Date().toISOString().slice(0, 10)

    this.selectedGameIds = new Set()
    for (const game of games) {
      if (game.ownedByClub) {
        const hash = RandomDailyScorer.hash(today + game.bgg.id)
        if (hash % 100 < RandomDailyScorer.selectProbability) {
          this.selectedGameIds.add(game.bgg.id)
        }
      }
    }
  }

  /**
   * Calculate the i32 hash from a string, using the simple `djb2` algorithm.
   * Based on http://www.cse.yorku.ca/~oz/hash.html
   */
  private static hash(text: string): number {
    let hash = 5381

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) + hash + char
    }

    return hash >>> 0
  }

  score(games: Game[]): { scored: Map<string, number>; relevant: Set<string> } {
    const scored = new Map()
    const relevant: Set<string> = new Set()

    for (const game of games) {
      const id = game.bgg.id
      if (this.selectedGameIds.has(id)) {
        scored.set(id, 1)
        relevant.add(id)
      }
    }

    return { scored, relevant }
  }
}
