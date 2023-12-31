import { onCall } from 'firebase-functions/v2/https'
import * as firebaseAdmin from 'firebase-admin'
import { logger } from 'firebase-functions'

firebaseAdmin.initializeApp()

// TODO: change zone (it's currently set as us-central1)
exports.recordPlayActivity = onCall(async (request) => {
  const gameId = request.data.gameId
  const day = request.data.day
  const location = request.data.location

  logger.log(`Record play for ${gameId} at ${day} at ${location}`)

  const inserted = await firebaseAdmin
    .firestore()
    .collection(`/games/${gameId}/playActivities`)
    .add({ day, location })

  logger.log(`Recorded ${inserted.id}`)
})
