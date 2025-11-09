# genX Testing Strategy

## Overview

Every module in genX requires **two layers of testing**:

1. **Base Module Safety Tests** - Generic requirements that prevent critical bugs
2. **Module-Specific Feature Tests** - Functionality unique to each module

## Architecture

```
tests/
├── features/                          # Gherkin feature files
│   ├── base-module-safety.feature     # Generic tests for ALL modules
│   ├── fmtx.feature                   # fmtx-specific features
│   ├── accx.feature                   # accx-specific features
│   └── [module].feature               # One per module
│
├── step_definitions/                  # Cucumber step implementations
│   ├── base-module-safety.steps.js    # Shared steps for base tests
│   ├── fmtx.steps.js                  # fmtx-specific steps
│   └── [module].steps.js              # One per module
│
├── browser/                           # Playwright integration tests
│   ├── fixtures/                      # HTML fixtures for tests
│   │   ├── test-base.html             # Base fixture for all modules
│   │   ├── fmtx-test.html             # fmtx-specific fixture
│   │   └── [module]-test.html         # One per module
│   └── *.spec.js                      # Playwright test specs
│
└── unit/                              # Jest unit tests
    ├── fmtx.test.js
    └── [module].test.js
```

## Test Layers

### Layer 1: Base Module Safety Tests

**Purpose**: Catch critical bugs that freeze browsers, create security holes, or degrade performance.

**Location**: `tests/features/base-module-safety.feature`

**Coverage**:
- ✅ Infinite loop prevention (MutationObserver)
- ✅ Idempotent operations
- ✅ Change detection (no unnecessary DOM updates)
- ✅ Performance (1000 elements < 100ms, 60 FPS)
- ✅ Memory safety (cleanup, leak detection)
- ✅ XSS prevention (input sanitization)
- ✅ Error handling (missing/invalid attrs, circular refs)
- ✅ Browser compatibility (Chromium, Firefox, WebKit)
- ✅ Accessibility (preserve ARIA attributes)
- ✅ Concurrency (race condition prevention)
- ✅ Module isolation (no global pollution, no conflicts)

**How it works**:
- Uses Cucumber `Scenario Outline` with `Examples` to run same tests against every module
- Module configuration defined in `MODULE_CONFIG` map
- Shared step definitions work with any module

**Example**:
```gherkin
Scenario Outline: Module does not create infinite MutationObserver loops
  Given the "<module>" module is loaded
  When I add 10 elements with "<module>" attributes
  Then the total mutation count should be less than 50

  Examples:
    | module |
    | fmtx   |
    | accx   |
```

### Layer 2: Module-Specific Feature Tests

**Purpose**: Test functionality unique to each module.

**Location**: `tests/features/[module].feature`

**Example for fmtx**:
- Currency formatting (USD, EUR, GBP, JPY)
- Date formatting (short, medium, long, full, ISO)
- Number formatting (thousands separator, decimals)
- Text transformations (uppercase, capitalize, truncate)
- Phone numbers, durations, file sizes
- Dynamic content (MutationObserver integration)
- Unformat functionality

**Example for accx**:
- Screen reader text insertion
- ARIA label generation
- Live region configuration
- Form field accessibility
- Character counters
- Navigation landmarks
- Focus management
- Skip links

## Implementation Fixtures

### Fixture Strategy

**Problem**: Tests need isolated, reproducible environments that work across Cucumber and Playwright.

**Solution**: HTML fixtures + shared utilities

#### 1. Base Fixture (`test-base.html`)

Minimal HTML loaded by ALL base safety tests:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Base Module Test Fixture</title>
</head>
<body>
    <div id="test-container"></div>
    <script>
        // XSS trap
        window._xssTriggered = false;
        window.alert = function() { window._xssTriggered = true; };
        window.testReady = true;
    </script>
</body>
</html>
```

**Usage**: Step definitions dynamically inject module scripts and test elements.

#### 2. Module-Specific Fixtures

Pre-loaded with module and common test elements:

```html
<!-- tests/browser/fixtures/fmtx-test.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>fmtx Test Fixture</title>
</head>
<body>
    <div id="test-container"></div>
    <script src="../../../dist/modules/fmtx.js"></script>
    <script>window.testReady = true;</script>
</body>
</html>
```

**Usage**: Faster for module-specific tests (module already loaded).

#### 3. Shared Test Utilities

Create `tests/support/test-utils.js`:

```javascript
module.exports = {
  MODULE_CONFIG: {
    fmtx: {
      scriptPath: '/dist/modules/fmtx.js',
      globalName: 'FormatX',
      attributePrefix: 'fx-',
      sampleAttribute: 'fx-format',
      sampleValue: 'currency'
    },
    accx: {
      scriptPath: '/dist/modules/accx.js',
      globalName: 'AccessX',
      attributePrefix: 'ax-',
      sampleAttribute: 'ax-enhance',
      sampleValue: 'label'
    }
  },

  // Helper: Create test element with module attributes
  createTestElement: (moduleName, config = {}) => {
    const moduleConfig = this.MODULE_CONFIG[moduleName];
    return {
      tag: config.tag || 'span',
      attributes: {
        [moduleConfig.sampleAttribute]: config.value || moduleConfig.sampleValue,
        [`${moduleConfig.attributePrefix}raw`]: config.raw || '25.00',
        ...config.attributes
      }
    };
  },

  // Helper: Measure mutations
  setupMutationObserver: (page, selector = '#test-container') => {
    return page.evaluate((sel) => {
      window._testMutationCount = 0;
      const target = document.querySelector(sel);

      window._testObserver = new MutationObserver((mutations) => {
        window._testMutationCount += mutations.length;
      });

      window._testObserver.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });

      return window._testMutationCount;
    }, selector);
  },

  // Helper: Check browser responsiveness
  checkResponsiveness: (page, timeoutMs = 1000) => {
    return page.evaluate((timeout) => {
      return new Promise((resolve) => {
        let responded = false;
        const timer = setTimeout(() => {
          if (!responded) resolve(false);
        }, timeout);

        requestAnimationFrame(() => {
          responded = true;
          clearTimeout(timer);
          resolve(true);
        });
      });
    }, timeoutMs);
  },

  // Helper: Measure performance
  measurePerformance: async (page, operation) => {
    const startTime = Date.now();
    await operation();
    const endTime = Date.now();
    return endTime - startTime;
  },

  // Helper: Check memory usage
  getMemoryUsage: (page) => {
    return page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize / (1024 * 1024), // MB
          total: performance.memory.totalJSHeapSize / (1024 * 1024)
        };
      }
      return null;
    });
  }
};
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Browser Integration Tests
```bash
npm run test:browser
```

### Cucumber BDD Tests
```bash
npm run test:cucumber
```

### Specific Module
```bash
npm run test:unit -- fmtx.test.js
npx playwright test tests/browser/fmtx-mutation-loop.spec.js
npx cucumber-js tests/features/fmtx.feature
```

### Base Safety Tests Only
```bash
npx cucumber-js tests/features/base-module-safety.feature
```

### Specific Scenario
```bash
npx cucumber-js tests/features/base-module-safety.feature:10  # Line 10
npx cucumber-js --tags @critical
npx cucumber-js --tags "@mutation-safety and @critical"
```

## Test Tags

Use tags to filter tests:

- `@critical` - Must never fail (browser freeze, XSS, infinite loops)
- `@mutation-safety` - MutationObserver and DOM update tests
- `@performance` - Speed and FPS tests
- `@memory-safety` - Memory leak and cleanup tests
- `@xss-prevention` - Security tests
- `@error-handling` - Graceful degradation tests
- `@browser-compat` - Cross-browser tests
- `@a11y` - Accessibility tests
- `@concurrency` - Race condition tests
- `@isolation` - Module independence tests

## Adding a New Module

When creating a new module (e.g., `bindx`), follow these steps:

### 1. Update MODULE_CONFIG

Add to `tests/step_definitions/base-module-safety.steps.js`:

```javascript
const MODULE_CONFIG = {
  // ...existing modules...
  bindx: {
    scriptPath: '/dist/modules/bindx.js',
    globalName: 'BindX',
    factoryName: 'bxXFactory',
    attributePrefix: 'bx-',
    sampleAttribute: 'bx-bind',
    sampleValue: 'model'
  }
};
```

### 2. Add to Base Safety Tests

Add `bindx` to Examples in `base-module-safety.feature`:

```gherkin
Examples:
  | module   |
  | fmtx     |
  | accx     |
  | bindx    |  # ← Add here
```

### 3. Create Module-Specific Feature File

Create `tests/features/bindx.feature`:

```gherkin
Feature: BindX (bx) - Data Binding Module
  As a web developer
  I want declarative data binding via HTML attributes
  So that I can sync UI with model state without writing JavaScript

  Background:
    Given the bindx module is loaded
    And the DOM is ready

  Scenario: Two-way data binding
    Given an input with bx-bind="user.name"
    And the model has user.name = "Alice"
    When the model updates to "Bob"
    Then the input value should be "Bob"

  # ... more scenarios
```

### 4. Create Step Definitions

Create `tests/step_definitions/bindx.steps.js`:

```javascript
const { Given, When, Then } = require('@cucumber/cucumber');

Given('an input with bx-bind={string}', async function(binding) {
  // Implementation
});

// ... more steps
```

### 5. Create Unit Tests

Create `tests/unit/bindx.test.js`:

```javascript
describe('BindX Module', () => {
  test('should bind input to model', () => {
    // Implementation
  });
});
```

### 6. Create Browser Tests

Create `tests/browser/bindx-*.spec.js` for complex integration tests.

### 7. Create Fixture

Create `tests/browser/fixtures/bindx-test.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>bindx Test Fixture</title>
</head>
<body>
    <div id="test-container"></div>
    <script src="../../../dist/modules/bindx.js"></script>
    <script>window.testReady = true;</script>
</body>
</html>
```

## CI/CD Integration

All tests run automatically on:
- **Pre-commit**: Unit tests (via git hooks)
- **Pull Request**: All tests (via GitHub Actions)
- **Pre-release**: All tests + coverage report

## Success Criteria

A module is **production-ready** when:

1. ✅ All base safety tests pass (100%)
2. ✅ All module-specific feature tests pass (100%)
3. ✅ Unit test coverage ≥ 90%
4. ✅ No critical browser bugs in Chromium, Firefox, WebKit
5. ✅ Performance meets targets:
   - 1000 elements < 100ms
   - Maintains 60 FPS
   - No memory leaks
6. ✅ No XSS vulnerabilities
7. ✅ Accessible (WCAG 2.1 AA)
8. ✅ No infinite loops or browser freezes

## Troubleshooting

### Test Hangs/Timeouts

- Check for infinite loops in code
- Verify MutationObserver change detection
- Increase timeout in `cucumber.js` or test spec

### Flaky Tests

- Add explicit waits: `await page.waitForTimeout(100)`
- Use `waitForFunction` instead of fixed timeouts
- Check for race conditions in async code

### Module Not Loading

- Verify script path in MODULE_CONFIG
- Check that `dist/` directory has built files
- Run `npm run build:modules` before tests

### Memory Leaks Detected

- Ensure event listeners are removed
- Check that MutationObserver is disconnected
- Verify circular references are avoided

## Resources

- [Cucumber Documentation](https://cucumber.io/docs/cucumber/)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/reference/)
