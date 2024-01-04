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
  _firestore: Firestore

  constructor(firebaseApp: FirebaseApp) {
    this._firestore = getFirestore(firebaseApp)
    this.reloadGames()
    this.reloadTranslations()
  }

  reloadGames() {
    this.games.value = []

    this._getGames()
      .then((loadedGames) => {
        this.games.value = loadedGames
      })
      .catch((error) => {
        console.error(`Failed to load games: ${error}`)
      })
  }

  reloadTranslations() {
    this.translations.value = {
      categories: new Map(),
      mechanics: new Map()
    }

    this._getTranslations()
      .then((loadedTranslations) => {
        this.translations.value = loadedTranslations
      })
      .catch((error) => {
        console.error(`Failed to load translations: ${error}`)
      })
  }

  /**
   * Return all the games from the database
   */
  async _getGames() {
    const gameQuerySnapshot = await getDocs(collection(this._firestore, 'games'))
    return gameQuerySnapshot.docs.map((doc) => doc.data() as Game)
  }

  async batchAdd(games: Game[]) {
    if (games.length) {
      const batch = writeBatch(this._firestore)

      for (const game of games) {
        batch.set(doc(this._firestore, 'games', game.bgg.id), game)
      }

      await batch.commit()
    }
  }

  async batchUpdate(games: Map<string, any>) {
    if (games.size) {
      const batch = writeBatch(this._firestore)

      for (const [id, updates] of games.entries()) {
        batch.update(doc(this._firestore, 'games', id), updates)
      }

      await batch.commit()
    }
  }

  async _getTranslations(): Promise<Translations> {
    const translationsDoc = await getDoc(doc(this._firestore, 'translations', 'translations'))
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

    await setDoc(doc(this._firestore, 'translations', 'translations'), asObject)
  }

  // Return when the last sync operation was done
  async getLastSync() {
    // TODO
  }
}
