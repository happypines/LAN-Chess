# Development Guide

This guide provides detailed information for developers working on LAN Chess.

## Project Overview

LAN Chess is a peer-to-peer chess game running entirely in the browser using WebRTC. No backend server is required - all game logic runs locally in each player's browser.

### Key Principles

1. **P2P First**: All communication happens directly between browsers
2. **No Backend**: Game logic and state management happen client-side
3. **Minimal Dependencies**: Keep external dependencies to a minimum
4. **Type Safe**: All JavaScript is well-documented with JSDoc
5. **Accessible**: Code should be readable and maintainable

## Architecture

### Services Layer

#### GameEngine (`src/services/GameEngine.js`)
- Manages chess game state and logic
- Handles move validation and execution
- Provides game state synchronization
- **Key Methods**:
  - `createGame(gameId)`: Initialize a new game
  - `joinGame(gameId)`: Join an existing game
  - `makeMove(gameId, moveNotation)`: Execute a move
  - `getGameState(gameId)`: Get current game state
  - `getMoves(gameId, square)`: Get legal moves for a piece

#### WebRTCService (`src/services/WebRTCService.js`)
- Manages WebRTC peer connections
- Handles offer/answer/ICE negotiation
- Manages data channels for message passing
- **Key Methods**:
  - `createPeerConnection(peerId)`: Create new peer connection
  - `createOffer(peerId)`: Generate WebRTC offer
  - `handleOffer(peerId, offer)`: Process received offer
  - `handleAnswer(peerId, answer)`: Process received answer
  - `sendMessage(peerId, data)`: Send message to peer

#### PeerManager (`src/services/PeerManager.js`)
- High-level game flow orchestration
- Connects GameEngine with WebRTCService
- Manages host/guest roles
- Routes messages between peer and local engine
- **Key Methods**:
  - `createGame()`: Host creates a new game
  - `joinGame()`: Guest joins a game
  - `makeMove(moveNotation)`: Make a move and broadcast
  - `handlePeerMessage(message)`: Process peer messages

### React Component

#### App.jsx
- Main application component
- Game board UI rendering
- Game state management
- Event handling and callbacks
- Integration of all services

## Data Flow

```
User Input (Move Piece)
    ↓
App.jsx → movePiece()
    ↓
PeerManager.makeMove(moveNotation)
    ↓
GameEngine.makeMove() → Updates local state → Emits 'position' event
    ↓
WebRTCService.sendMessage() → Sends to peer via data channel
    ↓
Peer receives message → PeerManager.handlePeerMessage()
    ↓
PeerManager applies move to local GameEngine
    ↓
Peer's App.jsx receives state update → Re-renders board
```

## Message Protocol

Messages between peers follow this format:

```javascript
{
  type: 'move' | 'sync-state' | 'reset-game' | 'undo-move',
  gameId: string,
  payload: {
    // Type-specific data
  }
}
```

### Message Types

**Move**
```javascript
{
  type: 'move',
  gameId: 'abc123',
  payload: {
    moveNotation: 'e2e4'
  }
}
```

**Sync State**
```javascript
{
  type: 'sync-state',
  gameId: 'abc123',
  payload: {
    position: [...],
    turn: 'w',
    history: [...]
  }
}
```

**Reset Game**
```javascript
{
  type: 'reset-game',
  gameId: 'abc123'
}
```

**Undo Move**
```javascript
{
  type: 'undo-move',
  gameId: 'abc123'
}
```

## State Management

### React State
```javascript
const [board, setBoard] = useState([]) // 8x8 board position
const [selectedSquare, setSelectedSquare] = useState(null)
const [availableMoves, setAvailableMoves] = useState([])
const [turn, setTurn] = useState('w') // 'w' or 'b'
const [history, setHistory] = useState([]) // Move history
const [isGameOver, setIsGameOver] = useState(false)
const [peerConnected, setPeerConnected] = useState(false)
// ... more state
```

### Service State
- **GameEngine**: Internal game Map with state per gameId
- **WebRTCService**: RTCPeerConnection and RTCDataChannel instances
- **PeerManager**: Game reference and peer connection reference

## WebRTC Connection Flow

### Host Side (Initiator)
1. Call `createGame()` in App.jsx
2. PeerManager calls `WebRTCService.createPeerConnection()`
3. Generate offer with `WebRTCService.createOffer()`
4. Return offer JSON for user to copy/share
5. User pastes guest's answer
6. Call `PeerManager.handleAnswer()`
7. WebRTCService sets remote description
8. Data channel opens → `onPeerConnected` callback

### Guest Side (Answerer)
1. Call `joinGame()` with room code
2. User pastes host's offer
3. Call `PeerManager.handleOffer(offer)`
4. WebRTCService processes offer
5. Generate answer with `createAnswer()`
6. Return answer JSON for user to copy/share
7. User sends answer to host
8. Data channel opens → `onPeerConnected` callback

### ICE Gathering
- Candidates gathered automatically by browser
- Transmitted via data channel once connected
- Handled transparently by WebRTCService

## Adding Features

### Adding a New Game Command

1. **Update GameEngine** (`src/services/GameEngine.js`):
```javascript
newCommand(gameId, ...args) {
  const game = this.games.get(gameId);
  if (!game) return false;
  
  // Execute command
  this.emitEvent(gameId, 'position', this.getGameState(gameId));
  return true;
}
```

2. **Update PeerManager** (`src/services/PeerManager.js`):
```javascript
newCommand(...args) {
  if (this.gameEngine) {
    this.gameEngine.newCommand(this.gameId, ...args);
    // Broadcast to peer
    this.webrtcService.sendMessage(this.peerId, {
      type: 'new-command',
      payload: { ...args }
    });
  }
}

handlePeerMessage(message) {
  if (message.type === 'new-command') {
    this.gameEngine.newCommand(this.gameId, ...message.payload.args);
  }
}
```

3. **Update App.jsx**:
```javascript
const newCommand = (...args) => {
  if (peerManagerRef.current) {
    peerManagerRef.current.newCommand(...args);
  }
}

// Add button in UI
<button onClick={() => newCommand(...)}>New Command</button>
```

### Adding UI Components

1. Create component in a logical location
2. Import required state/handlers from App.jsx props
3. Use Tailwind classes for styling
4. Follow existing naming conventions

Example:
```javascript
const MyComponent = ({ board, onMove }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Component content */}
    </div>
  );
};
```

## Testing

### Manual Testing Checklist

- [ ] Open app in two browser tabs/windows
- [ ] Create room and copy offer
- [ ] Paste offer in second tab
- [ ] Copy answer and paste in first tab
- [ ] Verify connection established
- [ ] Make moves and verify sync
- [ ] Test undo move
- [ ] Test reset game
- [ ] Test disconnect/reconnect
- [ ] Test in different browsers
- [ ] Test on mobile devices

### Browser DevTools

- **Network tab**: Monitor WebRTC data channel messages
- **Console**: Check for errors, use `console.log` for debugging
- **Application tab**: View IndexedDB, localStorage if needed

## Performance Optimization

### Current Bottlenecks
- Board rendering on every state change
- Large move history arrays
- Unoptimized piece image loading

### Optimization Opportunities
- Memoize React components
- Virtual scrolling for move history
- Canvas rendering for board
- Lazy load piece images

## Debugging

### Enable Debug Mode
```javascript
// In App.jsx or services
const DEBUG = true;
if (DEBUG) console.log('Debug:', ...);
```

### Common Issues

**WebRTC Connection Not Establishing**
- Check browser console for errors
- Verify STUN servers are accessible
- Check firewall/network settings
- Try different network

**Moves Not Syncing**
- Check data channel is open (`webrtcService.isConnected()`)
- Verify message format matches protocol
- Check peer's console for errors
- Verify GameEngine.makeMove() returns truthy

**Board Not Updating**
- Check React state setters are called
- Verify GameEngine emits 'position' events
- Check PeerManager callbacks are registered
- Verify no errors in state setters

## Deployment

### Static Hosting (GitHub Pages, Vercel, Netlify)

1. Build the project:
```bash
npm run build
```

2. Upload `dist/` folder to hosting provider
3. Configure for SPA (single-page app) routing if needed
4. Enable HTTPS (required for WebRTC)

### Environment Variables

Create `.env.production` for production-specific settings:
```
VITE_DEBUG=false
VITE_STUN_SERVERS=...
```

## Resources

- [WebRTC MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Chess Notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))

## Questions?

- Check existing code for examples
- Search GitHub issues for similar questions
- Open a discussion in the repository
- Ask in pull request comments
