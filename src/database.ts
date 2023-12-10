import type { BggGame } from '@/board_game_geek'
import { initializeApp } from 'firebase/app'
import { getFirestore, Firestore, getDocs, collection, writeBatch, doc } from 'firebase/firestore'

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
  clubCode: string
  lastPlayed: Date | null
  totalPlays: number
}

/**
 * Represents the fact that someone from the club played a game
 */
interface PlayActivity {
  // The time part is zeroed
  day: Date
  location: 'club' | 'home' | 'festival'
}

export class Database {
  _firestore: Firestore
  _games: Game[]
  _gamesRefreshed: Date | null

  constructor() {
    const firebaseConfig = {
      apiKey: 'AIzaSyBg8ecSB_ogiqWAWCZgWRcOKtkrRFu6fOE',
      authDomain: 'plateaux-aux-conjures.firebaseapp.com',
      projectId: 'plateaux-aux-conjures',
      storageBucket: 'plateaux-aux-conjures.appspot.com',
      messagingSenderId: '656580485619',
      appId: '1:656580485619:web:edaa857b984e6e1bc57286'
    }

    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig)

    // Initialize Cloud Firestore and get a reference to the service
    this._firestore = getFirestore(firebaseApp)
  }

  // Return all the games from the database, caching the response.
  // The cache is re-evaluated every minute
  async getGamesWithCache() {
    const expiration = 60e3
    if (!this._gamesRefreshed || Date.now() - this._gamesRefreshed.getTime() > expiration) {
      this._games = await this.getGames()
      this._gamesRefreshed = new Date()
    }

    return this._games
  }

  // Return all the games from the database
  async getGames() {
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
}