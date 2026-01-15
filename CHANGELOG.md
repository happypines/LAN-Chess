# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial P2P chess game implementation using WebRTC
- GameEngine service for local chess game logic
- WebRTCService for peer connection management
- PeerManager for game orchestration
- React UI with drag-and-drop chess board
- Sound effects for moves and game events
- Room creation and joining with offer/answer flow
- Undo move and reset game functionality
- Responsive design with Tailwind CSS

### Changed
- Migrated from client-server architecture to pure P2P

### Removed
- Socket.io dependency (replaced with WebRTC)
- Backend Express server requirement
- External chess.js dependency (using SimpleChess)

## [0.1.0] - 2026-01-15

### Added
- Project initialized with React + Vite setup
- Basic chess board UI
- WebRTC P2P architecture
- Professional project documentation
- Code of conduct and contributing guidelines
- MIT License

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backward compatible)
- **PATCH** version for bug fixes (backward compatible)

## Release Process

1. Update version in `package.json`
2. Update this CHANGELOG
3. Create a git tag: `git tag v0.x.x`
4. Push tag: `git push origin v0.x.x`
5. Create a GitHub Release
