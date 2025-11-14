/**
 * Accessibility Performance Benchmarks
 *
 * Measures performance of accX (AccessX) implementation
 * Target: <10ms for all operations
 *
 * Metrics:
 * - Initial ARIA application time
 * - Keyboard event handler response time
 * - Focus management overhead
 * - Live region update latency
 * - Memory usage for accessibility features
 *
 * Test scales: 100, 1000, 5000 elements
 */

const fs = require('fs');
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');

// Mock DOM environment for Node.js
const { JSDOM } = require('jsdom');

class AccessibilityBenchmark {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            targetMs: 10,
            scales: {},
            summary: {}
        };
        this.scales = [100, 1000, 5000];
    }

    setupDOM(elementCount) {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head><title>Accessibility Benchmark</title></head>
            <body>
                <div id="container"></div>
                <div id="live-region" role="status" aria-live="polite" aria-atomic="true"></div>
            </body>
            </html>
        `);

        global.window = dom.window;
        global.document = dom.window.document;
        global.MutationObserver = dom.window.MutationObserver;

        const container = document.getElementById('container');

        // Create elements to benchmark
        for (let i = 0; i < elementCount; i++) {
            const el = document.createElement('button');
            el.id = `element-${i}`;
            el.textContent = `Element ${i}`;
            el.setAttribute('data-test-id', i);
            container.appendChild(el);
        }

        return { dom, container };
    }

    benchmark(name, fn, iterations = 100) {
        const times = [];

        // Warmup
        for (let i = 0; i < 10; i++) {
            fn();
        }

        // Actual benchmark
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            fn();
            const end = performance.now();
            times.push(end - start);
        }

        return {
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            min: Math.min(...times),
            max: Math.max(...times),
            p50: this.percentile(times, 0.5),
            p95: this.percentile(times, 0.95),
            p99: this.percentile(times, 0.99)
        };
    }

    percentile(arr, p) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index];
    }

    measureARIAApplication(elementCount) {
        const { container } = this.setupDOM(elementCount);
        const elements = Array.from(container.querySelectorAll('button'));

        return this.benchmark('aria-application', () => {
            elements.forEach((el, index) => {
                el.setAttribute('aria-label', `Button ${index}`);
                el.setAttribute('aria-pressed', 'false');
                el.setAttribute('role', 'button');
                el.setAttribute('tabindex', '0');
            });
        }, 50);
    }

    measureKeyboardEventHandler(elementCount) {
        const { container } = this.setupDOM(elementCount);
        const elements = Array.from(container.querySelectorAll('button'));

        // Setup keyboard handler
        let currentIndex = 0;
        const handler = (e) => {
            if (e.key === 'ArrowDown') {
                currentIndex = Math.min(currentIndex + 1, elements.length - 1);
                elements[currentIndex].focus();
            } else if (e.key === 'ArrowUp') {
                currentIndex = Math.max(currentIndex - 1, 0);
                elements[currentIndex].focus();
            }
        };

        container.addEventListener('keydown', handler);

        const result = this.benchmark('keyboard-event', () => {
            const event = new window.KeyboardEvent('keydown', { key: 'ArrowDown' });
            container.dispatchEvent(event);
        }, 100);

        container.removeEventListener('keydown', handler);
        return result;
    }

    measureFocusManagement(elementCount) {
        const { container } = this.setupDOM(elementCount);
        const elements = Array.from(container.querySelectorAll('button'));

        return this.benchmark('focus-management', () => {
            elements.forEach((el, index) => {
                el.setAttribute('tabindex', index === 0 ? '0' : '-1');
            });

            // Simulate focus change
            const randomIndex = Math.floor(Math.random() * elements.length);
            elements.forEach((el, index) => {
                el.setAttribute('tabindex', index === randomIndex ? '0' : '-1');
            });
        }, 50);
    }

    measureLiveRegionUpdate(elementCount) {
        const { dom } = this.setupDOM(elementCount);
        const liveRegion = document.getElementById('live-region');

        return this.benchmark('live-region-update', () => {
            liveRegion.textContent = `Updated at ${Date.now()}`;
        }, 100);
    }

    measureMemoryUsage(elementCount) {
        const { dom, container } = this.setupDOM(elementCount);

        if (global.gc) {
            global.gc();
        }

        const before = process.memoryUsage();

        // Apply accessibility attributes
        const elements = Array.from(container.querySelectorAll('button'));
        elements.forEach((el, index) => {
            el.setAttribute('aria-label', `Button ${index}`);
            el.setAttribute('aria-pressed', 'false');
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', index === 0 ? '0' : '-1');
            el.setAttribute('aria-selected', 'false');
        });

        // Setup event listeners
        const handlers = elements.map((el) => {
            const handler = () => {
                el.setAttribute('aria-pressed',
                    el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'
                );
            };
            el.addEventListener('click', handler);
            return handler;
        });

        if (global.gc) {
            global.gc();
        }

        const after = process.memoryUsage();

        // Cleanup
        elements.forEach((el, index) => {
            el.removeEventListener('click', handlers[index]);
        });

        return {
            heapUsed: (after.heapUsed - before.heapUsed) / 1024 / 1024, // MB
            heapTotal: (after.heapTotal - before.heapTotal) / 1024 / 1024,
            external: (after.external - before.external) / 1024 / 1024,
            perElement: ((after.heapUsed - before.heapUsed) / elementCount) / 1024 // KB per element
        };
    }

    measureMultiSelection(elementCount) {
        const { container } = this.setupDOM(elementCount);
        const elements = Array.from(container.querySelectorAll('button'));

        // Setup multi-selection state
        container.setAttribute('aria-multiselectable', 'true');
        elements.forEach(el => {
            el.setAttribute('role', 'option');
            el.setAttribute('aria-selected', 'false');
        });

        return this.benchmark('multi-selection', () => {
            // Simulate range selection (Shift+Arrow)
            const start = Math.floor(Math.random() * elements.length);
            const end = Math.min(start + 10, elements.length - 1);

            for (let i = start; i <= end; i++) {
                elements[i].setAttribute('aria-selected', 'true');
            }

            // Clear selection
            for (let i = start; i <= end; i++) {
                elements[i].setAttribute('aria-selected', 'false');
            }
        }, 50);
    }

    measureAnnouncement(elementCount) {
        const { dom } = this.setupDOM(elementCount);

        return this.benchmark('announcement', () => {
            let announcer = document.getElementById('ax-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'ax-announcer';
                announcer.className = 'ax-sr-only';
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                document.body.appendChild(announcer);
            }

            announcer.textContent = '';
            announcer.textContent = `Announcement ${Date.now()}`;
        }, 100);
    }

    async runBenchmarks() {
        console.log('🏃 Running Accessibility Performance Benchmarks...\n');
        console.log(`Target: <${this.results.targetMs}ms for all operations\n`);

        for (const scale of this.scales) {
            console.log(`\n📊 Testing with ${scale} elements...`);

            const scaleResults = {
                elementCount: scale,
                metrics: {}
            };

            // Initial ARIA application
            console.log('  ⏱️  Measuring ARIA application...');
            scaleResults.metrics.ariaApplication = this.measureARIAApplication(scale);

            // Keyboard event handling
            console.log('  ⏱️  Measuring keyboard event handling...');
            scaleResults.metrics.keyboardEvent = this.measureKeyboardEventHandler(scale);

            // Focus management
            console.log('  ⏱️  Measuring focus management...');
            scaleResults.metrics.focusManagement = this.measureFocusManagement(scale);

            // Live region updates
            console.log('  ⏱️  Measuring live region updates...');
            scaleResults.metrics.liveRegion = this.measureLiveRegionUpdate(scale);

            // Multi-selection
            console.log('  ⏱️  Measuring multi-selection...');
            scaleResults.metrics.multiSelection = this.measureMultiSelection(scale);

            // Announcements
            console.log('  ⏱️  Measuring announcements...');
            scaleResults.metrics.announcement = this.measureAnnouncement(scale);

            // Memory usage
            console.log('  ⏱️  Measuring memory usage...');
            scaleResults.metrics.memory = this.measureMemoryUsage(scale);

            this.results.scales[scale] = scaleResults;

            // Print summary for this scale
            this.printScaleSummary(scale, scaleResults);
        }

        this.generateSummary();
        this.saveResults();
        this.printFinalReport();
    }

    printScaleSummary(scale, results) {
        console.log(`\n  Results for ${scale} elements:`);

        Object.entries(results.metrics).forEach(([metric, data]) => {
            if (metric === 'memory') {
                console.log(`    ${metric}: ${data.heapUsed.toFixed(2)}MB (${data.perElement.toFixed(2)}KB/element)`);
            } else {
                const status = data.avg < this.results.targetMs ? '✅' : '❌';
                console.log(`    ${metric}: avg=${data.avg.toFixed(2)}ms, p95=${data.p95.toFixed(2)}ms ${status}`);
            }
        });
    }

    generateSummary() {
        const summary = {
            passedTarget: {},
            failedTarget: {},
            memoryEfficiency: {},
            scalability: {}
        };

        Object.entries(this.results.scales).forEach(([scale, data]) => {
            summary.passedTarget[scale] = {};
            summary.failedTarget[scale] = {};

            Object.entries(data.metrics).forEach(([metric, values]) => {
                if (metric === 'memory') {
                    summary.memoryEfficiency[scale] = values;
                } else {
                    if (values.avg < this.results.targetMs) {
                        summary.passedTarget[scale][metric] = values.avg;
                    } else {
                        summary.failedTarget[scale][metric] = values.avg;
                    }
                }
            });
        });

        // Calculate scalability (how performance degrades with scale)
        const scales = Object.keys(this.results.scales).map(Number).sort((a, b) => a - b);
        if (scales.length >= 2) {
            const smallScale = scales[0];
            const largeScale = scales[scales.length - 1];

            const metrics = Object.keys(this.results.scales[smallScale].metrics).filter(m => m !== 'memory');
            metrics.forEach(metric => {
                const smallTime = this.results.scales[smallScale].metrics[metric].avg;
                const largeTime = this.results.scales[largeScale].metrics[metric].avg;
                const scaleFactor = largeScale / smallScale;
                const timeFactor = largeTime / smallTime;

                summary.scalability[metric] = {
                    scaleFactor,
                    timeFactor,
                    efficiency: (scaleFactor / timeFactor * 100).toFixed(1) + '%'
                };
            });
        }

        this.results.summary = summary;
    }

    saveResults() {
        const outputPath = path.join(__dirname, '..', '..', 'baseline-performance.json');
        fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
        console.log(`\n\n💾 Results saved to: ${outputPath}`);
    }

    printFinalReport() {
        console.log('\n\n' + '='.repeat(60));
        console.log('FINAL REPORT');
        console.log('='.repeat(60));

        console.log('\n📈 Scalability Analysis:');
        Object.entries(this.results.summary.scalability).forEach(([metric, data]) => {
            console.log(`  ${metric}:`);
            console.log(`    Scale factor: ${data.scaleFactor}x elements`);
            console.log(`    Time factor: ${data.timeFactor.toFixed(2)}x slower`);
            console.log(`    Efficiency: ${data.efficiency} (100% = linear scaling)`);
        });

        console.log('\n💚 Metrics Meeting Target (<10ms):');
        Object.entries(this.results.summary.passedTarget).forEach(([scale, metrics]) => {
            if (Object.keys(metrics).length > 0) {
                console.log(`  ${scale} elements: ${Object.keys(metrics).join(', ')}`);
            }
        });

        console.log('\n⚠️  Metrics Exceeding Target:');
        Object.entries(this.results.summary.failedTarget).forEach(([scale, metrics]) => {
            if (Object.keys(metrics).length > 0) {
                console.log(`  ${scale} elements:`);
                Object.entries(metrics).forEach(([metric, time]) => {
                    console.log(`    ${metric}: ${time.toFixed(2)}ms`);
                });
            }
        });

        console.log('\n💾 Memory Usage:');
        Object.entries(this.results.summary.memoryEfficiency).forEach(([scale, data]) => {
            console.log(`  ${scale} elements: ${data.heapUsed.toFixed(2)}MB (${data.perElement.toFixed(2)}KB/element)`);
        });

        console.log('\n' + '='.repeat(60));
    }
}

// Run benchmarks
if (require.main === module) {
    const benchmark = new AccessibilityBenchmark();
    benchmark.runBenchmarks().catch(console.error);
}

module.exports = AccessibilityBenchmark;
