# Contributing to LAN Chess

Thank you for your interest in contributing to LAN Chess! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors and maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/LAN-Chess.git
   cd LAN-Chess
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies**
   ```bash
   npm install
   ```

## Development Workflow

1. **Start the dev server**
   ```bash
   npm run dev
   ```
2. **Make your changes** to the relevant files
3. **Test your changes** thoroughly in multiple browsers
4. **Run linting** to ensure code quality
   ```bash
   npm run lint
   ```
5. **Build for production** to check for build errors
   ```bash
   npm run build
   ```

## Commit Guidelines

- Use clear, descriptive commit messages
- Use the imperative mood ("add feature" not "added feature")
- Reference issues when relevant: "Fix #123"
- Keep commits focused on a single change

Example:
```
feat: add undo move functionality

- Implement undo in GameEngine service
- Add undo button to UI
- Sync undo state across peers via WebRTC
```

## Pull Request Process

1. **Update your branch** with the latest main
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Create a Pull Request** with a clear title and description
4. **Link related issues** using GitHub's issue linking
5. **Respond to review feedback** promptly
6. **Ensure all checks pass** (linting, building, tests)

## Code Style

- **Indentation**: 2 spaces (enforced by .editorconfig)
- **Quotes**: Single quotes for JavaScript strings
- **Semicolons**: Required
- **Line length**: Max 100 characters recommended
- **Comments**: Use JSDoc for functions and complex logic
- **Naming**: camelCase for variables/functions, PascalCase for classes/components

### Example Function
```javascript
/**
 * Get available moves for a square
 * @param {string} gameId - The game ID
 * @param {string} square - The square in algebraic notation (e.g., 'e4')
 * @returns {Array} Array of legal move objects
 */
function getMoves(gameId, square) {
  const game = this.games.get(gameId);
  if (!game) return [];
  
  try {
    return game.game.moves({ square, verbose: true });
  } catch (e) {
    console.error('Error getting moves:', e);
    return [];
  }
}
```

## Testing

While formal tests aren't yet required, please:
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on both desktop and mobile
- Test with peers on different networks
- Check for console errors
- Verify functionality matches existing behavior

## Areas for Contribution

### High Priority
- Integrate proper chess engine (chess.js)
- Improve move validation
- Add comprehensive error handling
- Performance optimizations
- Cross-browser testing

### Medium Priority
- Game history/replay feature
- Chat during games
- Timer/clock support
- Spectator mode
- Better UI/UX

### Low Priority
- Animation improvements
- Theme customization
- Accessibility enhancements
- Documentation
- Examples

## Reporting Issues

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS information
- Screenshots if applicable

### Feature Requests
Include:
- Clear description of the feature
- Use case and motivation
- Possible implementation approach
- Examples or mockups if applicable

## Questions?

Feel free to:
- Open a GitHub discussion
- Create an issue for clarification
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make LAN Chess better! 🎉
