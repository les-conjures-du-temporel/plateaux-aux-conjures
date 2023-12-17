import type { Database, Game } from '@/database'
import type { BggGame } from '@/board_game_geek'
import { normalizeClubCode } from '@/helpers'
import { searchGames } from '@/board_game_geek'

export type SearchResult = { id: string; name: string }
export type SearchResultsCallback = (hits: SearchResult[]) => void

export class GameSeacher {
  _db: Database
  _localGames: Promise<{ text: string; game: Game }[]>
  _remoteGames: { text: string; game: BggGame }[] = []
  bggDebounce: number = 1000
  maxResults: number = 5

  constructor(db: Database) {
    this._db = db
    this._localGames = GameSeacher._loadLocalGames(db)
  }

  /**
   * Do the search to fill in the auto-complete suggestions in the search field.
   *
   * This will do a fast search on the local results, then after a time request more results from BGG.
   * If there are too many local results, the BGG api will not be called.
   *
   * The search term can also be a club code.
   *
   * Club-owned games will be higher on the result list.
   */
  autoCompleteSearch(
    term: string,
    abortSignal: AbortSignal,
    resultsCallback: SearchResultsCallback
  ): void {
    const normalizedTerm = GameSeacher._normalizeText(term)

    this._localGames.then((localGames) => {
      const hitIds = new Set()
      const localHits = []

      const clubCode = normalizeClubCode(term)
      if (clubCode) {
        for (const localGame of localGames) {
          if (localGame.game.clubCode === clubCode) {
            localHits.push(localGame)
            hitIds.add(localGame.game.bgg.id)
            break
          }
        }
      }

      for (const localGame of localGames) {
        const gameId = localGame.game.bgg.id
        if (localGame.text.includes(normalizedTerm) && !hitIds.has(gameId)) {
          localHits.push(localGame)
          hitIds.add(gameId)
        }
      }

      if (localHits.length > this.maxResults) {
        // Too many results, search is too broad
        resultsCallback([])
        return
      }

      resultsCallback(
        localHits.map((hit) => ({
          id: hit.game.bgg.id,
          name: hit.game.name
        }))
      )

      setTimeout(() => {
        if (abortSignal.aborted) {
          return
        }

        searchGames(term).then((bggHits) => {
          // TODO
        })
      }, this.bggDebounce)
    })
  }

  async searchRemote(term: string, abort: AbortSignal): Promise<BggGame[]> {}

  static async _loadLocalGames(db: Database): Promise<{ text: string; game: Game }[]> {
    const games = await db.getGamesWithCache()

    return games.map((game) => {
      const names = [game.name, game.bgg.primaryName, ...game.bgg.secondaryNames]
      const text = names.join(' ')
      return { text: GameSeacher._normalizeText(text), game }
    })
  }

  /**
   * Remove diacritics and other non-latin letters
   */
  static _normalizeText(text: string): string {
    return text
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
  }
}
