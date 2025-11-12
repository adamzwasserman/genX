# Polymorphic Notation Implementation Plan

## Overview

Implement support for 4 polymorphic notation styles across all genX modules (fmtX, accX, loadX, navX, dragX, bindX), enabling developers to use whichever style fits their workflow while producing identical output.

**Business Value**: Increases developer productivity by supporting multiple notation styles (beginner-friendly verbose, expert compact, power-user JSON, designer CSS classes) while maintaining code consistency.

## Current State Analysis

- **Current Support**: Only Notation 1 (verbose attributes like `fx-format="currency" fx-currency="USD"`)
- **Missing**: Compact notation (`fx-format="currency:USD:2"`), JSON notation (`fx-opts='{...}'`), CSS class notation (`class="fmtx-currency-USD-2"`)
- **Code Location**: All modules in `/src/*.js`
- **Testing**: Browser tests in `/tests/browser/`, features in `/tests/features/`

## Success Metrics

- **Functionality**: All 4 notation styles produce identical output for each module
- **Test Coverage**: 100% pass rate for all notation styles across all modules
- **Performance**: <16ms processing time (60 FPS requirement)
- **Demo**: Interactive notation switcher on demo page
- **Documentation**: All architecture docs and README updated

## Phase 1: Foundation & Parser Development

### Task 1.1: Design Polymorphic Notation Parser
**Duration**: 2 hours
**Dependencies**: None
**Risk Level**: Low

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 1.1 Start: $(date '+%Y-%m-%d %H:%M:%S')" >> docs/implementation/polymorphic-notation-implementation-plan.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # tests/features/polymorphic-notation.feature
   Feature: Polymorphic Notation Support
     As a developer
     I want to use multiple notation styles
     So that I can choose the style that fits my workflow

     Scenario: Verbose notation produces correct output
       Given an element with verbose notation
       When the formatter processes the element
       Then the output should match the expected format

     Scenario: Compact notation produces identical output
       Given an element with compact notation
       When the formatter processes the element
       Then the output should match verbose notation output

     Scenario: JSON notation produces identical output
       Given an element with JSON notation
       When the formatter processes the element
       Then the output should match verbose notation output

     Scenario: CSS class notation produces identical output
       Given an element with CSS class notation
       When the formatter processes the element
       Then the output should match verbose notation output
   ```

3. **Create Test Fixtures**
   ```javascript
   // tests/fixtures/notation-fixtures.js
   export const notationTestCases = {
     currency: {
       verbose: '<span fx-format="currency" fx-currency="EUR" fx-decimals="2">1234.56</span>',
       compact: '<span fx-format="currency:EUR:2">1234.56</span>',
       json: '<span fx-format="currency" fx-opts=\'{"currency":"EUR","decimals":2}\'>1234.56</span>',
       css: '<span class="fmtx-currency-EUR-2">1234.56</span>',
       expected: '€1.234,56'
     }
   };
   ```

4. **Run Red Test**
   ```bash
   npx playwright test tests/browser/polymorphic-notation.spec.js
   # Tests fail - red state verified ✓
   ```

5. **Write Implementation**
   ```javascript
   // src/genx-common.js - shared parser for all modules
   const parseNotation = (el, prefix) => {
     // 1. Check for CSS class notation
     const classMatch = parseClassNotation(el, prefix);
     if (classMatch) return classMatch;

     // 2. Check for JSON notation (fx-opts)
     const jsonOpts = el.getAttribute(`${prefix}opts`);
     if (jsonOpts) return { ...parseJSON(jsonOpts), ...parseVerbose(el, prefix) };

     // 3. Check for compact notation (colon-separated)
     const format = el.getAttribute(`${prefix}format`);
     if (format && format.includes(':')) return parseCompact(format, prefix);

     // 4. Fall back to verbose notation
     return parseVerbose(el, prefix);
   };
   ```

6. **Run Green Test**
   ```bash
   npx playwright test tests/browser/polymorphic-notation.spec.js
   # All tests pass - 100% success rate ✓
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat: Implement polymorphic notation parser

   - Added BDD tests for all 4 notation styles
   - Implemented parseNotation with fallback chain
   - Created test fixtures for notation validation
   - Architecture compliance verified (function-based)

   Relates-to: polymorphic-notation-support"
   git push origin feature/polymorphic-notation
   ```

8. **Capture End Time**
   ```bash
   echo "Task 1.1 End: $(date '+%Y-%m-%d %H:%M:%S')" >> docs/implementation/polymorphic-notation-implementation-plan.md
   # Duration calculated from start/end times
   ```

**Validation Criteria**:
- All 4 notation parsers working correctly
- 100% test pass rate
- Parser performance <1ms per element
- No regression in existing functionality

**Rollback Procedure**:
1. `git revert` commit
2. Run test suite to verify rollback
3. Update stakeholders

## Phase 2: Module Implementation

### Task 2.1: Implement fmtX Polymorphic Notation
**Duration**: 3 hours
**Dependencies**: Task 1.1 complete
**Risk Level**: Medium

**Implementation Process**: [Complete 8-step process with fmtX-specific BDD scenarios]

### Task 2.2: Implement accX Polymorphic Notation
**Duration**: 3 hours
**Dependencies**: Task 1.1 complete
**Risk Level**: Medium

**Implementation Process**: [Complete 8-step process with accX-specific BDD scenarios]

### Task 2.3: Implement loadX Polymorphic Notation
**Duration**: 3 hours
**Dependencies**: Task 1.1 complete
**Risk Level**: Medium

**Implementation Process**: [Complete 8-step process with loadX-specific BDD scenarios]

### Task 2.4: Implement navX Polymorphic Notation
**Duration**: 3 hours
**Dependencies**: Task 1.1 complete
**Risk Level**: Medium

**Implementation Process**: [Complete 8-step process with navX-specific BDD scenarios]

### Task 2.5: Implement dragX Polymorphic Notation
**Duration**: 3 hours
**Dependencies**: Task 1.1 complete
**Risk Level**: Medium

**Implementation Process**: [Complete 8-step process with dragX-specific BDD scenarios]

### Task 2.6: Implement bindX Polymorphic Notation
**Duration**: 3 hours
**Dependencies**: Task 1.1 complete
**Risk Level**: Medium

**Implementation Process**: [Complete 8-step process with bindX-specific BDD scenarios]

## Phase 3: Testing & Validation

### Task 3.1: Create Comprehensive Test Suite
**Duration**: 4 hours
**Dependencies**: All Phase 2 tasks complete
**Risk Level**: Low

**Implementation Process**: [Complete 8-step process for test matrix covering all modules × all notations]

## Phase 4: Documentation & Demo

### Task 4.1: Update Architecture Documentation
**Duration**: 2 hours
**Dependencies**: Task 3.1 complete
**Risk Level**: Low

**Implementation Process**: [Complete 8-step process for doc updates]

### Task 4.2: Add Notation Switcher to Demo Page
**Duration**: 3 hours
**Dependencies**: Task 4.1 complete
**Risk Level**: Low

**Implementation Process**: [Complete 8-step process for interactive demo switcher]

### Task 4.3: Update README with Examples
**Duration**: 1 hour
**Dependencies**: Task 4.2 complete
**Risk Level**: Low

**Implementation Process**: [Complete 8-step process for README updates]

## Implementation Time Summary

**Total Estimated Duration**: 26 hours (3.25 days at 8 hours/day)

- Phase 1 (Foundation): 2 hours
- Phase 2 (Module Implementation): 18 hours (6 modules × 3 hours)
- Phase 3 (Testing): 4 hours
- Phase 4 (Documentation): 6 hours

**Buffer**: +30% for unforeseen issues = 33.8 hours total (4.2 days)

## Success Criteria

- [ ] All 4 notation styles work in all 6 modules
- [ ] 100% test pass rate for all notation × module combinations
- [ ] Performance <16ms per element processing
- [ ] Demo page has working notation switcher
- [ ] All architecture docs updated
- [ ] README has polymorphic notation examples
- [ ] Zero regression in existing functionality

## Risk Management

### Risk: Notation conflicts between modules
**Probability**: Low
**Impact**: Medium
**Mitigation**: Use module prefixes (`fmtx-`, `accX-`, etc.) for CSS classes
**Contingency**: Add namespace parameter to parser

### Risk: Performance degradation with notation parsing
**Probability**: Medium
**Impact**: High
**Mitigation**: Cache parsed results, optimize parser with fast-path checks
**Contingency**: Use memoization for repeated elements

## Key Success Factors

1. **BDD-First Approach**: All scenarios defined before implementation
2. **Test Coverage**: 100% pass rate enforced as quality gate
3. **Consistent Parser**: Shared logic across all modules via genx-common.js
4. **Performance Budget**: <16ms requirement maintained
5. **Documentation**: Complete examples for all notation styles

---

**Status**: Ready to begin implementation
**Next Action**: Execute Task 1.1 - Design Polymorphic Notation Parser
