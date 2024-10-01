import { getGamesInBatches, listGamesInUserCollection } from '@/board_game_geek'
import { boardGameGeekFestivalUser, boardGameGeekUser } from '@/config'
import type { Database } from '@/database'
import { buildGameFromBggGame } from '@/helpers'
import type { CloudFunctions } from '@/cloud_functions'

export type ProgressCallback = (message: string, level: 'info' | 'warn') => void

/**
 * Updates the database with the games from the board game geek collection
 */
export async function resyncCollection(
  db: Database,
  cloudFunctions: CloudFunctions,
  progressCallback: ProgressCallback
) {
  // Extract current data from db
  const staleGamesList = db.games.value
  const staleGames = new Map(staleGamesList.map((game) => [game.bgg.id, game]))
  progressCallback(`Database currently has ${staleGames.size} items`, 'info')

  // Extract data from bgg
  const novelGames = await listGamesInUserCollection(boardGameGeekUser, progressCallback)
  const novelFestivalGames = await listGamesInUserCollection(
    boardGameGeekFestivalUser,
    progressCallback
  )
  const novelGameById = new Map(novelGames.map((game) => [game.id, game]))
  const novelFestivalGameById = new Map(novelFestivalGames.map((game) => [game.id, game]))
  const allBggIds = new Set([
    ...staleGames.keys(),
    ...novelGameById.keys(),
    ...novelFestivalGameById.keys()
  ])
  const bggGamesList = await getGamesInBatches(Array.from(allBggIds), progressCallback)
  const bggGames = new Map(bggGamesList.map((game) => [game.id, game]))

  // Detect what to do with each game
  const gamesToAdd = []
  const gamesToUpdate = []
  for (const id of allBggIds) {
    const bggGame = bggGames.get(id)
    if (!bggGame) {
      progressCallback(`Game ${id} was not found in BGG`, 'warn')
      continue
    }

    const staleGame = staleGames.get(id)
    const ownedByClub = novelGameById.has(id)
    const availableAtFestival = novelFestivalGameById.has(id)
    const name =
      novelGameById.get(id)?.name || novelFestivalGameById.get(id)?.name || staleGame?.name
    if (!staleGame) {
      const value = buildGameFromBggGame(bggGame, ownedByClub, availableAtFestival, name)
      gamesToAdd.push({ id, value })
    } else {
      gamesToUpdate.push({
        id,
        updates: {
          bgg: bggGame,
          ownedByClub,
          availableAtFestival,
          name
        }
      })
    }
  }

  progressCallback(
    `Will insert ${gamesToAdd.length} and update ${gamesToUpdate.length} games`,
    'info'
  )
  await cloudFunctions.batchUpdateGames(gamesToAdd, gamesToUpdate)

  progressCallback('Done', 'info')
}
