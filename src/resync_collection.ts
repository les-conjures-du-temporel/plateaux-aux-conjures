import { getGamesInBatches, listGameIdsInUserCollection } from '@/board_game_geek'
import { boardGameGeekUser } from '@/config'
import type { Database, Game } from '@/database'

interface Progress {
  message: string
  level: 'info' | 'warn'
}

export type ProgressCallback = (message: Progress) => void

/**
 * Updates the database with the games from the board game geek collection
 */
export async function resyncCollection(db: Database, progressCallback: ProgressCallback) {
  // Extract current data from db
  const staleGamesList = await db.getGames()
  const staleGames = new Map(staleGamesList.map((game) => [game.bgg.id, game]))
  progressCallback({ message: `Database currently has ${staleGames.size} items`, level: 'info' })

  // Extract data from bgg
  const novelGameIds = new Set(
    await listGameIdsInUserCollection(boardGameGeekUser, progressCallback)
  )
  const allBggIds = new Set([...staleGames.keys(), ...novelGameIds])
  const bggGamesList = await getGamesInBatches(Array.from(allBggIds), progressCallback)
  const bggGames = new Map(bggGamesList.map((game) => [game.id, game]))

  // Detect what to do with each game
  const gamesToAdd: Game[] = []
  const gamesToUpdate: Map<string, any> = new Map()
  for (const id of allBggIds) {
    const bggGame = bggGames.get(id)
    if (!bggGame) {
      progressCallback({ message: `Game ${id} was not found in BGG`, level: 'warn' })
      continue
    }

    const staleGame = staleGames.get(id)
    if (!staleGame) {
      gamesToAdd.push({
        bgg: bggGame,
        clubCode: generateClubCode(),
        lastPlayed: null,
        name: bggGame.primaryName,
        totalPlays: 0
      })
    } else {
      const updates: any = { bgg: bggGame }

      if (novelGameIds.has(id) && !staleGame.clubCode) {
        updates.clubCode = generateClubCode()
      }

      gamesToUpdate.set(id, updates)
    }
  }

  progressCallback({
    message: `Will insert ${gamesToAdd.length} and update ${gamesToUpdate.size} games`,
    level: 'info'
  })
  await db.batchAdd(gamesToAdd)
  await db.batchUpdate(gamesToUpdate)

  progressCallback({ message: 'Done', level: 'info' })
}

function generateClubCode(): string {
  const base32Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  for (let i = 0; i < 5; i++) {
    const index = Math.floor(Math.random() * base32Characters.length)
    result += base32Characters[index]
  }
  return result
}
