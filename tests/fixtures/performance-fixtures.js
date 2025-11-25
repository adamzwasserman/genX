/**
 * Polymorphic Notation Performance Test Fixtures
 *
 * Provides utilities for testing performance targets:
 * - Single scan < 5ms (1000 elements)
 * - Parse once < 100ms (1000 elements)
 * - Module init < 105ms total
 * - O(1) cache lookups
 * - Bundle size < 8KB (verbose-only)
 * - 6× faster than V1 baseline
 */

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurer {
    constructor() {
        this.measurements = [];
        this.marks = new Map();
    }

    /**
     * Start timing a measurement
     */
    start(label) {
        this.marks.set(label, performance.now());
    }

    /**
     * End timing and record measurement
     */
    end(label) {
        const endTime = performance.now();
        const startTime = this.marks.get(label);

        if (!startTime) {
            throw new Error(`No start mark found for: ${label}`);
        }

        const duration = endTime - startTime;
        this.measurements.push({
            label,
            duration,
            timestamp: Date.now()
        });

        this.marks.delete(label);
        return duration;
    }

    /**
     * Measure a synchronous function
     */
    measure(label, fn) {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;

        this.measurements.push({
            label,
            duration,
            timestamp: Date.now()
        });

        return { result, duration };
    }

    /**
     * Measure an async function
     */
    async measureAsync(label, fn) {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;

        this.measurements.push({
            label,
            duration,
            timestamp: Date.now()
        });

        return { result, duration };
    }

    /**
     * Get measurements by label
     */
    getByLabel(label) {
        return this.measurements.filter(m => m.label === label);
    }

    /**
     * Get average duration for label
     */
    getAverage(label) {
        const measurements = this.getByLabel(label);
        if (measurements.length === 0) return 0;

        const sum = measurements.reduce((acc, m) => acc + m.duration, 0);
        return sum / measurements.length;
    }

    /**
     * Get statistics for label
     */
    getStats(label) {
        const measurements = this.getByLabel(label);
        if (measurements.length === 0) {
            return { count: 0, min: 0, max: 0, avg: 0, median: 0 };
        }

        const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
        const sum = durations.reduce((acc, d) => acc + d, 0);

        return {
            count: durations.length,
            min: durations[0],
            max: durations[durations.length - 1],
            avg: sum / durations.length,
            median: durations[Math.floor(durations.length / 2)]
        };
    }

    /**
     * Reset all measurements
     */
    reset() {
        this.measurements = [];
        this.marks.clear();
    }

    /**
     * Get all measurements
     */
    getAll() {
        return [...this.measurements];
    }
}

/**
 * Large DOM generator for performance testing
 */
export class LargeDOMGenerator {
    /**
     * Generate DOM with mixed notation styles
     */
    static generate(count = 1000, options = {}) {
        const {
            verbosePercent = 25,
            jsonPercent = 25,
            colonPercent = 25,
            cssPercent = 25
        } = options;

        const container = document.createElement('div');
        container.id = 'performance-test-container';

        for (let i = 0; i < count; i++) {
            const percent = (i / count) * 100;
            const element = document.createElement('span');
            element.textContent = `$${(Math.random() * 1000).toFixed(2)}`;

            // Distribute notation styles
            if (percent < verbosePercent) {
                element.setAttribute('fx-format', 'currency');
            } else if (percent < verbosePercent + jsonPercent) {
                element.setAttribute('data-fmt', JSON.stringify({ fmt: 'currency' }));
            } else if (percent < verbosePercent + jsonPercent + colonPercent) {
                element.className = 'format:currency';
            } else {
                element.className = 'fx-currency';
            }

            container.appendChild(element);
        }

        return container;
    }

    /**
     * Generate deeply nested DOM
     */
    static generateNested(depth = 100) {
        let current = document.createElement('div');
        const root = current;

        for (let i = 0; i < depth; i++) {
            const child = document.createElement('span');
            child.setAttribute('fx-format', 'currency');
            child.textContent = '$100.00';
            current.appendChild(child);
            current = child;
        }

        return root;
    }

    /**
     * Generate specific notation style
     */
    static generateNotation(count, notation) {
        const container = document.createElement('div');

        for (let i = 0; i < count; i++) {
            const element = document.createElement('span');
            element.textContent = `$${(Math.random() * 1000).toFixed(2)}`;

            switch (notation) {
                case 'verbose':
                    element.setAttribute('fx-format', 'currency');
                    break;
                case 'json':
                    element.setAttribute('data-fmt', JSON.stringify({ fmt: 'currency' }));
                    break;
                case 'colon':
                    element.className = 'format:currency';
                    break;
                case 'css':
                    element.className = 'fx-currency';
                    break;
            }

            container.appendChild(element);
        }

        return container;
    }

    /**
     * Cleanup generated DOM
     */
    static cleanup() {
        const container = document.getElementById('performance-test-container');
        if (container) {
            container.remove();
        }
    }
}

/**
 * V1 baseline measurements (from historical data)
 */
export const v1Baseline = {
    singleScan1000: 30, // ms
    parse1000: 600, // ms
    moduleInit: 630, // ms
    fullBootstrap: 650 // ms
};

/**
 * V2 performance targets
 */
export const v2Targets = {
    singleScan1000: 5, // ms (6× faster)
    parse1000: 100, // ms (6× faster)
    moduleInit: 105, // ms (6× faster)
    cacheLookup: 0.001, // ms per lookup
    bundleSize: 8192, // bytes (8KB for verbose-only)
    speedupRatio: 6 // Must be 6× faster than V1
};

/**
 * Performance assertion helpers
 */
export class PerformanceAssertions {
    /**
     * Assert duration is under target
     */
    static assertUnder(duration, target, label = '') {
        if (duration >= target) {
            throw new Error(
                `Performance target exceeded ${label}: ${duration.toFixed(2)}ms >= ${target}ms`
            );
        }
    }

    /**
     * Assert speedup ratio
     */
    static assertSpeedup(v2Time, v1Time, minRatio = 6) {
        const actualRatio = v1Time / v2Time;

        if (actualRatio < minRatio) {
            throw new Error(
                `Speedup insufficient: ${actualRatio.toFixed(2)}× < ${minRatio}×`
            );
        }
    }

    /**
     * Assert cache efficiency
     */
    static assertCacheHitRate(hits, total, minRate = 0.95) {
        const hitRate = hits / total;

        if (hitRate < minRate) {
            throw new Error(
                `Cache hit rate too low: ${(hitRate * 100).toFixed(1)}% < ${(minRate * 100)}%`
            );
        }
    }

    /**
     * Assert O(1) lookup time
     */
    static assertConstantTime(times) {
        // Calculate variance - should be low for O(1)
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avg;

        // CV should be low for constant time (<0.5)
        if (coefficientOfVariation > 0.5) {
            throw new Error(
                `Lookup time not constant (CV=${coefficientOfVariation.toFixed(2)})`
            );
        }
    }
}

/**
 * Memory profiling utilities
 */
export class MemoryProfiler {
    /**
     * Get current memory usage (if available)
     */
    static getCurrentUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * Measure memory for operation
     */
    static async measureMemory(fn) {
        // Force GC if available (Chrome DevTools)
        if (global.gc) {
            global.gc();
        }

        const before = this.getCurrentUsage();
        await fn();
        const after = this.getCurrentUsage();

        if (before && after) {
            return {
                before: before.used,
                after: after.used,
                delta: after.used - before.used
            };
        }

        return null;
    }

    /**
     * Check for memory leaks
     */
    static async detectLeaks(operations, iterations = 100) {
        const snapshots = [];

        for (let i = 0; i < iterations; i++) {
            await operations();

            if (i % 10 === 0) {
                const usage = this.getCurrentUsage();
                if (usage) {
                    snapshots.push(usage.used);
                }
            }
        }

        // Check if memory is growing unbounded
        if (snapshots.length < 2) return { hasLeak: false };

        const growth = snapshots[snapshots.length - 1] - snapshots[0];
        const avgGrowthPerIteration = growth / iterations;

        // If average growth > 1KB per iteration, likely a leak
        return {
            hasLeak: avgGrowthPerIteration > 1024,
            totalGrowth: growth,
            avgGrowthPerIteration,
            snapshots
        };
    }
}

/**
 * Cache performance tester
 */
export class CacheTester {
    constructor(cache) {
        this.cache = cache;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Perform cache lookups and measure
     */
    performLookups(elements, count = 10000) {
        const times = [];

        for (let i = 0; i < count; i++) {
            const element = elements[i % elements.length];

            const start = performance.now();
            const result = this.cache.get(element);
            const duration = performance.now() - start;

            times.push(duration);

            if (result) {
                this.hits++;
            } else {
                this.misses++;
            }
        }

        return {
            times,
            avgTime: times.reduce((sum, t) => sum + t, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses)
        };
    }

    /**
     * Reset statistics
     */
    reset() {
        this.hits = 0;
        this.misses = 0;
    }
}

/**
 * Bundle size analyzer
 */
export class BundleAnalyzer {
    /**
     * Estimate bundle size for code
     */
    static estimateSize(code) {
        // Rough estimate: count bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(code).length;

        return {
            bytes,
            kilobytes: (bytes / 1024).toFixed(2)
        };
    }

    /**
     * Compare bundle sizes
     */
    static compare(bundle1, bundle2) {
        const size1 = this.estimateSize(bundle1);
        const size2 = this.estimateSize(bundle2);

        const reduction = ((size1.bytes - size2.bytes) / size1.bytes) * 100;

        return {
            bundle1Size: size1.bytes,
            bundle2Size: size2.bytes,
            reductionPercent: reduction,
            reductionBytes: size1.bytes - size2.bytes
        };
    }

    /**
     * Check if bundle meets size target
     */
    static meetsTarget(code, targetKB) {
        const size = this.estimateSize(code);
        const targetBytes = targetKB * 1024;

        return {
            meetsTarget: size.bytes <= targetBytes,
            actualSize: size.bytes,
            targetSize: targetBytes,
            margin: targetBytes - size.bytes
        };
    }
}

/**
 * Realistic page scenario generator
 */
export class RealisticScenario {
    /**
     * Generate realistic e-commerce page
     */
    static generateEcommercePage(productCount = 50) {
        const page = document.createElement('div');

        for (let i = 0; i < productCount; i++) {
            const product = document.createElement('div');
            product.className = 'product';

            // Price
            const price = document.createElement('span');
            price.className = 'fx-currency';
            price.textContent = `$${(Math.random() * 100 + 10).toFixed(2)}`;

            // Date added
            const date = document.createElement('span');
            date.setAttribute('fx-format', 'date');
            date.textContent = new Date().toISOString();

            // Discount percentage
            const discount = document.createElement('span');
            discount.setAttribute('data-fmt', JSON.stringify({ fmt: 'percentage' }));
            discount.textContent = `${Math.floor(Math.random() * 30)}`;

            product.appendChild(price);
            product.appendChild(date);
            product.appendChild(discount);
            page.appendChild(product);
        }

        return page;
    }

    /**
     * Generate dashboard with metrics
     */
    static generateDashboard(metricCount = 100) {
        const dashboard = document.createElement('div');

        for (let i = 0; i < metricCount; i++) {
            const metric = document.createElement('div');
            metric.className = 'metric';

            const value = document.createElement('span');
            value.className = 'format:number';
            value.textContent = `${Math.floor(Math.random() * 10000)}`;

            metric.appendChild(value);
            dashboard.appendChild(metric);
        }

        return dashboard;
    }
}

/**
 * Performance regression detector
 */
export class RegressionDetector {
    constructor(baseline) {
        this.baseline = baseline;
    }

    /**
     * Check for performance regression
     */
    detectRegression(current, threshold = 1.1) {
        const regressions = [];

        for (const [key, baselineValue] of Object.entries(this.baseline)) {
            const currentValue = current[key];

            if (currentValue > baselineValue * threshold) {
                regressions.push({
                    metric: key,
                    baseline: baselineValue,
                    current: currentValue,
                    ratio: currentValue / baselineValue
                });
            }
        }

        return {
            hasRegression: regressions.length > 0,
            regressions
        };
    }
}

/**
 * Production metrics simulator
 */
export class ProductionMetrics {
    constructor() {
        this.metrics = [];
    }

    /**
     * Log performance metric
     */
    log(metric, value, unit = 'ms') {
        this.metrics.push({
            metric,
            value,
            unit,
            timestamp: Date.now()
        });
    }

    /**
     * Get metrics summary
     */
    getSummary() {
        const summary = {};

        for (const m of this.metrics) {
            if (!summary[m.metric]) {
                summary[m.metric] = [];
            }
            summary[m.metric].push(m.value);
        }

        // Calculate stats for each metric
        const stats = {};
        for (const [metric, values] of Object.entries(summary)) {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            stats[metric] = {
                count: values.length,
                avg,
                min: Math.min(...values),
                max: Math.max(...values)
            };
        }

        return stats;
    }

    /**
     * Check if metrics meet thresholds
     */
    checkThresholds(thresholds) {
        const violations = [];
        const summary = this.getSummary();

        for (const [metric, threshold] of Object.entries(thresholds)) {
            const stats = summary[metric];

            if (stats && stats.avg > threshold) {
                violations.push({
                    metric,
                    threshold,
                    actual: stats.avg,
                    exceeded: stats.avg - threshold
                });
            }
        }

        return {
            passed: violations.length === 0,
            violations
        };
    }
}

export default {
    PerformanceMeasurer,
    LargeDOMGenerator,
    v1Baseline,
    v2Targets,
    PerformanceAssertions,
    MemoryProfiler,
    CacheTester,
    BundleAnalyzer,
    RealisticScenario,
    RegressionDetector,
    ProductionMetrics
};
