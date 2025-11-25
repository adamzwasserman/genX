# Polymorphic Notation Implementation Plan v2.0
## Optimized Architecture with Parse-Once & Tree-Shaking

## Overview

Implement support for 4 polymorphic notation styles across all genX modules with **optimized architecture**:
- **Single DOM scan** (not N loops)
- **Parse once, use many** (WeakMap cache)
- **Tree-shakeable parsers** (load only what's needed)
- **33% smaller bundles** when using single notation style

**Business Value**: Developer productivity + optimal performance + minimal bundle size.

## Architectural Improvements Over V1

| Aspect | V1 (Original) | V2 (Optimized) | Gain |
|--------|---------------|----------------|------|
| DOM Scans | N scans (1 per module) | 1 unified scan | **10× faster** |
| Parsing | Parse per module check | Parse once, cache in WeakMap | **6× faster** (6 modules) |
| Bundle Size | All parsers in genx-common.js (6KB) | Load parsers on-demand (2KB avg) | **33% smaller** |
| Lookup Speed | Re-parse on every access | WeakMap O(1) lookup | **100× faster** |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Single DOM Scan (Unified Selector)                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ querySelector('[fx-], [bx-], [class*="fmt-"], ...)     │ │
│ │ Returns: All genX elements in one traversal             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Detect Notation Styles (Smart Loading)            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Detected: ['verbose', 'class']                          │ │
│ │ Load ONLY: parser-verbose.js + parser-class.js          │ │
│ │ Skip: parser-colon.js + parser-json.js (not used)       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Parse Once & Cache (WeakMap)                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ for (el of elements) {                                  │ │
│ │   config = parseWithLoaded parsers(el);                 │ │
│ │   parseMap.set(el, { prefix, config });                 │ │
│ │ }                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Modules Lookup (No Re-Parsing)                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ fmtx.process(el) {                                       │ │
│ │   const parsed = window.genx.getConfig(el);  // O(1)    │ │
│ │   if (parsed?.prefix === 'fx') format(el, parsed);      │ │
│ │ }                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Bootloader Optimization (4 hours)

### Task 1.1: Single Unified Scan
**Duration**: 1 hour

```javascript
// src/bootloader.js - BEFORE (slow)
const scan = (root = document) => {
    const needed = new Set();
    for (const prefix of Object.keys(modules)) {
        if (root.querySelector(`[${prefix}-]`)) {  // N queries!
            needed.add(prefix);
        }
    }
    return needed;
};

// AFTER (10× faster)
const CLASS_PREFIX_MAP = {
    'fmt': 'fx', 'bind': 'bx', 'acc': 'ax',
    'drag': 'dx', 'load': 'lx', 'nav': 'nx', 'table': 'tx'
};

const MODULE_PREFIX_MAP = Object.fromEntries(
    Object.entries(CLASS_PREFIX_MAP).map(([k, v]) => [v, k])
);

const buildUnifiedSelector = () => {
    const attrSelectors = Object.keys(modules).map(p => `[${p}-]`);
    const classSelectors = Object.values(MODULE_PREFIX_MAP).map(p => `[class*="${p}-"]`);
    return [...attrSelectors, ...classSelectors].join(',');
};

const detectPrefix = (el) => {
    // Check attributes first (faster)
    for (const prefix of Object.keys(modules)) {
        if (el.hasAttribute(`${prefix}-format`) ||
            el.hasAttribute(`${prefix}-bind`) ||
            el.hasAttribute(`${prefix}-label`)) {
            return prefix;
        }
    }

    // Check CSS classes
    for (const [classPrefix, modulePrefix] of Object.entries(CLASS_PREFIX_MAP)) {
        if (el.className.includes(`${classPrefix}-`)) {
            return modulePrefix;
        }
    }

    return null;
};

const scan = (root = document) => {
    const selector = buildUnifiedSelector();
    const elements = root.querySelectorAll(selector);  // ONE query!
    const needed = new Set();

    for (const el of elements) {
        const prefix = detectPrefix(el);
        if (prefix) needed.add(prefix);
    }

    return { needed, elements: Array.from(elements) };
};
```

**BDD Test**:
```gherkin
Scenario: Unified scan detects all notation styles in one query
  Given a page with 1000 elements using mixed notation styles
  When the bootloader scans the page
  Then it should issue exactly 1 querySelector call
  And detect all required modules correctly
  And scan time should be under 5ms
```

### Task 1.2: Notation Style Detection
**Duration**: 1 hour

```javascript
// src/bootloader.js
const detectNotationStyles = (elements) => {
    const styles = new Set();

    for (const el of elements) {
        // Verbose: any module-prefixed attributes
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i].name;
            if (/^(fx|bx|ax|dx|lx|nx|tx)-/.test(attr) && !attr.endsWith('-opts')) {
                styles.add('verbose');
            }

            // Colon: attribute value contains ':'
            if (/^(fx|bx|ax|dx|lx|nx|tx)-(format|bind|label|type)$/.test(attr)) {
                if (attrs[i].value.includes(':')) {
                    styles.add('colon');
                }
            }

            // JSON: -opts attributes
            if (attr.endsWith('-opts')) {
                styles.add('json');
            }
        }

        // CSS Classes: fmt-, bind-, etc.
        if (/\b(fmt|bind|acc|drag|load|nav|table)-/.test(el.className)) {
            styles.add('class');
        }
    }

    return styles;
};
```

**BDD Test**:
```gherkin
Scenario Outline: Detect which notation styles are in use
  Given a page with elements using "<notations>"
  When the bootloader detects notation styles
  Then it should return exactly "<detected>"

  Examples:
    | notations              | detected              |
    | verbose only           | ['verbose']           |
    | verbose + class        | ['verbose', 'class']  |
    | all 4 styles           | ['verbose', 'colon', 'json', 'class'] |
```

### Task 1.3: Dynamic Parser Loading
**Duration**: 2 hours

```javascript
// src/bootloader.js
const PARSER_URLS = {
    verbose: '/parsers/genx-parser-verbose.js',
    colon: '/parsers/genx-parser-colon.js',
    json: '/parsers/genx-parser-json.js',
    class: '/parsers/genx-parser-class.js'
};

const loadParsers = async (styles) => {
    const parsers = {};

    const loadPromises = Array.from(styles).map(async (style) => {
        const url = window.genxConfig?.cdn
            ? `${window.genxConfig.cdn}${PARSER_URLS[style]}`
            : PARSER_URLS[style];

        const module = await import(url);
        parsers[style] = module.default || module;
    });

    await Promise.all(loadPromises);  // Parallel loading
    return parsers;
};
```

## Phase 2: Separate Parser Modules (6 hours)

### Task 2.1: Extract Verbose Parser (1.5 hours)

```javascript
// src/parsers/genx-parser-verbose.js (~2KB minified)
/**
 * Verbose Attribute Parser
 * Handles: fx-format="currency" fx-currency="USD" fx-decimals="2"
 */

const CARDINALITY_ORDERS = {
    fx: ['format', 'currency', 'decimals', 'symbol'],
    bx: ['bind', 'debounce', 'throttle'],
    ax: ['label', 'icon', 'value', 'role'],
    dx: ['type', 'id', 'style', 'group'],
    lx: ['type', 'color', 'size'],
    nx: ['type', 'label', 'href', 'target'],
    tx: ['sortable', 'pageSize', 'virtualScroll']
};

export const parseVerbose = (element, prefix) => {
    const config = {};
    const attributes = element.attributes;

    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        const attrName = attr.name;

        if (attrName.startsWith(`${prefix}-`)) {
            if (attrName === `${prefix}-opts` || attrName === `${prefix}-raw`) {
                continue;
            }

            const key = attrName.substring(prefix.length + 1);
            config[key] = attr.value;
        }
    }

    return config;
};

export default { parseVerbose, CARDINALITY_ORDERS };
```

### Task 2.2: Extract Colon Parser (1.5 hours)

```javascript
// src/parsers/genx-parser-colon.js (~1KB minified)
import { CARDINALITY_ORDERS } from './genx-parser-verbose.js';

export const parseColon = (element, prefix) => {
    const config = {};
    const cardinalityOrder = CARDINALITY_ORDERS[prefix] || [];

    if (cardinalityOrder.length === 0) return config;

    const primaryKey = cardinalityOrder[0];
    const attrName = `${prefix}-${primaryKey}`;
    const attrValue = element.getAttribute(attrName);

    if (!attrValue || !attrValue.includes(':')) {
        return config;
    }

    const parts = attrValue.split(':');
    parts.forEach((part, index) => {
        if (part && cardinalityOrder[index]) {
            config[cardinalityOrder[index]] = part;
        }
    });

    return config;
};

export default { parseColon };
```

### Task 2.3: Extract JSON Parser (1 hour)

```javascript
// src/parsers/genx-parser-json.js (~0.5KB minified)
export const parseJson = (element, prefix) => {
    const optsAttr = element.getAttribute(`${prefix}-opts`);

    if (!optsAttr) return {};

    try {
        return JSON.parse(optsAttr);
    } catch (err) {
        console.warn(`genX: Failed to parse ${prefix}-opts JSON:`, err.message);
        return {};
    }
};

export default { parseJson };
```

### Task 2.4: Extract CSS Class Parser (2 hours)

```javascript
// src/parsers/genx-parser-class.js (~1.5KB minified)
import { CARDINALITY_ORDERS } from './genx-parser-verbose.js';

const CLASS_PREFIX_MAP = {
    'fmt': 'fx', 'bind': 'bx', 'acc': 'ax',
    'drag': 'dx', 'load': 'lx', 'nav': 'nx', 'table': 'tx'
};

export const parseClass = (element, prefix) => {
    const config = {};
    const classList = element.className;

    if (!classList || typeof classList !== 'string') {
        return config;
    }

    // Find CSS class prefix for this module
    let classPrefix = null;
    for (const [cssPrefix, attrPrefix] of Object.entries(CLASS_PREFIX_MAP)) {
        if (attrPrefix === prefix) {
            classPrefix = cssPrefix;
            break;
        }
    }

    if (!classPrefix) return config;

    // Match pattern: prefix-param1-param2-param3
    const classes = classList.split(/\s+/);
    const regex = new RegExp(`^${classPrefix}-(.+)$`);

    for (const cls of classes) {
        const match = cls.match(regex);
        if (match) {
            const parts = match[1].split('-');
            const cardinalityOrder = CARDINALITY_ORDERS[prefix] || [];

            parts.forEach((part, index) => {
                if (cardinalityOrder[index]) {
                    config[cardinalityOrder[index]] = part;
                }
            });
            break;
        }
    }

    return config;
};

export default { parseClass };
```

## Phase 3: Parse-Once-Use-Many Cache (3 hours)

### Task 3.1: WeakMap Parse Cache

```javascript
// src/bootloader.js
const parseMap = new WeakMap();  // element → { prefix, config }

const parseAllElements = (elements, parsers) => {
    const startTime = performance.now();

    for (const el of elements) {
        const prefix = detectPrefix(el);
        if (!prefix) continue;

        let config = {};

        // Try parsers in priority order: JSON > Colon > Verbose > Class
        if (parsers.json) {
            const jsonConfig = parsers.json.parseJson(el, prefix);
            if (Object.keys(jsonConfig).length > 0) {
                config = jsonConfig;
            }
        }

        if (parsers.colon && Object.keys(config).length === 0) {
            const colonConfig = parsers.colon.parseColon(el, prefix);
            if (Object.keys(colonConfig).length > 0) {
                config = colonConfig;
            }
        }

        if (parsers.verbose && Object.keys(config).length === 0) {
            config = parsers.verbose.parseVerbose(el, prefix);
        }

        if (parsers.class && Object.keys(config).length === 0) {
            config = parsers.class.parseClass(el, prefix);
        }

        // Cache result
        parseMap.set(el, { prefix, config });
    }

    const parseTime = performance.now() - startTime;
    console.log(`genX: Parsed ${elements.length} elements in ${parseTime.toFixed(2)}ms`);
};

// Public API
window.genx = {
    ...window.genx,
    getConfig: (el) => parseMap.get(el),
    parseMap  // For debugging
};
```

### Task 3.2: Updated Bootstrap Sequence

```javascript
// src/bootloader.js
const bootstrap = () => {
    requestAnimationFrame(async () => {
        try {
            // Phase 1: Single unified scan
            const { needed, elements } = scan();

            // Phase 2: Detect notation styles
            const styles = detectNotationStyles(elements);
            console.log('genX: Detected notation styles:', Array.from(styles));

            // Phase 3: Load only needed parsers
            const parsers = await loadParsers(styles);
            console.log('genX: Loaded parsers:', Object.keys(parsers));

            // Phase 4: Parse all elements ONCE
            parseAllElements(elements, parsers);

            // Phase 5: Load and init modules
            for (const prefix of needed) {
                const config = window.genxConfig?.modules?.[prefix] || {};
                await init(prefix, config);
            }

            // Phase 6: Setup MutationObserver
            if (window.genxConfig?.observe !== false) {
                setupMutationObserver(parsers);
            }

            window.dispatchEvent(new CustomEvent('genx:ready', {
                detail: {
                    loaded: Array.from(needed),
                    styles: Array.from(styles),
                    parsed: elements.length
                }
            }));

        } catch (err) {
            console.error('genX Bootloader: Initialization failed', err);
        }
    });
};
```

## Phase 4: Update Modules to Use Cache (6 hours, 1 hour each)

### Task 4.1: Update fmtX

```javascript
// src/fmtx.js - BEFORE
const processElement = (el) => {
    const format = el.getAttribute('fx-format');
    const currency = el.getAttribute('fx-currency');
    // ... manual attribute reading
};

// AFTER (uses cache)
const processElement = (el) => {
    const parsed = window.genx.getConfig(el);  // O(1) lookup!

    if (!parsed || parsed.prefix !== 'fx') return;

    const { config } = parsed;
    // config = { format: 'currency', currency: 'USD', decimals: '2' }

    switch (config.format) {
        case 'currency':
            return formatCurrency(el, config);
        case 'date':
            return formatDate(el, config);
        // ...
    }
};
```

Apply same pattern to: bindX, accX, dragX, loadX, navX, tableX

## Phase 5: SmartX Threshold & Logging (8 hours)

[Same as original plan - no changes needed]

## Implementation Timeline

**Total: 27 hours** (3.4 days)

- Phase 1: Bootloader Optimization (4 hours)
- Phase 2: Parser Extraction (6 hours)
- Phase 3: Parse Cache (3 hours)
- Phase 4: Module Updates (6 hours)
- Phase 5: SmartX Threshold (8 hours)

**+30% buffer = 35 hours** (4.4 days)

## Performance Benchmarks

### Before (V1 Architecture)

```
Scan 1000 elements with 6 modules: 60ms (6 × 10ms scans)
Parse 1000 elements × 6 modules: 600ms (re-parse on every check)
Bundle size (verbose-only page): 12KB (all parsers loaded)
Total init time: 660ms
```

### After (V2 Architecture)

```
Scan 1000 elements (unified): 5ms (single query)
Parse 1000 elements (once): 100ms (cached for reuse)
Bundle size (verbose-only page): 8KB (only verbose parser)
Total init time: 105ms
```

**6.3× faster initialization, 33% smaller bundle**

## Bundle Size Comparison

| Notation Used | V1 Bundle | V2 Bundle | Savings |
|---------------|-----------|-----------|---------|
| Verbose only | 12KB | 8KB | **33%** |
| Verbose + Class | 12KB | 9.5KB | **21%** |
| All 4 notations | 12KB | 12KB | 0% (but still faster) |

## Success Criteria

- [ ] Single unified DOM scan (1 querySelector vs N)
- [ ] Parsers loaded on-demand based on detected styles
- [ ] Elements parsed once and cached in WeakMap
- [ ] All modules use `genx.getConfig()` for O(1) lookup
- [ ] Bundle size reduced by 33% for single-notation pages
- [ ] Initialization 6× faster than V1
- [ ] 100% test coverage maintained
- [ ] Zero regression in existing functionality

## Risk Management

### Risk: Parser import() not supported in old browsers
**Probability**: Low
**Mitigation**: Fallback to <script> tag loading for legacy browsers
**Contingency**: Bundle parsers in genx-common.js for IE11

### Risk: WeakMap performance issues with large DOMs
**Probability**: Very Low
**Mitigation**: WeakMap is optimized in all modern engines
**Contingency**: Fall back to Map with manual cleanup

## Key Architectural Principles

1. **Scan Once**: Single unified querySelector
2. **Parse Once**: Elements parsed once, cached forever
3. **Load Smart**: Only load parsers actually in use
4. **Lookup Fast**: O(1) WeakMap retrieval vs O(n) re-parsing

---

**Status**: Ready for implementation
**Next Action**: Task 1.1 - Implement unified scan in bootloader
