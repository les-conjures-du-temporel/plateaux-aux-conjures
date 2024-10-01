import type { FirebaseApp } from 'firebase/app'
import { getFunctions, httpsCallable, type HttpsCallable } from 'firebase/functions'
import { type Ref } from 'vue'
import { normalizeBase32Code } from '@/helpers'
import type { Game } from '@/database'

export interface Response {
  message: string
}

export interface BatchUpdateGamesRequest {
  passCode: string
  additions: { id: string; value: object }[]
  updates: { id: string; updates: object }[]
}

export interface RecordPlayActivityRequest {
  passCode: string
  gameId: string
  day: string
  location: string
}

export interface RecordFestivalPlayActivityRequest {
  gameId: string
  day: string
}

export interface SetTranslationsRequest {
  passCode: string
  translations: {
    categories: { [key: string]: string }
    mechanics: { [key: string]: string }
  }
}

export class CloudFunctions {
  private readonly passCode: Ref<string | null>
  private readonly batchUpdateGamesFn: HttpsCallable<BatchUpdateGamesRequest, Response>
  private readonly recordPlayActivityFn: HttpsCallable<RecordPlayActivityRequest, Response>
  private readonly recordFestivalPlayActivityFn: HttpsCallable<
    RecordFestivalPlayActivityRequest,
    Response
  >
  private readonly setTranslationsFn: HttpsCallable<SetTranslationsRequest, Response>

  constructor(firebaseApp: FirebaseApp, passCode: Ref<string | null>) {
    this.passCode = passCode

    // Note: the region must be the same one for the deployed function
    const functions = getFunctions(firebaseApp, 'europe-west1')
    this.batchUpdateGamesFn = httpsCallable<BatchUpdateGamesRequest, Response>(
      functions,
      'batchUpdateGames'
    )
    this.recordPlayActivityFn = httpsCallable<RecordPlayActivityRequest, Response>(
      functions,
      'recordPlayActivity'
    )
    this.recordFestivalPlayActivityFn = httpsCallable<RecordFestivalPlayActivityRequest, Response>(
      functions,
      'recordFestivalPlayActivity'
    )
    this.setTranslationsFn = httpsCallable<SetTranslationsRequest, Response>(
      functions,
      'setTranslations'
    )
  }

  async batchUpdateGames(
    additions: { id: string; value: Game }[],
    updates: { id: string; updates: object }[]
  ): Promise<void> {
    await this.batchUpdateGamesFn({
      passCode: this.getPassCode(),
      additions,
      updates
    })
  }

  async recordPlayActivity(gameId: string, day: string, location: string): Promise<void> {
    await this.recordPlayActivityFn({
      passCode: this.getPassCode(),
      gameId,
      day,
      location
    })
  }

  async recordFestivalPlayActivity(gameId: string, day: string): Promise<void> {
    await this.recordFestivalPlayActivityFn({
      gameId,
      day
    })
  }

  async setTranslations(translations: {
    categories: { [key: string]: string }
    mechanics: { [key: string]: string }
  }): Promise<void> {
    await this.setTranslationsFn({
      passCode: this.getPassCode(),
      translations
    })
  }

  private getPassCode(): string {
    if (this.passCode.value) {
      return normalizeBase32Code(this.passCode.value)
    }

    throw new Error('Missing pass code')
  }
}
