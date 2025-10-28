# Contributing to genX

Thank you for your interest in contributing to genX! This document provides guidelines and standards for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Module Development Standards](#module-development-standards)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions on-topic

## Getting Started

### Prerequisites

- Node.js 14+
- Git
- Text editor (VS Code recommended)

### Setup

```bash
# Clone the repository
git clone https://github.com/genx-software/genx.git
cd genx

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
# Open http://localhost:8080/examples/
```

## Development Workflow

### 1. Fork & Branch

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/genx.git
cd genx
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Edit files in `src/`
- Add tests if applicable
- Update documentation

### 3. Build & Test

```bash
npm run build
npm test
npm run lint
```

### 4. Commit

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 5. Push & PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Module Development Standards

### Creating a New Module

All genX modules must follow these standards:

#### 1. Factory Pattern Export

```javascript
// ✅ CORRECT
window.bxXFactory = {
    init: (config = {}) => initBindX(config),
    // Other exports...
};

// ❌ WRONG
window.BindX = initBindX(); // Don't auto-initialize
```

#### 2. Pure Functional Design

```javascript
// ✅ CORRECT - Pure functions
const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(value);
};

// ❌ WRONG - Classes and state
class CurrencyFormatter {
    constructor() {
        this.cache = {}; // Mutable state
    }
}
```

#### 3. XSS-Safe DOM Manipulation

```javascript
// ✅ CORRECT - Safe DOM manipulation
while (cell.firstChild) {
    th.appendChild(cell.firstChild);
}

// ❌ WRONG - innerHTML XSS risk
th.innerHTML = cell.innerHTML;
```

#### 4. Attribute Naming Convention

- Use prefix pattern: `[prefix]-[attribute]`
- Prefix is 2 letters + `x`: `fx-`, `ax-`, `bx-`, etc.
- Use kebab-case: `fx-format`, `ax-enhance`

```html
<!-- ✅ CORRECT -->
<span fx-format="currency" fx-currency="USD">25.00</span>

<!-- ❌ WRONG -->
<span fmtx-format="currency">25.00</span>
<span fx_format="currency">25.00</span>
```

#### 5. MutationObserver Support

```javascript
// Modules must handle dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    processElement(node);
                }
            });
        }
    });
});
```

#### 6. Size Limits

- Bootloader: <1KB minified + gzipped
- Each module: <50KB uncompressed
- Total payload: Keep minimal

Check with: `npm run size`

### Module Structure Template

```javascript
/**
 * [ModuleName] - [Brief description]
 * @version 1.0.0
 */
(function() {
    'use strict';

    // Utils
    const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    // Core functionality
    const enhance = {
        // Enhancement functions...
    };

    // Processing
    const processElement = (el, prefix) => {
        // Process attributes...
    };

    // Observer
    const createObserver = (prefix) => {
        // MutationObserver setup...
    };

    // Init
    const initModule = (config = {}) => {
        const { prefix = 'xx-', auto = true, observe = true } = config;
        const observer = createObserver(prefix);

        const api = {
            enhance: (type, el, opts) => enhance[type]?.(el, opts),
            process: el => processElement(el, prefix),
            destroy: () => observer.stop()
        };

        if (auto) {
            // Auto-initialize...
        }

        return api;
    };

    // Factory export for bootloader
    window.xxXFactory = {
        init: (config = {}) => initModule(config)
    };

    // Legacy standalone support
    if (!window.genx) {
        window.ModuleName = initModule();
    }

    // CommonJS/ESM export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initModule };
    }
})();
```

## Code Style

### JavaScript Standards

- **ES6+** - Use modern JavaScript features
- **Functional** - Prefer pure functions over classes
- **Concise** - Keep functions small and focused
- **Comments** - Document complex logic
- **JSDoc** - Use for public APIs

```javascript
/**
 * Format a value according to type
 * @param {string} type - Format type (currency, date, etc.)
 * @param {any} value - Value to format
 * @param {Object} opts - Format options
 * @returns {string} Formatted string
 */
const format = (type, value, opts = {}) => {
    // Implementation...
};
```

### Formatting

Run before committing:

```bash
npm run format
npm run lint
```

## Testing

### Manual Testing

```bash
npm run dev
# Open http://localhost:8080/examples/test-bootloader.html
```

### Browser Testing

Test in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Accessibility Testing

- Screen readers: NVDA, JAWS, VoiceOver
- Keyboard navigation
- Lighthouse accessibility audit
- axe DevTools

## Documentation

### Architecture Documentation

When adding a new module, create:

```
docs/architecture/[modulename]-architecture-v1_0.md
```

Follow the template in `docs/architecture/STANDARD_TEXT_BLOCKS.md`

### Code Documentation

- JSDoc for public APIs
- Inline comments for complex logic
- Examples in comments

### README Updates

Update these files when relevant:
- `README.md` - Add to modules table
- `docs/README.md` - Add module reference
- `docs/QUICK-START.md` - Add usage examples

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Size limits not exceeded (`npm run size`)
- [ ] Browser testing completed
- [ ] Accessibility testing completed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Browser compatibility verified
- [ ] Accessibility tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Size limits respected
```

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address review feedback
4. Squash commits before merge

## Questions?

- 💬 Discord: [discord.gg/genx](https://discord.gg/genx)
- 🐛 Issues: [GitHub Issues](https://github.com/genx-software/genx/issues)
- 📧 Email: contribute@genx.software

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to genX! 🎉
