import type { Game } from '@/database'
import type { BggSearchHit } from '@/board_game_geek'
import { getGamesInBatches, searchGames } from '@/board_game_geek'
import { buildGameFromBggGame, normalizeClubCode, sleep } from '@/helpers'
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'

export interface SearchHit {
  id: string
  name: string
  yearPublished: number | null
  ownedByClub: boolean
}
export type SearchResultsCallback = (hits: SearchHit[], searchingBgg: boolean) => void

export class GameSearcher {
  _games: Ref<Game[]>
  _localGames: ComputedRef<{ text: string; game: Game }[]>
  _bggSearchCache: Map<string, BggSearchHit[]> = new Map()
  _bggGameCache: Map<string, Game> = new Map()
  bggDebounce: number = 1000
  maxResults: number = 7
  maxFullResults: number = 40

  constructor(games: Ref<Game[]>) {
    this._games = games
    this._localGames = computed(() => {
      return GameSearcher._calculateLocalGames(games.value)
    })
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
  searchForAutoComplete(
    term: string,
    abortSignal: AbortSignal,
    resultsCallback: SearchResultsCallback
  ): void {
    const normalizedTerm = GameSearcher._normalizeText(term)

    const localGames = this._localGames.value
    const hitIds = new Set()
    const hits: SearchHit[] = []

    const clubCode = normalizeClubCode(term)
    if (clubCode) {
      for (const localGame of localGames) {
        if (localGame.game.clubCode === clubCode) {
          const gameId = localGame.game.bgg.id
          hits.push({
            name: localGame.game.name,
            yearPublished: localGame.game.bgg.yearPublished,
            id: gameId,
            ownedByClub: localGame.game.ownedByClub
          })
          hitIds.add(gameId)
          break
        }
      }
    }

    for (const localGame of localGames) {
      const gameId = localGame.game.bgg.id
      if (localGame.text.includes(normalizedTerm) && !hitIds.has(gameId)) {
        hits.push({
          name: localGame.game.name,
          yearPublished: localGame.game.bgg.yearPublished,
          id: gameId,
          ownedByClub: localGame.game.ownedByClub
        })
        hitIds.add(gameId)
      }

      if (hits.length > this.maxResults) {
        // Too many results, search is too broad
        resultsCallback([], false)
        return
      }
    }

    if (hits.length === this.maxResults) {
      // Don't do search on BGG
      resultsCallback(hits, false)
      return
    }

    // Dispatch search on BGG
    resultsCallback(hits.slice(), true)

    this._searchBgg(term, abortSignal, this.bggDebounce)
      .then((bggHits) => {
        const idsOwnedByClub = new Set(
          localGames.filter((game) => game.game.ownedByClub).map((game) => game.game.bgg.id)
        )

        for (const bggHit of bggHits) {
          if (!hitIds.has(bggHit.id)) {
            hits.push({
              name: bggHit.name,
              yearPublished: bggHit.yearPublished,
              id: bggHit.id,
              ownedByClub: idsOwnedByClub.has(bggHit.id)
            })
            hitIds.add(bggHit.id)
            if (hits.length >= this.maxResults) {
              break
            }
          }
        }

        resultsCallback(hits, false)
      })
      .catch((error) => {
        console.warn(error)
        resultsCallback(hits, false)
      })
  }

  /**
   * Do a full search using local and remote games
   */
  async doFullSearch(term: string): Promise<Game[]> {
    const gameById = new Map(this._games.value.map((game) => [game.bgg.id, game]))

    const bggHits = await this._searchBgg(term, new AbortController().signal, 0)
    bggHits.splice(this.maxFullResults, Number.MAX_SAFE_INTEGER)

    // Load missing games from BGG
    const missingGameIds = []
    for (const bggHit of bggHits) {
      if (!gameById.has(bggHit.id) && !this._bggGameCache.has(bggHit.id)) {
        missingGameIds.push(bggHit.id)
      }
    }
    await this._populateBggGameCache(missingGameIds)

    const hits: Game[] = []
    for (const bggHit of bggHits) {
      const game = gameById.get(bggHit.id)
      if (game) {
        hits.push(game)
      } else {
        const bggGame = this._bggGameCache.get(bggHit.id)
        if (bggGame) {
          hits.push(bggGame)
        }
      }
    }

    return hits
  }

  /**
   * Load the game information, from either the local db, local cache or BGG
   */
  async loadGame(id: string): Promise<Game> {
    for (const game of this._games.value) {
      if (game.bgg.id === id) {
        return game
      }
    }

    let game = this._bggGameCache.get(id)
    if (game) {
      return game
    }

    await this._populateBggGameCache([id])
    game = this._bggGameCache.get(id)
    if (!game) {
      throw new Error('Could not load game information')
    }
    return game
  }

  /**
   * Search BGG after a delay or, if the results are cached, return them immediately
   */
  async _searchBgg(term: string, abortSignal: AbortSignal, bggDebounce: number) {
    const cached = this._bggSearchCache.get(term)
    if (cached) {
      return cached
    }

    await sleep(bggDebounce)
    if (abortSignal.aborted) {
      return []
    }

    const bggHits = await searchGames(term)
    if (abortSignal.aborted) {
      return []
    }

    this._bggSearchCache.set(term, bggHits)
    return bggHits
  }

  static _calculateLocalGames(games: Game[]): { text: string; game: Game }[] {
    return games.map((game) => {
      const names = [game.name, game.bgg.primaryName, ...game.bgg.secondaryNames]
      const text = names.join(' ')
      return { text: GameSearcher._normalizeText(text), game }
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

  async _populateBggGameCache(ids: string[]) {
    const missingGames = await getGamesInBatches(ids, () => {})
    for (const missingGame of missingGames) {
      this._bggGameCache.set(missingGame.id, buildGameFromBggGame(missingGame, false))
    }
  }
}
