import type { BggGame } from '@/board_game_geek'
import { type FirebaseApp } from 'firebase/app'
import {
  collection,
  collectionGroup,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  type DocumentData
} from 'firebase/firestore'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { notifyError, notifyWarn } from '@/helpers'
import type { Day } from '@/day'

/**
 * The age (in days) that defines a "new" game in the club
 */
export const RECENT_GAMES_DAYS = 30

/**
 * Represents a board game, that may or may not be in the club's catalog
 */
export interface Game {
  // The name used to display on the UI. This is usually the primary name from BGG, but some games
  // it may be different because of locality
  name: string
  bgg: BggGame
  ownedByClub: boolean
  // When this game was first detected in the club's collection.
  ownedSince: Day | null
  lastPlayed: Day | null
  totalPlays: number
}

export interface Translations {
  categories: Map<string, string>
  mechanics: Map<string, string>
}

export type PlayLocation = 'club' | 'home' | 'festival' | 'other'

export interface PlayActivity {
  gameId: string
  day: string
  location: PlayLocation
}

export class Database {
  games: Ref<Game[]> = ref([])
  translations: Ref<Translations> = ref({
    categories: new Map(),
    mechanics: new Map()
  })
  private readonly firestore: Firestore

  constructor(firebaseApp: FirebaseApp, autoUpdateMs: number = 90e3) {
    this.firestore = getFirestore(firebaseApp)
    this.reloadGames(false)
    this.reloadTranslations()

    setInterval(() => {
      this.reloadGames(true)
    }, autoUpdateMs)
  }

  /**
   * Load all game information from the database. A "soft" load is useful to update the data on the background, only
   * replacing it if and when the new data is available
   */
  reloadGames(softLoad: boolean) {
    if (!softLoad) {
      this.games.value = (this.getCache('games') as Game[]) || []
    }

    this.getGames()
      .then((loadedGames) => {
        this.games.value = loadedGames
        this.setCache('games', loadedGames)
      })
      .catch((error) => {
        if (softLoad) {
          notifyWarn(error)
        } else {
          notifyError(error)
        }
      })
  }

  reloadTranslations() {
    const cached = this.getCache('translations') || {}
    this.translations.value = this.convertTranslations(cached)

    this.getTranslationsData()
      .then((data) => {
        this.translations.value = this.convertTranslations(data)
        this.setCache('translations', data)
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

  /**
   * Return all translations from the database
   */
  private async getTranslationsData(): Promise<DocumentData> {
    const translationsDoc = await getDoc(doc(this.firestore, 'translations', 'translations'))
    return translationsDoc.data() || {}
  }

  private convertTranslations(data: DocumentData): Translations {
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
      categories: extractMap(data?.categories),
      mechanics: extractMap(data?.mechanics)
    }
  }

  async setTranslations(translations: Translations): Promise<void> {
    const asObject = {
      categories: Object.fromEntries(translations.categories.entries()),
      mechanics: Object.fromEntries(translations.mechanics.entries())
    }

    await setDoc(doc(this.firestore, 'translations', 'translations'), asObject)
  }

  async getPlayActivities(): Promise<PlayActivity[]> {
    const querySnapshot = await getDocs(collectionGroup(this.firestore, 'playActivities'))
    return querySnapshot.docs.map((doc) => ({
      gameId: doc.ref.parent.parent!.id,
      day: doc.data().day,
      location: doc.data().location
    }))
  }

  private setCache(key: string, value: object): void {
    window.localStorage.setItem(key, JSON.stringify(value))
  }

  private getCache(key: string): object | null {
    const item = window.localStorage.getItem(key)

    if (item === null) {
      return item
    }

    try {
      return JSON.parse(item)
    } catch (error) {
      console.warn(`Could not parse ${key} from cache: ${error}`)
      return null
    }
  }
}
