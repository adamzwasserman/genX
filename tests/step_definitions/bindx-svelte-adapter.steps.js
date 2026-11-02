/**
 * Step definitions for bindx-svelte-adapter.feature
 *
 * Runs the real adapter (src/bindx-svelte.ts) with Svelte 5 against a jsdom
 * document. The adapter and Svelte's browser runtime are bundled together, the
 * way an app bundler resolves them, and components are compiled from source with
 * svelte/compiler in legacy (non-runes) mode, the syntax the adapter documents:
 * $: statements, export let props, $store, bind:, slots. SSR scenarios use the
 * server runtime and svelte/server. Type scenarios run the TypeScript compiler.
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { setupAdapter, flush, adapterSteps, re } = require('../support/bindx-adapter-harness');

const { Given, When, Then } = adapterSteps('svelte');

const ROOT = path.resolve(__dirname, '../..');
const ADAPTER_SRC = path.join(ROOT, 'src', 'bindx-svelte.ts');
const OUT_DIR = path.join(ROOT, 'node_modules', '.cache', 'genx-bindx-adapters');
const TS_DIR = path.join(OUT_DIR, 'ts');
const ADAPTER_IMPORT = JSON.stringify(ADAPTER_SRC.replace(/\.ts$/, ''));

// ---------------------------------------------------------------- runtime

const runtimeFiles = {};

/** Bundle the adapter with Svelte's client (browser) or server runtime. */
function buildRuntime(kind) {
    if (runtimeFiles[kind]) return runtimeFiles[kind];
    const esbuild = require('esbuild');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outfile = path.join(OUT_DIR, `bindx-svelte-${kind}-runtime.cjs`);
    const client = kind === 'client';
    const entry = client ? `
export * as svelte from 'svelte';
export * as store from 'svelte/store';
export * as internal from 'svelte/internal/client';
export * as transition from 'svelte/transition';
export * as animate from 'svelte/animate';
export * as easing from 'svelte/easing';
export * as motion from 'svelte/motion';
export * as adapter from ${JSON.stringify(ADAPTER_SRC)};
import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/legacy';
` : `
export * as svelte from 'svelte';
export * as store from 'svelte/store';
export * as internal from 'svelte/internal/server';
export * as server from 'svelte/server';
export * as adapter from ${JSON.stringify(ADAPTER_SRC)};
`;
    esbuild.buildSync({
        stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
        outfile,
        bundle: true,
        platform: client ? 'browser' : 'node',
        conditions: client ? ['browser'] : [],
        format: 'cjs',
        target: 'es2022',
        logLevel: 'silent'
    });
    runtimeFiles[kind] = outfile;
    return outfile;
}

function loadRuntime(kind) {
    const file = buildRuntime(kind);
    delete require.cache[file];
    return require(file);
}

/** jsdom has no Web Animations API; Svelte transitions run on element.animate(). */
function installAnimations(ad) {
    const win = ad.dom.window;
    ad.animations = [];
    win.Element.prototype.animate = function(keyframes, options) {
        const duration = typeof options === 'number' ? options : (options && options.duration) || 0;
        const started = Date.now();
        const animation = {
            element: this,
            keyframes,
            duration,
            playState: 'running',
            onfinish: null,
            effect: {},
            get currentTime() {
                return this.playState === 'finished' ? duration : Math.min(Date.now() - started, duration);
            },
            cancel() {
                if (this.playState === 'running') clearTimeout(timer);
                this.playState = 'idle';
            },
            play() {},
            pause() {}
        };
        const timer = setTimeout(() => {
            if (animation.playState !== 'running') return;
            animation.playState = 'finished';
            animation.ranToEnd = true;
            if (animation.onfinish) animation.onfinish();
        }, duration);
        ad.animations.push(animation);
        return animation;
    };
    win.Element.prototype.getAnimations = function() {
        return ad.animations.filter(a => a.element === this && a.playState === 'running');
    };
}

function svelteSetup(world) {
    let rt;
    const ad = setupAdapter(world, 'svelte', {
        load() {
            // svelte/motion reads prefers-reduced-motion when it loads; jsdom has no matchMedia
            if (typeof window.matchMedia !== 'function') {
                window.matchMedia = (query) => ({
                    matches: false, media: query, onchange: null,
                    addEventListener() {}, removeEventListener() {},
                    addListener() {}, removeListener() {}, dispatchEvent: () => false
                });
            }
            rt = loadRuntime('client');
            return rt.adapter;
        }
    });
    if (rt) {
        ad.rt = rt;
        ad.c = {};
        installAnimations(ad);
    }
    return ad;
}

const sv = (world) => world.ad;
const A = (world) => world.ad.adapter;
const c = (world) => world.ad.c;

function serverRuntime(world) {
    const ad = sv(world);
    if (!ad.srt) ad.srt = loadRuntime('server');
    return ad.srt;
}

/**
 * Compile a legacy-mode (or, with runes: true, runes-mode) component. `children` maps './Name.svelte' imports to
 * components compiled earlier for the same runtime.
 */
function compileSvelte(world, source, { filename = 'App.svelte', children = {}, server = false, runes = false } = {}) {
    const { compile } = require('svelte/compiler');
    const esbuild = require('esbuild');
    const out = compile(source, {
        filename,
        generate: server ? 'server' : 'client',
        runes,
        css: 'injected'
    });
    const code = esbuild.transformSync(out.js.code, { format: 'cjs', loader: 'js', target: 'es2022' }).code;
    const rt = server ? serverRuntime(world) : sv(world).rt;
    const modules = {
        svelte: rt.svelte,
        'svelte/store': rt.store,
        [server ? 'svelte/internal/server' : 'svelte/internal/client']: rt.internal,
        'svelte/internal/disclose-version': {},
        'svelte/internal/flags/legacy': {},
        '@genx/bindx-svelte': rt.adapter
    };
    if (!server) {
        Object.assign(modules, {
            'svelte/transition': rt.transition,
            'svelte/animate': rt.animate,
            'svelte/easing': rt.easing,
            'svelte/motion': rt.motion
        });
    }
    for (const [name, component] of Object.entries(children)) {
        modules[name] = { __esModule: true, default: component };
    }
    const module = { exports: {} };
    const requireModule = (name) => {
        if (!(name in modules)) throw new Error(`${filename} imports ${name}, which the test runtime does not provide`);
        return modules[name];
    };
    new Function('require', 'module', 'exports', code)(requireModule, module, module.exports);
    return module.exports.default;
}

function sync(world) {
    sv(world).rt.svelte.flushSync();
}

/** Mount a component into a fresh container; unmounted after the scenario. */
function mount(world, Component, props = {}, options = {}) {
    const { rt } = sv(world);
    const target = document.createElement('div');
    document.body.appendChild(target);
    const view = {
        target,
        destroyed: false,
        instance: rt.svelte.mount(Component, { target, props, ...options }),
        text: () => target.textContent.replace(/\s+/g, ' ').trim(),
        find: (selector) => target.querySelector(selector),
        findAll: (selector) => Array.from(target.querySelectorAll(selector)),
        unmount() {
            if (view.destroyed) return;
            view.destroyed = true;
            rt.svelte.unmount(view.instance);
            rt.svelte.flushSync();
            target.remove();
        }
    };
    rt.svelte.flushSync();
    sv(world).cleanups.push(() => view.unmount());
    return view;
}

function fire(world, element, type) {
    element.dispatchEvent(new window.Event(type, { bubbles: true }));
    sync(world);
}

function click(world, element) {
    element.click();
    sync(world);
}

function texts(view, selector) {
    return view.findAll(selector).map(el => el.textContent.trim());
}

/** Collect console.error calls for the rest of the scenario. */
function captureErrors(world) {
    const ad = sv(world);
    if (ad.consoleErrors) return ad.consoleErrors;
    ad.consoleErrors = [];
    const original = console.error;
    console.error = (...args) => ad.consoleErrors.push(args);
    ad.cleanups.push(() => { console.error = original; });
    return ad.consoleErrors;
}

/** The svelte block of the adapter's own @example under `title`. */
function docExample(title) {
    const source = fs.readFileSync(ADAPTER_SRC, 'utf8');
    const start = source.indexOf(title);
    assert.ok(start >= 0, `no "${title}" example in ${ADAPTER_SRC}`);
    const block = source.slice(start).match(/```svelte\n([\s\S]*?)```/);
    assert.ok(block, `no svelte block after "${title}"`);
    return block[1].split('\n').map(line => line.replace(/^ \* ?/, '')).join('\n');
}

// ---------------------------------------------------------------- TypeScript

let tsCounter = 0;

function typecheck(code) {
    const ts = require('typescript');
    fs.mkdirSync(TS_DIR, { recursive: true });
    const file = path.join(TS_DIR, `svelte-check-${process.pid}-${tsCounter++}.ts`);
    fs.writeFileSync(file, `import { reactive, computed, watch, createStore, toStore, useDerived } from ${ADAPTER_IMPORT};\nimport { get, derived } from 'svelte/store';\n${code}\n`);
    const program = ts.createProgram([file], {
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true
    });
    const diagnostics = ts.getPreEmitDiagnostics(program)
        .filter(d => d.file && d.file.fileName === file)
        .map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
    fs.unlinkSync(file);
    return diagnostics;
}

function assertCompiles(code) {
    assert.deepStrictEqual(typecheck(code), [], 'expected no type errors');
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
    const file = path.join(TS_DIR, `svelte-complete-${process.pid}-${tsCounter++}.ts`);
    const source = `import { createStore } from ${ADAPTER_IMPORT};\n${prefix}`;
    fs.writeFileSync(file, source);
    const options = { strict: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true };
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

// ---------------------------------------------------------------- Background

Given(re('Svelte 3+ is installed'), function() {
    const { version } = require('svelte/package.json');
    assert.ok(Number(version.split('.')[0]) >= 3, `svelte ${version}`);
});

Given(re('@genx/bindx-svelte package is installed'), function() {
    const ad = svelteSetup(this);
    for (const api of ['createStore', 'reactive', 'computed', 'watch', 'toStore', 'toReadable', 'useDerived']) {
        assert.strictEqual(typeof ad.adapter[api], 'function', `${api} export`);
    }
});

// ---------------------------------------------------------------- Store compatibility

const COUNT_VIEW = `<script>export let store;</script><p>Count: {$store.count}</p>`;

Given(re('a bindX reactive state'), function() {
    c(this).state = A(this).reactive({ count: 0 });
    assert.ok(A(this).isReactive(c(this).state));
});

When(re('I convert it to a Svelte-compatible store'), function() {
    c(this).store = A(this).toStore(c(this).state);
});

for (const method of ['subscribe', 'set', 'update']) {
    Then(re(`the store should have ${method}() method`), function() {
        assert.strictEqual(typeof c(this).store[method], 'function');
    });
}

Then(re('Svelte components can subscribe to it'), function() {
    const view = mount(this, compileSvelte(this, COUNT_VIEW), { store: c(this).store });
    assert.strictEqual(view.text(), 'Count: 0');
    // A write to the bindX state, not through the store, reaches the component
    c(this).state.count = 3;
    sync(this);
    assert.strictEqual(view.text(), 'Count: 3');
    c(this).store.set({ count: 4 });
    sync(this);
    assert.strictEqual(view.text(), 'Count: 4');
    assert.strictEqual(c(this).state.count, 4);
});

Given(re('a bindX store with value { count: 0 }'), function() {
    const ctx = c(this);
    ctx.store = A(this).createStore({ count: 0 });
    ctx.notified = [];
    ctx.unsubscribe = ctx.store.subscribe(value => ctx.notified.push(value.count));
    ctx.view = mount(this, compileSvelte(this, COUNT_VIEW), { store: ctx.store });
});

When(re('a Svelte component subscribes to the store'), function() {
    const ctx = c(this);
    ctx.received = [];
    const Component = compileSvelte(this, `<script>
        import { onDestroy } from 'svelte';
        export let store, received;
        onDestroy(store.subscribe(value => received.push(value.count)));
    </script>
    <p>Seen: {$store.count}</p>`);
    ctx.component = mount(this, Component, { store: ctx.store, received: ctx.received });
});

Then(re('the component should receive the initial value'), function() {
    assert.deepStrictEqual(c(this).received, [0]);
    assert.strictEqual(c(this).component.text(), 'Seen: 0');
});

When(re('the store value changes'), function() {
    c(this).store.update(value => ({ count: value.count + 1 }));
});

Then(re('the subscriber should be notified'), function() {
    assert.deepStrictEqual(c(this).received, [0, 1]);
});

Then(re('the component should re-render'), function() {
    sync(this);
    assert.strictEqual(c(this).component.text(), 'Seen: 1');
});

Given(re('a Svelte component subscribed to bindX store'), function() {
    const ctx = c(this);
    ctx.store = A(this).createStore({ count: 0 });
    ctx.view = mount(this, compileSvelte(this, COUNT_VIEW), { store: ctx.store });
    assert.strictEqual(ctx.store.subscribers.size, 1, 'the $store subscription');
});

When(re('the component is destroyed'), function() {
    c(this).view.unmount();
});

Then(re('the subscription should automatically unsubscribe'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.store.subscribers.size, 0);
    ctx.store.set({ count: 9 });
    assert.strictEqual(ctx.view.target.textContent, '');
    this.checkReleased = () => {
        assert.strictEqual(ctx.store.subscribers.size, 0);
        assert.strictEqual(ctx.view.target.isConnected, false);
    };
});

Given(re('a bindX store'), function() {
    c(this).store = A(this).createStore({ count: 0, label: 'Clicks' });
});

When(re('I use $storeName syntax in Svelte template'), function() {
    const Component = compileSvelte(this, `<script>export let counter;</script><p>{$counter.label}: {$counter.count}</p>`);
    c(this).Component = Component;
    c(this).view = mount(this, Component, { counter: c(this).store });
});

Then(re('Svelte should automatically subscribe'), function() {
    assert.strictEqual(c(this).store.subscribers.size, 1);
    assert.strictEqual(c(this).view.text(), 'Clicks: 0');
});

Then(re('automatically unsubscribe on destroy'), function() {
    const ctx = c(this);
    const second = mount(this, ctx.Component, { counter: ctx.store });
    assert.strictEqual(ctx.store.subscribers.size, 2);
    second.unmount();
    assert.strictEqual(ctx.store.subscribers.size, 1, 'only the first component is still subscribed');
});

Then(re('the template should display current value'), function() {
    const ctx = c(this);
    ctx.store.update(value => ({ ...value, count: 2 }));
    sync(this);
    assert.strictEqual(ctx.view.text(), 'Clicks: 2');
});

// ---------------------------------------------------------------- Reactive statements

Given(re('a bindX reactive state { count: 0 }'), function() {
    c(this).state = A(this).reactive({ count: 0 });
});

When(re('I use it in a $: reactive statement'), function() {
    const ctx = c(this);
    ctx.runs = [];
    ctx.view = mount(this, compileSvelte(this, `<script>
        export let state, runs;
        let unrelated = 0;
        $: runs.push(state.count);
        export function increment() { state.count++; }
        export function touchUnrelated() { unrelated++; }
    </script>
    <p>{state.count} {unrelated}</p>`), { state: ctx.state, runs: ctx.runs });
    assert.deepStrictEqual(ctx.runs, [0]);
});

Then(re('the statement should execute when count changes'), function() {
    const ctx = c(this);
    ctx.view.instance.increment();
    sync(this);
    assert.deepStrictEqual(ctx.runs, [0, 1]);
    assert.strictEqual(ctx.state.count, 1, 'the write went to the bindX state');
});

Then(re("Svelte's reactive system should track the dependency"), function() {
    const ctx = c(this);
    ctx.view.instance.touchUnrelated();
    sync(this);
    assert.strictEqual(ctx.view.text(), '1 1');
    assert.deepStrictEqual(ctx.runs, [0, 1], 'a change the statement does not read does not re-run it');
});

Given(re('bindX computed property derived from reactive state'), function() {
    const ctx = c(this);
    ctx.state = A(this).reactive({ count: 1, other: 0 });
    ctx.evaluations = 0;
    ctx.doubled = A(this).computed(() => {
        ctx.evaluations++;
        return ctx.state.count * 2;
    });
});

When(re('used in $: statement in Svelte component'), function() {
    const ctx = c(this);
    ctx.runs = [];
    ctx.view = mount(this, compileSvelte(this, `<script>
        export let doubled, runs;
        $: runs.push($doubled);
    </script>
    <p>{$doubled}</p>`), { doubled: ctx.doubled, runs: ctx.runs });
    assert.deepStrictEqual(ctx.runs, [2]);
});

Then(re('the $ statement should reactively update'), function() {
    const ctx = c(this);
    ctx.state.count = 2;
    sync(this);
    assert.deepStrictEqual(ctx.runs, [2, 4]);
    assert.strictEqual(ctx.view.text(), '4');
});

Then(re('updates should only trigger when dependencies change'), function() {
    const ctx = c(this);
    const evaluations = ctx.evaluations;
    ctx.state.other = 5;
    sync(this);
    assert.deepStrictEqual(ctx.runs, [2, 4]);
    assert.strictEqual(ctx.evaluations, evaluations, 'the computed did not re-evaluate');
});

// ---------------------------------------------------------------- Lifecycle

Given(re('a Svelte component with onMount lifecycle'), function() {
    c(this).Component = compileSvelte(this, `<script>
        import { onMount } from 'svelte';
        import { reactive, toStore } from '@genx/bindx-svelte';
        export let probe;
        let store;
        probe.hooks.push('init');
        onMount(() => {
            probe.hooks.push('mount');
            probe.state = reactive({ user: 'Ada', count: 0 });
            store = toStore(probe.state);
        });
    </script>
    {#if store}<p>{$store.user}: {$store.count}</p>{:else}<p>loading</p>{/if}`);
});

When(re('onMount executes'), function() {
    const ctx = c(this);
    ctx.probe = { hooks: [] };
    ctx.view = mount(this, ctx.Component, { probe: ctx.probe });
    assert.deepStrictEqual(ctx.probe.hooks, ['init', 'mount']);
});

When(re('I initialize bindX reactive state'), function() {
    assert.ok(A(this).isReactive(c(this).probe.state), 'onMount created bindX state');
});

Then(re('the state should be properly initialized'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.probe.state.user, 'Ada');
    assert.strictEqual(ctx.view.text(), 'Ada: 0');
});

Then(re('subscriptions should be active'), function() {
    const ctx = c(this);
    ctx.probe.state.count = 3;
    sync(this);
    assert.strictEqual(ctx.view.text(), 'Ada: 3');
});

Given(re('a Svelte component with bindX state'), function() {
    const ctx = c(this);
    ctx.Component = compileSvelte(this, `<script>
        import { onMount, onDestroy } from 'svelte';
        import { reactive, toStore, createStore, watch } from '@genx/bindx-svelte';
        export let probe;
        const state = reactive({ count: 0, status: 'idle' });
        const store = toStore(state);
        const settings = createStore({ theme: 'light' });
        watch(() => state.count, value => probe.seen.push(value));
        onMount(() => { state.status = 'ready'; });
        onDestroy(() => settings.destroy());
        probe.state = state;
        probe.settings = settings;
        export function increment() { state.count++; }
    </script>
    <p>{$store.status} {$store.count} {$settings.theme}</p>`);
    ctx.probe = { seen: [] };
});

function mountLifecycle(world) {
    const ctx = c(world);
    if (!ctx.view) {
        ctx.watchersBefore = sv(world).activeWatchers;
        ctx.view = mount(world, ctx.Component, { probe: ctx.probe });
    }
    return ctx.view;
}

When(re('onDestroy lifecycle executes'), function() {
    const ctx = c(this);
    mountLifecycle(this);
    assert.ok(sv(this).activeWatchers > ctx.watchersBefore, 'the component watches bindX state');
    assert.strictEqual(ctx.probe.settings.subscribers.size, 1);
    ctx.view.unmount();
});

Then(re('all bindX watchers should disconnect'), function() {
    const ctx = c(this);
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore);
    ctx.probe.state.count = 5;
    assert.deepStrictEqual(ctx.probe.seen, [], 'the watch() callback no longer runs');
});

Then(re('all store subscriptions should unsubscribe'), function() {
    assert.strictEqual(c(this).probe.settings.subscribers.size, 0);
});

Then(re('no memory leaks should remain'), function() {
    const ctx = c(this);
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore);
    assert.strictEqual(ctx.view.target.isConnected, false);
    assert.strictEqual(document.body.innerHTML, '');
});

When(re('the component mounts'), function() {
    mountLifecycle(this);
});

When(re('state is initialized in onMount'), function() {
    assert.strictEqual(c(this).probe.state.status, 'ready');
});

Then(re('the template should display the initial state'), function() {
    assert.strictEqual(c(this).view.text(), 'ready 0 light');
});

When(re('state changes during component lifetime'), function() {
    const ctx = c(this);
    ctx.view.instance.increment();
    ctx.probe.state.count += 1;
    ctx.probe.settings.set({ theme: 'dark' });
});

Then(re('the template should reactively update'), function() {
    sync(this);
    assert.strictEqual(c(this).view.text(), 'ready 2 dark');
    assert.deepStrictEqual(c(this).probe.seen, [1, 2]);
});

// ---------------------------------------------------------------- Two-way binding

/** Reactive state plus its store; components bind to $state.<key>. */
function stateWithStore(world, initial) {
    const ctx = c(world);
    ctx.state = A(world).reactive(initial);
    ctx.store = A(world).toStore(ctx.state);
    return ctx;
}

Given(re("bindX reactive state { inputValue: 'test' }"), function() {
    stateWithStore(this, { inputValue: 'test' });
});

When(re('I use bind:value={state.inputValue} on input'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>export let state;</script>
        <input bind:value={$state.inputValue}><p>{$state.inputValue}</p>`), { state: ctx.store });
    assert.strictEqual(ctx.view.find('input').value, 'test');
});

Then(re('input changes should update state.inputValue'), function() {
    const ctx = c(this);
    const input = ctx.view.find('input');
    input.value = 'typed';
    fire(this, input, 'input');
    assert.strictEqual(ctx.state.inputValue, 'typed');
});

Then(re('state.inputValue changes should update input'), function() {
    const ctx = c(this);
    ctx.state.inputValue = 'from state';
    sync(this);
    assert.strictEqual(ctx.view.find('input').value, 'from state');
});

Then(re("Svelte's two-way binding should work"), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('p').textContent, 'from state');
    const input = ctx.view.find('input');
    input.value = 'round trip';
    fire(this, input, 'input');
    assert.strictEqual(ctx.view.find('p').textContent, 'round trip');
    assert.strictEqual(ctx.state.inputValue, 'round trip');
});

Given(re('bindX state { agreed: false }'), function() {
    stateWithStore(this, { agreed: false });
});

When(re('I use bind:checked={state.agreed}'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>export let state;</script>
        <input type="checkbox" bind:checked={$state.agreed}><p>{$state.agreed ? 'agreed' : 'not yet'}</p>`), { state: ctx.store });
    assert.strictEqual(ctx.view.find('input').checked, false);
});

Then(re('checkbox changes should update state.agreed'), function() {
    const ctx = c(this);
    click(this, ctx.view.find('input'));
    assert.strictEqual(ctx.state.agreed, true);
    assert.strictEqual(ctx.view.find('p').textContent, 'agreed');
});

Then(re('state.agreed changes should update checkbox'), function() {
    const ctx = c(this);
    ctx.state.agreed = false;
    sync(this);
    assert.strictEqual(ctx.view.find('input').checked, false);
    assert.strictEqual(ctx.view.find('p').textContent, 'not yet');
});

Given(re("bindX state { selected: 'a' }"), function() {
    stateWithStore(this, { selected: 'a' });
});

When(re('I use bind:value={state.selected} on select'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>export let state;</script>
        <select bind:value={$state.selected}>
            <option value="a">A</option><option value="b">B</option><option value="c">C</option>
        </select><p>{$state.selected}</p>`), { state: ctx.store });
    assert.strictEqual(ctx.view.find('select').value, 'a');
});

Then(re('select changes should update state'), function() {
    const ctx = c(this);
    const select = ctx.view.find('select');
    select.value = 'b';
    fire(this, select, 'change');
    assert.strictEqual(ctx.state.selected, 'b');
    assert.strictEqual(ctx.view.find('p').textContent, 'b');
});

Then(re('state changes should update select'), function() {
    const ctx = c(this);
    ctx.state.selected = 'c';
    sync(this);
    assert.strictEqual(ctx.view.find('select').value, 'c');
    assert.strictEqual(ctx.view.find('p').textContent, 'c');
});

// ---------------------------------------------------------------- Computed properties

Given(re("bindX state { firstName: 'John', lastName: 'Doe' }"), function() {
    c(this).state = A(this).reactive({ firstName: 'John', lastName: 'Doe' });
});

Given(re('bindX computed fullName combining both names'), function() {
    const ctx = c(this);
    ctx.fullName = A(this).computed(() => `${ctx.state.firstName} ${ctx.state.lastName}`);
});

When(re('the template displays {fullName()}'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>let { fullName } = $props();</script><p>{fullName()}</p>`, { runes: true }),
        { fullName: ctx.fullName });
});

Then(re("it should show 'John Doe'"), function() {
    assert.strictEqual(c(this).view.text(), 'John Doe');
});

When(re("firstName changes to 'Jane'"), function() {
    c(this).state.firstName = 'Jane';
});

Then(re("fullName() should update to 'Jane Doe'"), function() {
    assert.strictEqual(c(this).fullName(), 'Jane Doe');
});

Then(re('template should re-render'), function() {
    sync(this);
    assert.strictEqual(c(this).view.text(), 'Jane Doe');
});

Given(re('multiple bindX computed properties depending on each other'), function() {
    const ctx = c(this);
    const { reactive, computed } = A(this);
    ctx.state = reactive({ price: 10, qty: 2, taxRate: 0.5, note: '' });
    ctx.runs = { subtotal: 0, tax: 0, total: 0 };
    ctx.subtotal = computed(() => { ctx.runs.subtotal++; return ctx.state.price * ctx.state.qty; });
    ctx.tax = computed(() => { ctx.runs.tax++; return ctx.subtotal() * ctx.state.taxRate; });
    ctx.total = computed(() => { ctx.runs.total++; return ctx.subtotal() + ctx.tax(); });
});

When(re('used in Svelte template'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>let { subtotal, tax, total } = $props();</script>
        <p>{subtotal()} {tax()} {total()}</p>`, { runes: true }), { subtotal: ctx.subtotal, tax: ctx.tax, total: ctx.total });
    assert.strictEqual(ctx.view.text(), '20 10 30');
});

Then(re('all computed should update correctly'), function() {
    const ctx = c(this);
    ctx.runsBefore = { ...ctx.runs };
    ctx.state.qty = 4;
    sync(this);
    assert.strictEqual(ctx.view.text(), '40 20 60');
});

Then(re('only necessary recomputations should occur'), function() {
    const ctx = c(this);
    for (const name of Object.keys(ctx.runs)) {
        assert.strictEqual(ctx.runs[name] - ctx.runsBefore[name], 1, `${name} recomputed once for one change`);
    }
    const settled = { ...ctx.runs };
    ctx.state.note = 'gift';
    sync(this);
    assert.deepStrictEqual(ctx.runs, settled, 'a property no computed reads changes nothing');
    assert.strictEqual(ctx.view.text(), '40 20 60');
});

Given(re('bindX computed property'), function() {
    const ctx = c(this);
    ctx.state = A(this).reactive({ count: 1, other: 0 });
    ctx.evaluations = 0;
    ctx.computed = A(this).computed(() => {
        ctx.evaluations++;
        return ctx.state.count * 10;
    });
});

When(re('used in $: statement'), function() {
    const ctx = c(this);
    ctx.runs = [];
    ctx.view = mount(this, compileSvelte(this, `<script>
        export let value, runs;
        $: runs.push($value);
    </script>
    <p>{$value}</p>`), { value: ctx.computed, runs: ctx.runs });
    assert.deepStrictEqual(ctx.runs, [10]);
});

Then(re('the statement should react to computed changes'), function() {
    const ctx = c(this);
    ctx.state.count = 2;
    sync(this);
    assert.deepStrictEqual(ctx.runs, [10, 20]);
    assert.strictEqual(ctx.view.text(), '20');
});

Then(re('dependency tracking should work correctly'), function() {
    const ctx = c(this);
    const evaluations = ctx.evaluations;
    ctx.state.other = 1;
    ctx.state.count = 2;
    sync(this);
    assert.deepStrictEqual(ctx.runs, [10, 20], 'no re-run for an unread property or an unchanged value');
    assert.strictEqual(ctx.evaluations, evaluations);
});

When(re('used in {#if computed()}'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>let { computed } = $props();</script>
        {#if computed()}<p class="shown">{computed()} points</p>{:else}<p class="empty">no points</p>{/if}`, { runes: true }),
        { computed: ctx.computed });
});

Then(re('condition should evaluate correctly'), function() {
    const ctx = c(this);
    assert.ok(ctx.view.find('.shown'));
    assert.strictEqual(ctx.view.text(), '10 points');
});

Then(re('block should show/hide reactively'), function() {
    const ctx = c(this);
    ctx.state.count = 0;
    sync(this);
    assert.strictEqual(ctx.view.find('.shown'), null);
    assert.strictEqual(ctx.view.text(), 'no points');
    ctx.state.count = 3;
    sync(this);
    assert.strictEqual(ctx.view.text(), '30 points');
});

When(re('computed value changes'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { fade } from 'svelte/transition';
        // fade scales the element's computed opacity, which jsdom only knows inline
        let { computed } = $props();
    </script>
    {#key computed()}<span class="value" style="opacity: 1" in:fade={{ duration: 120 }}>{computed()}</span>{/key}`, { runes: true }),
        { computed: ctx.computed });
    assert.strictEqual(sv(this).animations.length, 0, 'no intro on first render');
    ctx.oldSpan = ctx.view.find('.value');
    ctx.state.count = 2;
});

When(re('triggers Svelte animation'), async function() {
    const ctx = c(this);
    sync(this);
    const span = ctx.view.find('.value');
    assert.notStrictEqual(span, ctx.oldSpan, '{#key} replaced the element');
    // Svelte first plays a zero-length "delay" animation, then the fade itself
    await flush(10);
    const fades = sv(this).animations.filter(a => a.duration > 0);
    assert.strictEqual(fades.length, 1, 'one fade-in');
    assert.strictEqual(fades[0].element, span);
    assert.strictEqual(fades[0].duration, 120);
    ctx.fade = fades[0];
});

Then(re('animation should play smoothly'), async function() {
    const animation = c(this).fade;
    const opacities = animation.keyframes.map(frame => Number(frame.opacity));
    assert.ok(opacities.length > 2, `eased keyframes, got ${opacities.length}`);
    assert.strictEqual(opacities[0], 0);
    assert.strictEqual(opacities[opacities.length - 1], 1);
    assert.ok(opacities.every((value, i) => i === 0 || value >= opacities[i - 1]), 'opacity only increases');
    await flush(150);
    // Svelte cancels a finished intro to drop its keyframes, so check it ran to the end
    assert.strictEqual(animation.ranToEnd, true, 'fade ran to the end');
    assert.strictEqual(animation.element.getAnimations().length, 0);
});

Then(re('reactivity should work with animations'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.text(), '20');
    ctx.state.count = 5;
    sync(this);
    assert.strictEqual(ctx.view.text(), '50');
    // the new {#key} element starts its own intro (after the first fade and its delay)
    const intros = sv(this).animations.filter(a => a.element === ctx.view.find('.value'));
    assert.strictEqual(intros.length, 1, 'new element got an intro');
    assert.notStrictEqual(intros[0].element, ctx.fade.element);
});

// ---------------------------------------------------------------- Watchers

const WATCH_PROBE = () => ({ calls: [] });

Given(re('bindX state { userId: 1 }'), function() {
    c(this).state = A(this).reactive({ userId: 1 });
});

When(re('I create bindX watcher in onMount'), function() {
    const ctx = c(this);
    ctx.probe = WATCH_PROBE();
    ctx.watchersBefore = sv(this).activeWatchers;
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { onMount } from 'svelte';
        import { watch } from '@genx/bindx-svelte';
        export let state, probe;
        onMount(() => watch(() => state.userId, (value, old) => probe.calls.push([value, old])));
    </script>
    <p>user</p>`), { state: ctx.state, probe: ctx.probe });
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore + 1);
});

Then(re('watcher should execute on state changes'), function() {
    const ctx = c(this);
    ctx.state.userId = 2;
    assert.strictEqual(ctx.probe.calls.length, 1);
});

Then(re('callback should receive new and old values'), function() {
    const ctx = c(this);
    ctx.state.userId = 3;
    assert.deepStrictEqual(ctx.probe.calls, [[2, 1], [3, 2]]);
});

Then(re('watcher should auto-cleanup on destroy'), function() {
    const ctx = c(this);
    ctx.view.unmount();
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore);
    ctx.state.userId = 4;
    assert.strictEqual(ctx.probe.calls.length, 2);
});

Given(re('bindX state with initial value'), function() {
    c(this).state = A(this).reactive({ value: 'initial' });
});

Given(re('bindX state with nested objects'), function() {
    c(this).state = A(this).reactive({
        user: { profile: { name: 'Ada', address: { city: 'London' } }, tags: ['math'] }
    });
});

function mountWatcher(world, getter, options) {
    const ctx = c(world);
    ctx.probe = WATCH_PROBE();
    ctx.view = mount(world, compileSvelte(world, `<script>
        import { watch } from '@genx/bindx-svelte';
        export let state, probe;
        watch(() => ${getter}, (value, old) => probe.calls.push([value, old]), ${options});
    </script>
    <p>watching</p>`), { state: ctx.state, probe: ctx.probe });
}

When(re('I create watcher with { immediate: true }'), function() {
    mountWatcher(this, 'state.value', '{ immediate: true }');
});

Then(re('watcher should execute immediately'), function() {
    assert.strictEqual(c(this).probe.calls.length, 1);
});

Then(re('should receive initial value'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(ctx.probe.calls[0], ['initial', undefined]);
    ctx.state.value = 'next';
    assert.deepStrictEqual(ctx.probe.calls[1], ['next', 'initial']);
});

When(re('I create watcher with { deep: true }'), function() {
    mountWatcher(this, 'state.user', '{ deep: true }');
    assert.strictEqual(c(this).probe.calls.length, 0);
});

Then(re('watcher should react to nested property changes'), function() {
    const ctx = c(this);
    ctx.state.user.profile.name = 'Grace';
    assert.strictEqual(ctx.probe.calls.length, 1);
});

Then(re('all levels should be tracked'), function() {
    const ctx = c(this);
    ctx.state.user.profile.address.city = 'Paris';
    assert.strictEqual(ctx.probe.calls.length, 2);
    ctx.state.user.tags.push('logic');
    assert.strictEqual(ctx.probe.calls.length, 3);
    assert.strictEqual(ctx.probe.calls[2][0].profile.address.city, 'Paris');
});

// ---------------------------------------------------------------- Store methods

When(re('I call store.set({ count: 5 })'), function() {
    c(this).store.set({ count: 5 });
});

Then(re('the store value should be 5'), function() {
    assert.strictEqual(sv(this).rt.store.get(c(this).store).count, 5);
});

Then(re('subscribers should be notified'), function() {
    const ctx = c(this);
    const expected = ctx.store.getValue().count;
    assert.deepStrictEqual(ctx.notified, [0, expected]);
});

Then(re('Svelte components should re-render'), function() {
    sync(this);
    assert.strictEqual(c(this).view.text(), 'Count: 5');
});

When(re('I call store.update(val => ({ count: val.count + 1 }))'), function() {
    c(this).store.update(val => ({ count: val.count + 1 }));
});

Then(re('the count should be 1'), function() {
    assert.strictEqual(sv(this).rt.store.get(c(this).store).count, 1);
});

When(re('I subscribe and get current value'), function() {
    const ctx = c(this);
    ctx.store.set({ count: 7 });
    let current;
    const unsubscribe = ctx.store.subscribe(value => { current = value.count; });
    unsubscribe();
    ctx.subscribed = current;
});

When(re('use get(store) from svelte/store'), function() {
    c(this).got = sv(this).rt.store.get(c(this).store);
});

Then(re('I should receive the current value'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.subscribed, 7);
    assert.strictEqual(ctx.got.count, 7);
    assert.strictEqual(ctx.got.label, 'Clicks');
    ctx.store.update(value => ({ ...value, count: 8 }));
    assert.strictEqual(sv(this).rt.store.get(ctx.store).count, 8);
    assert.strictEqual(ctx.store.subscribers.size, 0, 'get() and the manual subscription both unsubscribed');
});

// ---------------------------------------------------------------- TypeScript

const STATE_TYPE = `interface State { name: string; age: number; tags: string[] }
const store = createStore<State>({ name: 'Ada', age: 36, tags: [] });`;

Given(re('TypeScript interface for state'), function() {
    c(this).ts = STATE_TYPE;
});

When(re('I create bindX store with type: createStore<State>(...)'), function() {
    assertCompiles(`${c(this).ts}
store.set({ name: 'Grace', age: 45, tags: ['navy'] });
store.update(s => ({ ...s, age: s.age + 1 }));
const name: string = get(store).name;
const unsubscribe = store.subscribe(s => s.tags.join(','));
unsubscribe();`);
});

Then(re('TypeScript should enforce type safety'), function() {
    assertTypeError(`interface State { name: string; age: number; tags: string[] }
createStore<State>({ name: 'Ada', age: 'old', tags: [] });`);
});

Then(re('IDE autocomplete should work'), function() {
    const ctx = c(this);
    if (ctx.completionCheck) return ctx.completionCheck();
    const fields = completionsAfter(`${STATE_TYPE}\nstore.subscribe(s => s.`);
    for (const name of ['name', 'age', 'tags']) assert.ok(fields.includes(name), `${name} in ${fields}`);
    const methods = completionsAfter(`${STATE_TYPE}\nstore.`);
    for (const name of ['set', 'update', 'subscribe']) assert.ok(methods.includes(name), `${name} in ${methods}`);
});

Then(re('type errors should be caught at compile time'), function() {
    assertTypeError(`${STATE_TYPE}\nstore.set({ name: 1, age: 2, tags: [] });`);
    assertTypeError(`${STATE_TYPE}\nstore.update(s => ({ ...s, tags: 'none' }));`, [2322, 2345]);
    assertTypeError(`${STATE_TYPE}\nconst n: number = get(store).name;`);
});

const CART_TYPE = `interface Cart { items: { price: number; qty: number }[]; coupon: string | null }
const cart = reactive<Cart>({ items: [], coupon: null });`;

Given(re('typed bindX state'), function() {
    c(this).ts = CART_TYPE;
});

When(re('I create computed properties'), function() {
    c(this).ts += `
const total = computed(() => cart.items.reduce((sum, item) => sum + item.price * item.qty, 0));
const label = computed(() => cart.coupon ?? 'none');`;
});

Then(re('return types should be inferred'), function() {
    const ctx = c(this);
    assertCompiles(`${ctx.ts}
const t: number = total();
const l: string = label();
const fromStore: number = get(total);`);
    assertTypeError(`${ctx.ts}\nconst wrong: string = total();`);
});

Then(re('TypeScript should validate usage'), function() {
    const ctx = c(this);
    assertTypeError(`${ctx.ts}\ntotal().toUpperCase();`, 2339);
    assertTypeError(`${ctx.ts}\nlabel.subscribe((value: number) => value);`, 2345);
});

const SETTINGS_TYPE = `interface Settings { theme: 'light' | 'dark'; fontSize: number }
const store = createStore<Settings>({ theme: 'light', fontSize: 14 });`;

Given(re('typed bindX store'), function() {
    c(this).ts = SETTINGS_TYPE;
});

When(re('I subscribe to the store'), function() {
    c(this).ts += `
store.subscribe(value => {
    const theme: 'light' | 'dark' = value.theme;
    const size: number = value.fontSize;
});`;
});

Then(re('subscription callback should have correct types'), function() {
    assertCompiles(c(this).ts);
});

Then(re('TypeScript should validate the callback'), function() {
    assertTypeError(`${SETTINGS_TYPE}\nstore.subscribe((value: { theme: number }) => value);`, 2345);
    assertTypeError(`${SETTINGS_TYPE}\nstore.subscribe(value => value.missing);`, 2339);
    assertTypeError(`${SETTINGS_TYPE}\nstore.subscribe(value => { const t: 'blue' = value.theme; });`);
});

// ---------------------------------------------------------------- $: statements on bindX state
// Legacy-mode $: statements re-run when a value they read is invalidated. Writes
// made outside the component reach them through toStore(state), so the
// statements read $store (see decisions: external writes use the store form).

function mountStatement(world, statement, markup) {
    const ctx = c(world);
    if (!ctx.store) ctx.store = A(world).toStore(ctx.state);
    ctx.probe = { runs: [], calls: [] };
    ctx.view = mount(world, compileSvelte(world, `<script>
        export let store, probe, fetchUser = null;
        let unrelated = 0;
        ${statement}
        export function touchUnrelated() { unrelated++; }
    </script>
    ${markup}<i>{unrelated}</i>`), { store: ctx.store, probe: ctx.probe, fetchUser: ctx.fetchUser || null });
}

Given(re('bindX state { count: 0 }'), function() {
    stateWithStore(this, { count: 0 });
});

When(re('I write $: doubled = state.count * 2'), function() {
    mountStatement(this, `$: doubled = $store.count * 2;
        $: probe.runs.push(doubled);`, '<p class="out">{doubled}</p>');
    assert.deepStrictEqual(c(this).probe.runs, [0]);
});

Then(re('doubled should update when count changes'), function() {
    const ctx = c(this);
    ctx.state.count = 3;
    sync(this);
    assert.strictEqual(ctx.view.find('.out').textContent, '6');
    assert.deepStrictEqual(ctx.probe.runs, [0, 6]);
});

Then(re('Svelte should track the dependency'), function() {
    const ctx = c(this);
    ctx.view.instance.touchUnrelated();
    sync(this);
    assert.strictEqual(ctx.view.find('i').textContent, '1');
    assert.deepStrictEqual(ctx.probe.runs, [0, 6], 'an unrelated change does not re-run the statement');
});

When(re('I write $: fetchUser(state.userId)'), function() {
    const ctx = c(this);
    ctx.fetched = [];
    ctx.fetchUser = (id) => {
        ctx.fetched.push(id);
        return Promise.resolve({ id, name: `User ${id}` });
    };
    mountStatement(this, `let user = null;
        $: fetchUser($store.userId).then(result => { user = result; });`,
    '<p class="user">{user ? user.name : "loading"}</p>');
});

Then(re('fetchUser should execute when userId changes'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(ctx.fetched, [1]);
    ctx.state.userId = 2;
    sync(this);
    assert.deepStrictEqual(ctx.fetched, [1, 2]);
    ctx.view.instance.touchUnrelated();
    sync(this);
    assert.deepStrictEqual(ctx.fetched, [1, 2], 'no fetch without a userId change');
});

Then(re('side effect should run reactively'), async function() {
    const ctx = c(this);
    await flush();
    sync(this);
    assert.strictEqual(ctx.view.find('.user').textContent, 'User 2');
    ctx.state.userId = 7;
    sync(this);
    await flush();
    sync(this);
    assert.strictEqual(ctx.view.find('.user').textContent, 'User 7');
});

Given(re('bindX state { a: 1, b: 2 }'), function() {
    stateWithStore(this, { a: 1, b: 2 });
});

When(re('I write $: sum = state.a + state.b'), function() {
    mountStatement(this, `$: sum = $store.a + $store.b;
        $: probe.runs.push(sum);`, '<p class="out">{sum}</p>');
});

Then(re('sum should update when either a or b changes'), function() {
    const ctx = c(this);
    ctx.state.a = 5;
    sync(this);
    assert.strictEqual(ctx.view.find('.out').textContent, '7');
    ctx.state.b = 10;
    sync(this);
    assert.strictEqual(ctx.view.find('.out').textContent, '15');
});

Then(re('Svelte should track both dependencies'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(ctx.probe.runs, [3, 7, 15]);
    ctx.view.instance.touchUnrelated();
    sync(this);
    assert.deepStrictEqual(ctx.probe.runs, [3, 7, 15]);
});

// ---------------------------------------------------------------- Props

Given(re('parent component with bindX state'), function() {
    c(this).state = A(this).reactive({ name: 'Ada', count: 0 });
});

When(re('I pass state to child component as prop'), function() {
    const ctx = c(this);
    const Child = compileSvelte(this, `<script>export let state;</script>
        <p class="child">{state.name} {state.count}</p>
        <button class="rename" on:click={() => { state.name = 'Grace'; }}>rename</button>`, { filename: 'Child.svelte' });
    ctx.view = mount(this, compileSvelte(this, `<script>
        import Child from './Child.svelte';
        import { toStore } from '@genx/bindx-svelte';
        export let state;
        const store = toStore(state);
        export function bump() { state.count++; }
    </script>
    <p class="parent">{$store.name} {$store.count}</p>
    <Child {state} />`, { children: { './Child.svelte': Child } }), { state: ctx.state });
});

Then(re('child should receive the state'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('.child').textContent, 'Ada 0');
    assert.strictEqual(ctx.view.find('.parent').textContent, 'Ada 0');
});

Then(re('changes in child should reflect in parent'), function() {
    const ctx = c(this);
    click(this, ctx.view.find('.rename'));
    assert.strictEqual(ctx.state.name, 'Grace', 'the child wrote the shared bindX state');
    assert.strictEqual(ctx.view.find('.parent').textContent, 'Grace 0');
    assert.strictEqual(ctx.view.find('.child').textContent, 'Grace 0');
});

Then(re('reactivity should flow both ways'), function() {
    const ctx = c(this);
    ctx.view.instance.bump();
    sync(this);
    assert.strictEqual(ctx.state.count, 1);
    assert.strictEqual(ctx.view.find('.child').textContent, 'Grace 1');
    assert.strictEqual(ctx.view.find('.parent').textContent, 'Grace 1');
});

Given(re('child component that exports bindX state'), function() {
    c(this).Child = compileSvelte(this, `<script>
        import { reactive } from '@genx/bindx-svelte';
        export let state = reactive({ count: 0 });
    </script>
    <p class="child">{state.count}</p>
    <button class="inc" on:click={() => state.count++}>+</button>`, { filename: 'Child.svelte' });
});

When(re('parent binds to the exported prop'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>
        import Child from './Child.svelte';
        import { reactive } from '@genx/bindx-svelte';
        let shared;
        export function getShared() { return shared; }
        export function reset() { shared = reactive({ count: 100 }); }
    </script>
    <Child bind:state={shared} />
    <p class="parent">{shared ? shared.count : '-'}</p>`, { children: { './Child.svelte': ctx.Child } }));
    assert.strictEqual(ctx.view.find('.parent').textContent, '0', 'the child default flowed up');
});

Then(re('parent should receive updates from child'), function() {
    const ctx = c(this);
    const shared = ctx.view.instance.getShared();
    assert.ok(A(this).isReactive(shared), 'the parent holds the child’s bindX state');
    click(this, ctx.view.find('.inc'));
    assert.strictEqual(shared.count, 1);
    assert.strictEqual(ctx.view.find('.parent').textContent, '1');
});

Then(re('two-way binding should work'), function() {
    const ctx = c(this);
    if (ctx.bindInput) return ctx.bindInput();
    ctx.view.instance.reset();
    sync(this);
    assert.strictEqual(ctx.view.find('.child').textContent, '100', 'parent → child');
    click(this, ctx.view.find('.inc'));
    assert.strictEqual(ctx.view.instance.getShared().count, 101);
    assert.strictEqual(ctx.view.find('.parent').textContent, '101', 'child → parent');
});

// ---------------------------------------------------------------- Each blocks

function mountList(world, key, itemMarkup, extra = '') {
    const ctx = c(world);
    ctx.view = mount(world, compileSvelte(world, `<script>export let store;</script>
        <ul>{#each $store.${key} as item (${key === 'todos' ? 'item.id' : 'item'})}<li>${itemMarkup}</li>{:else}<p class="empty">Nothing</p>{/each}</ul>${extra}`),
    { store: ctx.store });
    ctx.nodes = () => new Map(ctx.view.findAll('li').map(li => [li.textContent, li]));
}

Given(re('bindX state { items: [1, 2, 3] }'), function() {
    stateWithStore(this, { items: [1, 2, 3] });
});

When(re('I use {#each state.items as item}'), function() {
    mountList(this, 'items', '{item}');
});

Then(re('each should iterate over items'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(texts(ctx.view, 'li'), ['1', '2', '3']);
    ctx.before = ctx.nodes();
});

When(re('items array changes'), function() {
    const ctx = c(this);
    ctx.state.items.push(4);
    ctx.state.items.splice(0, 1);
    sync(this);
});

Then(re('each block should re-render'), function() {
    assert.deepStrictEqual(texts(c(this).view, 'li'), ['2', '3', '4']);
});

Then(re('keyed updates should work correctly'), function() {
    const ctx = c(this);
    const after = ctx.nodes();
    assert.strictEqual(after.get('2'), ctx.before.get('2'), 'kept items keep their element');
    assert.strictEqual(after.get('3'), ctx.before.get('3'));
    assert.strictEqual(ctx.before.get('1').isConnected, false);
});

Given(re('bindX state { todos: [] }'), function() {
    stateWithStore(this, { todos: [] });
    mountList(this, 'todos', '{item.text}');
    assert.ok(c(this).view.find('.empty'));
});

When(re('I push new todo to state.todos'), function() {
    const ctx = c(this);
    ctx.state.todos.push({ id: 1, text: 'Write tests' });
    ctx.expected = ['Write tests'];
});

Then(re('#each block should update'), function() {
    const ctx = c(this);
    sync(this);
    assert.deepStrictEqual(texts(ctx.view, 'li'), ctx.expected);
});

Then(re('new item should appear in list'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('.empty'), null);
    assert.strictEqual(ctx.view.find('li').textContent, 'Write tests');
});

Then(re('Svelte should efficiently update DOM'), function() {
    const ctx = c(this);
    const first = ctx.view.find('li');
    ctx.state.todos.push({ id: 2, text: 'Ship it' });
    sync(this);
    assert.deepStrictEqual(texts(ctx.view, 'li'), ['Write tests', 'Ship it']);
    assert.strictEqual(ctx.view.find('li'), first, 'the existing item was not re-created');
});

Given(re('bindX array with items'), function() {
    stateWithStore(this, { items: ['a', 'b', 'c', 'd'] });
    mountList(this, 'items', '{item}');
    c(this).before = c(this).nodes();
});

When(re('I remove item using splice()'), function() {
    const ctx = c(this);
    ctx.state.items.splice(1, 1);
    ctx.expected = ['a', 'c', 'd'];
});

Then(re('removed item should disappear'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.nodes().has('b'), false);
    assert.strictEqual(ctx.before.get('b').isConnected, false);
});

Then(re('remaining items should remain stable'), function() {
    const ctx = c(this);
    const after = ctx.nodes();
    for (const item of ['a', 'c', 'd']) {
        assert.strictEqual(after.get(item), ctx.before.get(item), `${item} kept its element`);
    }
});

// ---------------------------------------------------------------- #if and #await

Given(re('bindX state { isVisible: true }'), function() {
    stateWithStore(this, { isVisible: true });
});

When(re('I use {#if state.isVisible}'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>export let store;</script>
        {#if $store.isVisible}<div class="content">Shown</div>{:else}<p class="placeholder">Hidden</p>{/if}`),
    { store: ctx.store });
});

Then(re('content should be visible'), function() {
    assert.strictEqual(c(this).view.find('.content').textContent, 'Shown');
});

When(re('state.isVisible changes to false'), function() {
    c(this).state.isVisible = false;
    sync(this);
});

Then(re('content should be hidden'), function() {
    assert.strictEqual(c(this).view.find('.content'), null);
});

Then(re('DOM should update reactively'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('.placeholder').textContent, 'Hidden');
    ctx.state.isVisible = true;
    sync(this);
    assert.ok(ctx.view.find('.content'));
    assert.strictEqual(ctx.view.find('.placeholder'), null);
});

function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

Given(re('bindX state { promise: fetchData() }'), function() {
    const ctx = c(this);
    ctx.request = deferred();
    stateWithStore(this, { promise: ctx.request.promise });
});

When(re('I use {#await state.promise}'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>export let store;</script>
        {#await $store.promise}<p class="loading">Loading…</p>{:then data}<p class="data">{data.name}</p>{:catch error}<p class="error">{error.message}</p>{/await}`),
    { store: ctx.store });
});

Then(re('Svelte should handle loading state'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.text(), 'Loading…');
});

async function settle(world) {
    await flush();
    sync(world);
}

Then(re('handle resolved value'), async function() {
    const ctx = c(this);
    ctx.request.resolve({ name: 'Ada' });
    await settle(this);
    assert.strictEqual(ctx.view.find('.data').textContent, 'Ada');
});

Then(re('handle error state'), async function() {
    const ctx = c(this);
    const failing = deferred();
    ctx.state.promise = failing.promise;
    sync(this);
    assert.ok(ctx.view.find('.loading'), 'a new promise shows the pending block again');
    failing.reject(new Error('Network down'));
    await settle(this);
    assert.strictEqual(ctx.view.find('.error').textContent, 'Network down');
});

Then(re('updates should work reactively'), async function() {
    const ctx = c(this);
    ctx.state.promise = Promise.resolve({ name: 'Grace' });
    sync(this);
    await settle(this);
    assert.strictEqual(ctx.view.find('.data').textContent, 'Grace');
    assert.strictEqual(ctx.view.find('.error'), null);
});

// ---------------------------------------------------------------- Context

When(re("I setContext('store', bindXStore)"), function() {
    c(this).parentSource = `<script>
        import { setContext } from 'svelte';
        import { toStore } from '@genx/bindx-svelte';
        import Child from './Child.svelte';
        export let state;
        const store = toStore(state);
        setContext('store', store);
    </script>
    <h1>{$store.name}</h1>
    <Child /><Child />`;
});

When(re("child component uses getContext('store')"), function() {
    const ctx = c(this);
    const Child = compileSvelte(this, `<script>
        import { getContext } from 'svelte';
        const store = getContext('store');
    </script>
    <p class="consumer">{$store.name} {$store.count}</p>`, { filename: 'Child.svelte' });
    ctx.view = mount(this, compileSvelte(this, ctx.parentSource, { children: { './Child.svelte': Child } }),
        { state: ctx.state });
});

Then(re('child should access the store'), function() {
    assert.deepStrictEqual(texts(c(this).view, '.consumer'), ['Ada 0', 'Ada 0']);
});

Then(re('updates should propagate to all consumers'), function() {
    const ctx = c(this);
    ctx.state.name = 'Grace';
    ctx.state.count = 2;
    sync(this);
    assert.deepStrictEqual(texts(ctx.view, '.consumer'), ['Grace 2', 'Grace 2']);
    assert.strictEqual(ctx.view.find('h1').textContent, 'Grace');
});

Given(re('bindX store in context'), function() {
    c(this).store = A(this).createStore({ theme: 'light' });
});

When(re('multiple components getContext'), function() {
    const ctx = c(this);
    ctx.probe = { seen: [] };
    const consumer = (name, extra = '') => compileSvelte(this, `<script>
        import { getContext } from 'svelte';
        export let probe;
        const settings = getContext('settings');
        probe.seen.push(settings);
    </script>
    <p class="${name}">{$settings.theme}</p>${extra}`, { filename: `${name}.svelte` });
    const children = {
        './Header.svelte': consumer('Header'),
        './Toggler.svelte': consumer('Toggler', `<button on:click={() => { $settings.theme = 'dark'; }}>dark</button>`),
        './Footer.svelte': consumer('Footer')
    };
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { provideStore } from '@genx/bindx-svelte';
        import Header from './Header.svelte';
        import Toggler from './Toggler.svelte';
        import Footer from './Footer.svelte';
        export let settings, probe;
        provideStore('settings', settings);
    </script>
    <Header {probe} /><Toggler {probe} /><Footer {probe} />`, { children }), { settings: ctx.store, probe: ctx.probe });
});

Then(re('all components should share same state'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.probe.seen.length, 3);
    assert.ok(ctx.probe.seen.every(store => store === ctx.store));
    assert.deepStrictEqual(texts(ctx.view, 'p'), ['light', 'light', 'light']);
});

Then(re('updates should sync across components'), function() {
    const ctx = c(this);
    click(this, ctx.view.find('button'));
    assert.strictEqual(ctx.store.getValue().theme, 'dark');
    assert.deepStrictEqual(texts(ctx.view, 'p'), ['dark', 'dark', 'dark']);
    ctx.store.update(value => ({ ...value, theme: 'blue' }));
    sync(this);
    assert.deepStrictEqual(texts(ctx.view, 'p'), ['blue', 'blue', 'blue']);
});

// ---------------------------------------------------------------- Batching and laziness

Given(re('multiple bindX property changes'), function() {
    const ctx = stateWithStore(this, { a: 1, b: 2, c: 3 });
    ctx.probe = { updates: 0 };
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { afterUpdate } from 'svelte';
        export let store, probe;
        afterUpdate(() => { probe.updates++; });
    </script>
    <p>{$store.a} {$store.b} {$store.c}</p>`), { store: ctx.store, probe: ctx.probe });
    ctx.updatesBefore = ctx.probe.updates;
    ctx.mutations = [];
    ctx.observer = new window.MutationObserver(records => ctx.mutations.push(...records));
    ctx.observer.observe(ctx.view.target, { subtree: true, childList: true, characterData: true });
    sv(this).cleanups.push(() => ctx.observer.disconnect());
});

When(re('changes occur in same tick'), function() {
    const ctx = c(this);
    if (ctx.sameTick) return ctx.sameTick();
    ctx.state.a = 10;
    ctx.state.b = 20;
    ctx.state.c = 30;
});

Then(re('only one Svelte update should occur'), async function() {
    const ctx = c(this);
    await flush();
    assert.strictEqual(ctx.probe.updates - ctx.updatesBefore, 1);
});

Then(re('DOM should update once'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('p').textContent, '10 20 30');
    assert.strictEqual(ctx.mutations.length, 1, 'one text change for three writes');
});

Given(re('bindX computed properties'), function() {
    const ctx = c(this);
    ctx.state = A(this).reactive({ count: 1 });
    ctx.counts = { used: 0, unused: 0 };
    ctx.used = A(this).computed(() => { ctx.counts.used++; return ctx.state.count * 10; });
    ctx.unused = A(this).computed(() => { ctx.counts.unused++; return ctx.state.count * 100; });
    ctx.view = mount(this, compileSvelte(this, `<script>export let used, unused;</script><p>{$used}</p>`),
        { used: ctx.used, unused: ctx.unused });
    assert.strictEqual(ctx.view.text(), '10');
    ctx.usedBefore = ctx.counts.used;
});

When(re('reactive state changes'), function() {
    c(this).state.count = 2;
    sync(this);
});

Then(re('only accessed computed should recalculate'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.text(), '20');
    assert.strictEqual(ctx.counts.used - ctx.usedBefore, 1, 'one re-evaluation for one change');
});

Then(re('unused computed should not execute'), function() {
    assert.strictEqual(c(this).counts.unused, 0);
});

// ---------------------------------------------------------------- Errors

Given(re('computed property that throws error'), function() {
    const ctx = c(this);
    ctx.kind = 'computed';
    ctx.state = A(this).reactive({ broken: true, value: 5 });
    ctx.computed = A(this).computed(() => {
        if (ctx.state.broken) throw new Error('Computation failed');
        return ctx.state.value;
    });
});

When(re('computed is accessed'), function() {
    const ctx = c(this);
    captureErrors(this);
    ctx.caught = [];
    ctx.view = mount(this, compileSvelte(this, `<script>
        let { computed, onerror } = $props();
    </script>
    <svelte:boundary {onerror}>
        <p class="value">{computed()}</p>
        {#snippet failed(error, reset)}
            <p class="failed">{error.message}</p><button class="retry" onclick={reset}>retry</button>
        {/snippet}
    </svelte:boundary>
    <p class="outside">still here</p>`, { runes: true }), {
        computed: ctx.computed,
        onerror: (error) => ctx.caught.push(error)
    });
});

Then(re('error should be caught'), function() {
    const ctx = c(this);
    if (ctx.kind === 'watcher') {
        const logged = sv(this).consoleErrors.filter(args => args[0] === 'bindX: watcher callback threw');
        assert.strictEqual(logged.length, 1);
        assert.strictEqual(logged[0][1].message, 'watcher failed');
        return;
    }
    if (ctx.kind !== 'computed') throw new Error('error should be caught: no svelte setup for this scenario');
    assert.strictEqual(ctx.caught.length, 1);
    assert.strictEqual(ctx.caught[0].message, 'Computation failed');
    assert.strictEqual(ctx.view.find('.failed').textContent, 'Computation failed');
});

Then(re('component should not crash'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('.outside').textContent, 'still here');
    ctx.state.broken = false;
    click(this, ctx.view.find('.retry'));
    assert.strictEqual(ctx.view.find('.value').textContent, '5', 'retry renders the fixed computed');
    ctx.state.value = 6;
    sync(this);
    assert.strictEqual(ctx.view.find('.value').textContent, '6');
});

Then(re('error should be logged'), function() {
    const logged = sv(this).consoleErrors.filter(args => args[0] === 'bindX: computed threw');
    assert.ok(logged.length >= 1, 'the adapter logs the throwing computed');
    assert.strictEqual(logged[0][1].message, 'Computation failed');
});

Given(re('watcher callback that throws error'), function() {
    const ctx = c(this);
    ctx.kind = 'watcher';
    captureErrors(this);
    ctx.state = A(this).reactive({ count: 0 });
    ctx.probe = { seen: [] };
    ctx.watchersBefore = sv(this).activeWatchers;
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { watch } from '@genx/bindx-svelte';
        export let state, probe;
        watch(() => state.count, () => { throw new Error('watcher failed'); });
        watch(() => state.count, value => probe.seen.push(value));
    </script>
    <p class="stable">ok {state.count}</p>`), { state: ctx.state, probe: ctx.probe });
});

When(re('watcher executes'), function() {
    const ctx = c(this);
    assert.doesNotThrow(() => { ctx.state.count = 1; }, 'the write survives a throwing watcher');
});

Then(re('other watchers should continue'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(ctx.probe.seen, [1]);
    ctx.state.count = 2;
    assert.deepStrictEqual(ctx.probe.seen, [1, 2]);
});

Then(re('component should remain stable'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('.stable').textContent, 'ok 0');
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore + 2);
    ctx.view.unmount();
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore, 'both watchers stop with the component');
});

// ---------------------------------------------------------------- Testing

Given(re('test suite for component using bindX'), function() {
    c(this).Counter = compileSvelte(this, `<script>
        import { reactive } from '@genx/bindx-svelte';
        export let initial = 0;
        export const state = reactive({ count: initial });
    </script>
    <button on:click={() => state.count++}>Count: {state.count}</button>`, { filename: 'Counter.svelte' });
});

When(re('I create component in test'), function() {
    const ctx = c(this);
    ctx.view = mount(this, ctx.Counter, { initial: 5 });
});

When(re('initialize bindX state'), function() {
    const state = c(this).view.instance.state;
    assert.ok(A(this).isReactive(state), 'the component exposes its bindX state');
    assert.strictEqual(state.count, 5);
});

Then(re('component should render'), function() {
    const ctx = c(this);
    if (ctx.renderCheck) return ctx.renderCheck();
    assert.strictEqual(ctx.view.find('button').textContent, 'Count: 5');
});

Then(re('state updates should work in tests'), function() {
    const ctx = c(this);
    click(this, ctx.view.find('button'));
    assert.strictEqual(ctx.view.instance.state.count, 6);
    assert.strictEqual(ctx.view.find('button').textContent, 'Count: 6');
});

Given(re('component that depends on bindX store'), function() {
    c(this).UserCard = compileSvelte(this, `<script>
        import { getContext } from 'svelte';
        const user = getContext('user');
    </script>
    <p class="name">{$user.name}</p>{#if $user.admin}<span class="badge">admin</span>{/if}`, { filename: 'UserCard.svelte' });
});

When(re('I provide mock store in test'), function() {
    const ctx = c(this);
    ctx.mock = A(this).createStore({ name: 'Test User', admin: false });
    ctx.view = mount(this, ctx.UserCard, {}, { context: new Map([['user', ctx.mock]]) });
});

Then(re('component should work with mock'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.find('.name').textContent, 'Test User');
    assert.strictEqual(ctx.view.find('.badge'), null);
});

Then(re('I can control state for testing'), function() {
    const ctx = c(this);
    ctx.mock.update(value => ({ ...value, admin: true }));
    sync(this);
    assert.ok(ctx.view.find('.badge'));
    ctx.mock.set({ name: 'Other User', admin: false });
    sync(this);
    assert.strictEqual(ctx.view.find('.name').textContent, 'Other User');
    assert.strictEqual(ctx.view.find('.badge'), null);
});

Given(re('component with bindX and $ statements'), function() {
    const ctx = c(this);
    ctx.state = A(this).reactive({ qty: 1, price: 30 });
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { toStore } from '@genx/bindx-svelte';
        export let state;
        const store = toStore(state);
        $: total = $store.qty * $store.price;
        $: label = total > 100 ? 'bulk' : 'single';
        export function getTotal() { return total; }
        export function getLabel() { return label; }
    </script>
    <p>{total} {label}</p>`), { state: ctx.state });
    assert.strictEqual(ctx.view.text(), '30 single');
});

When(re('I update state in test'), function() {
    c(this).state.qty = 4;
    sync(this);
});

Then(re('$ statements should execute'), function() {
    assert.strictEqual(c(this).view.instance.getTotal(), 120);
});

Then(re('I can assert on derived values'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.instance.getLabel(), 'bulk');
    assert.strictEqual(ctx.view.text(), '120 bulk');
});

// ---------------------------------------------------------------- SSR

Given(re('SSR environment'), function() {
    const ctx = c(this);
    ctx.srt = serverRuntime(this);
    ctx.watchersBefore = sv(this).activeWatchers;
    ctx.Page = compileSvelte(this, `<script>
        import { reactive, computed, watch, toStore } from '@genx/bindx-svelte';
        export let user;
        const state = reactive({ user, visits: 1 });
        const store = toStore(state);
        const greeting = computed(() => 'Hello ' + state.user);
        watch(() => state.user, () => {});
    </script>
    <p>{$store.user} {$greeting} {$store.visits}</p>`, { server: true, filename: 'Page.svelte' });
});

When(re('components with bindX render'), function() {
    const ctx = c(this);
    ctx.pages = [];
    ctx.leftover = [];
    for (let i = 0; i < 25; i++) {
        const { body } = ctx.srt.server.render(ctx.Page, { props: { user: `user${i}` } });
        ctx.pages.push(body);
        ctx.leftover.push(sv(this).activeWatchers - ctx.watchersBefore);
    }
});

Then(re('watchers should clean up after render'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(ctx.leftover, Array(25).fill(0), 'every render released its watchers');
});

Then(re('no memory should leak between requests'), function() {
    const ctx = c(this);
    ctx.pages.forEach((body, i) => {
        assert.match(body, new RegExp(`<p>user${i} Hello user${i} 1</p>`));
        assert.strictEqual((body.match(/user\d+/g) || []).every(name => name === `user${i}`), true,
            `request ${i} saw only its own data`);
    });
});

// ---------------------------------------------------------------- Derived stores

Given(re('bindX store'), function() {
    const ctx = c(this);
    ctx.store = A(this).createStore({ count: 1, label: 'x' });
});

When(re("I create derived store using Svelte's derived()"), function() {
    const ctx = c(this);
    ctx.derived = sv(this).rt.store.derived(ctx.store, $value => $value.count * 2);
    ctx.values = [];
    sv(this).cleanups.push(ctx.derived.subscribe(value => ctx.values.push(value)));
    ctx.view = mount(this, compileSvelte(this, `<script>export let doubled;</script><p>{$doubled}</p>`),
        { doubled: ctx.derived });
});

Then(re('derived store should update when source changes'), function() {
    const ctx = c(this);
    ctx.store.update(value => ({ ...value, count: 2 }));
    sync(this);
    assert.deepStrictEqual(ctx.values, [2, 4]);
    assert.strictEqual(ctx.view.text(), '4');
});

Then(re('derivation should work correctly'), function() {
    const ctx = c(this);
    const { get } = sv(this).rt.store;
    assert.strictEqual(get(ctx.derived), 4);
    ctx.store.update(value => ({ ...value, label: 'y' }));
    assert.deepStrictEqual(ctx.values, [2, 4], 'an unrelated change leaves the derived value alone');
});

Given(re('multiple bindX stores'), function() {
    const ctx = c(this);
    ctx.cart = A(this).createStore({ items: 2, price: 10 });
    ctx.discount = A(this).createStore({ percent: 0 });
});

When(re('I use derived([store1, store2], ...)'), function() {
    const ctx = c(this);
    ctx.total = sv(this).rt.store.derived([ctx.cart, ctx.discount],
        ([$cart, $discount]) => $cart.items * $cart.price * (1 - $discount.percent / 100));
    ctx.values = [];
    sv(this).cleanups.push(ctx.total.subscribe(value => ctx.values.push(value)));
});

Then(re('derived should combine values'), function() {
    assert.deepStrictEqual(c(this).values, [20]);
});

Then(re('update when any source changes'), function() {
    const ctx = c(this);
    ctx.discount.update(value => ({ ...value, percent: 50 }));
    ctx.cart.update(value => ({ ...value, items: 4 }));
    assert.deepStrictEqual(ctx.values, [20, 10, 20]);
});

// ---------------------------------------------------------------- Transitions and actions

Given(re('component with Svelte transitions'), function() {
    const ctx = stateWithStore(this, { open: false });
    ctx.view = mount(this, compileSvelte(this, `<script>
        import { fade } from 'svelte/transition';
        export let store;
    </script>
    {#if $store.open}<div class="panel" style="opacity: 1" transition:fade={{ duration: 40 }}>Panel</div>{/if}`),
    { store: ctx.store });
    assert.strictEqual(ctx.view.find('.panel'), null);
});

When(re('bindX state controls visibility'), function() {
    const ctx = c(this);
    ctx.state.open = true;
    sync(this);
    ctx.panel = ctx.view.find('.panel');
    assert.ok(ctx.panel, 'opening shows the panel');
});

const fadesOf = (world, element) => sv(world).animations.filter(a => a.element === element && a.duration > 0);
const opacitiesOf = (animation) => animation.keyframes.map(frame => Number(frame.opacity));

Then(re('transitions should play correctly'), async function() {
    const ctx = c(this);
    await flush(10);
    const [intro] = fadesOf(this, ctx.panel);
    assert.ok(intro, 'an intro played');
    const opacities = opacitiesOf(intro);
    assert.strictEqual(opacities[0], 0);
    assert.strictEqual(opacities[opacities.length - 1], 1);
    await flush(60);
    assert.strictEqual(intro.ranToEnd, true);
});

Then(re('state changes should trigger transitions'), async function() {
    const ctx = c(this);
    ctx.state.open = false;
    sync(this);
    assert.strictEqual(ctx.panel.isConnected, true, 'the panel stays while its outro plays');
    await flush(10);
    const outro = fadesOf(this, ctx.panel)[1];
    assert.ok(outro, 'an outro played');
    const opacities = opacitiesOf(outro);
    assert.strictEqual(opacities[0], 1);
    assert.strictEqual(opacities[opacities.length - 1], 0);
    await flush(80);
    sync(this);
    assert.strictEqual(ctx.panel.isConnected, false, 'removed after the outro');
});

Given(re('Svelte action that uses bindX state'), function() {
    const ctx = c(this);
    const { watch } = A(this);
    ctx.state = A(this).reactive({ color: 'red' });
    ctx.log = [];
    ctx.watchersBefore = sv(this).activeWatchers;
    ctx.paint = (node, state) => {
        ctx.log.push(['init', state === ctx.state]);
        const stop = watch(() => state.color, color => {
            node.style.color = color;
            ctx.log.push(['color', color]);
        }, { immediate: true });
        return {
            destroy() {
                stop();
                ctx.log.push(['destroy']);
            }
        };
    };
});

When(re('action is applied to element'), function() {
    const ctx = c(this);
    ctx.view = mount(this, compileSvelte(this, `<script>export let paint, state;</script>
        <div class="painted" use:paint={state}>paint</div>`), { paint: ctx.paint, state: ctx.state });
});

Then(re('action should access state'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(ctx.log, [['init', true], ['color', 'red']]);
    assert.strictEqual(ctx.view.find('.painted').style.color, 'red');
});

Then(re('react to state changes'), function() {
    const ctx = c(this);
    ctx.state.color = 'blue';
    assert.strictEqual(ctx.view.find('.painted').style.color, 'blue');
});

Then(re('cleanup should work on destroy'), function() {
    const ctx = c(this);
    ctx.view.unmount();
    assert.deepStrictEqual(ctx.log.at(-1), ['destroy']);
    assert.strictEqual(sv(this).activeWatchers, ctx.watchersBefore);
    ctx.state.color = 'green';
    assert.ok(!ctx.log.some(entry => entry[1] === 'green'), 'no updates after destroy');
});

// ---------------------------------------------------------------- Slots

Given(re('parent with bindX state'), function() {
    stateWithStore(this, { user: 'Ada', count: 0 });
});

When(re('passed to child via slot props'), function() {
    const ctx = c(this);
    const Provider = compileSvelte(this, `<script>export let store;</script>
        <div class="provider"><slot user={$store.user} count={$store.count} /></div>`, { filename: 'Provider.svelte' });
    ctx.view = mount(this, compileSvelte(this, `<script>
        import Provider from './Provider.svelte';
        export let store;
    </script>
    <Provider {store} let:user let:count><p class="slotted">{user}: {count}</p></Provider>`,
    { children: { './Provider.svelte': Provider } }), { store: ctx.store });
});

Then(re('slot content should access state'), function() {
    assert.strictEqual(c(this).view.find('.slotted').textContent, 'Ada: 0');
});

Then(re('reactivity should work through slots'), function() {
    const ctx = c(this);
    ctx.state.user = 'Grace';
    ctx.state.count = 3;
    sync(this);
    assert.strictEqual(ctx.view.find('.slotted').textContent, 'Grace: 3');
});

// ---------------------------------------------------------------- Documented examples
// The adapter has no README; its usage examples are the @example blocks in
// src/bindx-svelte.ts, which these scenarios compile and run as written.

function captureLogs(world) {
    const ad = sv(world);
    ad.logs = [];
    const original = console.log;
    console.log = (...args) => ad.logs.push(args);
    ad.cleanups.push(() => { console.log = original; });
    return ad.logs;
}

const button = (view, label) => view.findAll('button').find(b => b.textContent.trim() === label);

Given(re('the bindX-svelte package README'), function() {
    c(this).source = docExample('Example usage in Svelte component:');
});

When(re('I follow the counter example'), function() {
    const ctx = c(this);
    captureLogs(this);
    ctx.view = mount(this, compileSvelte(this, ctx.source, { filename: 'Counter.svelte' }));
});

Then(re('I should have working counter component'), function() {
    const ctx = c(this);
    assert.deepStrictEqual(texts(ctx.view, 'p'), ['Count: 0', 'Doubled: 0']);
    assert.ok(button(ctx.view, 'Increment') && button(ctx.view, 'Decrement'));
});

Then(re('increment/decrement should work'), function() {
    const ctx = c(this);
    click(this, button(ctx.view, 'Increment'));
    click(this, button(ctx.view, 'Increment'));
    click(this, button(ctx.view, 'Decrement'));
    assert.strictEqual(texts(ctx.view, 'p')[0], 'Count: 1');
});

Then(re('Svelte reactivity should work'), function() {
    const ctx = c(this);
    assert.strictEqual(texts(ctx.view, 'p')[1], 'Doubled: 2', 'the computed re-rendered');
    assert.deepStrictEqual(sv(this).logs, [['Count changed:', 1], ['Count changed:', 2], ['Count changed:', 1]],
        'the watcher saw every change');
});

Given(re('bindX-svelte todo example'), function() {
    const ctx = c(this);
    ctx.example = 'todo';
    ctx.source = docExample('Example with reactive state (non-store):');
});

const FORM_EXAMPLE = `<script>
    import { reactive, toStore, computed } from '@genx/bindx-svelte';
    export let onSubmit;
    const form = reactive({ email: '', password: '' });
    const fields = toStore(form);
    const errors = computed(() => ({
        email: !form.email ? 'Email is required' : /^\\S+@\\S+\\.\\S+$/.test(form.email) ? '' : 'Enter a valid email',
        password: form.password.length >= 8 ? '' : 'Use at least 8 characters'
    }));
    const valid = computed(() => !errors().email && !errors().password);
</script>
<form on:submit|preventDefault={() => onSubmit({ ...form })}>
    <input name="email" bind:value={$fields.email} />
    <span class="error email">{$errors.email}</span>
    <input name="password" type="password" bind:value={$fields.password} />
    <span class="error password">{$errors.password}</span>
    <button type="submit" disabled={!$valid}>Sign up</button>
</form>`;

Given(re('bindX-svelte form example'), function() {
    const ctx = c(this);
    ctx.example = 'form';
    ctx.source = FORM_EXAMPLE;
});

When(re('I implement the example'), function() {
    const ctx = c(this);
    if (ctx.example === 'todo') {
        const realNow = Date.now;
        let next = 1000;
        Date.now = () => next++;
        sv(this).cleanups.push(() => { Date.now = realNow; });
        ctx.view = mount(this, compileSvelte(this, ctx.source, { filename: 'Todos.svelte' }));
    } else if (ctx.example === 'form') {
        ctx.submitted = [];
        ctx.view = mount(this, compileSvelte(this, ctx.source, { filename: 'Signup.svelte' }),
            { onSubmit: values => ctx.submitted.push(values) });
    } else {
        throw new Error('I implement the example: no svelte example chosen');
    }
});

const todoTexts = (view) => texts(view, 'span');
const todoRow = (view, text) => view.findAll('span').find(span => span.textContent === text).parentElement;
const remaining = (view) => view.findAll('p').at(-1).textContent;

Then(re('I should have full CRUD functionality'), function() {
    const ctx = c(this);
    const { view } = ctx;
    assert.deepStrictEqual(todoTexts(view), ['Learn bindX', 'Build app']);
    assert.strictEqual(remaining(view), '2 items left');
    const input = view.find('input[type="text"]');
    input.value = 'Write docs';
    input.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    sync(this);
    assert.deepStrictEqual(todoTexts(view), ['Learn bindX', 'Build app', 'Write docs'], 'create');
    assert.strictEqual(remaining(view), '3 items left');
    const learn = todoRow(view, 'Learn bindX');
    const checkbox = learn.querySelector('input[type="checkbox"]');
    checkbox.checked = true;
    fire(this, checkbox, 'change');
    assert.ok(learn.querySelector('span').classList.contains('completed'), 'update');
    assert.strictEqual(remaining(view), '2 items left');
    click(this, todoRow(view, 'Build app').querySelector('button'));
    assert.deepStrictEqual(todoTexts(view), ['Learn bindX', 'Write docs'], 'delete');
    assert.strictEqual(remaining(view), '1 items left');
});

Then(re('filtering should work reactively'), function() {
    const ctx = c(this);
    const { view } = ctx;
    click(this, button(view, 'Active'));
    assert.deepStrictEqual(todoTexts(view), ['Write docs']);
    click(this, button(view, 'Completed'));
    assert.deepStrictEqual(todoTexts(view), ['Learn bindX']);
    click(this, button(view, 'All'));
    assert.deepStrictEqual(todoTexts(view), ['Learn bindX', 'Write docs']);
});

Then(re('completed count should update automatically'), function() {
    const ctx = c(this);
    const { view } = ctx;
    click(this, button(view, 'Completed'));
    const checkbox = todoRow(view, 'Learn bindX').querySelector('input[type="checkbox"]');
    checkbox.checked = false;
    fire(this, checkbox, 'change');
    assert.deepStrictEqual(todoTexts(view), [], 'un-completing leaves the Completed view');
    assert.strictEqual(remaining(view), '2 items left');
    click(this, button(view, 'All'));
    assert.ok(!todoRow(view, 'Learn bindX').querySelector('span').classList.contains('completed'));
});

function typeInto(world, view, name, value) {
    const input = view.find(`input[name="${name}"]`);
    input.value = value;
    fire(world, input, 'input');
}

const formError = (view, name) => view.find(`.error.${name}`).textContent;

Then(re('form validation should work'), function() {
    const ctx = c(this);
    const { view } = ctx;
    assert.strictEqual(formError(view, 'email'), 'Email is required');
    assert.strictEqual(formError(view, 'password'), 'Use at least 8 characters');
    typeInto(this, view, 'email', 'ada@');
    assert.strictEqual(formError(view, 'email'), 'Enter a valid email');
});

Then(re('error messages should be reactive'), function() {
    const ctx = c(this);
    const { view } = ctx;
    typeInto(this, view, 'email', 'ada@example.com');
    assert.strictEqual(formError(view, 'email'), '');
    typeInto(this, view, 'password', 'secret');
    assert.strictEqual(formError(view, 'password'), 'Use at least 8 characters');
    typeInto(this, view, 'password', 'longer secret');
    assert.strictEqual(formError(view, 'password'), '');
    typeInto(this, view, 'email', '');
    assert.strictEqual(formError(view, 'email'), 'Email is required');
});

Then(re('submit should be disabled when invalid'), function() {
    const ctx = c(this);
    const { view } = ctx;
    const submit = view.find('button[type="submit"]');
    assert.strictEqual(submit.disabled, true, 'invalid: email is empty');
    typeInto(this, view, 'email', 'ada@example.com');
    assert.strictEqual(submit.disabled, false);
    view.find('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    sync(this);
    assert.deepStrictEqual(ctx.submitted, [{ email: 'ada@example.com', password: 'longer secret' }]);
    typeInto(this, view, 'password', 'short');
    assert.strictEqual(submit.disabled, true, 'invalid again');
});
