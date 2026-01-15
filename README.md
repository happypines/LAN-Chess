# LAN Chess - P2P Browser-Based Chess Game

A modern, peer-to-peer chess game running entirely in the browser using WebRTC. Play chess with friends over LAN or the internet without any backend server required.

## 🎮 Features

- **Pure P2P Architecture**: No backend server needed - all games run directly between browsers
- **WebRTC-Powered**: Direct peer-to-peer connections for real-time gameplay
- **Browser-Based**: Works in any modern web browser
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-Time Sync**: Moves synchronize instantly between peers
- **Sound Effects**: Audio feedback for moves and game events
- **Room-Based Pairing**: Simple offer/answer mechanism for peer discovery

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with WebRTC support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## 📋 How to Play

### Creating a Game (Host)
1. Click **"Create Room"**
2. Copy the generated **WebRTC Offer** JSON
3. Share the offer with your opponent (copy-paste, email, chat, etc.)
4. Wait for the opponent to send back the **Answer**
5. Paste the answer in the answer field
6. Connection established! Start playing

### Joining a Game (Guest)
1. Click **"Join Room"**
2. Receive the **WebRTC Offer** from the host
3. Paste it in the offer field
4. Copy the generated **Answer** JSON
5. Send the answer back to the host
6. Wait for connection and start playing!

### Playing
- Click and drag pieces to move
- Pieces highlight available moves
- Both players see moves in real-time
- Use **Reset Game** to start over
- Use **Undo Move** to take back the last move

## 🏗️ Architecture

### Frontend Only
- **React 18**: UI framework with hooks
- **Vite 5**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first styling
- **WebRTC API**: Peer-to-peer connections

### Services
- **GameEngine.js**: Chess game logic and state management
- **WebRTCService.js**: Manages peer connections and data channels
- **PeerManager.js**: Orchestrates game flow and message routing

### Data Flow
```
User Input → PeerManager → GameEngine → WebRTCService → Peer Browser
                    ↓
            React State Update → UI Render
```

## 📦 Project Structure

```
LAN-Chess/
├── src/
│   ├── App.jsx                 # Main app component
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   ├── services/
│   │   ├── GameEngine.js      # Chess logic
│   │   ├── WebRTCService.js   # P2P connections
│   │   └── PeerManager.js     # Game orchestration
│   ├── assets/
│   │   ├── images/           # Piece and board images
│   │   └── sounds/           # Move and capture sounds
│   └── public/               # Static assets
├── index.html               # HTML entry point
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint to check code quality
npm run lint
```

### Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.2.0 | UI framework |
| Vite | 5.2.0 | Build tool |
| Tailwind CSS | 3.4.3 | Styling |
| use-sound | 4.0.1 | Sound management |

## 🌐 Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Opera 47+

Requires WebRTC support for P2P functionality.

## 🎯 How P2P Works

1. **Host creates a game** and generates a WebRTC offer
2. **Guest joins** and receives the offer
3. **Guest generates an answer** and sends it back
4. **Peers exchange ICE candidates** for optimal routing
5. **WebRTC data channel opens** → games sync in real-time
6. **All moves** broadcast via data channel to opponent's browser

No server stores game state - everything is local!

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For major changes:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🐛 Known Limitations

- **Limited move validation**: Current SimpleChess engine provides basic move tracking. For tournament-grade validation, consider integrating a proper chess engine
- **No persistent storage**: Games are in-memory only
- **Manual signaling**: Offer/answer exchange requires manual copy-paste (no automatic signaling server)
- **NAT traversal**: Relies on STUN servers; some restrictive networks may have issues

## 🚀 Future Improvements

- [ ] Integrate proper chess engine (chess.js)
- [ ] Automatic signaling server option
- [ ] Game history/replay
- [ ] ELO rating system
- [ ] Chat during games
- [ ] Timer/clock support
- [ ] Spectator mode
- [ ] Mobile app
- [ ] Difficulty levels with AI

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ by the LAN Chess team**
