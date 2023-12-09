const BASE_URL = 'https://www.boardgamegeek.com/xmlapi2'
const REQUEST_TIMEOUT = 10e3
const EXPORT_COLLECTION_QUEUE_TIMEOUT = 120e3
const EXPORT_COLLECTION_QUEUE_SLEEP = 2e3

export async function listGameIdsInUserCollection(
  username: string,
  progressCallback: (message: string) => void
): Promise<string[]> {
  const apiUrl: string = `${BASE_URL}/collection?username=${encodeURIComponent(username)}&brief=1`
  const start: number = Date.now()

  let response: Response
  while (Date.now() - start < EXPORT_COLLECTION_QUEUE_TIMEOUT) {
    response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT)
    if (response.status !== 202) {
      break
    }

    progressCallback('BGG has queued request for user collection')
    await sleep(EXPORT_COLLECTION_QUEUE_SLEEP)
  }

  if (response.status !== 200) {
    throw new Error(`Server responded with ${response.status}`)
  }

  const data: string = await response.text()
  const parser: DOMParser = new DOMParser()
  const xmlDoc: Document = parser.parseFromString(data, 'text/xml')

  const gamesIds: string[] = []
  for (const element of Array.from(xmlDoc.getElementsByTagName('item'))) {
    const gameId: string | null = element.getAttribute('objectid')
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
  const controller: AbortController = new AbortController()
  const signal: AbortSignal = controller.signal

  const timeout: number = setTimeout(() => {
    controller.abort()
  }, time)

  const response: Response = await fetch(url, { signal })

  clearTimeout(timeout)

  return response
}
