import type { BggGame } from '@/board_game_geek'
import { type FirebaseApp } from 'firebase/app'
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  writeBatch,
  setDoc
} from 'firebase/firestore'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { notifyError } from '@/helpers'

/**
 * Represents a board game, that may or may not be in the club's catalog
 */
export interface Game {
  // The name used to display on the UI. This is usually the primary name from BGG, but some games
  // it may be different because of locality
  name: string
  bgg: BggGame
  ownedByClub: boolean
  // The code used to log a play
  clubCode: string | null
  // In YYYY-MM-DD format
  lastPlayed: string | null
  totalPlays: number
}

export interface Translations {
  categories: Map<string, string>
  mechanics: Map<string, string>
}

export type PlayLocation = 'club' | 'home' | 'festival' | 'other'

export class Database {
  games: Ref<Game[]> = ref([])
  translations: Ref<Translations> = ref({
    categories: new Map(),
    mechanics: new Map()
  })
  private readonly firestore: Firestore

  constructor(firebaseApp: FirebaseApp, autoUpdateMs: number = 90e3) {
    this.firestore = getFirestore(firebaseApp)
    this.reloadGames()
    this.reloadTranslations()

    setInterval(() => {
      this.reloadGames()
    }, autoUpdateMs)
  }

  reloadGames() {
    this.games.value = []

    this.getGames()
      .then((loadedGames) => {
        this.games.value = loadedGames
      })
      .catch((error) => {
        notifyError(error)
      })
  }

  reloadTranslations() {
    this.translations.value = {
      categories: new Map(),
      mechanics: new Map()
    }

    this.getTranslations()
      .then((loadedTranslations) => {
        this.translations.value = loadedTranslations
      })
      .catch((error) => {
        notifyError(error)
      })
  }

  /**
   * Return all the games from the database
   */
  private async getGames() {
    const gameQuerySnapshot = await getDocs(collection(this.firestore, 'games'))
    return gameQuerySnapshot.docs.map((doc) => doc.data() as Game)
  }

  private async getTranslations(): Promise<Translations> {
    const translationsDoc = await getDoc(doc(this.firestore, 'translations', 'translations'))
    const translationsData = translationsDoc.data() || {}

    function extractMap(value: any): Map<string, string> {
      const map = new Map()
      if (value && typeof value === 'object') {
        for (const [fromText, toText] of Object.entries(value)) {
          if (typeof toText === 'string') {
            map.set(fromText, toText)
          }
        }
      }
      return map
    }

    return {
      categories: extractMap(translationsData?.categories),
      mechanics: extractMap(translationsData?.mechanics)
    }
  }

  async setTranslations(translations: Translations): Promise<void> {
    const asObject = {
      categories: Object.fromEntries(translations.categories.entries()),
      mechanics: Object.fromEntries(translations.mechanics.entries())
    }

    await setDoc(doc(this.firestore, 'translations', 'translations'), asObject)
  }

  // Return when the last sync operation was done
  async getLastSync() {
    // TODO
  }
}
