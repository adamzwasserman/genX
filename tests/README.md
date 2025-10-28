# genX Test Suite

Comprehensive BDD and TDD testing for genX platform.

## Test Structure

```
tests/
├── features/               # Gherkin feature files (BDD)
│   ├── bootloader.feature  # Universal bootloader tests
│   ├── fmtx.feature       # FormatX module tests
│   └── accx.feature       # AccessX module tests
├── step_definitions/       # Cucumber step implementations
│   ├── bootloader.steps.js
│   ├── fmtx.steps.js
│   └── accx.steps.js
├── unit/                   # Unit tests (TDD)
├── integration/            # Integration tests
├── fixtures/               # Test data and helpers
├── support/                # Test configuration
│   ├── world.js           # Cucumber World
│   └── hooks.js           # Before/After hooks
└── reports/               # Test reports (generated)
```

## Running Tests

### All Tests
```bash
npm test                    # Run all tests (Cucumber + Jest)
npm run test:all           # Run all tests with coverage
```

### BDD Tests (Cucumber + Playwright)
```bash
npm run test:cucumber      # Run all Gherkin features
```

### Unit Tests (Jest)
```bash
npm run test:jest          # Run all Jest tests
npm run test:unit          # Run only unit tests
npm run test:integration   # Run only integration tests
npm run test:watch         # Watch mode for TDD
npm run test:coverage      # Generate coverage report
```

## Test Coverage Requirements

- **Minimum Coverage:** 80% for all metrics
- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

## Writing Tests

### BDD Tests (Gherkin)

Create `.feature` files in `tests/features/`:

```gherkin
Feature: My Feature
  As a user
  I want some functionality
  So that I can achieve a goal

  Scenario: Basic functionality
    Given a precondition
    When an action occurs
    Then an outcome happens
```

Implement step definitions in `tests/step_definitions/`:

```javascript
const { Given, When, Then } = require('@cucumber/cucumber');

Given('a precondition', async function() {
    // Setup code
});

When('an action occurs', async function() {
    // Action code
});

Then('an outcome happens', async function() {
    // Assertion code
});
```

### Unit Tests (Jest)

Create `.test.js` files in `tests/unit/`:

```javascript
describe('MyModule', () => {
    test('should do something', () => {
        // Arrange
        const input = 'test';

        // Act
        const result = myFunction(input);

        // Assert
        expect(result).toBe('expected');
    });
});
```

## Test Fixtures

Place reusable test data in `tests/fixtures/`:

```javascript
// tests/fixtures/sample-html.js
module.exports = {
    currencyElement: '<span fx-format="currency">25.00</span>',
    accessibleButton: '<button ax-enhance="button">Click</button>'
};
```

## Browser Testing

Tests use Playwright for browser automation:

```javascript
// In step definitions
Given('an HTML page', async function() {
    await this.page.setContent('<html>...</html>');
});

When('the page loads', async function() {
    await this.page.addScriptTag({ path: './src/bootloader.js' });
});

Then('element should be formatted', async function() {
    const text = await this.page.locator('span').textContent();
    expect(text).toBe('$25.00');
});
```

## Performance Testing

Performance assertions are built into features:

```gherkin
Scenario: Format 1000 elements under 10ms
  Given 1000 elements with fx-format="currency"
  When all elements are processed
  Then the operation should complete in less than 10ms
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch

See `.github/workflows/ci.yml` for CI configuration.

## Test Reports

Reports are generated in `tests/reports/`:
- `cucumber-report.html` - BDD test results
- `cucumber-report.json` - Machine-readable BDD results
- `coverage/` - Code coverage reports

View coverage:
```bash
npm run test:coverage
open tests/reports/coverage/lcov-report/index.html
```

## Debugging Tests

### Cucumber
```bash
# Run specific feature
npx cucumber-js tests/features/bootloader.feature

# Run specific scenario
npx cucumber-js tests/features/bootloader.feature:10

# Debug mode
node --inspect-brk node_modules/.bin/cucumber-js
```

### Jest
```bash
# Run specific test file
npm run test:unit -- tests/unit/bootloader.test.js

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Best Practices

1. **Write tests first (TDD)** - Red, Green, Refactor
2. **Descriptive scenarios** - Clear Given/When/Then
3. **One assertion per scenario** - Keep tests focused
4. **Use fixtures** - Don't duplicate test data
5. **Test edge cases** - Error handling, empty inputs
6. **Performance tests** - Verify performance requirements
7. **Security tests** - XSS, injection vulnerabilities
8. **Accessibility tests** - WCAG compliance

## Common Issues

### Tests hang
- Check for missing `await` keywords
- Verify browser cleanup in hooks
- Increase timeout if needed

### Module not found
- Run `npm install` to ensure dependencies
- Check file paths in requires

### Coverage too low
- Add more test scenarios
- Test error paths
- Test edge cases

## Resources

- [Cucumber Documentation](https://cucumber.io/docs/cucumber/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
