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
  // If the club has this game, the code used to log a play
  clubCode: string | null
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

  /**
   * Retrieves all games from the Firestore database.
   *
   * @async
   * @returns {Promise<Game[]>} A Promise that resolves to an array of Game objects retrieved from the database.
   */
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
