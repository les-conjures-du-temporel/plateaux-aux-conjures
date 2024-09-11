import type { ProgressCallback } from '@/resync_collection'
import { sleep } from '@/helpers'

const BASE_URL = 'https://www.boardgamegeek.com/xmlapi2'
const REQUEST_TIMEOUT = 10e3
const EXPORT_COLLECTION_QUEUE_TIMEOUT = 120e3
const EXPORT_COLLECTION_QUEUE_SLEEP = 4e3
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
  playersPolls: PlayersPoll[]
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
  yearPublished: number | null
}

/**
 * Represents the community answers to the pool of suggested number of players.
 *
 * The BGG site let users vote for different amount of players, whether they recommend or not playing this game with
 * this many players. Each question has three possible answers: best, recommended, not recommended.
 */
export interface PlayersPoll {
  players: number
  // This is `true` when the question is about `more than ${players}`, usually the last question
  isMoreThan: boolean
  bestVotes: number
  recommendedVotes: number
  notRecommendedVotes: number
}

export async function listGamesInUserCollection(
  username: string,
  progressCallback: ProgressCallback
): Promise<{ id: string; name: string }[]> {
  const encodedUsername = encodeURIComponent(username)
  const apiUrl = `${BASE_URL}/collection?username=${encodedUsername}&brief=1&excludesubtype=boardgameexpansion`
  const start = Date.now()

  let response = null
  while (Date.now() - start < EXPORT_COLLECTION_QUEUE_TIMEOUT) {
    response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)
    if (response.status !== 202) {
      break
    }

    progressCallback('BGG has queued request for user collection', 'info')
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

  const games = []
  for (const element of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const id = element.getAttribute('objectid')
    const name = element.querySelector('name')?.textContent
    if (id && name) {
      games.push({ id, name })
    }
  }

  progressCallback(`Listed ${games.length} board games from collection`, 'info')
  return games
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

    progressCallback(`Will request ${subIds.length} more board games from BGG`, 'info')
    let newGames
    try {
      newGames = await getGames(subIds, progressCallback)
    } catch (error) {
      progressCallback(`Failed with ${error}. Will retry`, 'warn')
      await sleep(GET_GAMES_BATCH_SLEEP)
      newGames = await getGames(subIds, progressCallback)
    }
    games.push(...newGames)
  }

  progressCallback(`Successfully extracted ${games.length} board games`, 'info')
  return games
}

export interface BggSearchHit {
  id: string
  name: string
  yearPublished: number | null
}

export async function searchGames(term: string): Promise<BggSearchHit[]> {
  const encodedTerm = encodeURIComponent(term)

  // Note that there is a bug (or feature) in the BGG api: even when requesting with `type=boardgame`, the API results
  // expansions. Since we don't want to include expansions in the result, we do a separate parallels search asking only
  // for expansions in order to remove them from the results
  const apiUrl = `${BASE_URL}/search?type=boardgame&query=${encodedTerm}`
  const apiExpansionUrl = `${BASE_URL}/search?type=boardgameexpansion&query=${encodedTerm}`
  const [response, expansionResponse] = await Promise.all([
    fetchWithTimeout(apiUrl, REQUEST_TIMEOUT),
    fetchWithTimeout(apiExpansionUrl, REQUEST_TIMEOUT)
  ])

  if (response.status !== 200) {
    throw new Error(`BGG responded with ${response.status}`)
  }
  if (expansionResponse.status !== 200) {
    throw new Error(`BGG responded with ${expansionResponse.status}`)
  }

  // Parse expansion ids
  const expansionIds = new Set()
  const expansionsData = await expansionResponse.text()
  const expansionsParser = new DOMParser()
  const expansionsXmlDoc = expansionsParser.parseFromString(expansionsData, 'text/xml')
  for (const gameEl of Array.from(expansionsXmlDoc.getElementsByTagName('item'))) {
    const id = gameEl.getAttribute('id')
    if (id) {
      expansionIds.add(id)
    }
  }

  // Parse game data, ignoring expansions
  const data = await response.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(data, 'text/xml')

  const searchHits = []
  for (const gameEl of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const id = gameEl.getAttribute('id')
    const name = gameEl.querySelector('name')?.getAttribute('value')
    let yearPublished = null
    try {
      const yearText = gameEl.querySelector('yearpublished')?.getAttribute('value')
      yearPublished = yearText ? Number.parseInt(yearText) : null
    } catch (_) {
      /* empty */
    }

    if (id && name && !expansionIds.has(id)) {
      searchHits.push({ id, name, yearPublished })
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
    try {
      games.push(parseGameElement(gameEl, progressCallback))
    } catch (error) {
      progressCallback(`Failed to extract data for board game: ${error}`, 'warn')
    }
  }

  for (const id of ids) {
    if (!games.some((game) => game.id === id)) {
      progressCallback(`Could not find data for board game ${id}`, 'warn')
    }
  }

  return games
}

function parseGameElement(gameEl: Element, progressCallback: ProgressCallback): BggGame {
  const gameId = gameEl.getAttribute('id')
  if (!gameId) {
    throw Error('Missing game id')
  }
  const primaryName = extractString(
    gameEl.querySelector('name[type="primary"]')?.getAttribute('value')
  )

  const pollEl = gameEl.querySelector('poll[name=suggested_numplayers]')
  const playersPolls = pollEl ? parsePlayersPolls(pollEl, progressCallback) : []

  return {
    id: gameId,
    thumbnail: extractString(gameEl.querySelector('thumbnail')?.textContent),
    primaryName: primaryName || '(failed to extract name)',
    secondaryNames: extractStrings(gameEl.querySelectorAll('name[type="alternate"]')),
    minPlayers: extractNumber(gameEl.querySelector('minplayers')),
    maxPlayers: extractNumber(gameEl.querySelector('maxplayers')),
    playersPolls,
    minPlayTimeMinutes: extractNumber(gameEl.querySelector('minplaytime')),
    maxPlayTimeMinutes: extractNumber(gameEl.querySelector('maxplaytime')),
    minAge: extractNumber(gameEl.querySelector('minage')),
    categories: extractStrings(gameEl.querySelectorAll('link[type="boardgamecategory"]')),
    mechanics: extractStrings(gameEl.querySelectorAll('link[type="boardgamemechanic"]')),
    designers: extractStrings(gameEl.querySelectorAll('link[type="boardgamedesigner"]')),
    artists: extractStrings(gameEl.querySelectorAll('link[type="boardgameartist"]')),
    averageRating: extractNumber(gameEl.querySelector('statistics > ratings > average')),
    bayesAverageRating: extractNumber(gameEl.querySelector('statistics > ratings > bayesaverage')),
    averageWeight: extractNumber(gameEl.querySelector('statistics > ratings > averageweight')),
    yearPublished: extractNumber(gameEl.querySelector('yearpublished'))
  }
}

function parsePlayersPolls(pollEl: Element, progress: ProgressCallback): PlayersPoll[] {
  const results = []
  for (const resultEl of pollEl.querySelectorAll('results')) {
    try {
      results.push(parsePlayersPoll(resultEl))
    } catch (error) {
      progress(`Failed to parse players poll: ${error}`, 'warn')
    }
  }
  return results
}

function parsePlayersPoll(resultEl: Element): PlayersPoll {
  const numPlayersText = resultEl.getAttribute('numplayers')
  if (!numPlayersText) {
    throw Error('Missing numplayers')
  }

  const isMoreThan = numPlayersText.endsWith('+')
  const players = Number.parseInt(isMoreThan ? numPlayersText.slice(0, -1) : numPlayersText)

  const bestVotesText = resultEl.querySelector('result[value=Best]')?.getAttribute('numvotes')
  const recommendedVotesText = resultEl
    .querySelector('result[value=Recommended]')
    ?.getAttribute('numvotes')
  const notRecommendedVotesText = resultEl
    .querySelector('result[value="Not Recommended"]')
    ?.getAttribute('numvotes')
  const bestVotes = Number.parseInt(bestVotesText || '0')
  const recommendedVotes = Number.parseInt(recommendedVotesText || '0')
  const notRecommendedVotes = Number.parseInt(notRecommendedVotesText || '0')

  return {
    players,
    isMoreThan,
    bestVotes,
    recommendedVotes,
    notRecommendedVotes
  }
}

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
