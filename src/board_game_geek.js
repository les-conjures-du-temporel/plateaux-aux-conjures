const BASE_URL = 'https://www.boardgamegeek.com/xmlapi2'
const REQUEST_TIMEOUT = 10e3
const EXPORT_COLLECTION_QUEUE_TIMEOUT = 120e3
const EXPORT_COLLECTION_QUEUE_SLEEP = 2e3

export async function listGameIdsInUserCollection(username, progressCallback) {
  const apiUrl = `${BASE_URL}/collection?username=${encodeURIComponent(username)}&brief=1`
  const start = Date.now()

  let response
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

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function fetchWithTimeout(url, time) {
  const controller = new AbortController()
  const signal = controller.signal

  const timeout = setTimeout(() => {
    controller.abort()
  }, time)

  const response = await fetch(url, { signal })

  clearTimeout(timeout)

  return response
}