import type { ProgressCallback } from '@/resync_collection'
import { sleep } from '@/helpers'

const BASE_URL = 'https://www.boardgamegeek.com/xmlapi2'
const REQUEST_TIMEOUT = 10e3
const EXPORT_COLLECTION_QUEUE_TIMEOUT = 120e3
const EXPORT_COLLECTION_QUEUE_SLEEP = 2e3
const GET_GAMES_BATCH_SIZE = 10
const GET_GAMES_BATCH_SLEEP = 2e3

/**
 * Represents a board game retrieved from BoardGameGeek API.
 */
export interface BggGame {
  id: string
  thumbnail: string | null
  primaryName: string
  // Note that sometimes the French name is stored in BGG in this secondary list
  secondaryNames: string[]
  minPlayers: number | null
  maxPlayers: number | null
  minPlayTimeMinutes: number | null
  maxPlayTimeMinutes: number | null
  minAge: number | null
  categories: string[]
  mechanics: string[]
  designers: string[]
  artists: string[]
  averageRating: number | null
  bayesAverageRating: number | null
  averageWeight: number | null
}

export async function listGameIdsInUserCollection(
  username: string,
  progressCallback: ProgressCallback
): Promise<string[]> {
  const encodedUsername = encodeURIComponent(username)
  const apiUrl = `${BASE_URL}/collection?username=${encodedUsername}&brief=1&excludesubtype=boardgameexpansion`
  const start = Date.now()

  let response = null
  while (Date.now() - start < EXPORT_COLLECTION_QUEUE_TIMEOUT) {
    response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)
    if (response.status !== 202) {
      break
    }

    progressCallback({ message: 'BGG has queued request for user collection', level: 'info' })
    await sleep(EXPORT_COLLECTION_QUEUE_SLEEP)
  }

  if (!response) {
    throw new Error('BGG took to long to export collection')
  } else if (response.status !== 200) {
    throw new Error(`BGG responded with ${response.status}`)
  }

  const data = await response.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(data, 'text/xml')

  const gamesIds = []
  for (const element of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const gameId = element.getAttribute('objectid')
    if (gameId) {
      gamesIds.push(gameId)
    }
  }

  progressCallback({
    message: `Listed ${gamesIds.length} board games from collection`,
    level: 'info'
  })
  return gamesIds
}

export async function getGamesInBatches(
  ids: string[],
  progressCallback: ProgressCallback
): Promise<BggGame[]> {
  const games = []
  for (let i = 0; i < ids.length; i += GET_GAMES_BATCH_SIZE) {
    if (i > 0) {
      await sleep(GET_GAMES_BATCH_SLEEP)
    }
    const subIds = ids.slice(i, i + GET_GAMES_BATCH_SIZE)

    progressCallback({
      message: `Will request ${subIds.length} more board games from BGG`,
      level: 'info'
    })
    let newGames
    try {
      newGames = await getGames(subIds, progressCallback)
    } catch (error) {
      progressCallback({ message: `Failed with ${error}. Will retry`, level: 'warn' })
      await sleep(GET_GAMES_BATCH_SLEEP)
      newGames = await getGames(subIds, progressCallback)
    }
    games.push(...newGames)
  }

  progressCallback({ message: `Successfully extracted ${games.length} board games`, level: 'info' })
  return games
}

export type BggSearchHit = { id: string; name: string }

export async function searchGames(term: string): Promise<BggSearchHit[]> {
  const encodedTerm = encodeURIComponent(term)
  const apiUrl = `${BASE_URL}/search?type=boardgame&query=${encodedTerm}`
  const response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)

  if (response.status !== 200) {
    throw new Error(`BGG responded with ${response.status}`)
  }
  const data = await response.text()

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(data, 'text/xml')

  const searchHits = []
  for (const gameEl of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const id = gameEl.getAttribute('id')
    const name = gameEl.querySelector('name')?.getAttribute('value')

    if (id && name) {
      searchHits.push({ id, name })
    }
  }

  return searchHits
}

async function fetchWithTimeout(url: string, time: number): Promise<Response> {
  const controller = new AbortController()
  const signal = controller.signal

  const timeout = setTimeout(() => {
    controller.abort()
  }, time)

  const response = await fetch(url, { signal })

  clearTimeout(timeout)

  return response
}

async function getGames(ids: string[], progressCallback: ProgressCallback): Promise<BggGame[]> {
  const games: BggGame[] = []

  const idsParam = encodeURIComponent(ids.join(','))
  const apiUrl = `${BASE_URL}/things?id=${idsParam}&stats=1`
  const response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)

  if (response.status !== 200) {
    throw new Error(`BGG responded with ${response.status}`)
  }

  const data = await response.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(data, 'text/xml')

  for (const gameEl of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const game = parseGameElement(gameEl)
    if (game) {
      games.push(game)
    }
  }

  for (const id of ids) {
    if (!games.some((game) => game.id === id)) {
      progressCallback({ message: `Failed to extract data for board game ${id}`, level: 'warn' })
    }
  }

  return games
}

function parseGameElement(gameEl: Element): BggGame | null {
  function extractString(text: string | undefined | null): string | null {
    if (!text) {
      return null
    }
    return text.trim() || null
  }

  function extractNumber(element: Element | null): number | null {
    const text = extractString(element?.getAttribute('value'))
    if (!text) {
      return null
    }
    try {
      return Number.parseFloat(text)
    } catch {
      return null
    }
  }

  function extractStrings(elements: NodeListOf<Element>): string[] {
    const result = []
    for (const element of Array.from(elements)) {
      const text = extractString(element.getAttribute('value'))
      if (text) {
        result.push(text)
      }
    }
    return result
  }

  const gameId = gameEl.getAttribute('id')
  if (!gameId) {
    return null
  }
  const primaryName = extractString(
    gameEl.querySelector('name[type="primary"]')?.getAttribute('value')
  )

  return {
    id: gameId,
    thumbnail: extractString(gameEl.querySelector('thumbnail')?.textContent),
    primaryName: primaryName || '(failed to extract name)',
    secondaryNames: extractStrings(gameEl.querySelectorAll('name[type="alternate"]')),
    minPlayers: extractNumber(gameEl.querySelector('minplayers')),
    maxPlayers: extractNumber(gameEl.querySelector('maxplayers')),
    minPlayTimeMinutes: extractNumber(gameEl.querySelector('minplaytime')),
    maxPlayTimeMinutes: extractNumber(gameEl.querySelector('maxplaytime')),
    minAge: extractNumber(gameEl.querySelector('minage')),
    categories: extractStrings(gameEl.querySelectorAll('link[type="boardgamecategory"]')),
    mechanics: extractStrings(gameEl.querySelectorAll('link[type="boardgamemechanic"]')),
    designers: extractStrings(gameEl.querySelectorAll('link[type="boardgamedesigner"]')),
    artists: extractStrings(gameEl.querySelectorAll('link[type="boardgameartist"]')),
    averageRating: extractNumber(gameEl.querySelector('statistics > ratings > average')),
    bayesAverageRating: extractNumber(gameEl.querySelector('statistics > ratings > bayesaverage')),
    averageWeight: extractNumber(gameEl.querySelector('statistics > ratings > averageweight'))
  }
}
