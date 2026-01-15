/**
 * GameEngine - Local chess game logic (replaces backend server)
 * Runs entirely in the browser using minimal chess logic
 */

// Minimal chess implementation for move validation
class SimpleChess {
  constructor() {
    this.board = this.initBoard()
    this.turn = 'w'
    this.castling = 'KQkq'
    this.enPassant = '-'
    this.halfMoveCount = 0
    this.fullMoveCount = 1
    this.moves = []
  }

  initBoard() {
    const board = []
    for (let i = 0; i < 8; i++) {
      board[i] = []
      for (let j = 0; j < 8; j++) {
        board[i][j] = null
      }
    }
    // Setup initial position
    board[0] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
    board[1] = ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p']
    board[6] = ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P']
    board[7] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    return board
  }

  board() {
    const result = []
    for (let i = 0; i < 8; i++) {
      const row = []
      for (let j = 0; j < 8; j++) {
        const piece = this.board[i][j]
        row.push(piece ? { type: piece.toLowerCase(), color: piece === piece.toUpperCase() ? 'w' : 'b' } : null)
      }
      result.push(row)
    }
    return result
  }

  turn() {
    return this.turn
  }

  moves() {
    return []
  }

  move(moveStr) {
    try {
      const from = moveStr.substring(0, 2)
      const to = moveStr.substring(2, 4)
      
      const fromCol = from.charCodeAt(0) - 97
      const fromRow = 8 - parseInt(from[1])
      const toCol = to.charCodeAt(0) - 97
      const toRow = 8 - parseInt(to[1])
      
      const piece = this.board[fromRow][fromCol]
      if (!piece) return null

      this.board[toRow][toCol] = piece
      this.board[fromRow][fromCol] = null
      this.turn = this.turn === 'w' ? 'b' : 'w'
      this.moves.push(moveStr)
      
      return { from, to, piece: piece.toLowerCase(), color: piece === piece.toUpperCase() ? 'w' : 'b' }
    } catch (e) {
      return null
    }
  }

  undo() {
    if (this.moves.length === 0) return null
    const lastMove = this.moves.pop()
    this.turn = this.turn === 'w' ? 'b' : 'w'
    return lastMove
  }

  reset() {
    this.board = this.initBoard()
    this.turn = 'w'
    this.moves = []
  }

  inCheck() {
    return false
  }

  isCheckmate() {
    return false
  }

  isDraw() {
    return false
  }

  isStalemate() {
    return false
  }

  isGameOver() {
    return false
  }

  fen() {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  }

  history() {
    return this.moves.map(m => ({ san: m }))
  }
}

export class GameEngine {
  constructor() {
    this.games = new Map() // { gameId: { game: SimpleChess, players: {host, guest}, history } }
    this.listeners = new Map() // { gameId: { event: [callbacks] } }
  }

  /**
   * Create a new game
   */
  createGame(gameId) {
    if (this.games.has(gameId)) {
      throw new Error('Game already exists')
    }

    const game = {
      game: new Chess(),
      players: { host: null, guest: null },
      status: 'waiting', // waiting, playing, finished
      history: [],
      createdAt: Date.now()
    }

    this.games.set(gameId, game)
    this.initializeListeners(gameId)
    return game
  }

  /**
   * Join a game
   */
  joinGame(gameId) {
    if (!this.games.has(gameId)) {
      throw new Error('Game not found')
    }
    const game = this.games.get(gameId)
    if (game.players.guest) {
      throw new Error('Game is full')
    }
    return game
  }

  /**
   * Get game state for syncing
   */
  getGameState(gameId) {
    const game = this.games.get(gameId)
    if (!game) return null

    const chess = game.game
    const position = chess.board()

    return {
      position,
      turn: chess.turn(),
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isStalemate: chess.isStalemate(),
      isGameOver: chess.isGameOver(),
      history: chess.history({ verbose: true }),
      fen: chess.fen()
    }
  }

  /**
   * Get available moves for a square
   */
  getMoves(gameId, square) {
    const game = this.games.get(gameId)
    if (!game) return []
    
    try {
      return game.game.moves({ square, verbose: true })
    } catch (e) {
      console.error('Error getting moves:', e)
      return []
    }
  }

  /**
   * Make a move
   */
  makeMove(gameId, moveNotation) {
    const game = this.games.get(gameId)
    if (!game) return false

    try {
      const move = game.game.move(moveNotation)
      if (move) {
        this.emitEvent(gameId, 'position', this.getGameState(gameId))
        return move
      }
    } catch (e) {
      console.error('Invalid move:', e)
    }
    return false
  }

  /**
   * Reset game
   */
  resetGame(gameId) {
    const game = this.games.get(gameId)
    if (!game) return false

    game.game.reset()
    this.emitEvent(gameId, 'position', this.getGameState(gameId))
    return true
  }

  /**
   * Undo move
   */
  undoMove(gameId) {
    const game = this.games.get(gameId)
    if (!game) return false

    const move = game.game.undo()
    if (move) {
      this.emitEvent(gameId, 'position', this.getGameState(gameId))
      return true
    }
    return false
  }

  /**
   * Delete game
   */
  deleteGame(gameId) {
    this.games.delete(gameId)
    this.listeners.delete(gameId)
  }

  /**
   * Initialize event listeners for a game
   */
  initializeListeners(gameId) {
    if (!this.listeners.has(gameId)) {
      this.listeners.set(gameId, {})
    }
  }

  /**
   * Subscribe to game events
   */
  on(gameId, event, callback) {
    if (!this.listeners.has(gameId)) {
      this.initializeListeners(gameId)
    }

    const events = this.listeners.get(gameId)
    if (!events[event]) {
      events[event] = []
    }
    events[event].push(callback)

    // Return unsubscribe function
    return () => {
      const idx = events[event].indexOf(callback)
      if (idx > -1) {
        events[event].splice(idx, 1)
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  emitEvent(gameId, event, data) {
    const events = this.listeners.get(gameId)
    if (!events || !events[event]) return

    events[event].forEach(callback => {
      try {
        callback(data)
      } catch (e) {
        console.error(`Error in listener for ${event}:`, e)
      }
    })
  }

  /**
   * Get all games (for lobby)
   */
  getAllGames() {
    const games = []
    for (const [gameId, game] of this.games) {
      if (game.players.guest === null) { // Only show games with available slots
        games.push({
          gameId,
          status: game.status,
          createdAt: game.createdAt,
          hasGuest: game.players.guest !== null
        })
      }
    }
    return games
  }
}

// Export singleton
export const gameEngine = new GameEngine()
