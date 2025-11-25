/**
 * Bootstrap Sequence Test Fixtures
 *
 * Provides full-page scenarios, timing utilities, and end-to-end
 * testing support for the 6-phase bootstrap sequence.
 */

/**
 * Bootstrap performance targets (in milliseconds)
 */
export const bootstrapTargets = {
    phase1Scan: 5,              // < 5ms to scan 1000 elements
    phase2Detection: 3,          // < 3ms to detect notation styles
    phase3LoadParsers: 15,       // < 15ms to load parsers
    phase4Parse: 100,            // < 100ms to parse 1000 elements
    phase5InitModules: 50,       // < 50ms to initialize modules
    phase6Observer: 5,           // < 5ms to setup observer
    totalBootstrap: 105          // < 105ms total for 1000 elements
};

/**
 * Generate full page with mixed notation styles
 * @param {number} elementCount - Total elements to generate
 * @returns {string} - HTML string with mixed genX elements
 */
export function generateFullPage(elementCount = 1000) {
    const notations = [
        // Verbose notation
        (i) => `<span fx-format="currency" fx-currency="USD" fx-decimals="2">$${i}</span>`,
        // Colon notation
        (i) => `<span fx-format="currency:USD:2">$${i}</span>`,
        // JSON notation
        (i) => `<span fx-opts='{"format":"currency","currency":"USD","decimals":2}'>$${i}</span>`,
        // Class notation
        (i) => `<span class="fmt-currency-USD-2">$${i}</span>`,
        // bindX verbose
        (i) => `<input bx-bind="field${i}" bx-debounce="300" />`,
        // bindX class
        (i) => `<input class="bind-field${i}-300" />`,
        // accX verbose
        (i) => `<button ax-label="Save ${i}" ax-icon="disk">Save</button>`,
        // accX class
        (i) => `<button class="acc-Save-disk">Save ${i}</button>`,
        // dragX verbose
        (i) => `<div dx-draggable="true" dx-zone="zone${i}">Drag ${i}</div>`,
        // dragX class
        (i) => `<div class="drag-true-zone${i}">Drag ${i}</div>`
    ];

    const elements = [];
    for (let i = 0; i < elementCount; i++) {
        const template = notations[i % notations.length];
        elements.push(template(i));
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bootstrap Test Page</title>
</head>
<body>
    <div id="test-container">
        ${elements.join('\n        ')}
    </div>
    <script src="/src/bootloader.js"></script>
</body>
</html>
`;
}

/**
 * Generate page with specific notation style
 * @param {string} style - 'verbose', 'colon', 'json', or 'class'
 * @param {number} elementCount - Number of elements
 * @returns {string} - HTML string
 */
export function generateStyleSpecificPage(style, elementCount = 1000) {
    const templates = {
        verbose: (i) => `<span fx-format="currency" fx-currency="USD">$${i}</span>`,
        colon: (i) => `<span fx-format="currency:USD:2">$${i}</span>`,
        json: (i) => `<span fx-opts='{"format":"currency","currency":"USD"}'>$${i}</span>`,
        class: (i) => `<span class="fmt-currency-USD-2">$${i}</span>`
    };

    const template = templates[style];
    if (!template) {
        throw new Error(`Unknown style: ${style}`);
    }

    const elements = [];
    for (let i = 0; i < elementCount; i++) {
        elements.push(template(i));
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${style} Notation Test Page</title>
</head>
<body>
    <div id="test-container">
        ${elements.join('\n        ')}
    </div>
    <script src="/src/bootloader.js"></script>
</body>
</html>
`;
}

/**
 * Bootstrap phase timer for measuring individual phases
 */
export class BootstrapPhaseTimer {
    constructor() {
        this.phases = {
            phase1: { name: 'Scan', duration: 0, complete: false },
            phase2: { name: 'Detect Styles', duration: 0, complete: false },
            phase3: { name: 'Load Parsers', duration: 0, complete: false },
            phase4: { name: 'Parse Elements', duration: 0, complete: false },
            phase5: { name: 'Init Modules', duration: 0, complete: false },
            phase6: { name: 'Setup Observer', duration: 0, complete: false }
        };
        this.totalStart = 0;
        this.totalDuration = 0;
    }

    /**
     * Start timing the overall bootstrap
     */
    startTotal() {
        this.totalStart = performance.now();
    }

    /**
     * End timing the overall bootstrap
     */
    endTotal() {
        this.totalDuration = performance.now() - this.totalStart;
    }

    /**
     * Time a specific phase
     * @param {string} phaseName - 'phase1' through 'phase6'
     * @param {Function} fn - Function to time
     * @returns {*} - Result of the function
     */
    async timePhase(phaseName, fn) {
        const phase = this.phases[phaseName];
        if (!phase) {
            throw new Error(`Unknown phase: ${phaseName}`);
        }

        const start = performance.now();
        const result = await fn();
        phase.duration = performance.now() - start;
        phase.complete = true;
        return result;
    }

    /**
     * Get timing summary
     * @returns {Object} - Summary of all phase timings
     */
    getSummary() {
        const summary = {
            total: this.totalDuration,
            phases: {},
            meetsTargets: true
        };

        for (const [key, phase] of Object.entries(this.phases)) {
            summary.phases[phase.name] = {
                duration: phase.duration,
                complete: phase.complete
            };
        }

        // Check if all targets met
        if (this.phases.phase1.duration > bootstrapTargets.phase1Scan) summary.meetsTargets = false;
        if (this.phases.phase2.duration > bootstrapTargets.phase2Detection) summary.meetsTargets = false;
        if (this.phases.phase3.duration > bootstrapTargets.phase3LoadParsers) summary.meetsTargets = false;
        if (this.phases.phase4.duration > bootstrapTargets.phase4Parse) summary.meetsTargets = false;
        if (this.phases.phase5.duration > bootstrapTargets.phase5InitModules) summary.meetsTargets = false;
        if (this.phases.phase6.duration > bootstrapTargets.phase6Observer) summary.meetsTargets = false;
        if (this.totalDuration > bootstrapTargets.totalBootstrap) summary.meetsTargets = false;

        return summary;
    }

    /**
     * Get detailed report
     * @returns {string} - Formatted report
     */
    getReport() {
        const summary = this.getSummary();
        let report = `Bootstrap Performance Report\n`;
        report += `============================\n\n`;

        for (const [name, data] of Object.entries(summary.phases)) {
            const status = data.complete ? '✓' : '✗';
            report += `${status} ${name}: ${data.duration.toFixed(2)}ms\n`;
        }

        report += `\n` + `Total: ${summary.total.toFixed(2)}ms\n`;
        report += `Target: ${bootstrapTargets.totalBootstrap}ms\n`;
        report += `Status: ${summary.meetsTargets ? '✓ PASS' : '✗ FAIL'}\n`;

        return report;
    }
}

/**
 * Mock bootstrap runner for testing phases individually
 */
export class MockBootstrapRunner {
    constructor(bootloader) {
        this.bootloader = bootloader;
        this.timer = new BootstrapPhaseTimer();
        this.results = {};
    }

    /**
     * Run Phase 1: Unified scan
     */
    async runPhase1() {
        return await this.timer.timePhase('phase1', () => {
            const result = this.bootloader.scan();
            this.results.phase1 = result;
            return result;
        });
    }

    /**
     * Run Phase 2: Detect notation styles
     */
    async runPhase2(elements) {
        return await this.timer.timePhase('phase2', () => {
            const result = this.bootloader.detectNotationStyles(elements);
            this.results.phase2 = result;
            return result;
        });
    }

    /**
     * Run Phase 3: Load parsers
     */
    async runPhase3(styles) {
        return await this.timer.timePhase('phase3', async () => {
            const result = await this.bootloader.loadParsers(styles);
            this.results.phase3 = result;
            return result;
        });
    }

    /**
     * Run Phase 4: Parse all elements
     */
    async runPhase4(elements, loadedParsers) {
        return await this.timer.timePhase('phase4', () => {
            const result = this.bootloader.parseAllElements(elements, loadedParsers);
            this.results.phase4 = result;
            return result;
        });
    }

    /**
     * Run Phase 5: Initialize modules
     */
    async runPhase5() {
        return await this.timer.timePhase('phase5', async () => {
            const result = await this.bootloader.initAll();
            this.results.phase5 = result;
            return result;
        });
    }

    /**
     * Run Phase 6: Setup MutationObserver
     * (This is normally part of bootstrap(), so this is a mock version)
     */
    async runPhase6() {
        return await this.timer.timePhase('phase6', () => {
            // Mock observer setup time
            const start = performance.now();
            while (performance.now() - start < 1) {
                // Simulate some work
            }
            return { observerSetup: true };
        });
    }

    /**
     * Run complete bootstrap sequence
     */
    async runCompleteSequence() {
        this.timer.startTotal();

        // Phase 1: Scan
        const { needed, elements } = await this.runPhase1();

        // Phase 2: Detect styles
        const styles = await this.runPhase2(elements);

        // Phase 3: Load parsers
        const loadedParsers = await this.runPhase3(styles);

        // Phase 4: Parse elements
        const parsedCount = await this.runPhase4(elements, loadedParsers);

        // Phase 5: Initialize modules
        const modules = await this.runPhase5();

        // Phase 6: Setup observer
        const observer = await this.runPhase6();

        this.timer.endTotal();

        return {
            needed,
            elements,
            styles,
            loadedParsers,
            parsedCount,
            modules,
            observer,
            timing: this.timer.getSummary()
        };
    }

    /**
     * Get timing summary
     */
    getSummary() {
        return this.timer.getSummary();
    }

    /**
     * Get formatted report
     */
    getReport() {
        return this.timer.getReport();
    }
}

/**
 * MutationObserver mock for testing dynamic content
 */
export class MutationObserverMock {
    constructor() {
        this.mutations = [];
        this.callback = null;
        this.observing = false;
        this.config = null;
    }

    observe(target, config) {
        this.observing = true;
        this.config = config;
    }

    disconnect() {
        this.observing = false;
    }

    simulateAddition(nodes) {
        if (!this.observing) return;

        const mutation = {
            type: 'childList',
            addedNodes: nodes,
            removedNodes: []
        };

        this.mutations.push(mutation);

        if (this.callback) {
            this.callback([mutation]);
        }
    }

    simulateRemoval(nodes) {
        if (!this.observing) return;

        const mutation = {
            type: 'childList',
            addedNodes: [],
            removedNodes: nodes
        };

        this.mutations.push(mutation);

        if (this.callback) {
            this.callback([mutation]);
        }
    }

    getMutations() {
        return this.mutations;
    }
}

/**
 * Generate test configuration objects
 */
export const testConfigs = {
    performanceLogging: {
        performance: {
            logging: true
        }
    },

    observerDisabled: {
        observe: false
    },

    cdnEnabled: {
        cdn: 'https://cdn.genx.software/v1'
    },

    localPaths: {
        // No CDN config = use local paths
    },

    fullConfig: {
        cdn: 'https://cdn.genx.software/v1',
        performance: {
            logging: true
        },
        observe: true,
        modules: {
            fx: { locale: 'en-US' },
            bx: { debounce: 500 }
        }
    }
};

/**
 * Test page templates
 */
export const pageTemplates = {
    empty: `
<!DOCTYPE html>
<html>
<head><title>Empty Page</title></head>
<body></body>
</html>
`,

    singleElement: `
<!DOCTYPE html>
<html>
<head><title>Single Element</title></head>
<body>
    <span fx-format="currency" fx-currency="USD">100</span>
</body>
</html>
`,

    mixedModules: (count = 100) => {
        const modules = ['fx', 'bx', 'ax', 'dx'];
        const elements = [];
        for (let i = 0; i < count; i++) {
            const module = modules[i % modules.length];
            elements.push(`<div data-module="${module}" ${module}-format="test${i}">Element ${i}</div>`);
        }
        return `
<!DOCTYPE html>
<html>
<head><title>Mixed Modules</title></head>
<body>
    ${elements.join('\n    ')}
</body>
</html>
`;
    }
};

/**
 * Performance comparison utilities
 */
export class BootstrapComparison {
    constructor() {
        this.baseline = null;
        this.optimized = null;
    }

    setBaseline(timing) {
        this.baseline = timing;
    }

    setOptimized(timing) {
        this.optimized = timing;
    }

    getSpeedup() {
        if (!this.baseline || !this.optimized) {
            return null;
        }
        return this.baseline.total / this.optimized.total;
    }

    getReport() {
        if (!this.baseline || !this.optimized) {
            return 'Missing timing data';
        }

        const speedup = this.getSpeedup();
        return `
Performance Comparison
=====================
Baseline: ${this.baseline.total.toFixed(2)}ms
Optimized: ${this.optimized.total.toFixed(2)}ms
Speedup: ${speedup.toFixed(2)}x
Status: ${speedup >= 6.0 ? '✓ PASS (6x+ target met)' : '✗ FAIL (6x+ target not met)'}
`;
    }
}

/**
 * Bootstrap event listener helper
 */
export class BootstrapEventListener {
    constructor() {
        this.events = [];
        this.listening = false;
    }

    start() {
        this.listening = true;
        window.addEventListener('genx:ready', this.onReady.bind(this));
    }

    stop() {
        this.listening = false;
        window.removeEventListener('genx:ready', this.onReady.bind(this));
    }

    onReady(event) {
        if (this.listening) {
            this.events.push({
                type: 'genx:ready',
                detail: event.detail,
                timestamp: Date.now()
            });
        }
    }

    getEvents() {
        return this.events;
    }

    getLastEvent() {
        return this.events[this.events.length - 1] || null;
    }

    reset() {
        this.events = [];
    }
}

export default {
    bootstrapTargets,
    generateFullPage,
    generateStyleSpecificPage,
    BootstrapPhaseTimer,
    MockBootstrapRunner,
    MutationObserverMock,
    testConfigs,
    pageTemplates,
    BootstrapComparison,
    BootstrapEventListener
};
