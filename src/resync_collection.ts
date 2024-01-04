import { getGamesInBatches, listGamesInUserCollection } from '@/board_game_geek'
import { boardGameGeekUser } from '@/config'
import type { Database, Game } from '@/database'
import { buildGameFromBggGame } from '@/helpers'

export type ProgressCallback = (message: string, level: 'info' | 'warn') => void

/**
 * Updates the database with the games from the board game geek collection
 */
export async function resyncCollection(db: Database, progressCallback: ProgressCallback) {
  // Extract current data from db
  const staleGamesList = db.games.value
  const staleGames = new Map(staleGamesList.map((game) => [game.bgg.id, game]))
  progressCallback(`Database currently has ${staleGames.size} items`, 'info')

  // Extract data from bgg
  const novelGames = await listGamesInUserCollection(boardGameGeekUser, progressCallback)
  const novelGameById = new Map(novelGames.map((game) => [game.id, game]))
  const allBggIds = new Set([...staleGames.keys(), ...novelGameById.keys()])
  const bggGamesList = await getGamesInBatches(Array.from(allBggIds), progressCallback)
  const bggGames = new Map(bggGamesList.map((game) => [game.id, game]))

  // Detect what to do with each game
  const gamesToAdd: Game[] = []
  const gamesToUpdate = new Map()
  for (const id of allBggIds) {
    const bggGame = bggGames.get(id)
    if (!bggGame) {
      progressCallback(`Game ${id} was not found in BGG`, 'warn')
      continue
    }

    const staleGame = staleGames.get(id)
    const novelGameName = novelGameById.get(id)?.name
    if (!staleGame) {
      gamesToAdd.push(buildGameFromBggGame(bggGame, true, novelGameName))
    } else {
      gamesToUpdate.set(id, {
        bgg: bggGame,
        ownedByClub: novelGameById.has(id),
        name: novelGameName || staleGame.name
      })
    }
  }

  progressCallback(
    `Will insert ${gamesToAdd.length} and update ${gamesToUpdate.size} games`,
    'info'
  )
  await db.batchAdd(gamesToAdd)
  await db.batchUpdate(gamesToUpdate)

  progressCallback('Done', 'info')
}
