/**
 * bindX Performance Benchmarks
 *
 * Targets:
 * - <0.5ms per binding update
 * - <16ms for 100 simultaneous updates
 * - Minimal memory footprint
 * - RAF batching effectiveness
 */

// Node.js polyfills for browser APIs
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = clearTimeout;

const bindX = require('../../src/bindx.js');

// Helper to measure performance
const benchmark = (name, fn, iterations = 1000) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = performance.now();
    const total = end - start;
    const avg = total / iterations;

    console.log(`\n${name}:`);
    console.log(`  Total: ${total.toFixed(2)}ms`);
    console.log(`  Average: ${avg.toFixed(4)}ms`);
    console.log(`  Iterations: ${iterations}`);

    return { total, avg, iterations };
};

// Helper to measure async operations
const benchmarkAsync = async (name, fn, iterations = 100) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        await fn();
    }
    const end = performance.now();
    const total = end - start;
    const avg = total / iterations;

    console.log(`\n${name}:`);
    console.log(`  Total: ${total.toFixed(2)}ms`);
    console.log(`  Average: ${avg.toFixed(4)}ms`);
    console.log(`  Iterations: ${iterations}`);

    return { total, avg, iterations };
};

console.log('='.repeat(60));
console.log('bindX Performance Benchmarks');
console.log('='.repeat(60));

// 1. Reactive Object Creation
console.log('\n--- Reactive Object Creation ---');
benchmark('Create reactive object', () => {
    const data = bindX.reactive({ count: 0, name: 'test', items: [] });
}, 10000);

// 2. Property Access
console.log('\n--- Property Access ---');
const data = bindX.reactive({ count: 0, user: { name: 'John', email: 'john@example.com' } });
benchmark('Get top-level property', () => {
    const x = data.count;
}, 100000);

benchmark('Get nested property', () => {
    const x = data.user.name;
}, 100000);

// 3. Property Updates
console.log('\n--- Property Updates ---');
const result1 = benchmark('Update single property', () => {
    data.count++;
}, 10000);

console.log(`  Target: <0.5ms ✓ ${result1.avg < 0.5 ? 'PASS' : 'FAIL'}`);

// 4. Batch Updates
console.log('\n--- Batch Updates ---');
const batchData = bindX.reactive({ count: 0, value: 'test', flag: false });
const result2 = benchmark('Update 100 properties (batched)', () => {
    for (let i = 0; i < 100; i++) {
        batchData.count = i;
    }
}, 100);

console.log(`  Target: <16ms for 100 updates ✓ ${result2.avg < 16 ? 'PASS' : 'FAIL'}`);

// 5. Computed Properties
console.log('\n--- Computed Properties ---');
const computedData = bindX.reactive({ firstName: 'John', lastName: 'Doe' });
const fullName = bindX.computed(() => `${computedData.firstName} ${computedData.lastName}`);

benchmark('Access computed property (cached)', () => {
    const name = fullName();
}, 100000);

benchmark('Invalidate and recalculate computed', () => {
    computedData.firstName = 'Jane';
    const name = fullName();
}, 1000);

// 6. Watch Performance
console.log('\n--- Watchers ---');
const watchData = bindX.reactive({ value: 0 });
let watchCallCount = 0;
bindX.watch(watchData, 'value', () => {
    watchCallCount++;
});

benchmark('Trigger watcher', () => {
    watchData.value++;
}, 1000);

console.log(`  Watcher calls: ${watchCallCount}`);

// 7. Deep vs Shallow Reactivity
console.log('\n--- Deep vs Shallow Reactivity ---');
benchmark('Create deep reactive object', () => {
    const deep = bindX.reactive({
        level1: {
            level2: {
                level3: { value: 'deep' }
            }
        }
    }, { deep: true });
}, 1000);

benchmark('Create shallow reactive object', () => {
    const shallow = bindX.reactive({
        level1: {
            level2: {
                level3: { value: 'shallow' }
            }
        }
    }, { deep: false });
}, 1000);

// 8. Memory Footprint
console.log('\n--- Memory Footprint ---');
if (typeof performance.memory !== 'undefined') {
    const before = performance.memory.usedJSHeapSize;

    const objects = [];
    for (let i = 0; i < 1000; i++) {
        objects.push(bindX.reactive({
            id: i,
            name: `Item ${i}`,
            value: Math.random()
        }));
    }

    const after = performance.memory.usedJSHeapSize;
    const increase = (after - before) / 1024 / 1024;

    console.log(`  1000 reactive objects: ${increase.toFixed(2)}MB`);
    console.log(`  Per object: ${(increase / 1000 * 1024).toFixed(2)}KB`);
} else {
    console.log('  Memory API not available');
}

// 9. Binding Creation
console.log('\n--- Binding Creation ---');
if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    const bindingData = bindX.reactive({ value: 'test' });

    benchmark('Create model binding', () => {
        const input = document.createElement('input');
        input.setAttribute('bx-model', 'value');
        container.appendChild(input);
        bindX.scan(container, bindingData);
        container.removeChild(input);
    }, 100);

    benchmark('Create one-way binding', () => {
        const div = document.createElement('div');
        div.setAttribute('bx-bind', 'value');
        container.appendChild(div);
        bindX.scan(container, bindingData);
        container.removeChild(div);
    }, 100);
}

// 10. Form Validation
console.log('\n--- Form Validation ---');
const formData = bindX.reactive({
    email: 'test@example.com',
    age: 25,
    name: 'John Doe'
});

benchmark('Validate single field', () => {
    bindX.validateField(formData.email, { required: true, email: true });
}, 10000);

// 11. Serialization
console.log('\n--- Serialization ---');
if (typeof document !== 'undefined') {
    const form = document.createElement('form');
    for (let i = 0; i < 10; i++) {
        const input = document.createElement('input');
        input.name = `field${i}`;
        input.value = `value${i}`;
        form.appendChild(input);
    }

    benchmark('Serialize form (10 fields)', () => {
        bindX.serializeForm(form);
    }, 1000);
}

// 12. Dependency Tracking
console.log('\n--- Dependency Tracking ---');
const depData = bindX.reactive({ a: 1, b: 2 });
const depComputed = bindX.computed(() => depData.a + depData.b);

benchmark('Track dependencies', () => {
    depData.a++;
    depComputed();
}, 1000);

// 13. WeakMap Cleanup
console.log('\n--- WeakMap Cleanup ---');
let cleanupObjects = [];
for (let i = 0; i < 1000; i++) {
    cleanupObjects.push(bindX.reactive({ id: i }));
}
console.log(`  Created 1000 reactive objects`);

cleanupObjects = null;
if (typeof global !== 'undefined' && global.gc) {
    global.gc();
    console.log('  Garbage collection triggered (requires --expose-gc flag)');
} else {
    console.log('  GC not available (run with --expose-gc to test cleanup)');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('Performance Summary');
console.log('='.repeat(60));
console.log('\nCritical Targets:');
console.log(`  Single update: ${result1.avg.toFixed(4)}ms (target: <0.5ms) ${result1.avg < 0.5 ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  100 updates: ${result2.avg.toFixed(4)}ms (target: <16ms) ${result2.avg < 16 ? '✓ PASS' : '✗ FAIL'}`);

console.log('\n' + '='.repeat(60));
