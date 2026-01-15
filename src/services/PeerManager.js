/**
 * PeerManager - Manages peer connections and game state synchronization
 * Handles the complete P2P game flow
 */

import { webrtcService } from './WebRTCService'
import { gameEngine } from './GameEngine'

export class PeerManager {
  constructor(gameId) {
    this.gameId = gameId
    this.peerId = this.generatePeerId()
    this.isHost = false
    this.remotePeerId = null
    this.onGameStateChange = null
    this.onStatusChange = null
    this.onPeerConnected = null
    this.onPeerDisconnected = null
  }

  /**
   * Generate unique peer ID
   */
  generatePeerId() {
    return `peer-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create game as host
   */
  async createGame() {
    this.isHost = true
    gameEngine.createGame(this.gameId)
    
    // Emit ready
    if (this.onStatusChange) {
      this.onStatusChange('waiting-for-guest')
    }

    return {
      gameId: this.gameId,
      peerId: this.peerId,
      isHost: true
    }
  }

  /**
   * Join game as guest
   */
  async joinGame() {
    this.isHost = false
    const game = gameEngine.joinGame(this.gameId)
    
    if (this.onStatusChange) {
      this.onStatusChange('ready-to-connect')
    }

    return {
      gameId: this.gameId,
      peerId: this.peerId,
      isHost: false
    }
  }

  /**
   * Create WebRTC offer (host initiates)
   */
  async createOffer() {
    this.remotePeerId = `peer-guest-${Date.now()}`
    const offer = await webrtcService.createOffer(this.remotePeerId)
    
    if (offer) {
      this.setupPeerConnection()
    }

    return offer
  }

  /**
   * Handle offer from host (guest side)
   */
  async handleOffer(offer) {
    this.remotePeerId = `peer-host-${Date.now()}`
    const answer = await webrtcService.handleOffer(this.remotePeerId, offer)
    
    if (answer) {
      this.setupPeerConnection()
    }

    return answer
  }

  /**
   * Handle answer from guest (host side)
   */
  async handleAnswer(answer) {
    await webrtcService.handleAnswer(this.remotePeerId, answer)
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(candidate) {
    if (this.remotePeerId) {
      await webrtcService.addIceCandidate(this.remotePeerId, candidate)
    }
  }

  /**
   * Setup peer connection handlers
   */
  setupPeerConnection() {
    // Data channel opened
    webrtcService.onConnectionEvent(this.remotePeerId, 'open', () => {
      console.log('Peer connection established')
      if (this.onPeerConnected) {
        this.onPeerConnected()
      }

      // Sync game state when peer connects
      if (this.isHost) {
        const gameState = gameEngine.getGameState(this.gameId)
        webrtcService.sendMessage(this.remotePeerId, {
          type: 'sync-state',
          payload: gameState
        })
      }
    })

    // Data channel closed
    webrtcService.onConnectionEvent(this.remotePeerId, 'close', () => {
      console.log('Peer connection closed')
      if (this.onPeerDisconnected) {
        this.onPeerDisconnected()
      }
    })

    // Message received from peer
    webrtcService.onMessage(this.remotePeerId, (message) => {
      this.handlePeerMessage(message)
    })
  }

  /**
   * Handle messages from peer
   */
  handlePeerMessage(message) {
    const { type, payload } = message

    switch (type) {
      case 'move':
        const move = gameEngine.makeMove(this.gameId, payload.notation)
        if (move && this.onGameStateChange) {
          this.onGameStateChange(gameEngine.getGameState(this.gameId))
        }
        break

      case 'sync-state':
        // Update local game state from peer
        const game = gameEngine.games.get(this.gameId)
        if (game) {
          try {
            game.game.load(payload.fen)
            if (this.onGameStateChange) {
              this.onGameStateChange(gameEngine.getGameState(this.gameId))
            }
          } catch (e) {
            console.error('Failed to sync game state:', e)
          }
        }
        break

      case 'reset-game':
        gameEngine.resetGame(this.gameId)
        if (this.onGameStateChange) {
          this.onGameStateChange(gameEngine.getGameState(this.gameId))
        }
        break

      case 'undo-move':
        gameEngine.undoMove(this.gameId)
        if (this.onGameStateChange) {
          this.onGameStateChange(gameEngine.getGameState(this.gameId))
        }
        break

      default:
        console.warn('Unknown message type:', type)
    }
  }

  /**
   * Make a move and broadcast to peer
   */
  makeMove(moveNotation) {
    const move = gameEngine.makeMove(this.gameId, moveNotation)
    if (move) {
      if (this.remotePeerId && webrtcService.isConnected(this.remotePeerId)) {
        webrtcService.sendMessage(this.remotePeerId, {
          type: 'move',
          payload: { notation: moveNotation, san: move.san }
        })
      }
      if (this.onGameStateChange) {
        this.onGameStateChange(gameEngine.getGameState(this.gameId))
      }
      return true
    }
    return false
  }

  /**
   * Reset game
   */
  resetGame() {
    gameEngine.resetGame(this.gameId)
    if (this.remotePeerId && webrtcService.isConnected(this.remotePeerId)) {
      webrtcService.sendMessage(this.remotePeerId, {
        type: 'reset-game'
      })
    }
    if (this.onGameStateChange) {
      this.onGameStateChange(gameEngine.getGameState(this.gameId))
    }
  }

  /**
   * Undo move
   */
  undoMove() {
    if (gameEngine.undoMove(this.gameId)) {
      if (this.remotePeerId && webrtcService.isConnected(this.remotePeerId)) {
        webrtcService.sendMessage(this.remotePeerId, {
          type: 'undo-move'
        })
      }
      if (this.onGameStateChange) {
        this.onGameStateChange(gameEngine.getGameState(this.gameId))
      }
      return true
    }
    return false
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.remotePeerId) {
      webrtcService.removePeer(this.remotePeerId)
    }
    gameEngine.deleteGame(this.gameId)
  }

  /**
   * Get game state
   */
  getGameState() {
    return gameEngine.getGameState(this.gameId)
  }

  /**
   * Get moves for square
   */
  getMoves(square) {
    return gameEngine.getMoves(this.gameId, square)
  }
}
