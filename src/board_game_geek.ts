const BASE_URL = 'https://www.boardgamegeek.com/xmlapi2'
const REQUEST_TIMEOUT = 10e3
const EXPORT_COLLECTION_QUEUE_TIMEOUT = 120e3
const EXPORT_COLLECTION_QUEUE_SLEEP = 2e3
const GET_GAMES_BATCH_SIZE = 10
const GET_GAMES_BATCH_SLEEP = 2e3

interface Game {
  id: string
  thumbnail: string | null
  primaryName: string
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
  averageWeight: number | null
}

export async function listGameIdsInUserCollection(
  username: string,
  progressCallback: (message: string) => void
): Promise<string[]> {
  const apiUrl = `${BASE_URL}/collection?username=${encodeURIComponent(username)}&brief=1`
  const start = Date.now()

  let response = null
  while (Date.now() - start < EXPORT_COLLECTION_QUEUE_TIMEOUT) {
    response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)
    if (response.status !== 202) {
      break
    }

    progressCallback('BGG has queued request for user collection')
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

  return gamesIds
}

async function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
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

// TODO: progress messages and error logs
export async function getGamesInBatches(ids: string[]): Promise<Game[]> {
  const games = []
  for (let i = 0; i < ids.length; i += GET_GAMES_BATCH_SIZE) {
    const subIds = ids.slice(i, i + GET_GAMES_BATCH_SIZE)
    games.push(...(await getGames(subIds)))
    await sleep(GET_GAMES_BATCH_SLEEP)
  }
  return games
}

async function getGames(ids: string[]): Promise<Game[]> {
  const games: Game[] = []

  const idsParam = encodeURIComponent(ids.join(','))
  const apiUrl = `${BASE_URL}/things?id=${idsParam}&stats=1`
  const response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)

  if (response.status !== 200) {
    throw new Error(`BGG responded with ${response.status}`)
  }

  const data = await response.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(data, 'text/xml')

  const extractString = (text: string | undefined | null): string | null => {
    if (!text) {
      return null
    }
    return text.trim() || null
  }

  const extractNumber = (element): number | null => {
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

  const extractStrings = (elements): string[] => {
    const result = []
    for (const element of Array.from(elements)) {
      const text = extractString(element.getAttribute('value'))
      if (text) {
        result.push(text)
      }
    }
    return result
  }

  for (const gameEl of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const gameId = gameEl.getAttribute('id')
    if (!gameId) {
      continue
    }

    const game: Game = {
      id: gameId,
      thumbnail: extractString(gameEl.querySelector('thumbnail')?.textContent),
      primaryName:
        extractString(gameEl.querySelector('name[type="primary"]')?.getAttribute('value')) ||
        '(failed to extract name)',
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
      averageWeight: extractNumber(gameEl.querySelector('statistics > ratings > averageweight'))
    }

    games.push(game)
  }

  return games
}
