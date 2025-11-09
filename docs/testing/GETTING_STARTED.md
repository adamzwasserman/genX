# Getting Started with genX Testing

## Quick Start

### Prerequisites

```bash
node >= 14.0.0
npm >= 6.0.0
```

### Installation

Already installed if you've run `npm install` in the project root.

### Run All Tests

```bash
npm test
```

This runs:
1. Unit tests (Jest)
2. BDD tests (Cucumber)

### Run Specific Test Types

```bash
# Unit tests only (fast)
npm run test:unit

# BDD tests only
npm run test:bdd

# Browser integration tests
npm run test:browser

# Critical tests only (for CI)
npm run test:critical

# Everything
npm run test:all
```

## Your First Test

### 1. Unit Test (Jest)

Create `tests/unit/example.test.js`:

```javascript
describe('Example Module', () => {
  test('should format currency', () => {
    const result = formatCurrency(25.00);
    expect(result).toBe('$25.00');
  });
});
```

Run:
```bash
npm run test:unit -- example.test.js
```

### 2. BDD Test (Cucumber)

Create `tests/features/example.feature`:

```gherkin
Feature: Example Feature
  Scenario: Basic test
    Given a test element
    When I process it
    Then it should work
```

Create `tests/step_definitions/example.steps.js`:

```javascript
const { Given, When, Then } = require('@cucumber/cucumber');

Given('a test element', function() {
  this.element = document.createElement('div');
});

When('I process it', function() {
  this.result = processElement(this.element);
});

Then('it should work', function() {
  expect(this.result).toBeTruthy();
});
```

Run:
```bash
npx cucumber-js tests/features/example.feature
```

### 3. Browser Test (Playwright)

Create `tests/browser/example.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test('example test', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.click('button');
  await expect(page.locator('.result')).toHaveText('Success');
});
```

Run:
```bash
npx playwright test tests/browser/example.spec.js
```

## Understanding Test Layers

### Layer 1: Unit Tests (Jest)

**Purpose**: Test individual functions in isolation

**Location**: `tests/unit/[module].test.js`

**When to use**:
- Testing pure functions
- Testing logic without DOM
- Fast feedback during development

**Example**:
```javascript
test('parseNumber handles invalid input', () => {
  expect(parseNumber('not-a-number')).toBeNull();
});
```

### Layer 2: BDD Tests (Cucumber)

**Purpose**: Test features from user perspective

**Location**: `tests/features/[feature].feature`

**When to use**:
- Describing user-facing behavior
- Acceptance criteria
- Documentation that executes

**Example**:
```gherkin
Scenario: User formats currency
  Given an element with fx-format="currency"
  And the value is "25.00"
  When the element is processed
  Then it should display "$25.00"
```

### Layer 3: Browser Tests (Playwright)

**Purpose**: Test in real browser environment

**Location**: `tests/browser/[feature].spec.js`

**When to use**:
- Testing MutationObserver behavior
- Testing browser-specific APIs
- Testing visual behavior
- Integration testing

**Example**:
```javascript
test('detects browser freeze', async ({ page }) => {
  const responsive = await checkResponsiveness(page);
  expect(responsive).toBe(true);
});
```

### Layer 4: Base Safety Tests (Cucumber + Playwright)

**Purpose**: Generic tests for ALL modules

**Location**: `tests/features/base-module-safety.feature`

**When to use**:
- Automatically (runs against every module)
- When adding a new module

**Example**:
```gherkin
Scenario Outline: Module does not create infinite loops
  Given the "<module>" module is loaded
  When I add 10 elements
  Then mutation count should be less than 50

  Examples:
    | module |
    | fmtx   |
    | accx   |
```

## Test Organization

```
tests/
├── unit/                    # Jest unit tests
│   ├── fmtx.test.js
│   └── accx.test.js
│
├── features/                # Cucumber BDD tests
│   ├── base-module-safety.feature  # Generic (ALL modules)
│   ├── fmtx.feature               # fmtx-specific
│   └── accx.feature               # accx-specific
│
├── step_definitions/        # Cucumber step implementations
│   ├── base-module-safety.steps.js
│   ├── fmtx.steps.js
│   └── accx.steps.js
│
├── browser/                 # Playwright tests
│   ├── fixtures/            # HTML test fixtures
│   │   ├── test-base.html
│   │   └── fmtx-test.html
│   └── fmtx-mutation-loop.spec.js
│
├── support/                 # Shared utilities
│   └── test-utils.js
│
└── reports/                 # Generated reports
    ├── cucumber-report.html
    └── coverage/
```

## Common Commands

### Development

```bash
# Watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm run test:unit -- fmtx.test.js

# Run specific scenario
npx cucumber-js tests/features/fmtx.feature:42  # Line 42

# Run with tag filter
npx cucumber-js --tags @critical
npx cucumber-js --tags "@mutation-safety and @critical"
```

### Debugging

```bash
# Run with verbose output
npm run test:unit -- --verbose

# Debug in browser (headed mode)
npx playwright test --headed --debug

# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### CI/CD

```bash
# Fast critical tests
npm run test:critical

# Full suite
npm run test:all
```

## Test Utilities

Shared helpers in `tests/support/test-utils.js`:

```javascript
const {
  MODULE_CONFIG,              // Module metadata
  createTestElement,          // Generate test elements
  setupMutationObserver,      // Monitor DOM changes
  checkResponsiveness,        // Detect browser freeze
  measurePerformance,         // Time operations
  getMemoryUsage,            // Track memory
  checkXSSTriggered          // Security validation
} = require('./support/test-utils');
```

### Example Usage

```javascript
// Setup mutation observer
await setupMutationObserver(page, '#test-container');

// Perform operation
await someOperation();

// Check mutations
const count = await getMutationCount(page);
expect(count).toBeLessThan(10);

// Check browser responsiveness
const responsive = await checkResponsiveness(page);
expect(responsive).toBe(true);
```

## Troubleshooting

### Tests Hang/Timeout

**Problem**: Test never completes

**Solutions**:
1. Check for infinite loops in code
2. Verify MutationObserver has change detection
3. Increase timeout: `test.setTimeout(60000)`
4. Use `--headed` mode to see what's happening

### Module Not Loading

**Problem**: `window.FormatX is undefined`

**Solutions**:
1. Build modules: `npm run build:modules`
2. Check script path in fixture
3. Verify module exports global correctly

### Flaky Tests

**Problem**: Tests pass/fail randomly

**Solutions**:
1. Add explicit waits: `await page.waitForTimeout(100)`
2. Use `waitForFunction` instead of fixed timeouts
3. Check for race conditions in async code

### Memory Leaks Detected

**Problem**: Memory usage grows unbounded

**Solutions**:
1. Ensure event listeners are removed
2. Disconnect MutationObserver when done
3. Avoid circular references
4. Call cleanup functions in `afterEach`

## Next Steps

- Read [TESTING_STRATEGY.md](../../tests/TESTING_STRATEGY.md) for architecture details
- Read [IMPLEMENTATION_SUMMARY.md](../../tests/IMPLEMENTATION_SUMMARY.md) for implementation
- See [WRITING_TESTS.md](./WRITING_TESTS.md) for detailed test writing guide
- Check existing tests for examples: `tests/features/fmtx.feature`

## Getting Help

- Review existing tests as examples
- Check [Cucumber docs](https://cucumber.io/docs/cucumber/)
- Check [Playwright docs](https://playwright.dev/docs/intro)
- Check [Jest docs](https://jestjs.io/docs/getting-started)
- Search issues in the repo
