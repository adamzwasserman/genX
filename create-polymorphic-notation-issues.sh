#!/bin/bash
# Create bd issues for Polymorphic Notation v2 Implementation
# BDD-first approach: Feature → Fixture → Red Test → Code → Green Test → Refactor

set -e  # Exit on error

echo "Creating polymorphic notation implementation issues..."

# Phase 1: Bootloader Optimization
echo "Phase 1: Bootloader Optimization..."

bd create "1.1 BDD: Unified DOM scan (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for unified DOM scan before implementation.

Files to create:
- tests/features/bootloader-unified-scan.feature
- tests/fixtures/bootloader-scan-fixtures.js
- tests/step_defs/test_bootloader_scan.py

Feature scenarios:
1. Single querySelector finds all notation styles
2. Scan time under 5ms for 1000 elements
3. Detects fx-, bx-, ax- attributes
4. Detects fmt-, bind-, acc- CSS classes
5. Returns Set of needed module prefixes

Fixtures:
- Mixed notation HTML samples (1000 elements)
- Performance timing utilities
- Expected module detection results

Acceptance: Feature file passes RED tests (no implementation yet)" \
  --json

bd create "1.1 IMPL: Unified DOM scan implementation" \
  -t task -p 1 \
  -d "Implement single unified querySelector for all genX notations.

Prerequisites:
- bd issue for BDD artifacts must be complete
- Red tests must be failing

Implementation:
- buildUnifiedSelector() in src/bootloader.js
- detectPrefix(element) helper
- Updated scan() function with single query
- CLASS_PREFIX_MAP and MODULE_PREFIX_MAP

Performance target: <5ms for 1000 elements
Exit criteria: All BDD tests GREEN" \
  --json

bd create "1.2 BDD: Notation style detection (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for detecting which notation styles are in use.

Files to create:
- tests/features/bootloader-style-detection.feature
- tests/fixtures/notation-style-fixtures.js

Feature scenarios:
1. Detect verbose-only pages → ['verbose']
2. Detect verbose + class → ['verbose', 'class']
3. Detect colon syntax (attr contains ':')
4. Detect JSON (-opts attributes)
5. Detect all 4 styles correctly

Fixtures:
- Page with only verbose attributes
- Page with verbose + class mix
- Page with all 4 notation styles

Acceptance: RED tests confirm detection logic needed" \
  --json

bd create "1.2 IMPL: Notation style detection" \
  -t task -p 1 \
  -d "Implement detectNotationStyles() to identify which parsers to load.

Prerequisites:
- BDD artifacts complete
- Red tests failing

Implementation:
- detectNotationStyles(elements) in bootloader.js
- Check for verbose (fx-, bx- attributes)
- Check for colon (attribute values with ':')
- Check for JSON (-opts attributes)
- Check for CSS classes (fmt-, bind- patterns)

Exit criteria: All BDD tests GREEN" \
  --json

bd create "1.3 BDD: Dynamic parser loading (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for on-demand parser loading.

Files to create:
- tests/features/bootloader-parser-loading.feature
- tests/fixtures/parser-loading-fixtures.js

Feature scenarios:
1. Load only verbose parser when detected
2. Load multiple parsers in parallel
3. Skip unused parsers (bundle savings)
4. Handle parser load failures gracefully
5. Performance: parser loading < 50ms

Fixtures:
- Mock parser modules
- Network delay simulation
- Bundle size tracking

Acceptance: RED tests for dynamic import()" \
  --json

bd create "1.3 IMPL: Dynamic parser loading" \
  -t task -p 1 \
  -d "Implement loadParsers() with dynamic import().

Prerequisites:
- BDD artifacts complete
- Red tests failing

Implementation:
- PARSER_URLS mapping in bootloader.js
- loadParsers(styles) with Promise.all()
- CDN URL configuration support
- Error handling for failed imports

Exit criteria: All BDD tests GREEN, parsers load on-demand" \
  --json

# Phase 2: Parser Extraction
echo "Phase 2: Parser Extraction..."

bd create "2.1 BDD: Verbose parser module (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for verbose attribute parser.

Files to create:
- tests/features/parser-verbose.feature
- tests/fixtures/parser-verbose-fixtures.js
- src/parsers/genx-parser-verbose.js (stub for red test)

Feature scenarios:
1. Parse fx-format='currency' fx-currency='USD' → {format: 'currency', currency: 'USD'}
2. Skip -opts and -raw attributes
3. Handle all module prefixes (fx, bx, ax, dx, lx, nx, tx)
4. Performance: <0.5ms per element
5. Export CARDINALITY_ORDERS

Fixtures:
- Verbose attribute HTML samples for each module
- Expected config objects

Acceptance: RED tests show parser needed" \
  --json

bd create "2.1 IMPL: Verbose parser extraction" \
  -t task -p 1 \
  -d "Extract verbose parser from genx-common.js to separate module.

Prerequisites:
- BDD artifacts complete
- Red tests failing

Implementation:
- Create src/parsers/genx-parser-verbose.js (~2KB)
- Export parseVerbose(element, prefix)
- Export CARDINALITY_ORDERS
- ES module format for tree-shaking

Target size: 2KB minified
Exit criteria: All BDD tests GREEN" \
  --json

bd create "2.2 BDD: Colon parser module (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for colon syntax parser.

Files to create:
- tests/features/parser-colon.feature
- tests/fixtures/parser-colon-fixtures.js

Feature scenarios:
1. Parse fx-format='currency:USD:2' → {format: 'currency', currency: 'USD', decimals: '2'}
2. Handle partial colons (currency:USD:)
3. Use cardinality order from verbose parser
4. Performance: <0.5ms per element

Fixtures:
- Colon syntax samples for each module
- Edge cases (empty values, trailing colons)

Acceptance: RED tests for colon parsing" \
  --json

bd create "2.2 IMPL: Colon parser extraction" \
  -t task -p 1 \
  -d "Extract colon parser to separate module.

Prerequisites:
- BDD artifacts complete
- Verbose parser complete (dependency)
- Red tests failing

Implementation:
- Create src/parsers/genx-parser-colon.js (~1KB)
- Import CARDINALITY_ORDERS from verbose parser
- Export parseColon(element, prefix)

Target size: 1KB minified
Exit criteria: All BDD tests GREEN" \
  --json

bd create "2.3 BDD: JSON parser module (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for JSON config parser.

Files to create:
- tests/features/parser-json.feature
- tests/fixtures/parser-json-fixtures.js

Feature scenarios:
1. Parse fx-opts='{\"format\":\"currency\",\"currency\":\"USD\"}'
2. Handle malformed JSON gracefully
3. Log warning on parse failure
4. Performance: <0.5ms per element

Fixtures:
- Valid JSON configs for all modules
- Malformed JSON test cases

Acceptance: RED tests for JSON parsing" \
  --json

bd create "2.3 IMPL: JSON parser extraction" \
  -t task -p 1 \
  -d "Extract JSON parser to separate module.

Prerequisites:
- BDD artifacts complete
- Red tests failing

Implementation:
- Create src/parsers/genx-parser-json.js (~0.5KB)
- Export parseJson(element, prefix)
- Safe JSON.parse with try/catch
- Console warning on failure

Target size: 0.5KB minified
Exit criteria: All BDD tests GREEN" \
  --json

bd create "2.4 BDD: CSS class parser module (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for CSS class notation parser.

Files to create:
- tests/features/parser-class.feature
- tests/fixtures/parser-class-fixtures.js

Feature scenarios:
1. Parse class='fmt-currency-USD-2' → {format: 'currency', currency: 'USD', decimals: '2'}
2. Handle multiple classes (preserve non-genX classes)
3. Map class prefixes: fmt→fx, bind→bx, acc→ax
4. Use cardinality order for parameter mapping
5. Performance: <0.5ms per element

Fixtures:
- CSS class samples for all modules
- Mixed classes (genX + utility classes)

Acceptance: RED tests for class parsing" \
  --json

bd create "2.4 IMPL: CSS class parser extraction" \
  -t task -p 1 \
  -d "Implement CSS class notation parser.

Prerequisites:
- BDD artifacts complete
- Verbose parser complete (for CARDINALITY_ORDERS)
- Red tests failing

Implementation:
- Create src/parsers/genx-parser-class.js (~1.5KB)
- Import CARDINALITY_ORDERS
- Export parseClass(element, prefix)
- CLASS_PREFIX_MAP: fmt→fx, bind→bx, etc.

Target size: 1.5KB minified
Exit criteria: All BDD tests GREEN" \
  --json

# Phase 3: Parse-Once Cache
echo "Phase 3: Parse-Once Cache..."

bd create "3.1 BDD: WeakMap parse cache (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for parse-once-use-many cache.

Files to create:
- tests/features/bootloader-parse-cache.feature
- tests/fixtures/parse-cache-fixtures.js

Feature scenarios:
1. Elements parsed once during bootstrap
2. Config cached in WeakMap (GC-friendly)
3. window.genx.getConfig(el) returns cached config
4. Performance: O(1) lookup vs O(n) re-parse
5. 1000 elements parsed in <100ms

Fixtures:
- Large DOM samples (1000 elements)
- Performance benchmarking utilities
- Cache hit/miss tracking

Acceptance: RED tests show caching needed" \
  --json

bd create "3.1 IMPL: WeakMap parse cache" \
  -t task -p 1 \
  -d "Implement parse-once-use-many cache with WeakMap.

Prerequisites:
- BDD artifacts complete
- All 4 parsers complete
- Red tests failing

Implementation:
- parseMap WeakMap in bootloader.js
- parseAllElements(elements, parsers)
- Priority order: JSON > Colon > Verbose > Class
- window.genx.getConfig(el) API
- Performance logging

Target: Parse 1000 elements in <100ms
Exit criteria: All BDD tests GREEN" \
  --json

bd create "3.2 BDD: Bootstrap sequence (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for updated bootstrap flow.

Files to create:
- tests/features/bootloader-bootstrap.feature
- tests/fixtures/bootstrap-fixtures.js

Feature scenarios:
1. Phase 1: Unified scan
2. Phase 2: Detect notation styles
3. Phase 3: Load parsers (only needed)
4. Phase 4: Parse all elements once
5. Phase 5: Init modules with cache access
6. Phase 6: Setup MutationObserver
7. Total bootstrap < 105ms (1000 elements)

Fixtures:
- Full page scenarios
- End-to-end timing measurements

Acceptance: RED tests for new bootstrap flow" \
  --json

bd create "3.2 IMPL: Updated bootstrap sequence" \
  -t task -p 1 \
  -d "Refactor bootstrap() with optimized flow.

Prerequisites:
- BDD artifacts complete
- Parse cache complete
- Red tests failing

Implementation:
- Update bootstrap() in bootloader.js
- 6-phase sequence
- genx:ready event with stats
- MutationObserver integration

Target: <105ms total init (1000 elements)
Exit criteria: All BDD tests GREEN" \
  --json

# Phase 4: Module Updates
echo "Phase 4: Module Updates..."

MODULES=("fmtx" "bindx" "accx" "dragx" "loadx" "navx")
for module in "\${MODULES[@]}"; do
  bd create "4.x BDD: Update ${module} to use cache (feature + fixtures)" \
    -t task -p 1 \
    -d "Create BDD artifacts for ${module} cache integration.

Files to create:
- tests/features/${module}-cache-integration.feature
- Update existing ${module} fixtures

Feature scenarios:
1. ${module} calls window.genx.getConfig(el)
2. O(1) lookup instead of attribute reading
3. Works with all 4 notation styles
4. No regression in existing functionality
5. Performance improvement measurable

Acceptance: RED tests show cache not used yet" \
    --json

  bd create "4.x IMPL: Update ${module} to use cache" \
    -t task -p 1 \
    -d "Refactor ${module} to use parse cache instead of direct attributes.

Prerequisites:
- BDD artifacts complete
- Parse cache implemented
- Red tests failing

Implementation:
- Replace getAttribute() calls with genx.getConfig()
- Update processElement() logic
- Remove redundant parsing code
- Maintain backward compatibility

Exit criteria: All BDD tests GREEN, ${module} uses cache" \
    --json
done

# Phase 5: SmartX Threshold & Logging
echo "Phase 5: SmartX Threshold & Logging..."

bd create "5.1 BDD: SmartX threshold config (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for SmartX confidence threshold.

Files to create:
- tests/features/smartx-threshold.feature
- tests/fixtures/smartx-threshold-fixtures.js

Feature scenarios:
1. Global threshold: SmartX.configure({threshold: 80})
2. Element-level override: fx-smart-threshold='90'
3. Above threshold → format applied
4. Below threshold → fallback to original
5. data-smart-fallback attribute set

Fixtures:
- Elements with varying confidence scores
- Threshold configuration samples

Acceptance: RED tests for threshold enforcement" \
  --json

bd create "5.1 IMPL: SmartX threshold configuration" \
  -t task -p 1 \
  -d "Implement confidence threshold configuration.

Prerequisites:
- BDD artifacts complete
- Red tests failing

Implementation:
- SmartX.config object with threshold
- SmartX.configure(options)
- parseThreshold(element) for overrides
- Update format() to check threshold
- Set data-smart-fallback on low confidence

Exit criteria: All BDD tests GREEN" \
  --json

bd create "5.2 BDD: Console logging (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for low-confidence console logging.

Files to create:
- tests/features/smartx-console-logging.feature
- tests/fixtures/smartx-logging-fixtures.js

Feature scenarios:
1. logTarget: 'console' enables logging
2. Structured log data (timestamp, value, confidence, etc.)
3. Element path in log (CSS selector)
4. Warning emoji and formatting
5. Performance: <1ms logging overhead

Acceptance: RED tests for console output" \
  --json

bd create "5.2 IMPL: Console logging" \
  -t task -p 1 \
  -d "Implement structured console logging for low confidence.

Prerequisites:
- BDD artifacts complete
- Threshold config complete
- Red tests failing

Implementation:
- logLowConfidence(el, value, detection, threshold)
- getElementPath(el) for CSS selector path
- Structured log object
- console.warn() with formatting

Exit criteria: All BDD tests GREEN" \
  --json

bd create "5.3 BDD: HTTP logging with rate limiting (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for HTTP endpoint logging.

Files to create:
- tests/features/smartx-http-logging.feature
- tests/fixtures/smartx-http-fixtures.js
- tests/mocks/analytics-endpoint-mock.js

Feature scenarios:
1. logTarget: URL enables HTTP logging
2. Batching: max 10 requests/second
3. 25 logs → 3 batches (10, 10, 5)
4. Retry failed requests (up to 100 entries)
5. PII sanitization (emails, phones, cards)
6. HTTPS validation for external URLs

Fixtures:
- Mock analytics endpoint
- Network failure simulation
- Rate limiting test harness

Acceptance: RED tests for HTTP batching" \
  --json

bd create "5.3 IMPL: HTTP logging with rate limiting" \
  -t task -p 1 \
  -d "Implement HTTP logging with batching and rate limiting.

Prerequisites:
- BDD artifacts complete
- Console logging complete
- Red tests failing

Implementation:
- logRateLimiter state object
- sendToEndpoint(url, data) with queue
- flushLogQueue(url) with fetch()
- Retry logic for failed requests
- PII sanitization functions
- URL validation (HTTPS only)

Target: Max 10 requests/sec, batch efficiency
Exit criteria: All BDD tests GREEN" \
  --json

bd create "5.4 BDD: Performance validation (feature + fixtures)" \
  -t task -p 1 \
  -d "Create BDD artifacts for end-to-end performance validation.

Files to create:
- tests/features/polymorphic-performance.feature
- tests/fixtures/performance-fixtures.js

Feature scenarios:
1. Single scan: <5ms (1000 elements)
2. Parse once: <100ms (1000 elements)
3. Module init: <105ms total
4. O(1) cache lookups verified
5. Bundle size: 8KB (verbose-only)
6. 6× faster than V1 baseline

Fixtures:
- Large DOM samples (1000+ elements)
- V1 baseline measurements
- Performance profiling utilities

Acceptance: RED tests show baseline exceeded" \
  --json

bd create "5.4 IMPL: Performance optimization & validation" \
  -t task -p 1 \
  -d "Ensure all performance targets met, add instrumentation.

Prerequisites:
- All previous implementation complete
- Red tests failing

Implementation:
- Performance.now() instrumentation
- Bottleneck identification and fixes
- Bundle size optimization
- Performance logging in production

Targets:
- 6× faster than V1
- 33% smaller bundles (single notation)
- All timing budgets met

Exit criteria: All BDD tests GREEN, targets achieved" \
  --json

echo ""
echo "✅ Created all polymorphic notation implementation issues!"
echo ""
echo "Summary:"
echo "- Phase 1: Bootloader (6 issues)"
echo "- Phase 2: Parsers (8 issues)"
echo "- Phase 3: Cache (4 issues)"
echo "- Phase 4: Modules (12 issues - 2 per module)"
echo "- Phase 5: SmartX (8 issues)"
echo "Total: 38 issues following BDD methodology"
echo ""
echo "Next: Run 'bd ready --json' to see ready work"
