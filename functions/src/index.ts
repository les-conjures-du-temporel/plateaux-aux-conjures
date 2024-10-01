import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https'
import * as firebaseAdmin from 'firebase-admin'
import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'

firebaseAdmin.initializeApp()

const writePassCode = defineSecret('WRITE_PASS_CODE')
const firestore = firebaseAdmin.firestore()

interface Response {
  message: string
}

const callOptions = {
  secrets: [writePassCode],
  enforceAppCheck: true,
  region: 'europe-west1'
}

function checkPassCode(request: CallableRequest<{ passCode: string }>): void {
  if (request.data.passCode !== writePassCode.value()) {
    throw new HttpsError('unauthenticated', 'Invalid pass code')
  }
}

interface BatchUpdateGamesRequest {
  passCode: string
  additions: { id: string; value: object }[]
  updates: { id: string; updates: object }[]
}

exports.batchUpdateGames = onCall(
  callOptions,
  async (request: CallableRequest<BatchUpdateGamesRequest>): Promise<Response> => {
    checkPassCode(request)

    const batch = firestore.batch()

    for (const { id, value } of request.data.additions) {
      batch.create(firestore.doc(`/games/${id}`), value)
    }
    for (const { id, updates } of request.data.updates) {
      batch.update(firestore.doc(`/games/${id}`), updates)
    }

    const result = await batch.commit()

    return { message: `Processed ${result.length} changes` }
  }
)

interface RecordPlayActivityRequest {
  passCode: string
  gameId: string
  day: string
  location: string
}

exports.recordPlayActivity = onCall(
  callOptions,
  async (request: CallableRequest<RecordPlayActivityRequest>): Promise<Response> => {
    checkPassCode(request)

    await doRecordPlayActivity(request.data.gameId, request.data.day, request.data.location)

    return {
      message: 'Saved new play'
    }
  }
)

async function doRecordPlayActivity(gameId: string, day: string, location: string): Promise<void> {
  if (!gameId.match(/^\d+$/)) {
    throw new HttpsError('invalid-argument', 'Invalid game id')
  } else if (!day.match(/^\d{4}-\d\d-\d\d$/)) {
    throw new HttpsError('invalid-argument', 'Invalid day')
  } else if (!['club', 'home', 'festival', 'other'].includes(location)) {
    throw new HttpsError('invalid-argument', 'Invalid location')
  }

  logger.log(`Record play for ${gameId} at ${day} at ${location}`)

  await firestore.runTransaction(async (transaction) => {
    const gameRef = firestore.doc(`/games/${gameId}`)
    const game = (await transaction.get(gameRef)).data()
    if (!game) {
      throw new HttpsError('failed-precondition', 'Document does not exist')
    }

    const lastPlayed = game.lastPlayed || ''
    const totalPlays = game.totalPlays || 0
    const newLastPlayed = day > lastPlayed ? day : lastPlayed

    transaction.update(gameRef, { lastPlayed: newLastPlayed, totalPlays: totalPlays + 1 })
  })

  await firestore.collection(`/games/${gameId}/playActivities`).add({ day, location })
}

interface RecordFestivalPlayActivityRequest {
  gameId: string
  day: string
}

exports.recordFestivalPlayActivity = onCall(
  callOptions,
  async (request: CallableRequest<RecordFestivalPlayActivityRequest>): Promise<Response> => {
    await doRecordPlayActivity(request.data.gameId, request.data.day, 'festival')

    return {
      message: 'Saved new play'
    }
  }
)

interface SetTranslationsRequest {
  passCode: string
  translations: {
    categories: object
    mechanics: object
  }
}

exports.setTranslations = onCall(
  callOptions,
  async (request: CallableRequest<SetTranslationsRequest>): Promise<Response> => {
    checkPassCode(request)

    await firestore.doc('/translations/translations').set(request.data.translations)

    return { message: 'Saved translations' }
  }
)
