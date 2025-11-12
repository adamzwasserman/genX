# Manual Test Files

This directory contains HTML test files for manual/visual testing of genX functionality.

## Files

### Phone Number Formatting
- **test-phone-implementation.html** - Comprehensive test suite for phone number formatting covering all input/output format combinations
- **phone-format-test-matrix.md** - Specification document defining expected behavior for all phone format permutations

### Currency Formatting
- **test-cents-debug.html** - Debug test for cents input type handling
- **test-fx-type.html** - Test for fx-type attribute functionality

### Percentage Formatting
- **test-percent-debug.html** - Debug test for percentage formatting
- **test-percent-decimals.html** - Test for decimal precision control in percentages

### Input Types
- **test-input-types-debug.html** - Debug test for polymorphic input type handling

## Usage

Open any HTML file directly in a browser:

```bash
open tests/manual/test-phone-implementation.html
```

Or use a local server:

```bash
cd /Users/adam/dev/genX
python3 -m http.server 8000
# Then navigate to http://localhost:8000/tests/manual/test-phone-implementation.html
```

## Notes

- These tests complement the automated Playwright tests in `tests/browser/`
- Visual inspection helps catch rendering issues and UX problems
- Use these for exploratory testing and debugging specific formatting edge cases
