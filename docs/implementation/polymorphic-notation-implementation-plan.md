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

## Phase 5: SmartX Threshold & Logging

### Feature Requirements

SmartX currently detects data types with confidence scoring but has no threshold configuration or logging capability. This phase adds:

1. **Confidence Threshold**: Set minimum confidence level (0-100) for auto-detection
2. **Fallback Behavior**: Values below threshold use original unformatted value
3. **Console Logging**: Log low-confidence detections to console for debugging
4. **HTTP Logging**: POST low-confidence detections to analytics endpoint

### Task 5.1: SmartX Threshold Configuration
**Duration**: 2 hours
**Dependencies**: None
**Risk Level**: Low

**Implementation**:

```javascript
// src/smartx.js - Add configuration object
const SmartX = {
    config: {
        threshold: 70,              // Default: 70% minimum confidence
        logTarget: null,            // null | 'console' | URL string
        logBelowThreshold: true     // Log detections below threshold
    },

    /**
     * Configure SmartX globally
     * @param {Object} options - Configuration
     */
    configure(options) {
        Object.assign(this.config, options);
    },

    // ... existing code
};

// Allow element-level threshold override
const parseThreshold = (el) => {
    let current = el;
    while (current) {
        const threshold = current.getAttribute('fx-smart-threshold');
        if (threshold) return parseInt(threshold, 10);
        current = current.parentElement;
    }
    return null;
};
```

**Usage**:
```html
<!-- Global configuration -->
<script>
  SmartX.configure({
    threshold: 80,
    logTarget: 'console',
    logBelowThreshold: true
  });
</script>

<!-- Element-level override -->
<div fx-smart-threshold="90">
  <span fx-format="smart" fx-raw="555%555%1212"></span>
</div>
```

### Task 5.2: Threshold Enforcement
**Duration**: 1 hour
**Dependencies**: Task 5.1
**Risk Level**: Low

**Implementation**:

```javascript
format(el, value) {
    const detection = this.detect(value);

    // Get effective threshold (element > global)
    const elemThreshold = parseThreshold(el);
    const threshold = elemThreshold ?? this.config.threshold;

    // Set detection metadata
    el.setAttribute('data-smart-detected', detection.type);
    el.setAttribute('data-smart-confidence', Math.round(detection.confidence));

    // Check threshold
    if (detection.confidence < threshold) {
        // Log if enabled
        if (this.config.logBelowThreshold) {
            this.logLowConfidence(el, value, detection, threshold);
        }

        // Fall back to original value
        el.setAttribute('data-smart-fallback', 'true');
        return value;
    }

    // Proceed with formatting
    el.removeAttribute('data-smart-fallback');
    return this.applyFormat(detection.type, value);
}
```

### Task 5.3: Console Logging
**Duration**: 1 hour
**Dependencies**: Task 5.2
**Risk Level**: Low

**Implementation**:

```javascript
/**
 * Log low-confidence detection to console or HTTP
 * @param {HTMLElement} el - Element
 * @param {string} value - Input value
 * @param {Object} detection - Detection result
 * @param {number} threshold - Effective threshold
 */
logLowConfidence(el, value, detection, threshold) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        value: value,
        detected: detection.type,
        confidence: detection.confidence,
        threshold: threshold,
        gap: threshold - detection.confidence,
        element: {
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class: el.className || null,
            path: this.getElementPath(el)
        }
    };

    const target = this.config.logTarget;

    if (target === 'console') {
        console.warn('🔍 SmartX: Low confidence detection', logEntry);
    } else if (target && target.startsWith('http')) {
        this.sendToEndpoint(target, logEntry);
    }
}

/**
 * Get CSS selector path for element
 * @param {HTMLElement} el
 * @returns {string} CSS path
 */
getElementPath(el) {
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
        } else {
            let sibling = el;
            let nth = 1;
            while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling;
                if (sibling.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth > 1) selector += `:nth-of-type(${nth})`;
            path.unshift(selector);
        }
        el = el.parentElement;
    }
    return path.join(' > ');
}
```

### Task 5.4: HTTP Logging with Rate Limiting
**Duration**: 2 hours
**Dependencies**: Task 5.3
**Risk Level**: Medium

**Implementation**:

```javascript
// Rate limiting state
const logRateLimiter = {
    queue: [],
    lastSent: 0,
    maxPerSecond: 10,
    batchInterval: 1000  // Send batches every 1s
};

/**
 * Send log entries to HTTP endpoint with rate limiting
 * @param {string} url - Endpoint URL
 * @param {Object} data - Log entry
 */
sendToEndpoint(url, data) {
    // Add to queue
    logRateLimiter.queue.push(data);

    // Schedule batch send if not already scheduled
    if (!logRateLimiter.scheduled) {
        logRateLimiter.scheduled = setTimeout(() => {
            this.flushLogQueue(url);
        }, logRateLimiter.batchInterval);
    }
}

/**
 * Flush log queue to endpoint
 * @param {string} url - Endpoint URL
 */
flushLogQueue(url) {
    const batch = logRateLimiter.queue.splice(0, logRateLimiter.maxPerSecond);
    logRateLimiter.scheduled = null;

    if (batch.length === 0) return;

    // Send batch
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-SmartX-Version': '1.0',
            'X-SmartX-Batch-Size': String(batch.length)
        },
        body: JSON.stringify({
            entries: batch,
            metadata: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            }
        }),
        mode: 'cors',
        credentials: 'omit',
        keepalive: true  // Allow completion even if page unloads
    })
    .then(response => {
        if (!response.ok) {
            console.error('SmartX: Logging failed:', response.status);
        }
    })
    .catch(err => {
        console.error('SmartX: Failed to send logs:', err);
        // Re-queue failed entries (up to max)
        if (batch.length <= 100) {
            logRateLimiter.queue.unshift(...batch);
        }
    })
    .finally(() => {
        logRateLimiter.lastSent = Date.now();

        // Schedule next batch if queue has more
        if (logRateLimiter.queue.length > 0) {
            logRateLimiter.scheduled = setTimeout(() => {
                this.flushLogQueue(url);
            }, logRateLimiter.batchInterval);
        }
    });
}
```

### Task 5.5: BDD Tests for SmartX Threshold & Logging
**Duration**: 2 hours
**Dependencies**: Tasks 5.1-5.4
**Risk Level**: Low

**Feature File**:
```gherkin
# tests/features/smartx-threshold-logging.feature
Feature: SmartX Confidence Threshold and Logging

  Background:
    Given the SmartX module is loaded
    And the test environment is clean

  Scenario: Detections above threshold are formatted
    Given SmartX threshold is 70
    When I process fx-format="smart" fx-raw="$1,234.56"
    And the detected confidence is 95%
    Then the element should be formatted as currency
    And data-smart-fallback should not exist

  Scenario: Detections below threshold fallback to original
    Given SmartX threshold is 80
    When I process fx-format="smart" fx-raw="123456"
    And the detected confidence is 50%
    Then the element should display "123456"
    And data-smart-fallback should be "true"

  Scenario: Element-level threshold overrides global
    Given global SmartX threshold is 70
    And an element has fx-smart-threshold="90"
    When the element is processed with 75% confidence
    Then it should fallback (using element threshold 90)
    Not be formatted (would pass global threshold 70)

  Scenario: Console logging for low confidence
    Given SmartX is configured with logTarget="console"
    And threshold is 80
    When I process an element with 60% confidence
    Then a warning should be logged to console
    And the log should contain:
      | field      | value |
      | value      | input text |
      | detected   | number |
      | confidence | 60 |
      | threshold  | 80 |
      | gap        | 20 |

  Scenario: HTTP logging batches requests
    Given SmartX is configured with logTarget="https://api.test.com/analytics"
    And maxPerSecond is 10
    When I process 25 elements below threshold within 500ms
    Then exactly 2 POST requests should be sent
    And the first request should contain 10 entries
    And the second request should contain 10 entries
    And the third request should contain 5 entries

  Scenario: Failed HTTP requests are retried
    Given SmartX is configured with HTTP logging
    When the endpoint returns 500 error
    Then the entries should be re-queued
    And retried in the next batch
```

### Security & Privacy Considerations

**URL Validation**:
```javascript
const isValidLogURL = (url) => {
    try {
        const parsed = new URL(url);
        // Only allow HTTPS for external endpoints
        if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
            return false;
        }
        // Validate hostname (no file://, javascript:, etc.)
        if (!parsed.hostname || parsed.hostname.length === 0) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
};
```

**PII Sanitization**:
```javascript
const sanitizeValue = (value) => {
    // Mask email addresses
    value = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

    // Mask phone numbers
    value = value.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');

    // Mask credit card numbers
    value = value.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD]');

    return value;
};
```

### Performance Budget

- Threshold check: <0.1ms overhead
- Console logging: <1ms per log
- HTTP batching: 0ms (async, non-blocking)
- Rate limiting: <0.5ms per batch

### Success Criteria

- [ ] Threshold configuration works globally and per-element
- [ ] Detections below threshold fall back to original value
- [ ] Console logging outputs structured data
- [ ] HTTP logging batches requests (max 10/sec)
- [ ] Rate limiting prevents endpoint overload
- [ ] BDD tests pass 100%
- [ ] No performance degradation
- [ ] PII is sanitized in logs
- [ ] HTTPS validation prevents security issues

---

**Status**: Ready to begin implementation
**Next Action**: Execute Task 1.1 - Design Polymorphic Notation Parser
**Future Work**: SmartX Threshold & Logging (Phase 5)
