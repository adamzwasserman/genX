/**
 * Parser Loading Test Fixtures
 *
 * Provides mock parser modules, network simulation, and utilities
 * for testing dynamic parser loading in the genX bootloader.
 */

/**
 * Mock Parser Modules
 * These simulate the actual parser modules that would be loaded
 */
export const mockParsers = {
    verbose: {
        name: 'genx-parser-verbose',
        size: 2048, // 2KB
        parse: function(element, prefix) {
            const config = {};
            const attrs = element.attributes;

            for (let i = 0; i < attrs.length; i++) {
                const attrName = attrs[i].name;
                const attrValue = attrs[i].value;

                if (attrName.startsWith(prefix + '-') &&
                    !attrName.endsWith('-opts') &&
                    !attrName.endsWith('-raw')) {
                    const key = attrName.substring(prefix.length + 1);
                    config[key] = attrValue;
                }
            }

            return config;
        }
    },

    colon: {
        name: 'genx-parser-colon',
        size: 1536, // 1.5KB
        parse: function(element, prefix, baseConfig) {
            const config = { ...baseConfig };

            // Look for attributes with colon-separated values
            const attrs = element.attributes;
            for (let i = 0; i < attrs.length; i++) {
                const attrName = attrs[i].name;
                const attrValue = attrs[i].value;

                if (attrName.startsWith(prefix + '-') && attrValue.includes(':')) {
                    const parts = attrValue.split(':');
                    const key = attrName.substring(prefix.length + 1);

                    // Merge colon-parsed values into config
                    if (parts.length > 1) {
                        config[key] = parts[0];
                        // Additional parts become additional config keys
                        for (let j = 1; j < parts.length; j++) {
                            config[`${key}${j}`] = parts[j];
                        }
                    }
                }
            }

            return config;
        }
    },

    json: {
        name: 'genx-parser-json',
        size: 1024, // 1KB
        parse: function(element, prefix) {
            const config = {};

            // Look for -opts attributes
            const optsAttr = element.getAttribute(`${prefix}-opts`);
            if (optsAttr) {
                try {
                    return JSON.parse(optsAttr);
                } catch (e) {
                    console.warn(`Failed to parse JSON opts: ${optsAttr}`, e);
                }
            }

            return config;
        }
    },

    class: {
        name: 'genx-parser-class',
        size: 1792, // 1.75KB
        parse: function(element, classPrefix) {
            const config = {};
            const classList = element.classList;

            if (!classList || classList.length === 0) {
                return config;
            }

            // CLASS_PREFIX_MAP equivalent
            const classPrefixMap = {
                'fmt': 'fx',
                'acc': 'ax',
                'bind': 'bx',
                'drag': 'dx',
                'load': 'lx',
                'table': 'tx',
                'nav': 'nx'
            };

            for (let i = 0; i < classList.length; i++) {
                const className = classList[i];

                // Check if class matches our pattern
                for (const [cp, mp] of Object.entries(classPrefixMap)) {
                    if (className.startsWith(cp + '-')) {
                        // Parse class into config
                        const parts = className.split('-');
                        if (parts.length >= 2) {
                            config.format = parts[1];
                            if (parts.length >= 3) config.currency = parts[2];
                            if (parts.length >= 4) config.decimals = parts[3];
                        }
                        break;
                    }
                }
            }

            return config;
        }
    }
};

/**
 * Parser URL Configuration
 */
export const parserURLs = {
    verbose: '/parsers/genx-parser-verbose.js',
    colon: '/parsers/genx-parser-colon.js',
    json: '/parsers/genx-parser-json.js',
    class: '/parsers/genx-parser-class.js'
};

export const cdnParserURLs = {
    base: 'https://cdn.genx.software/v1',
    verbose: 'https://cdn.genx.software/v1/parsers/genx-parser-verbose.js',
    colon: 'https://cdn.genx.software/v1/parsers/genx-parser-colon.js',
    json: 'https://cdn.genx.software/v1/parsers/genx-parser-json.js',
    class: 'https://cdn.genx.software/v1/parsers/genx-parser-class.js'
};

/**
 * Network Delay Simulator
 * Simulates network latency for parser loading
 */
export class NetworkDelaySimulator {
    constructor(delayMs = 0) {
        this.delayMs = delayMs;
        this.loadTimes = new Map();
    }

    async simulateLoad(parserName, loader) {
        const startTime = performance.now();

        // Simulate network delay
        if (this.delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }

        // Load the parser
        const result = await loader();

        const endTime = performance.now();
        this.loadTimes.set(parserName, endTime - startTime);

        return result;
    }

    getLoadTime(parserName) {
        return this.loadTimes.get(parserName) || 0;
    }

    getTotalLoadTime() {
        let total = 0;
        for (const time of this.loadTimes.values()) {
            total += time;
        }
        return total;
    }

    reset() {
        this.loadTimes.clear();
    }
}

/**
 * Parser Load Error Simulator
 * Simulates parser load failures for error handling tests
 */
export class ParserLoadErrorSimulator {
    constructor() {
        this.failedParsers = new Set();
    }

    setParserToFail(parserName) {
        this.failedParsers.add(parserName);
    }

    clearFailedParsers() {
        this.failedParsers.clear();
    }

    shouldFail(parserName) {
        return this.failedParsers.has(parserName);
    }

    async simulateLoad(parserName, loader) {
        if (this.shouldFail(parserName)) {
            throw new Error(`Failed to load parser: ${parserName}`);
        }
        return await loader();
    }
}

/**
 * Bundle Size Tracker
 * Tracks cumulative bundle size as parsers are loaded
 */
export class BundleSizeTracker {
    constructor() {
        this.loadedParsers = new Map();
    }

    addParser(parserName, size) {
        this.loadedParsers.set(parserName, size);
    }

    getTotalSize() {
        let total = 0;
        for (const size of this.loadedParsers.values()) {
            total += size;
        }
        return total;
    }

    getParserSize(parserName) {
        return this.loadedParsers.get(parserName) || 0;
    }

    isLoaded(parserName) {
        return this.loadedParsers.has(parserName);
    }

    reset() {
        this.loadedParsers.clear();
    }
}

/**
 * Mock Dynamic Import
 * Simulates dynamic import() for testing
 */
export function createMockDynamicImport(simulator = null, errorSimulator = null) {
    return async function mockImport(url) {
        // Extract parser name from URL
        const parserName = url.split('/').pop().replace('genx-parser-', '').replace('.js', '');

        // Check for simulated errors
        if (errorSimulator && errorSimulator.shouldFail(parserName)) {
            throw new Error(`Failed to load module: ${url}`);
        }

        // Simulate network delay if simulator provided
        if (simulator) {
            await simulator.simulateLoad(parserName, async () => {
                return mockParsers[parserName];
            });
        }

        // Return the mock parser module
        const parser = mockParsers[parserName];
        if (!parser) {
            throw new Error(`Parser not found: ${parserName}`);
        }

        return {
            default: parser,
            parse: parser.parse
        };
    };
}

/**
 * Parser Loading Performance Benchmarks
 */
export const performanceBenchmarks = {
    maxSingleParserLoad: 20,     // <20ms per parser
    maxAllParsersLoad: 50,        // <50ms for all 4 parsers (parallel)
    maxParallelOverhead: 10,      // <10ms overhead for parallelization

    bundleSizes: {
        bootloaderOnly: 1024,     // ~1KB
        verboseOnly: 3072,        // ~3KB (1KB bootloader + 2KB parser)
        allParsers: 7424          // ~7.25KB (1KB + 2KB + 1.5KB + 1KB + 1.75KB)
    }
};

/**
 * Test Page Generators
 */
export const parserLoadingPages = {
    verboseOnly: `
        <div>
            <span fx-format="currency" fx-currency="USD">100</span>
            <input bx-bind="username" />
            <button ax-label="Save"></button>
        </div>
    `,

    verboseAndColon: `
        <div>
            <span fx-format="currency:USD:2">100</span>
            <span fx-format="date:YYYY-MM-DD">2024-01-01</span>
        </div>
    `,

    allFourStyles: `
        <div>
            <span fx-format="currency">100</span>
            <span fx-format="date:YYYY-MM-DD">2024-01-01</span>
            <input bx-opts='{"debounce":300}' />
            <button class="acc-label-icon-Home">Save</button>
        </div>
    `,

    empty: '<div><p>Regular content</p></div>'
};

/**
 * Parser Loading State Tracker
 * Tracks which parsers have been loaded and their status
 */
export class ParserLoadingTracker {
    constructor() {
        this.parsers = new Map();
        this.loadOrder = [];
    }

    markAsLoading(parserName) {
        this.parsers.set(parserName, { status: 'loading', startTime: performance.now() });
        this.loadOrder.push(parserName);
    }

    markAsLoaded(parserName, parser) {
        const existing = this.parsers.get(parserName);
        if (existing) {
            existing.status = 'loaded';
            existing.endTime = performance.now();
            existing.duration = existing.endTime - existing.startTime;
            existing.parser = parser;
        }
    }

    markAsFailed(parserName, error) {
        const existing = this.parsers.get(parserName);
        if (existing) {
            existing.status = 'failed';
            existing.error = error;
            existing.endTime = performance.now();
        }
    }

    isLoaded(parserName) {
        const parser = this.parsers.get(parserName);
        return parser && parser.status === 'loaded';
    }

    isFailed(parserName) {
        const parser = this.parsers.get(parserName);
        return parser && parser.status === 'failed';
    }

    getLoadDuration(parserName) {
        const parser = this.parsers.get(parserName);
        return parser && parser.duration ? parser.duration : null;
    }

    getLoadOrder() {
        return [...this.loadOrder];
    }

    wereLoadedInParallel(parser1, parser2) {
        const p1 = this.parsers.get(parser1);
        const p2 = this.parsers.get(parser2);

        if (!p1 || !p2) return false;

        // Check if load times overlap (parallel loading)
        return (p1.startTime < p2.endTime && p2.startTime < p1.endTime);
    }

    reset() {
        this.parsers.clear();
        this.loadOrder = [];
    }
}

export default {
    mockParsers,
    parserURLs,
    cdnParserURLs,
    NetworkDelaySimulator,
    ParserLoadErrorSimulator,
    BundleSizeTracker,
    createMockDynamicImport,
    performanceBenchmarks,
    parserLoadingPages,
    ParserLoadingTracker
};
