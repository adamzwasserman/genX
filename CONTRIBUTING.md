# Contributing to genX

Thank you for your interest in contributing to genX! This document provides guidelines and information for contributors.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/genX.git`
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Build the project: `npm run build`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Build successfully: `npm run build`
6. Commit your changes with a descriptive message
7. Push to your fork
8. Create a Pull Request

## Code Style

- Use pure functional JavaScript — no classes, no complex state
- Follow the declarative attribute pattern (`fx-*`, `bx-*`, `dx-*`, etc.)
- Add JSDoc comments for all public functions
- Keep functions small and focused
- Use meaningful variable names
- Target <16ms for all operations (60 FPS)

## Testing

genX uses a comprehensive BDD/TDD testing framework:

- **Cucumber BDD** - Human-readable feature specifications
- **Playwright** - Browser automation for UI testing
- **Jest** - Unit tests for pure functions

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run BDD tests
npm run test:bdd

# Run browser tests
npm run test:browser
```

### Test Guidelines

- Add unit tests for all new functionality
- Write BDD scenarios for user-facing features
- Ensure existing tests still pass
- Test edge cases and error conditions
- Use descriptive test names

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure CI checks pass
- Follow the existing architecture patterns
- Keep PRs focused — one feature or fix per PR

## Architecture Principles

When contributing, please follow these core principles:

1. **Declarative over Procedural** - Users should configure behavior via HTML attributes, not JavaScript
2. **Privacy First** - No external calls, no tracking, 100% client-side
3. **Performance Budget** - All operations must complete in <16ms
4. **Accessibility Built-in** - WCAG 2.1 AA compliance by default
5. **Framework Agnostic** - Must work with vanilla HTML, React, Vue, Angular, htmx, etc.

## Adding a New Module

If you're adding a new module (e.g., `newX`):

1. Create architecture spec first: `docs/architecture/newx-architecture-v1.0.md`
2. Use a unique attribute prefix (e.g., `nx-*`)
3. Follow the existing module patterns in `src/`
4. Add to the build in `package.json`
5. Include comprehensive tests
6. Update the README modules table

## Code of Conduct

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions. We aim for simplicity to focus on code — basic respect is assumed.

## Questions?

Feel free to open an issue for questions or discussions.
