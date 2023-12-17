import type { Database, Game } from '@/database'
import type { BggGame } from '@/board_game_geek'

export class GameSeacher {
  _db: Database
  _localGames: Promise<{ text: string; game: Game }[]>
  _remoteGames: { text: string; game: BggGame }[] = []
  bggDebounce: number = 1000

  constructor(db: Database) {
    this._db = db
    this._localGames = GameSeacher._loadLocalGames(db)
  }

  async searchLocal(term: string): Promise<Game[]> {
    const normalizedTerm = GameSeacher._normalizeText(term)
    const localGames = await this._localGames

    return localGames.filter(({ text }) => text.includes(normalizedTerm)).map(({ game }) => game)
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
