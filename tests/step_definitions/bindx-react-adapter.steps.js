/**
 * Step definitions for bindx-react-adapter.feature
 *
 * Runs the real adapter (src/bindx-react.ts, compiled by the adapter harness) with
 * React 19 and react-dom against a jsdom document. Type scenarios run the
 * TypeScript compiler on small files that import the adapter.
 */
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { setupAdapter, flush } = require('../support/bindx-adapter-harness');

const ROOT = path.resolve(__dirname, '../..');
const ADAPTER_SRC = path.join(ROOT, 'src', 'bindx-react.ts');
const TS_DIR = path.join(ROOT, 'node_modules', '.cache', 'genx-bindx-adapters', 'ts');

// Anchored regex for a literal step text (texts here contain { } ( ) and /)
const re = (text) => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '$');

function rx(world) {
    if (!world.rc) world.rc = { renders: 0, log: [], checks: {} };
    return world.rc;
}

function react(world) {
    const ad = world.ad;
    if (!ad.react) {
        const React = require('react');
        ad.react = {
            React,
            h: React.createElement,
            act: React.act,
            client: require('react-dom/client')
        };
    }
    return ad.react;
}

const hooks = (world) => world.ad.adapter;

function act(world, fn) {
    return react(world).act(fn);
}

async function actAsync(world, fn) {
    await react(world).act(async () => { await fn(); });
}

function mount(world, element, options) {
    const { client } = react(world);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = client.createRoot(container, options);
    act(world, () => root.render(element));
    const mounted = {
        container,
        root,
        gone: false,
        text: () => container.textContent,
        unmount() {
            if (!mounted.gone) {
                mounted.gone = true;
                act(world, () => root.unmount());
                container.remove();
            }
        }
    };
    world.ad.cleanups.push(() => mounted.unmount());
    return mounted;
}

function click(world, element) {
    act(world, () => {
        element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
}

// Register a check for a step text that several scenarios share
function setCheck(world, key, fn) {
    rx(world).checks[key] = fn;
}

async function runCheck(world, key) {
    const fn = rx(world).checks[key];
    assert.ok(fn, `no check registered for "${key}" in this scenario`);
    await fn();
}

let tsCounter = 0;
/** Type-check a TypeScript snippet that imports the adapter; returns its diagnostics. */
function typecheck(code) {
    const ts = require('typescript');
    fs.mkdirSync(TS_DIR, { recursive: true });
    const file = path.join(TS_DIR, `check-${process.pid}-${tsCounter++}.ts`);
    const importPath = ADAPTER_SRC.replace(/\.ts$/, '');
    fs.writeFileSync(file, `import { useBindX, useComputed, useWatch } from ${JSON.stringify(importPath)};\n${code}\n`);
    const program = ts.createProgram([file], {
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        skipLibCheck: true,
        noUnusedLocals: false
    });
    const diagnostics = ts.getPreEmitDiagnostics(program)
        .filter(d => d.file && d.file.fileName === file)
        .map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
    fs.unlinkSync(file);
    return diagnostics;
}

function assertCompiles(code) {
    const diagnostics = typecheck(code);
    assert.deepStrictEqual(diagnostics, [], 'expected no type errors');
}

function assertTypeError(code, expectedCode = 2322) {
    const diagnostics = typecheck(code);
    const codes = [].concat(expectedCode);
    assert.ok(diagnostics.some(d => codes.includes(d.code)),
        `expected TS${expectedCode}, got ${JSON.stringify(diagnostics)}`);
}

/** Completions TypeScript offers at the end of `prefix` (what an IDE would show). */
function completionsAfter(prefix) {
    const ts = require('typescript');
    fs.mkdirSync(TS_DIR, { recursive: true });
    const file = path.join(TS_DIR, `complete-${process.pid}-${tsCounter++}.ts`);
    const importPath = ADAPTER_SRC.replace(/\.ts$/, '');
    const source = `import { useBindX } from ${JSON.stringify(importPath)};\n${prefix}`;
    fs.writeFileSync(file, source);
    const options = { strict: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Node10, skipLibCheck: true };
    const host = {
        getScriptFileNames: () => [file],
        getScriptVersion: () => '1',
        getScriptSnapshot: (name) => fs.existsSync(name) ? ts.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf8')) : undefined,
        getCurrentDirectory: () => ROOT,
        getCompilationSettings: () => options,
        getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories
    };
    const service = ts.createLanguageService(host, ts.createDocumentRegistry());
    const result = service.getCompletionsAtPosition(file, source.length, {});
    fs.unlinkSync(file);
    return result ? result.entries.map(e => e.name) : [];
}

function errorBoundary(world) {
    const { React, h } = react(world);
    const rc = rx(world);
    class Boundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { error: null };
        }
        static getDerivedStateFromError(error) {
            return { error };
        }
        componentDidCatch(error) {
            rc.caughtByBoundary = error;
        }
        render() {
            if (this.state.error) return h('p', { className: 'fallback' }, `Something went wrong: ${this.state.error.message}`);
            return this.props.children;
        }
    }
    return Boundary;
}

// ---------------------------------------------------------------- Background

Given(re('React 17+ is installed'), function() {
    const React = require('react');
    const major = parseInt(React.version.split('.')[0], 10);
    assert.ok(major >= 17, `React ${React.version} is older than 17`);
    assert.strictEqual(require('react-dom/package.json').version, React.version);
});

Given(re('@genx/bindx-react package is installed'), function() {
    const ad = setupAdapter(this, 'react');
    for (const name of ['useBindX', 'useComputed', 'useWatch', 'useCounter', 'useToggle', 'useArray',
        'useForm', 'useAsync', 'createBindXContext', 'createGlobalStore', 'withBindX']) {
        assert.strictEqual(typeof ad.adapter[name], 'function', `${name} should be exported`);
    }
});

// ---------------------------------------------------------------- Core hook

Given(re('a React function component'), function() {
    const rc = rx(this);
    rc.Component = ({ initial }) => {
        rc.renders++;
        const state = hooks(this).useBindX(initial);
        rc.state = state;
        return react(this).h('p', null, `count=${state.count}`);
    };
});

When(re('I call useBindX({ count: 0 })'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.Component, { initial: { count: 0 } }));
    assert.strictEqual(rc.view.text(), 'count=0');
});

Then(re('the state should be reactive'), function() {
    const rc = rx(this);
    const doubled = this.ad.core.computed(() => rc.state.count * 2);
    assert.strictEqual(doubled(), 0);
    act(this, () => { rc.state.count = 2; });
    assert.strictEqual(doubled(), 4, 'a computed reading the hook state should see the write');
});

Then(re('component should re-render on state changes'), function() {
    const rc = rx(this);
    const before = rc.renders;
    act(this, () => { rc.state.count = 5; });
    assert.strictEqual(rc.renders, before + 1);
    assert.strictEqual(rc.view.text(), 'count=5');
});

Then(re('TypeScript types should be correct'), function() {
    assertCompiles('export function C() { const s = useBindX({ count: 0 }); const n: number = s.count; s.count++; return n; }');
    assertTypeError('export function C() { const s = useBindX({ count: 0 }); const t: string = s.count; return t; }');
});

Given(re('component with useBindX state'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.states = [];
    rc.inits = 0;
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX(() => { rc.inits++; return { a: 0, b: 0, c: 0 }; });
        const [, setTick] = React.useState(0);
        rc.setTick = setTick;
        rc.state = state;
        rc.states.push(state);
        return h('p', null, `a=${state.a} b=${state.b} c=${state.c}`);
    };
    rc.view = mount(this, h(Component));
});

When(re('multiple properties change in same function'), function() {
    const rc = rx(this);
    rc.before = rc.renders;
    act(this, () => {
        rc.state.a = 1;
        rc.state.b = 2;
        rc.state.c = 3;
    });
});

Then(re('only one re-render should occur'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.renders - rc.before, 1);
});

Then(re('all changes should be batched'), function() {
    assert.strictEqual(rx(this).view.text(), 'a=1 b=2 c=3');
});

When(re('component re-renders for other reasons'), function() {
    const rc = rx(this);
    const before = rc.renders;
    act(this, () => rc.setTick(t => t + 1));
    act(this, () => rc.setTick(t => t + 1));
    assert.strictEqual(rc.renders, before + 2);
});

Then(re('state should maintain identity'), function() {
    const rc = rx(this);
    assert.ok(rc.states.length >= 3);
    assert.ok(rc.states.every(s => s === rc.states[0]), 'every render should get the same state object');
});

Then(re('state should not reinitialize'), function() {
    assert.strictEqual(rx(this).inits, 1);
});

When(re('state changes during lifetime'), function() {
    const rc = rx(this);
    rc.before = rc.renders;
    act(this, () => { rc.state.a = 5; });
    act(this, () => { rc.state.b = 7; });
});

Then(re('component should re-render'), function() {
    const rc = rx(this);
    assert.ok(rc.renders > rc.before, 'expected a re-render after the state change');
});

Then(re('UI should update correctly'), function() {
    assert.strictEqual(rx(this).view.text(), 'a=5 b=7 c=0');
});

// ---------------------------------------------------------------- Computed

Given(re('useBindX state { count: 0 }'), function() {
    rx(this).initial = { count: 0 };
});

Given(re('computed doubleCount'), function() {
    rx(this).derive = (state) => state.count * 2;
});

When(re('rendering {{ doubleCount() }}'), function() {
    const rc = rx(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX(rc.initial);
        const doubleCount = hooks(this).useComputed(() => rc.derive(state));
        rc.state = state;
        rc.computed = doubleCount;
        return react(this).h('span', null, String(doubleCount()));
    };
    rc.view = mount(this, react(this).h(Component));
});

Then(re('it should show correct value'), function() {
    assert.strictEqual(rx(this).view.text(), '0');
});

When(re('count changes'), function() {
    const rc = rx(this);
    rc.before = rc.renders;
    act(this, () => { rc.state.count = 4; });
});

Then(re('doubleCount should update'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.computed(), 8);
    assert.strictEqual(rc.view.text(), '8');
});

Given(re("useBindX state { firstName: 'John', lastName: 'Doe' }"), function() {
    rx(this).initial = { firstName: 'John', lastName: 'Doe' };
});

Given(re('computed fullName'), function() {
    const rc = rx(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX(rc.initial);
        const fullName = hooks(this).useComputed(() => `${state.firstName} ${state.lastName}`);
        rc.state = state;
        rc.computed = fullName;
        return react(this).h('span', null, fullName());
    };
    rc.view = mount(this, react(this).h(Component));
    assert.strictEqual(rc.view.text(), 'John Doe');
});

When(re('either name changes'), function() {
    const rc = rx(this);
    rc.steps = [];
    for (const [key, value] of [['firstName', 'Jane'], ['lastName', 'Smith']]) {
        const before = rc.renders;
        act(this, () => { rc.state[key] = value; });
        rc.steps.push({ renders: rc.renders - before, text: rc.view.text(), computed: rc.computed() });
    }
});

Then(re('fullName should update'), function() {
    const rc = rx(this);
    assert.deepStrictEqual(rc.steps.map(s => s.computed), ['Jane Doe', 'Jane Smith']);
    assert.deepStrictEqual(rc.steps.map(s => s.text), ['Jane Doe', 'Jane Smith']);
});

Then(re('component should re-render once'), function() {
    assert.deepStrictEqual(rx(this).steps.map(s => s.renders), [1, 1]);
});

Given(re('multiple computed depending on each other'), function() {
    const rc = rx(this);
    rc.counts = { subtotal: 0, tax: 0, total: 0, label: 0 };
    const Component = () => {
        const { useBindX, useComputed } = hooks(this);
        const state = useBindX({ price: 10, qty: 2, name: 'widget' });
        const subtotal = useComputed(() => { rc.counts.subtotal++; return state.price * state.qty; });
        const tax = useComputed(() => { rc.counts.tax++; return Math.round(subtotal() / 10); });
        const total = useComputed(() => { rc.counts.total++; return subtotal() + tax(); });
        const label = useComputed(() => { rc.counts.label++; return state.name.toUpperCase(); });
        rc.state = state;
        rc.total = total;
        return react(this).h('span', null, `${label()}: ${total()}`);
    };
    rc.view = mount(this, react(this).h(Component));
    assert.strictEqual(rc.view.text(), 'WIDGET: 22');
});

When(re('source state changes'), function() {
    const rc = rx(this);
    for (const key of Object.keys(rc.counts)) rc.counts[key] = 0;
    act(this, () => { rc.state.qty = 3; });
});

Then(re('all computed should update correctly'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.total(), 33);
    assert.strictEqual(rc.view.text(), 'WIDGET: 33');
});

Then(re('only necessary recomputations occur'), function() {
    assert.deepStrictEqual(rx(this).counts, { subtotal: 1, tax: 1, total: 1, label: 0 });
});

// ---------------------------------------------------------------- Watchers

Given(re('useBindX state { userId: 1 }'), function() {
    rx(this).initial = { userId: 1 };
});

When(re('I create watcher in useEffect'), function() {
    const rc = rx(this);
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        // useWatch registers the watcher in a useEffect and unwatches in its cleanup
        hooks(this).useWatch(() => state.userId, (n, o) => rc.log.push([n, o]));
        rc.state = state;
        return react(this).h('span', null, `user ${state.userId}`);
    };
    rc.view = mount(this, react(this).h(Component));
});

Then(re('watcher should execute on changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.userId = 2; });
    assert.deepStrictEqual(rc.log, [[2, 1]]);
});

Then(re('cleanup should happen on unmount'), function() {
    const rc = rx(this);
    rc.view.unmount();
    rc.state.userId = 3;
    assert.deepStrictEqual(rc.log, [[2, 1]], 'watcher should not run after unmount');
    assert.strictEqual(this.ad.activeWatchers, 0);
});

Given(re('useBindX state with initial value'), function() {
    rx(this).initial = { value: 'initial' };
});

When(re('I create watcher with { immediate: true }'), function() {
    const rc = rx(this);
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        hooks(this).useWatch(() => state.value, (n, o) => rc.log.push([n, o]), { immediate: true });
        rc.state = state;
        return null;
    };
    rc.view = mount(this, react(this).h(Component));
});

Then(re('watcher executes immediately'), function() {
    assert.strictEqual(rx(this).log.length, 1, 'immediate watcher should run on mount without a change');
});

Then(re('receives initial value'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.log[0][0], 'initial');
    act(this, () => { rc.state.value = 'next'; });
    assert.deepStrictEqual(rc.log[1], ['next', 'initial']);
});

Given(re('useBindX state with nested objects'), function() {
    rx(this).initial = { user: { profile: { name: 'Ada', address: { city: 'London' } } } };
});

When(re('I create watcher with { deep: true }'), function() {
    const rc = rx(this);
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        hooks(this).useWatch(() => state.user, (n) => rc.log.push(JSON.stringify(n)), { deep: true });
        rc.state = state;
        return react(this).h('span', null, state.user.profile.address.city);
    };
    rc.view = mount(this, react(this).h(Component));
});

Then(re('watcher reacts to nested changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.user.profile.name = 'Grace'; });
    assert.strictEqual(rc.log.length, 1);
    assert.ok(rc.log[0].includes('Grace'));
});

Then(re('all levels tracked correctly'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.user.profile.address.city = 'Paris'; });
    assert.strictEqual(rc.log.length, 2);
    assert.strictEqual(rc.view.text(), 'Paris', 'a nested write should re-render');
    act(this, () => { rc.state.user = { profile: { name: 'Linus', address: { city: 'Helsinki' } } }; });
    assert.strictEqual(rc.log.length, 3);
    assert.strictEqual(rc.view.text(), 'Helsinki');
});

// ---------------------------------------------------------------- Lifecycle

Given(re('React component with useBindX'), function() {
    const rc = rx(this);
    rc.inits = 0;
    rc.Component = () => {
        const { useBindX, useWatch } = hooks(this);
        const state = useBindX(() => { rc.inits++; return { status: 'idle', loaded: false }; });
        useWatch(() => state.status, (n) => rc.log.push(n));
        react(this).React.useEffect(() => { state.loaded = true; }, [state]);
        rc.state = state;
        return react(this).h('span', null, `${state.status} ${state.loaded ? 'loaded' : 'loading'}`);
    };
});

When(re('component mounts'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.Component));
});

Then(re('state should be initialized'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.inits, 1);
    assert.strictEqual(rc.state.loaded, true);
    assert.strictEqual(rc.view.text(), 'idle loaded');
});

Then(re('watchers should be active'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.status = 'ready'; });
    assert.deepStrictEqual(rc.log, ['ready']);
    assert.strictEqual(rc.view.text(), 'ready loaded');
});

Given(re('component with useBindX watchers'), function() {
    const rc = rx(this);
    rc.log = { a: [], total: [] };
    const Component = () => {
        const { useBindX, useWatch, useComputed } = hooks(this);
        const state = useBindX({ a: 1, b: 2 });
        const total = useComputed(() => state.a + state.b);
        useWatch(() => state.a, (n) => rc.log.a.push(n));
        useWatch(() => total(), (n) => rc.log.total.push(n));
        rc.state = state;
        return react(this).h('span', null, String(total()));
    };
    rc.view = mount(this, react(this).h(Component));
    act(this, () => { rc.state.a = 5; });
    assert.deepStrictEqual(rc.log, { a: [5], total: [7] });
    assert.ok(this.ad.activeWatchers >= 2);
});

When(re('component unmounts'), function() {
    rx(this).view.unmount();
});

Then(re('all watchers should disconnect'), function() {
    const rc = rx(this);
    rc.state.a = 10;
    rc.state.b = 20;
    assert.deepStrictEqual(rc.log, { a: [5], total: [7] }, 'no watcher should run after unmount');
});

Then(re('no React adapter memory leaks should occur'), function() {
    assert.strictEqual(this.ad.activeWatchers, 0, 'every watcher the adapter created should be unwatched');
});

// ---------------------------------------------------------------- StrictMode, Suspense, concurrency

Given(re('app wrapped in React.StrictMode'), function() {
    rx(this).kind = 'strict';
});

When(re('component uses useBindX'), async function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.effectRuns = 0;
    if (rc.kind === 'strict') {
        const Component = () => {
            const state = hooks(this).useBindX({ count: 0 });
            hooks(this).useWatch(() => state.count, (n) => rc.log.push(n));
            React.useEffect(() => { rc.effectRuns++; }, []);
            rc.state = state;
            return h('span', null, `count=${state.count}`);
        };
        rc.view = mount(this, h(React.StrictMode, null, h(Component)));
    } else if (rc.kind === 'suspense') {
        let resolveData;
        const data = new Promise(resolve => { resolveData = resolve; });
        let loaded = null;
        data.then(value => { loaded = value; });
        const Component = () => {
            if (!loaded) throw data;
            const state = hooks(this).useBindX({ items: loaded });
            rc.state = state;
            return h('span', null, `items=${state.items.join(',')}`);
        };
        rc.view = mount(this, h(React.Suspense, { fallback: h('i', null, 'Loading') }, h(Component)));
        assert.strictEqual(rc.view.text(), 'Loading');
        await actAsync(this, async () => { resolveData(['a', 'b']); await flush(); });
        setCheck(this, 'should work correctly', () => assert.strictEqual(rc.view.text(), 'items=a,b'));
    } else if (rc.kind === 'concurrent') {
        const Reader = ({ state, id }) => h('b', { id }, String(state.count));
        const Parent = () => {
            const state = hooks(this).useBindX({ count: 0 });
            rc.state = state;
            return h('div', null, h(Reader, { state, id: 'r1' }), h(Reader, { state, id: 'r2' }), h(Reader, { state, id: 'r3' }));
        };
        rc.view = mount(this, h(Parent));
        const readAll = () => ['r1', 'r2', 'r3'].map(id => rc.view.container.querySelector(`#${id}`).textContent);
        setCheck(this, 'should work correctly', async () => {
            assert.deepStrictEqual(readAll(), ['0', '0', '0']);
            await actAsync(this, () => React.startTransition(() => { rc.state.count = 1; }));
            assert.deepStrictEqual(readAll(), ['1', '1', '1']);
        });
        rc.readAll = readAll;
    } else {
        throw new Error(`no setup for kind ${rc.kind}`);
    }
});

Then(re('effects should handle double-invocation'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.effectRuns, 2, 'StrictMode should mount, unmount and remount effects in development');
    act(this, () => { rc.state.count = 1; });
    assert.deepStrictEqual(rc.log, [1], 'the first watcher must be gone, so the change is seen once');
    assert.strictEqual(rc.view.text(), 'count=1');
});

Then(re('cleanup should work correctly'), function() {
    const rc = rx(this);
    rc.view.unmount();
    rc.state.count = 2;
    assert.deepStrictEqual(rc.log, [1]);
});

Given(re('StrictMode enabled'), function() {
    rx(this).kind = 'strict-init';
});

When(re('useBindX initializes state'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.inits = 0;
    rc.committed = [];
    const Component = () => {
        const state = hooks(this).useBindX(() => { rc.inits++; return { count: 0 }; });
        React.useEffect(() => { rc.committed.push(state); });
        rc.state = state;
        return h('span', null, `count=${state.count}`);
    };
    rc.view = mount(this, h(React.StrictMode, null, h(Component)));
    act(this, () => { rc.state.count = 1; });
});

Then(re('state should not duplicate'), function() {
    const rc = rx(this);
    assert.ok(rc.committed.length >= 2);
    assert.ok(rc.committed.every(s => s === rc.committed[0]), 'every committed render should see one state object');
    assert.strictEqual(rc.view.text(), 'count=1');
});

Then(re('only one instance should exist'), function() {
    const rc = rx(this);
    assert.strictEqual(new Set(rc.committed).size, 1);
    assert.strictEqual(rc.committed[0].count, 1);
});

// ---------------------------------------------------------------- Other React hooks

Given(re('component with both hooks'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX({ a: 0 });
        const [b, setB] = React.useState(0);
        rc.state = state;
        rc.setB = setB;
        return h('span', null, `a=${state.a} b=${b}`);
    };
    rc.view = mount(this, h(Component));
});

When(re('either state changes'), function() {
    const rc = rx(this);
    rc.steps = [];
    let before = rc.renders;
    act(this, () => { rc.state.a = 1; });
    rc.steps.push({ text: rc.view.text(), renders: rc.renders - before });
    before = rc.renders;
    act(this, () => rc.setB(5));
    rc.steps.push({ text: rc.view.text(), renders: rc.renders - before });
});

Then(re('both should work independently'), function() {
    const rc = rx(this);
    assert.deepStrictEqual(rc.steps.map(s => s.text), ['a=1 b=0', 'a=1 b=5']);
    assert.strictEqual(rc.state.a, 1);
});

Then(re('re-renders should be correct'), function() {
    assert.deepStrictEqual(rx(this).steps.map(s => s.renders), [1, 1]);
});

Given(re('useBindX state'), function() {
    rx(this).initial = { query: 'a', unrelated: 0 };
});

When(re('used in useEffect dependency array'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.effects = [];
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        React.useEffect(() => { rc.effects.push(state.query); }, [state.query]);
        rc.state = state;
        return h('span', null, `${state.query} ${state.unrelated}`);
    };
    rc.view = mount(this, h(Component));
});

Then(re('effect should run on state changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.query = 'b'; });
    assert.deepStrictEqual(rc.effects, ['a', 'b']);
});

Then(re('dependencies should be tracked correctly'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.unrelated = 1; });
    assert.strictEqual(rc.view.text(), 'b 1');
    assert.deepStrictEqual(rc.effects, ['a', 'b'], 'a change outside the dependency array should not rerun the effect');
});

Given(re('expensive computation using bindX state'), function() {
    const rc = rx(this);
    rc.calls = 0;
    rc.expensive = (n) => { rc.calls++; return n * n; };
});

When(re('wrapped in useMemo'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    const Component = () => {
        const state = hooks(this).useBindX({ n: 2, other: 0 });
        const squared = React.useMemo(() => rc.expensive(state.n), [state.n]);
        rc.state = state;
        return h('span', null, `${squared} ${state.other}`);
    };
    rc.view = mount(this, h(Component));
});

Then(re('computation should memoize correctly'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.other = 1; });
    assert.strictEqual(rc.view.text(), '4 1');
    assert.strictEqual(rc.calls, 1);
});

Then(re('only recompute when state changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.n = 3; });
    assert.strictEqual(rc.view.text(), '9 1');
    assert.strictEqual(rc.calls, 2);
});

Given(re('function using bindX state'), function() {
    rx(this).callbacks = [];
});

When(re('wrapped in useCallback'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    const Component = () => {
        const state = hooks(this).useBindX({ n: 1, other: 0 });
        const read = React.useCallback(() => state.n, [state.n]);
        rc.callbacks.push(read);
        rc.state = state;
        return h('span', null, `${state.n} ${state.other}`);
    };
    rc.view = mount(this, h(Component));
});

Then(re('function should memoize correctly'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.other = 1; });
    assert.strictEqual(rc.callbacks.length, 2);
    assert.strictEqual(rc.callbacks[1], rc.callbacks[0]);
});

Then(re('only recreate when state changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.n = 2; });
    assert.strictEqual(rc.callbacks.length, 3);
    assert.notStrictEqual(rc.callbacks[2], rc.callbacks[1]);
    assert.strictEqual(rc.callbacks[2](), 2);
});

Given(re('component with both useBindX and useRef'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX({ count: 0 });
        const ref = React.useRef(0);
        rc.state = state;
        rc.ref = ref;
        return h('span', null, `count=${state.count} ref=${ref.current}`);
    };
    rc.view = mount(this, h(Component));
});

When(re('either changes'), function() {
    const rc = rx(this);
    const before = rc.renders;
    rc.ref.current += 1;
    assert.strictEqual(rc.renders, before, 'writing a ref should not re-render');
    act(this, () => { rc.state.count = 1; });
    setCheck(this, 'no conflicts should occur', () => {
        assert.notStrictEqual(rc.state, rc.ref);
        assert.strictEqual(rc.ref.current, 1, 're-rendering should keep the ref value');
    });
});

Then(re('both should work correctly'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.state.count, 1);
    assert.strictEqual(rc.view.text(), 'count=1 ref=1');
});

Then(re('no conflicts should occur'), async function() {
    await runCheck(this, 'no conflicts should occur');
});

Given(re('context providing bindX state'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    const Ctx = React.createContext(null);
    rc.consumerStates = [];
    const Consumer = ({ id }) => {
        const state = React.useContext(Ctx);
        rc.consumerStates.push(state);
        return h('b', { id }, state.theme);
    };
    rc.App = () => {
        const state = hooks(this).useBindX({ theme: 'light' });
        rc.state = state;
        return h(Ctx.Provider, { value: state }, h(Consumer, { id: 'c1' }), h(Consumer, { id: 'c2' }));
    };
});

When(re('components consume context'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.App));
    setCheck(this, 'updates should propagate', () => {
        act(this, () => { rc.state.theme = 'dark'; });
        assert.strictEqual(rc.view.container.querySelector('#c1').textContent, 'dark');
        assert.strictEqual(rc.view.container.querySelector('#c2').textContent, 'dark');
    });
});

Then(re('state should be shared'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.consumerStates.length, 2);
    assert.ok(rc.consumerStates.every(s => s === rc.state));
    assert.strictEqual(rc.view.text(), 'lightlight');
});

Then(re('updates should propagate'), async function() {
    await runCheck(this, 'updates should propagate');
});

// ---------------------------------------------------------------- Custom hooks

Given(re('custom hook using useBindX'), function() {
    const rc = rx(this);
    rc.useTodos = () => {
        const state = hooks(this).useBindX({ items: [] });
        return { state, add: (text) => { state.items = [...state.items, text]; } };
    };
    rc.useShared = hooks(this).createGlobalStore({ n: 0 });
});

When(re('multiple components use the hook'), function() {
    const rc = rx(this);
    const { h } = react(this);
    rc.todos = {};
    rc.shared = {};
    const Todos = ({ id }) => {
        rc.todos[id] = rc.useTodos();
        return h('b', { id }, rc.todos[id].state.items.join(','));
    };
    const Shared = ({ id }) => {
        rc.shared[id] = rc.useShared();
        return h('b', { id }, String(rc.shared[id].n));
    };
    rc.view = mount(this, h('div', null, h(Todos, { id: 'A' }), h(Todos, { id: 'B' }), h(Shared, { id: 'C' }), h(Shared, { id: 'D' })));
});

Then(re('each should have independent state'), function() {
    const rc = rx(this);
    act(this, () => rc.todos.A.add('milk'));
    const q = (id) => rc.view.container.querySelector(`#${id}`).textContent;
    assert.strictEqual(q('A'), 'milk');
    assert.strictEqual(q('B'), '');
    assert.notStrictEqual(rc.todos.A.state, rc.todos.B.state);
});

Then(re('can share state if designed that way'), function() {
    const rc = rx(this);
    act(this, () => { rc.shared.C.n = 5; });
    const q = (id) => rc.view.container.querySelector(`#${id}`).textContent;
    assert.strictEqual(q('C'), '5');
    assert.strictEqual(q('D'), '5', 'a component reading the shared store should re-render');
});

Given(re('multiple custom hooks with useBindX'), function() {
    const rc = rx(this);
    const { useCounter, useToggle, useArray } = hooks(this);
    rc.useAll = () => ({ counter: useCounter(1), toggle: useToggle(false), list: useArray(['x']) });
});

When(re('used together in component'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Component = () => {
        const all = rc.useAll();
        rc.all = all;
        return h('span', null, `${all.counter.count()} ${all.toggle.isOpen()} ${all.list.items().join(',')}`);
    };
    rc.view = mount(this, h(Component));
    assert.strictEqual(rc.view.text(), '1 false x');
    setCheck(this, 'no conflicts should occur', () => {
        const { counter, toggle, list } = rc.all;
        assert.strictEqual(new Set([counter.state, toggle.state, list.state]).size, 3, 'each hook should own its state');
        act(this, () => counter.reset());
        assert.strictEqual(rc.view.text(), '1 true x,y');
    });
});

Then(re('all should work correctly'), function() {
    const rc = rx(this);
    act(this, () => rc.all.counter.increment());
    act(this, () => rc.all.toggle.toggle());
    act(this, () => rc.all.list.push('y'));
    assert.strictEqual(rc.view.text(), '2 true x,y');
    assert.strictEqual(rc.all.list.count(), 2);
});

Given(re('useCounter custom hook'), function() {
    rx(this).useCounter = hooks(this).useCounter;
});

When(re('component uses useCounter()'), function() {
    const rc = rx(this);
    const { h } = react(this);
    rc.counters = {};
    const Counter = ({ id }) => {
        const counter = rc.useCounter();
        rc.counters[id] = counter;
        return h('b', { id }, String(counter.count()));
    };
    rc.view = mount(this, h('div', null, h(Counter, { id: 'one' }), h(Counter, { id: 'two' })));
});

Then(re('counter functionality should work'), function() {
    const rc = rx(this);
    const c = rc.counters.one;
    act(this, () => { c.increment(); c.increment(); c.decrement(); });
    assert.strictEqual(c.count(), 1);
    assert.strictEqual(rc.view.container.querySelector('#one').textContent, '1');
    act(this, () => c.reset());
    assert.strictEqual(rc.view.container.querySelector('#one').textContent, '0');
});

Then(re('can be reused across components'), function() {
    const rc = rx(this);
    act(this, () => rc.counters.two.increment());
    assert.strictEqual(rc.view.container.querySelector('#two').textContent, '1');
    assert.strictEqual(rc.view.container.querySelector('#one').textContent, '0');
});

// ---------------------------------------------------------------- JSX

Given(re("useBindX state { message: 'Hello' }"), function() {
    rx(this).initial = { message: 'Hello' };
});

When(re('JSX renders {state.message}'), function() {
    const rc = rx(this);
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        rc.state = state;
        return react(this).h('span', null, state.message);
    };
    rc.view = mount(this, react(this).h(Component));
});

Then(re("in React, it should display 'Hello'"), function() {
    assert.strictEqual(rx(this).view.text(), 'Hello');
});

When(re('state.message changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.message = 'World'; });
});

Then(re('JSX should update'), function() {
    assert.strictEqual(rx(this).view.text(), 'World');
});

Given(re('useBindX state { isVisible: true }'), function() {
    rx(this).initial = { isVisible: true };
});

When(re('JSX uses {state.isVisible && <div>...</div>}'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        rc.state = state;
        return h('section', null, state.isVisible && h('div', { id: 'content' }, 'Visible content'));
    };
    rc.view = mount(this, h(Component));
});

Then(re('content should show/hide correctly'), function() {
    const rc = rx(this);
    const content = () => rc.view.container.querySelector('#content');
    assert.ok(content());
    act(this, () => { rc.state.isVisible = false; });
    assert.strictEqual(content(), null);
    act(this, () => { rc.state.isVisible = true; });
    assert.strictEqual(content().textContent, 'Visible content');
});

Given(re('useBindX state { items: [1, 2, 3] }'), function() {
    rx(this).initial = { items: [1, 2, 3] };
});

When(re('JSX uses {state.items.map(...)}'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Component = () => {
        const state = hooks(this).useBindX(rc.initial);
        rc.state = state;
        return h('ul', null, state.items.map(item => h('li', { key: item }, String(item))));
    };
    rc.view = mount(this, h(Component));
    rc.items = () => [...rc.view.container.querySelectorAll('li')].map(li => li.textContent);
});

Then(re('list should render correctly'), function() {
    assert.deepStrictEqual(rx(this).items(), ['1', '2', '3']);
});

When(re('items change'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.items.push(4); });
    rc.afterPush = rc.items();
    act(this, () => { rc.state.items = rc.state.items.filter(n => n !== 2); });
});

Then(re('list should update'), function() {
    const rc = rx(this);
    assert.deepStrictEqual(rc.afterPush, ['1', '2', '3', '4'], 'push should re-render the list');
    assert.deepStrictEqual(rc.items(), ['1', '3', '4']);
});

Given(re('bindX computed property'), function() {
    const rc = rx(this);
    rc.Component = () => {
        const state = hooks(this).useBindX({ prices: [5, 10] });
        const total = hooks(this).useComputed(() => state.prices.reduce((sum, p) => sum + p, 0));
        rc.state = state;
        rc.total = total;
        return react(this).h('span', null, `Total: ${total()}`);
    };
});

When(re('JSX renders {computed()}'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.Component));
});

Then(re('value should display correctly'), function() {
    assert.strictEqual(rx(this).view.text(), 'Total: 15');
});

Then(re('update when dependencies change'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.prices.push(20); });
    assert.strictEqual(rc.view.text(), 'Total: 35');
    act(this, () => { rc.state.prices = [1]; });
    assert.strictEqual(rc.view.text(), 'Total: 1');
});

// ---------------------------------------------------------------- Events and props

When(re('button onClick increments count'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX(rc.initial);
        rc.state = state;
        return h('button', { onClick: () => { state.count++; } }, `count=${state.count}`);
    };
    rc.view = mount(this, h(Component));
    rc.before = rc.renders;
    click(this, rc.view.container.querySelector('button'));
});

Then(re('state should update'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.state.count, 1);
    assert.strictEqual(rc.view.text(), 'count=1');
});

Given(re('event handler modifying bindX state'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.handlers = [];
    const Component = () => {
        const state = hooks(this).useBindX({ count: 0 });
        // Created once: with useState this would close over count=0 forever
        const increment = React.useCallback(() => { state.count = state.count + 1; }, []);
        rc.handlers.push(increment);
        rc.state = state;
        return h('button', { onClick: increment }, `count=${state.count}`);
    };
    rc.view = mount(this, h(Component));
});

When(re('event fires'), function() {
    const rc = rx(this);
    for (let i = 0; i < 3; i++) click(this, rc.view.container.querySelector('button'));
});

Then(re('state should update correctly'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.state.count, 3);
    assert.strictEqual(rc.view.text(), 'count=3');
});

Then(re('no stale closure issues'), function() {
    const rc = rx(this);
    assert.ok(rc.handlers.length >= 4);
    assert.ok(rc.handlers.every(fn => fn === rc.handlers[0]), 'the handler kept from the first render still sees the current count');
});

Given(re('parent with useBindX state'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Child = ({ state }) => {
        rc.childState = state;
        return h('button', { id: 'child', onClick: () => { state.count++; } }, `child=${state.count}`);
    };
    rc.Parent = () => {
        const state = hooks(this).useBindX({ count: 0 });
        rc.parentState = state;
        return h('div', null, h('b', { id: 'parent' }, `parent=${state.count}`), h(Child, { state }));
    };
});

function mountParent(world) {
    const rc = rx(world);
    rc.view = mount(world, react(world).h(rc.Parent));
    rc.q = (id) => rc.view.container.querySelector(`#${id}`).textContent;
}

When(re('passed as props to child'), function() {
    mountParent(this);
});

When(re('passed to child component'), function() {
    mountParent(this);
});

Then(re('child should receive state'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.childState, rc.parentState);
    assert.strictEqual(rc.q('child'), 'child=0');
});

Then(re('child should receive the state'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.childState, rc.parentState);
    assert.strictEqual(rc.q('child'), 'child=0');
});

Then(re('changes should propagate'), function() {
    const rc = rx(this);
    act(this, () => { rc.parentState.count = 2; });
    assert.strictEqual(rc.q('child'), 'child=2');
});

Then(re('changes in child reflect in parent'), function() {
    const rc = rx(this);
    click(this, rc.view.container.querySelector('#child'));
    assert.strictEqual(rc.parentState.count, 1);
    assert.strictEqual(rc.q('parent'), 'parent=1');
});

Given(re('component receiving bindX state as prop'), function() {
    const rc = rx(this);
    const { h } = react(this);
    rc.Child = ({ count, label }) => h('span', null, `${label}:${count}`);
});

When(re('destructuring in function signature'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Parent = () => {
        const state = hooks(this).useBindX({ count: 0, label: 'a' });
        rc.state = state;
        return h(rc.Child, { ...state });
    };
    rc.view = mount(this, h(Parent));
    assert.strictEqual(rc.view.text(), 'a:0');
    setCheck(this, 'updates should propagate', () => {
        act(this, () => { rc.state.label = 'b'; });
        assert.strictEqual(rc.view.text(), 'b:3');
    });
});

Then(re('reactivity should work'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.count = 3; });
    assert.strictEqual(rc.view.text(), 'a:3');
});

Given(re('bindX state in parent'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Child = ({ source }) => {
        const copy = hooks(this).useBindX(() => JSON.parse(JSON.stringify(source)));
        rc.copy = copy;
        return h('b', { id: 'copy' }, copy.user.name);
    };
    rc.Parent = ({ withChild }) => {
        const state = hooks(this).useBindX({ user: { name: 'Ada', tags: ['x'] } });
        rc.state = state;
        return h('div', null, h('b', { id: 'orig' }, state.user.name), withChild ? h(Child, { source: state }) : null);
    };
});

When(re('child needs isolated copy'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.Parent, { withChild: true }));
    rc.q = (id) => rc.view.container.querySelector(`#${id}`).textContent;
});

Then(re('can clone state'), function() {
    const rc = rx(this);
    assert.notStrictEqual(rc.copy, rc.state);
    assert.notStrictEqual(rc.copy.user, rc.state.user);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(rc.copy)), JSON.parse(JSON.stringify(rc.state)));
});

Then(re("changes don't affect original"), function() {
    const rc = rx(this);
    act(this, () => { rc.copy.user.name = 'Grace'; rc.copy.user.tags.push('y'); });
    assert.strictEqual(rc.q('copy'), 'Grace');
    assert.strictEqual(rc.q('orig'), 'Ada');
    assert.deepStrictEqual([...rc.state.user.tags], ['x']);
});

// ---------------------------------------------------------------- Context (createBindXContext)

function contextApp(world) {
    const rc = rx(world);
    const { h } = react(world);
    const ctx = hooks(world).createBindXContext();
    rc.consumerRenders = { c1: 0, c2: 0 };
    const Consumer = ({ id }) => {
        rc.consumerRenders[id]++;
        const state = ctx.useContext();
        rc.consumers = rc.consumers || {};
        rc.consumers[id] = state;
        return h('button', { id, onClick: () => { state.user = `set by ${id}`; } }, state.user);
    };
    rc.App = () => {
        const state = hooks(world).useBindX({ user: 'Ada' });
        rc.state = state;
        return h(ctx.Provider, { value: state }, h(Consumer, { id: 'c1' }), h(Consumer, { id: 'c2' }));
    };
    rc.q = (id) => rc.view.container.querySelector(`#${id}`).textContent;
}

Given(re('bindX state in context provider'), function() {
    contextApp(this);
});

When(re('components use useContext'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.App));
});

Then(re('components should access state'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.consumers.c1, rc.state);
    assert.strictEqual(rc.consumers.c2, rc.state);
    assert.strictEqual(rc.q('c1'), 'Ada');
});

Then(re('updates should sync across consumers'), function() {
    const rc = rx(this);
    click(this, rc.view.container.querySelector('#c1'));
    assert.strictEqual(rc.q('c1'), 'set by c1');
    assert.strictEqual(rc.q('c2'), 'set by c1');
});

Given(re('multiple context providers'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const { createBindXContext, useBindX } = hooks(this);
    const theme = createBindXContext();
    const user = createBindXContext();
    const ThemeReader = () => { rc.themeSeen = theme.useContext(); return h('b', { id: 't' }, rc.themeSeen.value); };
    const UserReader = () => { rc.userSeen = user.useContext(); return h('b', { id: 'u' }, rc.userSeen.value); };
    rc.App = () => {
        const themeState = useBindX({ value: 'light' });
        const userState = useBindX({ value: 'Ada' });
        rc.themeState = themeState;
        rc.userState = userState;
        return h(theme.Provider, { value: themeState }, h(user.Provider, { value: userState }, h(ThemeReader), h(UserReader)));
    };
    rc.outside = () => { theme.useContext(); return null; };
});

When(re('components consume different contexts'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.App));
    rc.q = (id) => rc.view.container.querySelector(`#${id}`).textContent;
    setCheck(this, 'no conflicts should occur', () => {
        assert.notStrictEqual(rc.themeSeen, rc.userSeen);
        const errors = captureErrors(this);
        assert.throws(() => mount(this, react(this).h(rc.outside)), /must be used within a Provider/);
        errors.length = 0;
    });
});

Then(re('each context should work independently'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.q('t'), 'light');
    assert.strictEqual(rc.q('u'), 'Ada');
    act(this, () => { rc.themeState.value = 'dark'; });
    assert.strictEqual(rc.q('t'), 'dark');
    assert.strictEqual(rc.q('u'), 'Ada');
});

Given(re('bindX state in context'), function() {
    contextApp(this);
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.App));
});

When(re('any consumer updates state'), function() {
    const rc = rx(this);
    rc.rendersBefore = { ...rc.consumerRenders };
    click(this, rc.view.container.querySelector('#c2'));
});

Then(re('all consumers should see update'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.q('c1'), 'set by c2');
    assert.strictEqual(rc.q('c2'), 'set by c2');
    assert.strictEqual(rc.state.user, 'set by c2');
});

Then(re('re-render appropriately'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.consumerRenders.c1 - rc.rendersBefore.c1, 1);
    assert.strictEqual(rc.consumerRenders.c2 - rc.rendersBefore.c2, 1);
});

function captureErrors(world) {
    const rc = rx(world);
    if (!rc.errors) {
        rc.errors = [];
        const original = console.error;
        console.error = (...args) => rc.errors.push(args);
        world.ad.cleanups.push(() => { console.error = original; });
    }
    return rc.errors;
}

// ---------------------------------------------------------------- TypeScript

Given(re('TypeScript interface for state'), function() {
    rx(this).tsHeader = 'interface State { count: number; name: string }\n';
});

When(re('using useBindX<State>(...)'), function() {
    rx(this).tsBody = "export function C() { const s = useBindX<State>({ count: 0, name: 'Ada' });";
});

Then(re('TypeScript should enforce types'), function() {
    const rc = rx(this);
    assertCompiles(`${rc.tsHeader}${rc.tsBody} s.count = 1; s.name = 'Grace'; return s; }`);
    assertTypeError(`${rc.tsHeader}${rc.tsBody} s.count = 'one'; return s; }`);
    assertTypeError(`${rc.tsHeader}export function D() { return useBindX<State>({ count: 'zero', name: 'Ada' }); }`);
});

Then(re('IDE autocomplete should work'), function() {
    const rc = rx(this);
    const names = completionsAfter(`${rc.tsHeader}export function C() { const s = useBindX<State>({ count: 0, name: 'Ada' }); s.`);
    assert.ok(names.includes('count') && names.includes('name'), `completions were ${names.join(',')}`);
});

Given(re('typed bindX state'), function() {
    rx(this).tsBody = "interface State { count: number; label: string }\nexport function C() { const s = useBindX<State>({ count: 0, label: 'a' });";
});

When(re('creating computed properties'), function() {
    const rc = rx(this);
    rc.tsGood = `${rc.tsBody} const doubled = useComputed(() => s.count * 2); const n: number = doubled(); return n; }`;
    rc.tsBad = `${rc.tsBody} const doubled = useComputed(() => s.count * 2); const t: string = doubled(); return t; }`;
});

Then(re('return types should be inferred'), function() {
    assertTypeError(rx(this).tsBad);
});

When(re('creating watchers'), function() {
    const rc = rx(this);
    rc.tsGood = `${rc.tsBody} useWatch(() => s.count, (next, prev) => { const d: number = next - prev; return d; }); return s; }`;
    rc.tsBad = `${rc.tsBody} useWatch(() => s.count, (next: string) => next.length); return s; }`;
});

Then(re('callback types should be correct'), function() {
    assertTypeError(rx(this).tsBad, [2322, 2345]);
});

Then(re('TypeScript should validate'), function() {
    assertCompiles(rx(this).tsGood);
});

Given(re('generic component<T>'), function() {
    rx(this).tsGeneric = 'export function useList<T extends object>(initial: T) { const s = useBindX(initial); return s; }\n';
});

When(re('using useBindX'), function() {
    rx(this).tsUse = "const list = useList({ items: ['a'], total: 1 });";
});

Then(re('types should be inferred'), function() {
    const rc = rx(this);
    assertCompiles(`${rc.tsGeneric}export function C() { ${rc.tsUse} const n: number = list.total; const first: string = list.items[0]; return [n, first]; }`);
});

Then(re('type safety maintained'), function() {
    const rc = rx(this);
    assertTypeError(`${rc.tsGeneric}export function C() { ${rc.tsUse} const wrong: string = list.total; return wrong; }`);
    assertTypeError(`${rc.tsGeneric}export function C() { ${rc.tsUse} list.total = 'x'; }`);
});

// ---------------------------------------------------------------- Rendering efficiency

Given(re('component with many reactive properties'), function() {
    const rc = rx(this);
    const initial = {};
    for (let i = 0; i < 50; i++) initial[`p${i}`] = 0;
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX(initial);
        rc.state = state;
        return react(this).h('span', null, Object.keys(initial).map(k => state[k]).join(','));
    };
    rc.view = mount(this, react(this).h(Component));
});

When(re('properties update frequently'), function() {
    const rc = rx(this);
    rc.before = rc.renders;
    act(this, () => {
        for (let round = 1; round <= 10; round++) {
            for (let i = 0; i < 50; i++) rc.state[`p${i}`] = round;
        }
    });
});

Then(re('re-renders should be efficient'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.renders - rc.before, 1, '500 writes in one event should render once');
});

Then(re('UI should stay responsive'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.view.text(), new Array(50).fill('10').join(','));
    act(this, () => { rc.state.p0 = 99; });
    assert.ok(rc.view.text().startsWith('99,'), 'a later single update should still apply right away');
});

Given(re('parent and child components'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.childRenders = { memo: 0, affected: 0 };
    const Static = React.memo(({ title }) => { rc.childRenders.memo++; return h('i', null, title); });
    const Affected = ({ count }) => { rc.childRenders.affected++; return h('b', null, String(count)); };
    const Parent = () => {
        const state = hooks(this).useBindX({ count: 0 });
        rc.state = state;
        return h('div', null, h(Static, { title: 'static' }), h(Affected, { count: state.count }));
    };
    rc.view = mount(this, h(Parent));
});

When(re('parent state changes'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.count = 1; });
    act(this, () => { rc.state.count = 2; });
});

Then(re('only affected components re-render'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.childRenders.affected, 3);
    assert.strictEqual(rc.view.text(), 'static2');
});

Then(re('memoization works correctly'), function() {
    assert.strictEqual(rx(this).childRenders.memo, 1, 'React.memo child with unchanged props should not re-render');
});

Given(re('multiple useBindX property changes'), function() {
    const rc = rx(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX({ a: 0, b: 0, c: 0 });
        rc.state = state;
        return react(this).h('span', null, `${state.a}${state.b}${state.c}`);
    };
    rc.view = mount(this, react(this).h(Component));
});

When(re('changes occur in same tick'), async function() {
    const rc = rx(this);
    rc.before = rc.renders;
    await actAsync(this, async () => {
        rc.state.a = 1;
        rc.state.b = 2;
        rc.state.c = 3;
    });
    rc.afterSync = rc.renders;
    await actAsync(this, async () => {
        setTimeout(() => { rc.state.a = 4; rc.state.b = 5; rc.state.c = 6; }, 0);
        await flush(5);
    });
});

Then(re('only one re-render occurs'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.afterSync - rc.before, 1);
    assert.strictEqual(rc.renders - rc.afterSync, 1, 'writes inside a timer should batch too');
});

Then(re('React batching works'), function() {
    assert.strictEqual(rx(this).view.text(), '456');
});

Given(re('expensive initial state computation'), function() {
    const rc = rx(this);
    rc.inits = 0;
    rc.expensiveInit = () => { rc.inits++; return { rows: Array.from({ length: 1000 }, (_, i) => i), page: 0 }; };
});

When(re('using useBindX(() => expensiveInit())'), function() {
    const rc = rx(this);
    const Component = () => {
        rc.renders++;
        const state = hooks(this).useBindX(() => rc.expensiveInit());
        rc.state = state;
        return react(this).h('span', null, `page ${state.page} of ${state.rows.length}`);
    };
    rc.view = mount(this, react(this).h(Component));
    for (let p = 1; p <= 3; p++) act(this, () => { rc.state.page = p; });
});

Then(re('computation should only run once'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.inits, 1);
    assert.strictEqual(rc.view.text(), 'page 3 of 1000');
});

Then(re('not on every render'), function() {
    const rc = rx(this);
    assert.ok(rc.renders >= 4);
    assert.strictEqual(rc.inits, 1);
});

// ---------------------------------------------------------------- React 18+ features

Given(re('component wrapped in Suspense'), function() {
    rx(this).kind = 'suspense';
});

Then(re('should work correctly'), async function() {
    await runCheck(this, 'should work correctly');
});

Then(re('async rendering works'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.items.push('c'); });
    assert.strictEqual(rc.view.text(), 'items=a,b,c');
});

Given(re('state update wrapped in startTransition'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.seen = [];
    const Component = () => {
        const [isPending, startTransition] = React.useTransition();
        const state = hooks(this).useBindX({ filter: '', clicks: 0 });
        rc.state = state;
        rc.startTransition = startTransition;
        rc.seen.push({ isPending, filter: state.filter });
        return h('span', null, `${state.filter}|${state.clicks}`);
    };
    rc.view = mount(this, h(Component));
});

When(re('non-urgent update occurs'), async function() {
    const rc = rx(this);
    rc.seen.length = 0;
    await actAsync(this, async () => {
        rc.startTransition(() => { rc.state.filter = 'react'; });
    });
});

Then(re('update should be deferred'), function() {
    const rc = rx(this);
    assert.ok(rc.seen.some(s => s.isPending), 'the transition should first render as pending');
    assert.deepStrictEqual(rc.seen[rc.seen.length - 1], { isPending: false, filter: 'react' });
});

Then(re('UI should remain responsive'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.clicks++; });
    assert.strictEqual(rc.view.text(), 'react|1');
});

Given(re('bindX state used with useDeferredValue'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.seen = [];
    const Component = () => {
        const state = hooks(this).useBindX({ query: '' });
        const deferred = React.useDeferredValue(state.query);
        rc.state = state;
        rc.seen.push({ query: state.query, deferred });
        return h('span', null, deferred);
    };
    rc.view = mount(this, h(Component));
});

When(re('state updates rapidly'), async function() {
    const rc = rx(this);
    rc.seen.length = 0;
    await actAsync(this, async () => {
        rc.state.query = 'r';
        rc.state.query = 're';
        rc.state.query = 'rea';
    });
});

Then(re('deferred value should lag appropriately'), function() {
    const rc = rx(this);
    assert.ok(rc.seen.some(s => s.deferred !== s.query), 'an urgent render should show the old deferred value');
    assert.strictEqual(rc.view.text(), 'rea');
});

Then(re('performance should improve'), function() {
    const rc = rx(this);
    const deferredValues = new Set(rc.seen.map(s => s.deferred));
    assert.ok(!deferredValues.has('r') && !deferredValues.has('re'), 'intermediate values should never be rendered as deferred');
});

Given(re('React 18 concurrent features'), function() {
    const React = require('react');
    assert.strictEqual(typeof React.startTransition, 'function');
    assert.strictEqual(typeof require('react-dom/client').createRoot, 'function');
    rx(this).kind = 'concurrent';
});

Then(re('no tearing should occur'), async function() {
    const rc = rx(this);
    const { React } = react(this);
    for (let i = 2; i <= 5; i++) {
        await actAsync(this, () => React.startTransition(() => { rc.state.count = i; }));
        const values = rc.readAll();
        assert.ok(values.every(v => v === values[0]), `readers disagreed: ${values}`);
    }
    assert.deepStrictEqual(rc.readAll(), ['5', '5', '5']);
});

// ---------------------------------------------------------------- SSR (react-dom/server)

function ssrCounter(world) {
    const rc = rx(world);
    return ({ start }) => {
        const state = hooks(world).useBindX({ count: start });
        hooks(world).useWatch(() => state.count, () => {});
        rc.state = state;
        (rc.ssrStates = rc.ssrStates || []).push(state);
        return react(world).h('span', null, `count=${state.count}`);
    };
}

Given(re('SSR-rendered component'), function() {
    const rc = rx(this);
    const { renderToString } = require('react-dom/server');
    rc.Counter = ssrCounter(this);
    rc.html = renderToString(react(this).h(rc.Counter, { start: 5 }));
    assert.ok(rc.html.includes('count=5'));
});

When(re('hydration occurs on client'), function() {
    const rc = rx(this);
    const { client, h } = react(this);
    const errors = captureErrors(this);
    errors.length = 0;
    rc.recoverable = [];
    const container = document.createElement('div');
    container.innerHTML = rc.html;
    document.body.appendChild(container);
    act(this, () => {
        rc.root = client.hydrateRoot(container, h(rc.Counter, { start: 5 }), {
            onRecoverableError: (error) => rc.recoverable.push(error)
        });
    });
    rc.view = { container, text: () => container.textContent };
    this.ad.cleanups.push(() => act(this, () => rc.root.unmount()));
});

Then(re('state should restore correctly'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.view.text(), 'count=5');
    act(this, () => { rc.state.count = 6; });
    assert.strictEqual(rc.view.text(), 'count=6');
});

Then(re('no hydration errors'), function() {
    const rc = rx(this);
    assert.deepStrictEqual(rc.recoverable, []);
    const hydrationErrors = (rc.errors || []).filter(args => /hydrat/i.test(args.map(String).join(' ')));
    assert.deepStrictEqual(hydrationErrors, []);
});

Given(re('SSR environment'), function() {
    const rc = rx(this);
    rc.renderToString = require('react-dom/server').renderToString;
    rc.Counter = ssrCounter(this);
});

When(re('components with useBindX render'), function() {
    const rc = rx(this);
    rc.pages = [1, 2, 3].map(n => {
        const html = rc.renderToString(react(this).h(rc.Counter, { start: n }));
        rc.state.count += 100; // a request mutating its own state after render
        return html;
    });
});

Then(re('watchers should cleanup'), function() {
    assert.strictEqual(this.ad.activeWatchers, 0, 'server rendering runs no effects, so no watcher may stay registered');
});

Then(re('no memory leaks between requests'), function() {
    const rc = rx(this);
    assert.deepStrictEqual(rc.pages.map(html => html.replace(/<!-- -->/g, '')), ['<span>count=1</span>', '<span>count=2</span>', '<span>count=3</span>']);
    assert.strictEqual(new Set(rc.ssrStates).size, rc.ssrStates.length, 'each request should get its own state');
});

// ---------------------------------------------------------------- Class components

function classCounter(world) {
    const rc = rx(world);
    const { React, h } = react(world);
    return class ClassCounter extends React.Component {
        componentDidMount() {
            this.store = bindX.reactive({ count: 0 });
            this.unwatch = bindX.watch(() => this.store.count, () => this.forceUpdate());
            rc.classInstance = this;
            this.forceUpdate();
        }
        componentWillUnmount() {
            this.unwatch();
            rc.classUnmounted = true;
        }
        render() {
            return h('span', null, `count=${this.store ? this.store.count : 0}`);
        }
    };
}

Given(re('class component'), function() {
    rx(this).ClassCounter = classCounter(this);
});

When(re('using bindX in componentDidMount'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.ClassCounter));
});

Then(re('state should work'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.view.text(), 'count=0');
    act(this, () => { rc.classInstance.store.count = 2; });
    assert.strictEqual(rc.view.text(), 'count=2');
    assert.strictEqual(this.ad.activeWatchers, 1);
});

Then(re('cleanup in componentWillUnmount'), function() {
    const rc = rx(this);
    rc.view.unmount();
    assert.strictEqual(rc.classUnmounted, true);
    assert.strictEqual(this.ad.activeWatchers, 0);
});

Given(re('class component using bindX'), function() {
    rx(this).ClassCounter = classCounter(this);
});

When(re('converting to function component'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const FunctionCounter = () => {
        const state = hooks(this).useBindX({ count: 0 });
        rc.fnState = state;
        return h('span', null, `count=${state.count}`);
    };
    rc.classView = mount(this, h(rc.ClassCounter));
    rc.fnView = mount(this, h(FunctionCounter));
    rc.steps = [
        () => { rc.classInstance.store.count = 1; rc.fnState.count = 1; },
        () => { rc.classInstance.store.count += 5; rc.fnState.count += 5; },
        () => { rc.classInstance.store.count = 0; rc.fnState.count = 0; }
    ];
    setCheck(this, 'migration should be straightforward', () => {
        for (const step of rc.steps) {
            act(this, step);
            assert.strictEqual(rc.fnView.text(), rc.classView.text());
        }
    });
});

Then(re('useBindX should be equivalent'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.fnView.text(), rc.classView.text());
    assert.strictEqual(rc.fnView.text(), 'count=0');
});

Then(re('migration should be straightforward'), async function() {
    await runCheck(this, 'migration should be straightforward');
});

// ---------------------------------------------------------------- Errors

Given(re('computed that throws error'), function() {
    const rc = rx(this);
    const { h } = react(this);
    rc.Broken = () => {
        const state = hooks(this).useBindX({ bad: false });
        const value = hooks(this).useComputed(() => {
            if (state.bad) throw new Error('computed failed');
            return 'ok';
        });
        rc.state = state;
        return h('span', null, value());
    };
});

When(re('accessed in render'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Boundary = errorBoundary(this);
    rc.view = mount(this, h('div', null, h(Boundary, null, h(rc.Broken)), h('em', null, 'sibling ok')));
    assert.strictEqual(rc.view.text(), 'oksibling ok');
    captureErrors(this);
    act(this, () => { rc.state.bad = true; });
    setCheck(this, 'error boundary should catch', () => {
        assert.strictEqual(rc.caughtByBoundary && rc.caughtByBoundary.message, 'computed failed');
        assert.ok(rc.view.container.querySelector('.fallback'));
    });
});

Then(re('error boundary should catch'), async function() {
    await runCheck(this, 'error boundary should catch');
});

Then(re('component should not crash'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.view.text(), 'Something went wrong: computed failedsibling ok');
});

Given(re('watcher callback that throws'), function() {
    const rc = rx(this);
    const Component = () => {
        const state = hooks(this).useBindX({ count: 0 });
        hooks(this).useWatch(() => state.count, () => { throw new Error('watcher failed'); });
        rc.state = state;
        return react(this).h('span', null, `count=${state.count}`);
    };
    rc.view = mount(this, react(this).h(Component));
});

When(re('watcher executes'), function() {
    const rc = rx(this);
    const errors = captureErrors(this);
    act(this, () => {
        try {
            rc.state.count = 1;
        } catch (error) {
            rc.thrown = error;
        }
    });
    setCheck(this, 'error should be caught', () => {
        assert.strictEqual(rc.thrown, undefined, 'the write should not throw the watcher error');
        assert.ok(errors.some(args => args.some(a => a instanceof Error && a.message === 'watcher failed')),
            'the watcher error should be reported with console.error');
    });
});

Then(re('error should be caught'), async function() {
    await runCheck(this, 'error should be caught');
});

Then(re('component should remain stable'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.view.text(), 'count=1');
    act(this, () => { rc.state.count = 2; });
    assert.strictEqual(rc.view.text(), 'count=2');
});

Given(re('state update that throws'), function() {
    const rc = rx(this);
    const Component = () => {
        const state = hooks(this).useBindX(() => ({
            _count: 0,
            get count() { return this._count; },
            set count(value) {
                if (value < 0) throw new RangeError('count cannot be negative');
                this._count = value;
            }
        }));
        rc.state = state;
        return react(this).h('span', null, `count=${state.count}`);
    };
    rc.view = mount(this, react(this).h(Component));
});

When(re('update attempted'), function() {
    const rc = rx(this);
    act(this, () => {
        try {
            rc.state.count = -1;
        } catch (error) {
            rc.caught = error;
        }
    });
    setCheck(this, 'error should be caught', () => {
        assert.ok(rc.caught instanceof RangeError, 'the setter error should reach the code that wrote the value');
    });
});

Then(re('state should remain consistent'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.state.count, 0);
    assert.strictEqual(rc.view.text(), 'count=0');
    act(this, () => { rc.state.count = 3; });
    assert.strictEqual(rc.view.text(), 'count=3');
});

// ---------------------------------------------------------------- Testing with React Testing Library

function rtl(world) {
    const ad = world.ad;
    if (!ad.rtl) {
        ad.rtl = require('@testing-library/react');
        ad.cleanups.push(() => ad.rtl.cleanup());
    }
    return ad.rtl;
}

Given(re('test suite using React Testing Library'), function() {
    const lib = rtl(this);
    assert.strictEqual(typeof lib.render, 'function');
    assert.strictEqual(typeof lib.waitFor, 'function');
});

When(re('testing component with useBindX'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Counter = () => {
        const state = hooks(this).useBindX({ count: 0 });
        return h('div', null, h('p', null, `Count: ${state.count}`), h('button', { onClick: () => { state.count++; } }, '+'));
    };
    rc.screen = rtl(this).render(h(Counter));
});

Then(re('component should render'), function() {
    assert.ok(rx(this).screen.getByText('Count: 0'));
});

Then(re('state updates should work in tests'), function() {
    const rc = rx(this);
    rtl(this).fireEvent.click(rc.screen.getByRole('button', { name: '+' }));
    rtl(this).fireEvent.click(rc.screen.getByRole('button', { name: '+' }));
    assert.ok(rc.screen.getByText('Count: 2'));
});

Given(re('component depending on useBindX'), function() {
    const rc = rx(this);
    const { h } = react(this);
    rc.Greeting = ({ useStore = () => hooks(this).useBindX({ name: 'Real' }) }) => {
        const store = useStore();
        return h('p', null, `Hello ${store.name}`);
    };
});

When(re('providing mock state'), function() {
    const rc = rx(this);
    const useMock = () => {
        const state = hooks(this).useBindX({ name: 'Mock' });
        rc.mock = state;
        return state;
    };
    rc.screen = rtl(this).render(react(this).h(rc.Greeting, { useStore: useMock }));
});

Then(re('component should work with mock'), function() {
    assert.ok(rx(this).screen.getByText('Hello Mock'));
});

Then(re('can control state for testing'), function() {
    const rc = rx(this);
    rtl(this).act(() => { rc.mock.name = 'Controlled'; });
    assert.ok(rc.screen.getByText('Hello Controlled'));
});

Given(re('component with bindX computed'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Cart = () => {
        const state = hooks(this).useBindX({ items: [1, 2] });
        const total = hooks(this).useComputed(() => state.items.reduce((a, b) => a + b, 0));
        rc.state = state;
        rc.total = total;
        return h('p', null, `Total: ${total()}`);
    };
    rc.screen = rtl(this).render(h(Cart));
});

When(re('updating state in test'), function() {
    const rc = rx(this);
    rtl(this).act(() => { rc.state.items = [1, 2, 3]; });
});

Then(re('computed should update'), function() {
    assert.strictEqual(rx(this).total(), 6);
});

Then(re('can assert on computed values'), function() {
    assert.ok(rx(this).screen.getByText('Total: 6'));
});

Given(re('component with bindX watchers'), function() {
    const rc = rx(this);
    rc.sideEffects = [];
    const Search = () => {
        const state = hooks(this).useBindX({ q: '' });
        hooks(this).useWatch(() => state.q, (q) => rc.sideEffects.push(`search:${q}`));
        rc.state = state;
        return react(this).h('p', null, state.q);
    };
    rc.screen = rtl(this).render(react(this).h(Search));
});

When(re('triggering state changes in test'), function() {
    const rc = rx(this);
    rtl(this).act(() => { rc.state.q = 'a'; });
    rtl(this).act(() => { rc.state.q = 'ab'; });
});

Then(re('watchers should execute'), function() {
    assert.strictEqual(rx(this).sideEffects.length, 2);
});

Then(re('can assert on side effects'), function() {
    assert.deepStrictEqual(rx(this).sideEffects, ['search:a', 'search:ab']);
});

Given(re('component with async useBindX state'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const fetcher = () => new Promise(resolve => setTimeout(() => resolve(42), 10));
    rc.Data = () => {
        const job = hooks(this).useAsync(fetcher, { immediate: true });
        rc.job = job;
        if (job.loading()) return h('p', null, 'Loading...');
        return h('p', null, `Data: ${job.data()}`);
    };
});

When(re('testing async updates'), function() {
    const rc = rx(this);
    rc.screen = rtl(this).render(react(this).h(rc.Data));
});

Then(re('can use waitFor'), async function() {
    const rc = rx(this);
    assert.ok(rc.screen.getByText('Loading...'));
    await rtl(this).waitFor(() => rc.screen.getByText('Data: 42'));
});

Then(re('assertions should work'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.job.loading(), false);
    assert.strictEqual(rc.job.error(), null);
    assert.strictEqual(rc.job.data(), 42);
});

// ---------------------------------------------------------------- Patterns

Given(re('bindX state in module scope'), function() {
    rx(this).useStore = hooks(this).createGlobalStore({ count: 0 });
});

When(re('multiple components import'), function() {
    const rc = rx(this);
    const { h } = react(this);
    rc.stores = {};
    const Reader = ({ id }) => {
        rc.stores[id] = rc.useStore();
        return h('b', { id }, String(rc.stores[id].count));
    };
    rc.view = mount(this, h('div', null, h(Reader, { id: 'a' }), h(Reader, { id: 'b' }), h(Reader, { id: 'c' })));
});

Then(re('all share same state'), function() {
    const rc = rx(this);
    rc.stores.a.count = 3;
    assert.strictEqual(rc.stores.b.count, 3);
    assert.strictEqual(rc.stores.c.count, 3);
});

Then(re('updates sync across app'), function() {
    const rc = rx(this);
    act(this, () => { rc.stores.b.count = 7; });
    assert.strictEqual(rc.view.text(), '777');
});

Given(re('history tracking for bindX state'), function() {
    const rc = rx(this);
    rc.past = [];
    rc.future = [];
    const Editor = () => {
        const state = hooks(this).useBindX({ text: '' });
        hooks(this).useWatch(() => state.text, (next, prev) => {
            if (!rc.restoring) {
                rc.past.push(prev);
                rc.future.length = 0;
            }
        });
        rc.state = state;
        return react(this).h('span', null, state.text);
    };
    const restore = (from, to) => {
        to.push(rc.state.text);
        rc.restoring = true;
        act(this, () => { rc.state.text = from.pop(); });
        rc.restoring = false;
    };
    rc.undo = () => restore(rc.past, rc.future);
    rc.redo = () => restore(rc.future, rc.past);
    rc.view = mount(this, react(this).h(Editor));
});

When(re('user performs actions'), function() {
    const rc = rx(this);
    for (const text of ['a', 'ab', 'abc']) act(this, () => { rc.state.text = text; });
});

Then(re('can undo/redo'), function() {
    const rc = rx(this);
    rc.undo();
    rc.undo();
    assert.strictEqual(rc.state.text, 'a');
    rc.redo();
    assert.strictEqual(rc.state.text, 'ab');
});

Then(re('state restores correctly'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.view.text(), 'ab');
    assert.deepStrictEqual(rc.past, ['', 'a']);
    assert.deepStrictEqual(rc.future, ['abc']);
});

Given(re('bindX state with history'), function() {
    const rc = rx(this);
    rc.snapshots = [];
    rc.actions = [];
    const App = () => {
        const state = hooks(this).useBindX({ count: 0, user: 'Ada' });
        hooks(this).useWatch(() => state, (value) => rc.snapshots.push(JSON.stringify(value)), { deep: true, immediate: true });
        rc.state = state;
        return react(this).h('span', null, `${state.user}:${state.count}`);
    };
    rc.dispatch = (key, value) => {
        rc.actions.push([key, value]);
        act(this, () => { rc.state[key] = value; });
    };
    rc.view = mount(this, react(this).h(App));
});

When(re('debugging'), function() {
    const rc = rx(this);
    rc.dispatch('count', 1);
    rc.dispatch('user', 'Grace');
    rc.dispatch('count', 2);
});

Then(re('can inspect past states'), function() {
    const rc = rx(this);
    assert.deepStrictEqual(rc.snapshots.map(s => JSON.parse(s)), [
        { count: 0, user: 'Ada' },
        { count: 1, user: 'Ada' },
        { count: 1, user: 'Grace' },
        { count: 2, user: 'Grace' }
    ]);
});

Then(re('replay actions'), function() {
    const rc = rx(this);
    const start = JSON.parse(rc.snapshots[0]);
    act(this, () => Object.assign(rc.state, start));
    assert.strictEqual(rc.view.text(), 'Ada:0');
    for (const [key, value] of rc.actions) act(this, () => { rc.state[key] = value; });
    assert.strictEqual(rc.view.text(), 'Grace:2');
});

Given(re('async operation with bindX state'), function() {
    const rc = rx(this);
    const Likes = () => {
        const state = hooks(this).useBindX({ likes: 0 });
        rc.state = state;
        return react(this).h('span', null, `likes=${state.likes}`);
    };
    rc.api = () => new Promise((resolve, reject) => setTimeout(() => reject(new Error('server said no')), 5));
    rc.like = async () => {
        const previous = rc.state.likes;
        rc.state.likes = previous + 1;
        try {
            await rc.api();
        } catch (error) {
            rc.state.likes = previous;
        }
    };
    rc.view = mount(this, react(this).h(Likes));
});

When(re('updating optimistically'), function() {
    const rc = rx(this);
    act(this, () => { rc.pending = rc.like(); });
    rc.immediate = rc.view.text();
});

Then(re('UI updates immediately'), function() {
    assert.strictEqual(rx(this).immediate, 'likes=1');
});

Then(re('rolls back on error'), async function() {
    const rc = rx(this);
    await actAsync(this, () => rc.pending);
    assert.strictEqual(rc.view.text(), 'likes=0');
});

Given(re('component using useState'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.StateCounter = () => {
        const [count, setCount] = React.useState(0);
        return h('button', { onClick: () => setCount(c => c + 1) }, `count=${count}`);
    };
});

When(re('replacing with useBindX'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const BindXCounter = () => {
        const state = hooks(this).useBindX({ count: 0 });
        return h('button', { onClick: () => { state.count++; } }, `count=${state.count}`);
    };
    rc.before = mount(this, h(rc.StateCounter));
    rc.after = mount(this, h(BindXCounter));
    setCheck(this, 'migration should be straightforward', () => {
        // Same markup, same events, same results at every step
        assert.strictEqual(rc.after.container.innerHTML, rc.before.container.innerHTML);
    });
});

Then(re('functionality should be equivalent'), function() {
    const rc = rx(this);
    for (let i = 1; i <= 3; i++) {
        click(this, rc.before.container.querySelector('button'));
        click(this, rc.after.container.querySelector('button'));
        assert.strictEqual(rc.after.text(), `count=${i}`);
        assert.strictEqual(rc.after.text(), rc.before.text());
    }
});

// ---------------------------------------------------------------- Edge cases

Given(re('multiple React roots on page'), function() {
    const rc = rx(this);
    rc.rootStates = {};
    rc.Counter = ({ id }) => {
        const state = hooks(this).useBindX({ count: 0 });
        rc.rootStates[id] = state;
        return react(this).h('span', null, `count=${state.count}`);
    };
});

When(re('each uses useBindX'), function() {
    const rc = rx(this);
    rc.roots = { one: mount(this, react(this).h(rc.Counter, { id: 'one' })), two: mount(this, react(this).h(rc.Counter, { id: 'two' })) };
});

Then(re('should work independently'), function() {
    const rc = rx(this);
    act(this, () => { rc.rootStates.one.count = 5; });
    assert.strictEqual(rc.roots.one.text(), 'count=5');
    assert.strictEqual(rc.roots.two.text(), 'count=0');
});

Then(re('no conflicts'), function() {
    const rc = rx(this);
    rc.roots.one.unmount();
    act(this, () => { rc.rootStates.two.count = 2; });
    assert.strictEqual(rc.roots.two.text(), 'count=2');
});

Given(re('component using portals'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const { createPortal } = require('react-dom');
    rc.portalTarget = document.createElement('div');
    rc.portalTarget.id = 'portal-root';
    document.body.appendChild(rc.portalTarget);
    this.ad.cleanups.push(() => rc.portalTarget.remove());
    rc.Modal = () => {
        const state = hooks(this).useBindX({ open: false, message: 'Hello' });
        rc.state = state;
        return h('div', null, 'page', state.open ? createPortal(h('div', { id: 'modal' }, state.message), rc.portalTarget) : null);
    };
});

When(re('bindX state controls portal content'), function() {
    const rc = rx(this);
    rc.view = mount(this, react(this).h(rc.Modal));
    assert.strictEqual(rc.portalTarget.textContent, '');
    act(this, () => { rc.state.open = true; });
    setCheck(this, 'should work correctly', () => {
        assert.strictEqual(rc.portalTarget.querySelector('#modal').textContent, 'Hello');
        assert.strictEqual(rc.view.text(), 'page', 'portal content renders outside the component container');
    });
});

Then(re('reactivity maintained'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.message = 'Updated'; });
    assert.strictEqual(rc.portalTarget.textContent, 'Updated');
    act(this, () => { rc.state.open = false; });
    assert.strictEqual(rc.portalTarget.textContent, '');
});

Given(re('component wrapped in error boundary'), function() {
    const rc = rx(this);
    const { h } = react(this);
    const Boundary = errorBoundary(this);
    const Risky = () => {
        const state = hooks(this).useBindX({ count: 0 });
        rc.state = state;
        if (state.count > 3) throw new Error('count too high');
        return h('span', null, `count=${state.count}`);
    };
    const Other = () => {
        const state = hooks(this).useBindX({ n: 0 });
        rc.other = state;
        return h('em', { id: 'other' }, `other=${state.n}`);
    };
    rc.view = mount(this, h('div', null, h(Boundary, null, h(Risky)), h(Other)));
});

When(re('bindX state update causes error'), function() {
    const rc = rx(this);
    captureErrors(this);
    act(this, () => { rc.state.count = 4; });
    setCheck(this, 'error boundary should catch', () => {
        assert.strictEqual(rc.caughtByBoundary && rc.caughtByBoundary.message, 'count too high');
        assert.strictEqual(rc.view.container.querySelector('.fallback').textContent, 'Something went wrong: count too high');
    });
});

Then(re('app should remain stable'), function() {
    const rc = rx(this);
    act(this, () => { rc.other.n = 1; });
    assert.strictEqual(rc.view.container.querySelector('#other').textContent, 'other=1');
});

Given(re('lazy-loaded component with useBindX'), function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.inits = 0;
    const Counter = () => {
        const state = hooks(this).useBindX(() => { rc.inits++; return { count: 0 }; });
        rc.state = state;
        return h('span', null, `count=${state.count}`);
    };
    rc.Lazy = React.lazy(() => Promise.resolve({ default: Counter }));
});

When(re('component loads'), async function() {
    const rc = rx(this);
    const { React, h } = react(this);
    rc.view = mount(this, h(React.Suspense, { fallback: h('i', null, 'Loading') }, h(rc.Lazy)));
    await actAsync(this, () => flush());
    rc.loadedText = rc.view.text();
});

Then(re('useBindX should work'), function() {
    const rc = rx(this);
    act(this, () => { rc.state.count = 1; });
    assert.strictEqual(rc.view.text(), 'count=1');
});

Then(re('state should initialize correctly'), function() {
    const rc = rx(this);
    assert.strictEqual(rc.loadedText, 'count=0');
    assert.strictEqual(rc.inits, 1);
});

// ---------------------------------------------------------------- Bundle

function bundle(entryCode, minify = true) {
    const esbuild = require('esbuild');
    const result = esbuild.buildSync({
        stdin: { contents: entryCode, resolveDir: path.join(ROOT, 'src'), loader: 'ts' },
        bundle: true,
        write: false,
        format: 'esm',
        minify,
        treeShaking: true,
        // The file header's @license block would be kept at full size and swamp the code comparison
        legalComments: 'none',
        external: ['react', 'react-dom'],
        define: { 'process.env.NODE_ENV': '"production"' },
        logLevel: 'silent'
    });
    return result.outputFiles[0].text;
}

Given(re('production build'), function() {
    rx(this).full = bundle("export * from './bindx-react.ts';");
});

When(re('only using useBindX'), function() {
    rx(this).partial = bundle("export { useBindX } from './bindx-react.ts';");
});

Then(re('unused features should be removed'), function() {
    const rc = rx(this);
    // Strings that only the unused hooks contain survive minification
    const marker = 'useBindXContext must be used within a Provider';
    assert.ok(rc.full.includes(marker));
    assert.ok(!rc.partial.includes(marker), 'createBindXContext should be tree-shaken away');
    assert.ok(!/isSubmitting/.test(rc.partial), 'useForm should be tree-shaken away');
});

Then(re('bundle should be minimal'), function() {
    const rc = rx(this);
    assert.ok(rc.partial.length < rc.full.length / 2, 'a useBindX-only bundle should be well under half the full adapter');
});

Given(re('@genx/bindx-react in bundle'), function() {
    rx(this).full = bundle("export * from './bindx-react.ts';");
});

When(re('analyzing bundle size'), function() {
    const rc = rx(this);
    rc.gzipBytes = zlib.gzipSync(Buffer.from(rc.full)).length;
});

Then(re('should be <5KB gzipped'), function() {
    assert.ok(rx(this).gzipBytes < 5 * 1024, 'the adapter should stay under 5 KB gzipped');
});

Then(re('no duplicate dependencies'), function() {
    const rc = rx(this);
    const reactImports = rc.full.match(/from\s*"react"/g) || [];
    assert.strictEqual(reactImports.length, 1, 'react should be imported once, not bundled');
    assert.ok(!/__CLIENT_INTERNALS|ReactSharedInternals|react\.production/.test(rc.full), 'React itself must not be bundled');
});
