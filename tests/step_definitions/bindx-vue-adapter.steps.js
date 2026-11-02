/**
 * Step definitions for bindx-vue-adapter.feature
 *
 * Runs the real adapter (src/bindx-vue.ts, compiled by the adapter harness) with
 * Vue 3 against a jsdom document: runtime-compiled templates, @vue/test-utils,
 * vue/server-renderer, and vue/compiler-sfc for the single-file examples in the
 * adapter's own documentation. Type scenarios run the TypeScript compiler on
 * small files that import the adapter.
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { setupAdapter, flush, adapterSteps, re } = require('../support/bindx-adapter-harness');

const { Given, When, Then } = adapterSteps('vue');

const ROOT = path.resolve(__dirname, '../..');
const ADAPTER_SRC = path.join(ROOT, 'src', 'bindx-vue.ts');
const TS_DIR = path.join(ROOT, 'node_modules', '.cache', 'genx-bindx-adapters', 'ts');

// ---------------------------------------------------------------- helpers

function vx(world) {
    if (!world.vc) world.vc = { log: [], checks: {}, warnings: [], logged: [], updates: 0 };
    return world.vc;
}

/** The Vue instance the adapter was loaded with (fresh per scenario). */
const V = () => require('vue');
const A = (world) => world.ad.adapter;
/** Raw bindX core: checks made with it are not counted as adapter watchers. */
const core = (world) => world.ad.core;

function mount(world, component, { plugins = [], props, errors = false } = {}) {
    const c = vx(world);
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = V().createApp(component, props);
    app.config.warnHandler = (msg) => c.warnings.push(msg);
    if (errors) {
        // The app's error logger
        app.config.errorHandler = (err, instance, info) => c.logged.push({ err, info });
    }
    for (const plugin of plugins) app.use(...[].concat(plugin));
    const vm = app.mount(el);
    const view = {
        app,
        vm,
        el,
        gone: false,
        text: () => el.textContent.replace(/\s+/g, ' ').trim(),
        find: (selector) => el.querySelector(selector),
        findAll: (selector) => [...el.querySelectorAll(selector)],
        unmount() {
            if (!view.gone) {
                view.gone = true;
                app.unmount();
                el.remove();
            }
        }
    };
    world.ad.cleanups.push(() => view.unmount());
    return view;
}

/** Let Vue's scheduler flush (renders are async) and any timers fire. */
async function tick(ms = 0) {
    await V().nextTick();
    await flush(ms);
    await V().nextTick();
}

function click(element) {
    element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

function typeInto(input, value) {
    input.value = value;
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

/** A component that counts its re-renders into vx(world).updates. */
function counted(world, component) {
    const c = vx(world);
    return Object.assign({}, component, {
        beforeUpdate() {
            c.updates++;
        }
    });
}

/** An effect scope stopped at the end of the scenario. */
function scoped(world, fn) {
    const scope = V().effectScope();
    world.ad.cleanups.push(() => scope.stop());
    return scope.run(fn);
}

function captureErrors(world) {
    const c = vx(world);
    if (!c.errors) {
        c.errors = [];
        const original = console.error;
        console.error = (...args) => c.errors.push(args);
        world.ad.cleanups.push(() => {
            console.error = original;
        });
    }
    return c.errors;
}

function setCheck(world, key, fn) {
    vx(world).checks[key] = fn;
}

async function runCheck(world, key) {
    const fn = vx(world).checks[key];
    assert.ok(fn, `no check registered for "${key}" in this scenario`);
    await fn();
}

function noWarnings(world) {
    assert.deepStrictEqual(vx(world).warnings, [], 'Vue should not warn');
}

/** Watchers the adapter created, counted by the "bindX core library is loaded" step. */
const watchers = (world) => world.ad.activeWatchers;

let tsCounter = 0;
const ADAPTER_IMPORT = JSON.stringify(ADAPTER_SRC.replace(/\.ts$/, ''));

/** Type-check a TypeScript snippet that imports the adapter; returns its diagnostics. */
function typecheck(code) {
    const ts = require('typescript');
    fs.mkdirSync(TS_DIR, { recursive: true });
    const file = path.join(TS_DIR, `vue-check-${process.pid}-${tsCounter++}.ts`);
    fs.writeFileSync(file, `import { reactive, computed, watch, toVueRef, toVueReactive, createStore, useCounter, useArray } from ${ADAPTER_IMPORT};\n${code}\n`);
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
    const file = path.join(TS_DIR, `vue-complete-${process.pid}-${tsCounter++}.ts`);
    const source = `import { reactive } from ${ADAPTER_IMPORT};\n${prefix}`;
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

let sfcCounter = 0;
/**
 * Compile a single-file component the way a Vue build does (compiler-sfc, then
 * TypeScript stripped by esbuild) and evaluate it with '@genx/bindx-vue' bound to
 * the adapter under test. Scoped styles are injected into the document.
 */
function compileSFC(world, source, modules = {}) {
    const sfc = require('vue/compiler-sfc');
    const esbuild = require('esbuild');
    const id = `vx${process.pid}${sfcCounter++}`;
    const { descriptor, errors } = sfc.parse(source, { filename: `${id}.vue` });
    assert.deepStrictEqual(errors, [], 'SFC should parse');
    const script = sfc.compileScript(descriptor, { id, inlineTemplate: true });
    const js = esbuild.transformSync(script.content, { loader: 'ts', format: 'cjs', target: 'node18' }).code;
    const requireMap = Object.assign({ '@genx/bindx-vue': A(world), vue: V() }, modules);
    const mod = { exports: {} };
    // eslint-disable-next-line no-new-func
    new Function('require', 'module', 'exports', js)((name) => {
        assert.ok(name in requireMap, `SFC imports unexpected module ${name}`);
        return requireMap[name];
    }, mod, mod.exports);
    const component = mod.exports.default;
    const scoped = descriptor.styles.some(style => style.scoped);
    if (scoped) component.__scopeId = `data-v-${id}`;
    for (const style of descriptor.styles) {
        const { code, errors: styleErrors } = sfc.compileStyle({
            source: style.content, filename: `${id}.vue`, id: `data-v-${id}`, scoped: !!style.scoped
        });
        assert.deepStrictEqual(styleErrors, []);
        const tag = document.createElement('style');
        tag.textContent = code;
        document.head.appendChild(tag);
        world.ad.cleanups.push(() => tag.remove());
    }
    return { component, id, descriptor };
}

/** The @example blocks in the adapter's module documentation, as SFC sources. */
function docExamples() {
    const header = fs.readFileSync(ADAPTER_SRC, 'utf8').split('*/')[0];
    const lines = header.split('\n').map(line => line.replace(/^\s*\* ?/, '').replace(/^\/\*\*/, ''));
    return lines.join('\n').split('@example').slice(1).map(block => block.replace(/^\s*\/\/.*\n/, '').trim());
}

function docExample(title) {
    const header = fs.readFileSync(ADAPTER_SRC, 'utf8').split('*/')[0];
    const titles = [...header.matchAll(/@example\s*\n\s*\*\s*\/\/\s*(.+)/g)].map(m => m[1].trim());
    const index = titles.findIndex(t => t.startsWith(title));
    assert.ok(index >= 0, `no "${title}" example in the adapter docs (has: ${titles.join('; ')})`);
    return docExamples()[index];
}

// ---------------------------------------------------------------- Background

Given('Vue {int}+ is installed', function(version) {
    const pkg = require('vue/package.json');
    const major = parseInt(pkg.version.split('.')[0], 10);
    assert.ok(major >= version, `Vue ${pkg.version} is older than ${version}`);
    for (const dep of ['@vue/runtime-dom', '@vue/compiler-sfc', '@vue/server-renderer']) {
        assert.strictEqual(require(`${dep}/package.json`).version, pkg.version, `${dep} should match vue`);
    }
});

Given(re('@genx/bindx-vue package is installed'), function() {
    const ad = setupAdapter(this, 'vue');
    for (const name of ['reactive', 'computed', 'watch', 'toVueRef', 'toVueComputed', 'fromVueRef',
        'toVueReactive', 'createComposable', 'createStore', 'useBindX', 'useCounter', 'useToggle',
        'useArray', 'useForm', 'useAsync']) {
        assert.strictEqual(typeof ad.adapter[name], 'function', `${name} should be exported`);
    }
    assert.strictEqual(typeof ad.adapter.bindXPlugin.install, 'function');
    // The adapter and the tests must share the one Vue loaded against this document
    assert.strictEqual(require.cache[require.resolve('vue')] !== undefined, true);
});

// ---------------------------------------------------------------- Composition API

Given(re('a Vue 3 component using setup()'), function() {
    const c = vx(this);
    const world = this;
    c.Component = counted(this, {
        setup() {
            c.state = A(world).reactive({ count: 0 });
            return { state: c.state };
        },
        template: '<p class="count">{{ state.count }}</p>'
    });
});

When(re('I create bindX reactive state'), function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
    assert.ok(c.state, 'setup() should have created the state');
});

Then(re('the state should be reactive'), function() {
    const c = vx(this);
    const seen = [];
    const stop = core(this).watch(() => c.state.count, (value) => seen.push(value));
    c.state.count = 41;
    c.state.count = 0;
    stop();
    assert.deepStrictEqual(seen, [41, 0], 'bindX should see writes made through the component state');
});

Then(re("Vue's template should display the state"), async function() {
    await tick();
    assert.strictEqual(vx(this).view.text(), '0');
});

Then(re('changes should trigger re-renders'), async function() {
    const c = vx(this);
    await tick();
    const before = c.updates;
    c.state.count++;
    await tick();
    assert.strictEqual(c.view.text(), '1');
    assert.strictEqual(c.updates, before + 1, 'one write should cause one re-render');
});

Given(re('a Vue component with setup()'), function() {
    const c = vx(this);
    c.Component = {
        setup() {
            const { reactive, computed, watch } = c.imports;
            const state = reactive({ n: 1 });
            const double = computed(() => state.n * 2);
            watch(() => state.n, (value) => c.log.push(value));
            c.state = state;
            return { double };
        },
        template: '<p>{{ double() }}</p>'
    };
});

When(re("I import { reactive, computed, watch } from '@genx/bindx-vue'"), function() {
    const c = vx(this);
    const { reactive, computed, watch } = A(this);
    c.imports = { reactive, computed, watch };
    c.view = mount(this, c.Component);
});

Then(re('all functions should be available'), function() {
    for (const [name, fn] of Object.entries(vx(this).imports)) {
        assert.strictEqual(typeof fn, 'function', `${name} should be a function`);
    }
});

Then(re('should work in Vue 3 context'), async function() {
    const c = vx(this);
    assert.strictEqual(c.view.text(), '2');
    c.state.n = 2;
    await tick();
    assert.strictEqual(c.view.text(), '4');
    assert.deepStrictEqual(c.log, [2]);
    noWarnings(this);
});

Then(re('TypeScript types should be correct'), function() {
    assertCompiles(`
const state = reactive({ count: 0, name: 'a' });
const double = computed(() => state.count * 2);
const n: number = double();
const stop: () => void = watch(() => state.name, (next: string, prev: string) => {});
stop();`);
    assertTypeError(`
const state = reactive({ count: 0 });
const label: string = computed(() => state.count)();`);
});

// ---------------------------------------------------------------- Reactivity interop

Given(re('bindX reactive state'), function() {
    // Created outside any component: plain bindX state
    vx(this).store = A(this).reactive({ count: 0 });
    assert.strictEqual(core(this).isReactive(vx(this).store), true);
});

When(re('I convert it to Vue ref'), function() {
    const c = vx(this);
    c.vref = scoped(this, () => A(this).toVueRef(() => c.store.count));
    setCheck(this, 'template should reactively update', async () => {
        const view = mount(this, { setup: () => ({ r: c.vref }), template: '<span>{{ r }}</span>' });
        assert.strictEqual(view.text(), String(c.store.count));
        c.store.count = 7;
        await tick();
        assert.strictEqual(view.text(), '7');
    });
});

Then(re('Vue should track the ref'), function() {
    const c = vx(this);
    assert.strictEqual(V().isRef(c.vref), true);
    c.vc = V().computed(() => c.vref.value * 10);
    assert.strictEqual(c.vc.value, 0);
});

Then(re('changes should trigger Vue updates'), function() {
    const c = vx(this);
    const seen = [];
    scoped(this, () => V().watch(c.vref, (value) => seen.push(value), { flush: 'sync' }));
    c.store.count = 5;
    assert.deepStrictEqual(seen, [5]);
    assert.strictEqual(c.vc.value, 50);
});

Then(re('template should reactively update'), async function() {
    await runCheck(this, 'template should reactively update');
});

Given(re('Vue ref'), function() {
    vx(this).vref = V().ref(1);
});

When(re('I convert it to bindX reactive state'), function() {
    const c = vx(this);
    c.bstate = scoped(this, () => A(this).fromVueRef(c.vref));
});

Then(re('bindX should track changes'), function() {
    const c = vx(this);
    assert.strictEqual(core(this).isReactive(c.bstate), true);
    assert.strictEqual(c.bstate.value, 1);
    c.vref.value = 2;
    assert.strictEqual(c.bstate.value, 2, 'the bindX value should follow the ref');
});

Then(re('watchers should work'), function() {
    const c = vx(this);
    const seen = [];
    const stop = core(this).watch(() => c.bstate.value, (value, old) => seen.push([value, old]));
    c.vref.value = 3;
    stop();
    assert.deepStrictEqual(seen, [[3, 2]]);
});

Then(re('computed properties should work'), function() {
    const c = vx(this);
    const double = core(this).computed(() => c.bstate.value * 2);
    assert.strictEqual(double(), 6);
    c.vref.value = 4;
    assert.strictEqual(double(), 8);
});

Given(re('component with both Vue refs and bindX state'), function() {
    const c = vx(this);
    const world = this;
    c.runs = { vue: 0, bindx: 0 };
    c.view = mount(this, {
        setup() {
            const vref = V().ref(0);
            const state = A(world).reactive({ n: 0 });
            const vueDouble = V().computed(() => { c.runs.vue++; return vref.value * 2; });
            const bindDouble = A(world).computed(() => { c.runs.bindx++; return state.n * 2; });
            Object.assign(c, { vref, state });
            return { vref, state, vueDouble, bindDouble };
        },
        template: '<p>{{ vref }}|{{ state.n }}|{{ vueDouble }}|{{ bindDouble() }}</p>'
    });
    c.changeEither = async () => {
        const start = { ...c.runs };
        c.vref.value = 1;
        await tick();
        c.afterVue = { text: c.view.text(), runs: { vue: c.runs.vue - start.vue, bindx: c.runs.bindx - start.bindx } };
        const mid = { ...c.runs };
        c.state.n = 2;
        await tick();
        c.afterBindX = { text: c.view.text(), runs: { vue: c.runs.vue - mid.vue, bindx: c.runs.bindx - mid.bindx } };
    };
    setCheck(this, 'no conflicts should occur', () => {
        noWarnings(this);
        assert.strictEqual(V().isReactive(c.state), false, 'Vue should not re-wrap bindX state');
        assert.strictEqual(core(this).isReactive(c.vref), false, 'bindX should not wrap Vue refs');
    });
});

When(re('either changes'), async function() {
    await vx(this).changeEither();
});

Then(re('both should update correctly'), function() {
    const c = vx(this);
    assert.strictEqual(c.afterVue.text, '1|0|2|0');
    assert.strictEqual(c.afterBindX.text, '1|2|2|4');
});

Then(re('no conflicts should occur'), async function() {
    await runCheck(this, 'no conflicts should occur');
});

Then(re('reactivity should work independently'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.afterVue.runs, { vue: 1, bindx: 0 }, 'a Vue ref change should not recompute bindX computeds');
    assert.strictEqual(c.afterBindX.runs.vue, 0, 'a bindX change should not recompute Vue computeds');
    assert.ok(c.afterBindX.runs.bindx >= 1);
});

// ---------------------------------------------------------------- Computed properties

Given(re('bindX state { count: 0 }'), function() {
    vx(this).spec = { count: 0 };
});

Given(re('bindX computed doubleCount'), function() {
    vx(this).wantDouble = true;
});

When(re('template displays {{ doubleCount() }}'), function() {
    const c = vx(this);
    const world = this;
    assert.ok(c.wantDouble);
    c.view = mount(this, {
        setup() {
            c.state = A(world).reactive({ ...c.spec });
            c.doubleCount = A(world).computed(() => c.state.count * 2);
            return { doubleCount: c.doubleCount };
        },
        template: '<p>{{ doubleCount() }}</p>'
    });
});

Then(re('it should show correct value'), function() {
    assert.strictEqual(vx(this).view.text(), '0');
});

When(re('count changes'), function() {
    vx(this).state.count = 3;
});

Then(re('doubleCount should update'), function() {
    assert.strictEqual(vx(this).doubleCount(), 6);
});

Then(re('template should re-render'), async function() {
    await tick();
    assert.strictEqual(vx(this).view.text(), '6');
});

Given(re('multiple bindX computed depending on each other'), function() {
    const c = vx(this);
    const world = this;
    c.runs = { subtotal: 0, tax: 0, total: 0, label: 0 };
    c.Component = {
        setup() {
            const { reactive, computed } = A(world);
            const state = reactive({ price: 10, qty: 2, note: 'x' });
            const subtotal = computed(() => { c.runs.subtotal++; return state.price * state.qty; });
            const tax = computed(() => { c.runs.tax++; return subtotal() / 10; });
            const total = computed(() => { c.runs.total++; return subtotal() + tax(); });
            const label = computed(() => { c.runs.label++; return state.note.toUpperCase(); });
            c.state = state;
            return { subtotal, tax, total, label };
        },
        template: '<p>{{ subtotal() }}|{{ tax() }}|{{ total() }}|{{ label() }}</p>'
    };
});

When(re('used in Vue template'), function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
});

Then(re('all computed should update correctly'), async function() {
    const c = vx(this);
    assert.strictEqual(c.view.text(), '20|2|22|X');
    c.state.price = 20;
    await tick();
    assert.strictEqual(c.view.text(), '40|4|44|X');
});

Then(re('only necessary recomputations occur'), async function() {
    const c = vx(this);
    const before = { ...c.runs };
    c.state.note = 'y';
    await tick();
    assert.strictEqual(c.runs.subtotal, before.subtotal, 'subtotal does not read note');
    assert.strictEqual(c.runs.tax, before.tax);
    assert.strictEqual(c.runs.total, before.total);
    assert.strictEqual(c.runs.label, before.label + 1, 'label recomputes once');
});

Then(re('Vue should track dependencies'), async function() {
    const c = vx(this);
    assert.strictEqual(c.view.text(), '40|4|44|Y');
    c.state.qty = 3;
    await tick();
    assert.strictEqual(c.view.text(), '60|6|66|Y');
});

Given(re('bindX computed and Vue computed'), function() {
    const c = vx(this);
    const world = this;
    c.Component = {
        setup() {
            c.state = A(world).reactive({ n: 2 });
            c.bx = A(world).computed(() => c.state.n * 3);
            c.vc = V().computed(() => c.state.n * 3);
            return { bx: c.bx, vc: c.vc };
        },
        template: '<p>{{ bx() }}|{{ vc }}</p>'
    };
});

When(re('both derive from same state'), function() {
    vx(this).view = mount(this, vx(this).Component);
});

Then(re('both should produce same results'), function() {
    const c = vx(this);
    assert.strictEqual(c.bx(), 6);
    assert.strictEqual(c.vc.value, 6);
    assert.strictEqual(c.view.text(), '6|6');
});

Then(re('both should be reactive'), async function() {
    const c = vx(this);
    c.state.n = 5;
    assert.strictEqual(c.bx(), 15);
    assert.strictEqual(c.vc.value, 15);
    await tick();
    assert.strictEqual(c.view.text(), '15|15');
});

Then(re('can be used interchangeably'), function() {
    const c = vx(this);
    const { toVueComputed } = A(this);
    assert.strictEqual(V().computed(() => c.bx() + 1).value, 16);
    assert.strictEqual(core(this).computed(() => c.vc.value + 1)(), 16);
    const asVue = scoped(this, () => toVueComputed(c.bx));
    assert.strictEqual(asVue.value, 15);
    c.state.n = 1;
    assert.strictEqual(asVue.value, 3, 'toVueComputed should follow the bindX computed');
});

When(re('Vue computed references bindX computed'), function() {
    const c = vx(this);
    scoped(this, () => {
        c.bx = A(this).computed(() => c.store.count + 1);
        c.vc = V().computed(() => c.bx() * 2);
    });
});

Then(re('Vue should track bindX dependencies'), function() {
    const c = vx(this);
    assert.strictEqual(c.vc.value, 2);
    c.store.count = 4;
    assert.strictEqual(c.vc.value, 10);
});

Then(re('updates should propagate correctly'), function() {
    const c = vx(this);
    const seen = [];
    scoped(this, () => V().watch(c.vc, (value) => seen.push(value), { flush: 'sync' }));
    c.store.count = 5;
    assert.deepStrictEqual(seen, [12]);
});

// ---------------------------------------------------------------- Watchers

Given(re('Vue component with bindX state'), function() {
    const c = vx(this);
    const world = this;
    c.setupHooks = [];
    c.Component = {
        setup() {
            c.state = A(world).reactive({ count: 0 });
            for (const hook of c.setupHooks) hook(c.state);
            return { state: c.state };
        },
        template: '<p>{{ state.count }}</p>'
    };
    c.baseline = watchers(this);
});

When(re('I create bindX watcher in setup()'), function() {
    const c = vx(this);
    c.setupHooks.push((state) => {
        A(this).watch(() => state.count, (value, old) => c.log.push([value, old]));
    });
    c.view = mount(this, c.Component);
});

Then(re('watcher should execute on changes'), function() {
    const c = vx(this);
    c.state.count = 1;
    c.state.count = 2;
    assert.strictEqual(c.log.length, 2);
});

Then(re('receive new and old values'), function() {
    assert.deepStrictEqual(vx(this).log, [[1, 0], [2, 1]]);
});

Then(re('auto-cleanup on unmount'), function() {
    const c = vx(this);
    assert.ok(watchers(this) > c.baseline);
    c.view.unmount();
    assert.strictEqual(watchers(this), c.baseline, 'unmount should stop every adapter watcher');
    c.state.count = 3;
    assert.strictEqual(c.log.length, 2, 'a stopped watcher should not run');
});

Given(re('same state watched by both'), function() {
    const c = vx(this);
    const world = this;
    c.bx = [];
    c.vue = [];
    c.baseline = watchers(this);
    c.view = mount(this, {
        setup() {
            c.state = A(world).reactive({ count: 0 });
            A(world).watch(() => c.state.count, (value, old) => c.bx.push([value, old]));
            V().watch(() => c.state.count, (value, old) => c.vue.push([value, old]));
            return {};
        },
        template: '<p></p>'
    });
});

When(re('state changes'), async function() {
    vx(this).state.count = 1;
    await tick();
    vx(this).state.count = 2;
    await tick();
});

Then(re('both watchers should execute'), function() {
    assert.strictEqual(vx(this).bx.length, 2);
    assert.strictEqual(vx(this).vue.length, 2);
});

Then(re('both should receive correct values'), function() {
    assert.deepStrictEqual(vx(this).bx, [[1, 0], [2, 1]]);
    assert.deepStrictEqual(vx(this).vue, [[1, 0], [2, 1]]);
});

Then(re('both should cleanup properly'), async function() {
    const c = vx(this);
    c.view.unmount();
    assert.strictEqual(watchers(this), c.baseline);
    c.state.count = 3;
    await tick();
    assert.strictEqual(c.bx.length, 2);
    assert.strictEqual(c.vue.length, 2);
});

Given(re('bindX state with initial value'), function() {
    vx(this).store = A(this).reactive({ count: 5 });
});

When(re('I create watcher with { immediate: true }'), function() {
    const c = vx(this);
    scoped(this, () => A(this).watch(() => c.store.count, (value, old) => c.log.push([value, old]), { immediate: true }));
});

Then(re('watcher executes immediately'), function() {
    assert.strictEqual(vx(this).log.length, 1);
});

Then(re('receives initial value'), function() {
    assert.deepStrictEqual(vx(this).log[0], [5, undefined]);
});

Then(re('continues watching changes'), function() {
    const c = vx(this);
    c.store.count = 6;
    assert.deepStrictEqual(c.log, [[5, undefined], [6, 5]]);
});

Given(re('bindX state with nested objects'), function() {
    vx(this).store = A(this).reactive({ user: { profile: { address: { city: 'Oslo' } }, tags: ['a'] } });
});

When(re('I create watcher with { deep: true }'), function() {
    const c = vx(this);
    scoped(this, () => A(this).watch(() => c.store.user, () => c.log.push(JSON.stringify(c.store.user)), { deep: true }));
});

Then(re('watcher reacts to nested changes'), function() {
    const c = vx(this);
    c.store.user.profile.address.city = 'Bergen';
    assert.strictEqual(c.log.length, 1);
    assert.ok(c.log[0].includes('Bergen'));
});

Then(re('all levels tracked correctly'), function() {
    const c = vx(this);
    c.store.user.tags.push('b');
    c.store.user.profile.address = { city: 'Tromso' };
    c.store.user.profile.address.city = 'Bodo';
    assert.strictEqual(c.log.length, 4);
    assert.ok(c.log[3].includes('Bodo') && c.log[3].includes('"b"'));
});

// ---------------------------------------------------------------- Lifecycle

Given(re('Vue component with onMounted lifecycle'), function() {
    const c = vx(this);
    c.baseline = watchers(this);
    c.Component = {
        setup() {
            const holder = V().shallowRef(null);
            V().onMounted(() => {
                c.mountedRan = true;
                if (c.initInMounted) holder.value = c.initInMounted();
            });
            return { holder };
        },
        template: '<p>{{ holder ? holder.n : "none" }}</p>'
    };
});

When(re('onMounted executes'), function() {
    vx(this).expectMounted = true;
});

When(re('I initialize bindX state'), function() {
    const c = vx(this);
    const world = this;
    c.initInMounted = () => {
        c.state = A(world).reactive({ n: 1 });
        A(world).watch(() => c.state.n, (value) => c.log.push(value));
        return c.state;
    };
    c.view = mount(this, c.Component);
    assert.strictEqual(c.mountedRan, c.expectMounted);
});

Then(re('state should be properly initialized'), async function() {
    const c = vx(this);
    assert.strictEqual(core(this).isReactive(c.state), false, 'component state is the Vue-tracked view of bindX state');
    assert.strictEqual(c.state.n, 1);
    await tick();
    assert.strictEqual(c.view.text(), '1');
    c.state.n = 2;
    await tick();
    assert.strictEqual(c.view.text(), '2', 'state made in onMounted should still be Vue-tracked');
});

Then(re('watchers should be active'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.log, [2]);
    assert.ok(watchers(this) > c.baseline);
    c.view.unmount();
    assert.strictEqual(watchers(this), c.baseline, 'watchers made in onMounted stop on unmount');
});

When(re('onUnmounted lifecycle executes'), function() {
    const c = vx(this);
    c.setupHooks.push((state) => {
        A(this).watch(() => state.count, (value) => c.log.push(value));
        A(this).watch(() => state.count * 2, (value) => c.log.push(value));
    });
    c.view = mount(this, c.Component);
    c.mountedWatchers = watchers(this);
    c.view.unmount();
});

Then(re('all bindX watchers should disconnect'), function() {
    const c = vx(this);
    assert.ok(c.mountedWatchers >= c.baseline + 3, 'two watchers plus the template bridge were active');
    assert.strictEqual(watchers(this), c.baseline);
    c.state.count = 9;
    assert.deepStrictEqual(c.log, []);
    // For the shared "no memory leaks should occur" step
    this.checkReleased = () => {
        assert.strictEqual(watchers(this), c.baseline);
        assert.strictEqual(c.view.el.isConnected, false);
    };
});

When(re('component mounts'), function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
});

When(re('state is initialized'), function() {
    assert.strictEqual(vx(this).state.count, 0);
});

Then(re('template should display initial state'), function() {
    assert.strictEqual(vx(this).view.text(), '0');
});

When(re('state changes during lifetime'), function() {
    const c = vx(this);
    c.state.count = 12;
    setCheck(this, 'template should reactively update', async () => {
        await tick();
        assert.strictEqual(c.view.text(), '12');
        c.state.count++;
        await tick();
        assert.strictEqual(c.view.text(), '13');
    });
});

// ---------------------------------------------------------------- Templates

function stateComponent(world, initial, template, extra = {}) {
    const c = vx(world);
    return Object.assign({
        setup() {
            c.state = A(world).reactive(JSON.parse(JSON.stringify(initial)));
            return { state: c.state };
        },
        template
    }, extra);
}

Given(re("bindX state { message: 'Hello' }"), function() {
    vx(this).spec = { message: 'Hello' };
});

When(re('template uses {{ state.message }}'), function() {
    const c = vx(this);
    c.view = mount(this, stateComponent(this, c.spec, '<p>{{ state.message }}</p>'));
});

Then(re("in Vue, it should display 'Hello'"), function() {
    assert.strictEqual(vx(this).view.text(), 'Hello');
});

When(re('state.message changes'), function() {
    const c = vx(this);
    c.state.message = 'Hej';
    setCheck(this, 'template should update', async () => {
        await tick();
        assert.strictEqual(c.view.text(), 'Hej');
    });
});

Then(re('template should update'), async function() {
    await runCheck(this, 'template should update');
});

Given(re("bindX state { inputValue: 'test' }"), function() {
    vx(this).spec = { inputValue: 'test' };
});

When(re('I use v-model="state.inputValue"'), function() {
    const c = vx(this);
    c.view = mount(this, stateComponent(this, c.spec, '<input v-model="state.inputValue"><p>{{ state.inputValue }}</p>'));
    c.input = c.view.find('input');
    assert.strictEqual(c.input.value, 'test');
});

Then(re('input changes should update state'), async function() {
    const c = vx(this);
    typeInto(c.input, 'typed');
    assert.strictEqual(c.state.inputValue, 'typed');
    await tick();
    assert.strictEqual(c.view.find('p').textContent, 'typed');
});

Then(re('state changes should update input'), async function() {
    const c = vx(this);
    c.state.inputValue = 'from state';
    await tick();
    assert.strictEqual(c.input.value, 'from state');
});

Then(re('two-way binding should work'), async function() {
    const c = vx(this);
    typeInto(c.input, 'round');
    await tick();
    c.state.inputValue += ' trip';
    await tick();
    assert.strictEqual(c.input.value, 'round trip');
    assert.strictEqual(c.view.find('p').textContent, 'round trip');
});

Given(re('bindX state { isVisible: true }'), function() {
    vx(this).spec = { isVisible: true };
});

When(re('I use v-if="state.isVisible"'), function() {
    const c = vx(this);
    c.view = mount(this, stateComponent(this, c.spec, '<div><p v-if="state.isVisible" class="content">shown</p></div>'));
});

Then(re('content should be visible'), function() {
    assert.ok(vx(this).view.find('.content'));
});

When(re('state.isVisible changes to false'), async function() {
    vx(this).state.isVisible = false;
    await tick();
});

Then(re('content should be hidden'), function() {
    assert.strictEqual(vx(this).view.find('.content'), null);
});

Given(re('bindX state { items: [1, 2, 3] }'), function() {
    vx(this).spec = { items: [1, 2, 3] };
});

When(re('I use v-for="item in state.items"'), function() {
    const c = vx(this);
    c.view = mount(this, stateComponent(this, c.spec, '<ul><li v-for="item in state.items" :key="item">{{ item }}</li></ul>'));
});

Then(re('loop should iterate over items'), function() {
    assert.deepStrictEqual(vx(this).view.findAll('li').map(li => li.textContent), ['1', '2', '3']);
});

When(re('items array changes'), async function() {
    const c = vx(this);
    c.state.items.push(4);
    c.state.items.splice(0, 1);
    await tick();
    c.afterMutate = c.view.findAll('li').map(li => li.textContent);
    c.state.items = [9, 8];
    await tick();
});

Then(re('loop should re-render'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.afterMutate, ['2', '3', '4'], 'push and splice should re-render');
    assert.deepStrictEqual(c.view.findAll('li').map(li => li.textContent), ['9', '8'], 'replacing the array should re-render');
});

Given(re('bindX computed property'), function() {
    const c = vx(this);
    const world = this;
    c.Component = {
        setup() {
            const { reactive, computed } = A(world);
            c.state = reactive({ items: [1, 2, 3, 4], limit: 2 });
            const visible = computed(() => c.state.items.filter(n => n <= c.state.limit));
            const hasItems = computed(() => visible().length > 0);
            const many = computed(() => visible().length > 2);
            return { visible, hasItems, many };
        },
        template: '<div><ul v-if="hasItems()"><li v-for="n in visible()" :key="n">{{ n }}</li></ul>' +
            '<p v-else class="empty">none</p><b v-show="many()" class="many">many</b></div>'
    };
});

When(re('used in v-if, v-show, v-for'), function() {
    vx(this).view = mount(this, vx(this).Component);
});

Then(re('directives should evaluate correctly'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.view.findAll('li').map(li => li.textContent), ['1', '2']);
    assert.strictEqual(c.view.find('.empty'), null);
    assert.strictEqual(c.view.find('.many').style.display, 'none');
});

Then(re('update reactively'), async function() {
    const c = vx(this);
    c.state.limit = 3;
    await tick();
    assert.deepStrictEqual(c.view.findAll('li').map(li => li.textContent), ['1', '2', '3']);
    assert.strictEqual(c.view.find('.many').style.display, '');
    c.state.limit = 0;
    await tick();
    assert.strictEqual(c.view.findAll('li').length, 0);
    assert.ok(c.view.find('.empty'));
});

// ---------------------------------------------------------------- Events

When(re('I use @click="state.count++"'), function() {
    const c = vx(this);
    c.view = mount(this, counted(this, stateComponent(this, c.spec, '<button @click="state.count++">{{ state.count }}</button>')));
    click(c.view.find('button'));
    setCheck(this, 'template should update', async () => {
        await tick();
        assert.strictEqual(c.view.text(), '1');
    });
});

Then(re('click should increment count'), function() {
    assert.strictEqual(vx(this).state.count, 1);
});

Then(re('reactivity should work'), async function() {
    const c = vx(this);
    const before = c.updates;
    click(c.view.find('button'));
    click(c.view.find('button'));
    await tick();
    assert.strictEqual(c.view.text(), '3');
    assert.strictEqual(c.updates, before + 1, 'two clicks in one tick should render once');
});

Given(re('component with methods'), function() {
    const c = vx(this);
    const world = this;
    c.Component = {
        setup() {
            c.state = A(world).reactive({ count: 0, history: [] });
            A(world).watch(() => c.state.count, (value) => c.log.push(value));
            return { state: c.state };
        },
        methods: {
            add(amount) {
                this.state.count += amount;
                this.state.history.push(amount);
            }
        },
        template: '<div><button @click="add(5)">add</button><p>{{ state.count }}:{{ state.history.join(",") }}</p></div>'
    };
});

When(re('methods modify bindX state'), function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
    click(c.view.find('button'));
    c.view.vm.add(2);
    setCheck(this, 'state should update', () => {
        assert.strictEqual(c.state.count, 7);
        assert.deepStrictEqual([...c.state.history], [5, 2]);
    });
});

Then(re('state should update'), async function() {
    await runCheck(this, 'state should update');
});

Then(re('template should react'), async function() {
    await tick();
    assert.strictEqual(vx(this).view.find('p').textContent, '7:5,2');
});

Then(re('watchers should trigger'), function() {
    assert.deepStrictEqual(vx(this).log, [5, 7]);
});

// ---------------------------------------------------------------- Props and emits

Given(re('parent with bindX state'), function() {
    const c = vx(this);
    const world = this;
    c.parentRenders = 0;
    c.Parent = (Child, template) => counted(this, {
        components: { Child },
        setup() {
            c.state = A(world).reactive({ count: 1, user: { name: 'Ada' } });
            c.parentSetup && c.parentSetup(c.state);
            return { state: c.state };
        },
        template
    });
});

When(re('passed to child component as prop'), function() {
    const c = vx(this);
    const Child = {
        props: { store: { type: Object, required: true } },
        setup(props) {
            c.childProps = props;
            return {};
        },
        template: '<button class="child" @click="store.count++">{{ store.user.name }}:{{ store.count }}</button>'
    };
    c.view = mount(this, c.Parent(Child, '<div><p class="parent">{{ state.count }}</p><Child :store="state" /></div>'));
});

Then(re('child should receive the state'), function() {
    const c = vx(this);
    assert.strictEqual(V().toRaw(c.childProps.store), V().toRaw(c.state), 'child gets the same state object');
    assert.strictEqual(c.view.find('.child').textContent, 'Ada:1');
});

Then(re('changes in child reflect in parent'), async function() {
    const c = vx(this);
    click(c.view.find('.child'));
    await tick();
    assert.strictEqual(c.state.count, 2);
    assert.strictEqual(c.view.find('.parent').textContent, '2');
});

Then(re('reactivity flows both ways'), async function() {
    const c = vx(this);
    c.state.user.name = 'Grace';
    c.state.count = 10;
    await tick();
    assert.strictEqual(c.view.find('.child').textContent, 'Grace:10');
    click(c.view.find('.child'));
    await tick();
    assert.strictEqual(c.view.find('.parent').textContent, '11');
});

Given(re('child component with typed props'), function() {
    const c = vx(this);
    c.Child = V().defineComponent({
        props: {
            user: {
                type: Object,
                required: true,
                validator: (value) => typeof value.name === 'string' && typeof value.age === 'number'
            }
        },
        template: '<p class="child">{{ user.name }} ({{ user.age }})</p>'
    });
});

When(re('parent passes bindX state'), async function() {
    const c = vx(this);
    const world = this;
    c.view = mount(this, {
        components: { Child: c.Child },
        setup() {
            c.state = A(world).reactive({ user: { name: 'Ada', age: 36 } });
            return { state: c.state };
        },
        template: '<Child :user="state.user" />'
    });
    await tick();
});

Then(re('TypeScript should validate types'), function() {
    const prelude = `
import { defineComponent, type PropType } from 'vue';
interface User { name: string; age: number }
const Child = defineComponent({ props: { user: { type: Object as PropType<User>, required: true } } });
type ChildProps = InstanceType<typeof Child>['$props'];
const state = reactive({ user: { name: 'Ada', age: 36 } as User });
`;
    assertCompiles(prelude + 'const ok: ChildProps = { user: state.user };');
    assertTypeError(prelude + "const bad: ChildProps = { user: { name: 'Ada', age: 'old' } };");
});

Then(re('runtime validation should work'), async function() {
    const c = vx(this);
    assert.strictEqual(c.view.text(), 'Ada (36)');
    noWarnings(this);
    c.state.user = { name: 'Bob' };
    await tick();
    assert.ok(c.warnings.some(w => /Invalid prop: custom validator check failed for prop "user"/.test(w)),
        `expected a prop validator warning, got ${JSON.stringify(c.warnings)}`);
});

Given(re('child component'), function() {
    const c = vx(this);
    c.Child = {
        props: { count: Number },
        emits: ['increment'],
        template: '<button class="child" @click="$emit(\'increment\', 5)">{{ count }}</button>'
    };
});

When(re('child emits event'), function() {
    const c = vx(this);
    const world = this;
    c.view = mount(this, {
        components: { Child: c.Child },
        setup() {
            c.state = A(world).reactive({ count: 0 });
            const onIncrement = (amount) => {
                c.log.push(amount);
                c.onIncrement(amount);
            };
            return { state: c.state, onIncrement };
        },
        template: '<Child :count="state.count" @increment="onIncrement" />'
    });
    c.onIncrement = () => {};
});

When(re('parent updates bindX state'), function() {
    const c = vx(this);
    c.onIncrement = (amount) => {
        c.state.count += amount;
    };
    click(c.view.find('.child'));
    setCheck(this, 'state should update', () => {
        assert.deepStrictEqual(c.log, [5]);
        assert.strictEqual(c.state.count, 5);
    });
});

Then(re('child should receive new prop'), async function() {
    const c = vx(this);
    await tick();
    assert.strictEqual(c.view.find('.child').textContent, '5');
    noWarnings(this);
});

// ---------------------------------------------------------------- Provide / inject

When(re("I provide('store', bindXState)"), function() {
    const c = vx(this);
    c.parentSetup = (state) => V().provide('store', state);
});

When(re('descendant injects store'), function() {
    const c = vx(this);
    const Leaf = {
        setup() {
            c.injected = V().inject('store');
            return { store: c.injected };
        },
        template: '<p class="leaf">{{ store.user.name }}:{{ store.count }}</p>'
    };
    const Middle = { components: { Leaf }, template: '<section><Leaf /></section>' };
    c.view = mount(this, c.Parent(Middle, '<div><Child /></div>'));
});

Then(re('descendant should access state'), function() {
    const c = vx(this);
    assert.strictEqual(V().toRaw(c.injected), V().toRaw(c.state));
    assert.strictEqual(c.view.find('.leaf').textContent, 'Ada:1');
});

Then(re('updates should propagate'), async function() {
    const c = vx(this);
    const before = c.updates;
    c.state.count = 2;
    c.state.user.name = 'Grace';
    await tick();
    assert.strictEqual(c.view.find('.leaf').textContent, 'Grace:2');
    assert.strictEqual(c.updates, before, 'the provider does not read the state, so only the descendant re-renders');
    c.injected.count = 3;
    assert.strictEqual(c.state.count, 3, 'writes through the injected store reach the provider');
});

Given(re('bindX state provided at root'), function() {
    const c = vx(this);
    const world = this;
    c.Root = (children) => ({
        components: children,
        setup() {
            c.state = A(world).reactive({ count: 0 });
            V().provide('store', c.state);
            return {};
        },
        template: '<div>' + Object.keys(children).map(n => `<${n} />`).join('') + '</div>'
    });
});

When(re('multiple descendants inject'), function() {
    const c = vx(this);
    c.injected = [];
    const make = (cls) => ({
        setup() {
            const store = V().inject('store');
            c.injected.push(store);
            return { store };
        },
        template: `<button class="${cls}" @click="store.count++">{{ store.count }}</button>`
    });
    c.view = mount(this, c.Root({ A1: make('a'), B1: make('b'), C1: { components: { D1: make('d') }, template: '<i><D1 /></i>' } }));
    setCheck(this, 'all share same state', () => {
        assert.strictEqual(c.injected.length, 3);
        for (const store of c.injected) assert.strictEqual(V().toRaw(store), V().toRaw(c.state));
    });
});

Then(re('all share same state'), async function() {
    await runCheck(this, 'all share same state');
});

Then(re('updates sync across components'), async function() {
    const c = vx(this);
    click(c.view.find('.a'));
    click(c.view.find('.d'));
    await tick();
    assert.strictEqual(c.state.count, 2);
    assert.deepStrictEqual(['.a', '.b', '.d'].map(s => c.view.find(s).textContent), ['2', '2', '2']);
});

// ---------------------------------------------------------------- Composables

Given(re('composable function using bindX'), function() {
    const c = vx(this);
    const world = this;
    c.shared = null;
    c.useCounter = A(this).createComposable(() => {
        const { reactive, computed, watch } = A(world);
        const state = reactive({ count: 0 });
        const double = computed(() => state.count * 2);
        watch(() => state.count, (value) => c.log.push(value));
        return { state, double, increment: () => state.count++ };
    });
    // Designed for sharing: one store created once, outside any component
    c.useShared = () => {
        if (!c.shared) c.shared = A(world).createStore({ hits: 0 });
        return c.shared;
    };
});

When(re('multiple components use the composable'), function() {
    const c = vx(this);
    c.instances = [];
    c.baseline = watchers(this);
    const Counter = {
        setup() {
            const counter = c.useCounter();
            const shared = c.useShared();
            c.instances.push({ counter, shared });
            return { counter, shared };
        },
        template: '<button @click="counter.increment(); shared.hits++">{{ counter.state.count }}/{{ counter.double() }}/{{ shared.hits }}</button>'
    };
    c.views = [mount(this, Counter), mount(this, Counter)];
});

Then(re('each should have independent state'), async function() {
    const c = vx(this);
    click(c.views[0].find('button'));
    click(c.views[0].find('button'));
    click(c.views[1].find('button'));
    await tick();
    assert.deepStrictEqual(c.instances.map(i => i.counter.state.count), [2, 1]);
    assert.strictEqual(c.views[0].text().split('/').slice(0, 2).join('/'), '2/4');
    assert.strictEqual(c.views[1].text().split('/').slice(0, 2).join('/'), '1/2');
});

Then(re('can share state if designed that way'), function() {
    const c = vx(this);
    assert.strictEqual(c.instances[0].shared, c.instances[1].shared);
    assert.strictEqual(c.shared.hits, 3);
    assert.deepStrictEqual(c.views.map(v => v.text().split('/')[2]), ['3', '3']);
});

Then(re('lifecycle should be managed correctly'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.log, [1, 2, 1], 'each instance has its own watcher');
    const active = watchers(this);
    c.views[0].unmount();
    const afterOne = watchers(this);
    assert.ok(afterOne < active, 'unmounting one component stops its composable watchers');
    c.instances[0].counter.state.count = 50;
    assert.deepStrictEqual(c.log, [1, 2, 1]);
    c.views[1].unmount();
    assert.ok(watchers(this) < afterOne);
    // The shared store outlives components by design
    c.shared.hits = 4;
    assert.strictEqual(c.shared.hits, 4);
});

Given(re('component using both'), function() {
    const c = vx(this);
    const world = this;
    // A Vue composable (refs, Vue watch) and a bindX composable used side by side
    c.useMouse = () => {
        const x = V().ref(0);
        const moves = V().ref(0);
        V().watch(x, () => moves.value++);
        return { x, moves };
    };
    c.useCart = () => {
        const { reactive, computed } = A(world);
        const cart = reactive({ items: [] });
        const total = computed(() => cart.items.reduce((sum, i) => sum + i.price, 0));
        return { cart, total };
    };
    c.Component = {
        setup() {
            Object.assign(c, c.useMouse(), c.useCart());
            const summary = V().computed(() => `${c.x.value}:${c.total()}`);
            return { x: c.x, moves: c.moves, cart: c.cart, total: c.total, summary };
        },
        template: '<p>{{ x }}|{{ moves }}|{{ cart.items.length }}|{{ total() }}|{{ summary }}</p>'
    };
});

When(re('used together in setup()'), async function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
    c.x.value = 5;
    c.cart.items.push({ price: 3 }, { price: 4 });
    await tick();
    setCheck(this, 'both should work correctly', () => {
        assert.strictEqual(c.view.text(), '5|1|2|7|5:7');
    });
    setCheck(this, 'no conflicts should occur', async () => {
        noWarnings(this);
        c.cart.items = [];
        await tick();
        assert.strictEqual(c.view.text(), '5|1|0|0|5:0');
        assert.strictEqual(c.moves.value, 1, 'bindX changes do not trigger the Vue watcher');
    });
});

Then(re('both should work correctly'), async function() {
    await runCheck(this, 'both should work correctly');
});

Given(re('composable: useCounter(), useTodos()'), function() {
    const c = vx(this);
    const world = this;
    c.useTodos = () => {
        const list = A(world).useArray([{ title: 'a', done: false }]);
        const remaining = A(world).computed(() => list.items().filter(t => !t.done).length);
        return Object.assign(list, { remaining });
    };
    c.Component = {
        setup() {
            c.counter = A(world).useCounter(10);
            c.todos = c.useTodos();
            return { counter: c.counter, todos: c.todos };
        },
        template: '<div><button class="inc" @click="counter.increment">{{ counter.count() }}</button>' +
            '<button class="dec" @click="counter.decrement">-</button>' +
            '<ul><li v-for="t in todos.items()" :key="t.title">{{ t.title }}</li></ul><b>{{ todos.remaining() }}</b></div>'
    };
});

When(re('components use these composables'), function() {
    const c = vx(this);
    c.baseline = watchers(this);
    c.view = mount(this, c.Component);
});

Then(re('bindX features should work'), function() {
    const c = vx(this);
    c.counter.increment();
    c.counter.increment();
    assert.strictEqual(c.counter.count(), 12);
    c.counter.reset();
    assert.strictEqual(c.counter.count(), 10);
    c.todos.push({ title: 'b', done: false });
    c.todos.push({ title: 'c', done: true });
    assert.strictEqual(c.todos.count(), 3);
    assert.strictEqual(c.todos.remaining(), 2);
    c.todos.remove(0);
    assert.strictEqual(c.todos.isEmpty(), false);
    assert.deepStrictEqual(c.todos.items().map(t => t.title), ['b', 'c']);
});

Then(re('Vue reactivity should integrate'), async function() {
    const c = vx(this);
    await tick();
    assert.strictEqual(c.view.find('.inc').textContent, '10');
    assert.deepStrictEqual(c.view.findAll('li').map(li => li.textContent), ['b', 'c']);
    assert.strictEqual(c.view.find('b').textContent, '1');
    click(c.view.find('.inc'));
    click(c.view.find('.inc'));
    click(c.view.find('.dec'));
    c.todos.clear();
    await tick();
    assert.strictEqual(c.view.find('.inc').textContent, '11');
    assert.strictEqual(c.view.findAll('li').length, 0);
    assert.strictEqual(c.view.find('b').textContent, '0');
    c.view.unmount();
    assert.strictEqual(watchers(this), c.baseline, 'composable bridges stop with the component');
});

Then(re('TypeScript should infer types'), function() {
    const code = `
const counter = useCounter(1);
const n: number = counter.count();
const todos = useArray([{ title: 'a', done: false }]);
const first: { title: string; done: boolean } = todos.items()[0];
todos.push({ title: 'b', done: true });
`;
    assertCompiles(code);
    assertTypeError("const counter = useCounter(1);\nconst s: string = counter.count();");
    assertTypeError("const todos = useArray([{ title: 'a', done: false }]);\ntodos.push({ title: 1, done: true });");
});

// ---------------------------------------------------------------- TypeScript

Given(re('TypeScript interface for state'), function() {
    vx(this).tsHeader = 'interface State { count: number; name: string; tags: string[] }\n';
});

When(re('I create bindX state with type'), function() {
    vx(this).tsBody = "const s = reactive<State>({ count: 0, name: 'Ada', tags: [] });\n";
});

Then(re('TypeScript should enforce safety'), function() {
    const c = vx(this);
    assertCompiles(`${c.tsHeader}${c.tsBody}s.count++; s.name = 'Grace'; s.tags.push('x');`);
    assertTypeError(`${c.tsHeader}${c.tsBody}s.count = 'one';`);
    assertTypeError(`${c.tsHeader}${c.tsBody}s.tags.push(1);`, 2345);
});

Then(re('IDE autocomplete should work'), function() {
    const c = vx(this);
    const names = completionsAfter(`${c.tsHeader}${c.tsBody}s.`);
    for (const name of ['count', 'name', 'tags']) {
        assert.ok(names.includes(name), `completions were ${names.join(',')}`);
    }
});

Then(re('type errors caught at compile time'), function() {
    const c = vx(this);
    assertTypeError(`${c.tsHeader}const bad = reactive<State>({ count: 0, name: 'Ada' });`, 2345);
    assertTypeError(`${c.tsHeader}${c.tsBody}s.missing = 1;`, 2339);
});

Given(re('typed bindX state'), function() {
    vx(this).tsBody = "interface State { count: number; label: string }\nconst s = reactive<State>({ count: 0, label: 'a' });\n";
});

When(re('I create computed properties'), function() {
    const c = vx(this);
    c.tsGood = `${c.tsBody}const doubled = computed(() => s.count * 2);\nconst n: number = doubled();\nconst upper = computed(() => s.label.toUpperCase());\nconst t: string = upper();`;
    c.tsBad = `${c.tsBody}const doubled = computed(() => s.count * 2);\nconst t: string = doubled();`;
});

Then(re('return types should be inferred'), function() {
    assertCompiles(vx(this).tsGood);
    assertTypeError(vx(this).tsBad);
});

Then(re('TypeScript should validate usage'), function() {
    const c = vx(this);
    assertTypeError(`${c.tsBody}const doubled = computed(() => s.count * 2);\ndoubled().toUpperCase();`, 2339);
});

When(re('I create watchers'), function() {
    const c = vx(this);
    c.tsGood = `${c.tsBody}const stop: () => void = watch(() => s.count, (next, prev) => { const d: number = next - prev; }, { immediate: true, deep: false });`;
    c.tsBad = `${c.tsBody}watch(() => s.count, (next: string) => next.length);`;
});

Then(re('callback types should be correct'), function() {
    assertTypeError(vx(this).tsBad, [2322, 2345]);
});

Then(re('TypeScript should validate'), function() {
    const c = vx(this);
    assertCompiles(c.tsGood);
    assertTypeError(`${c.tsBody}watch(() => s.count, () => {}, { immediate: 'yes' });`);
});

Given(re('generic component using bindX'), function() {
    const c = vx(this);
    c.tsGeneric = `
import { defineComponent, h, type PropType } from 'vue';
function useSelection<T>(items: T[]) {
  const s = reactive({ items, selected: null as T | null });
  const count = computed(() => s.items.length);
  return { s, count, select: (item: T) => { s.selected = item; } };
}
const List = defineComponent(<T extends { id: number }>(props: { items: T[] }) => {
  const sel = useSelection(props.items);
  return () => h('ul', sel.s.items.map(i => h('li', String(i.id))));
});
`;
    // The same generic component at runtime
    const world = this;
    c.List = V().defineComponent((props) => {
        const s = A(world).reactive({ items: props.items, selected: null });
        c.listState = s;
        return () => V().h('ul', s.items.map(i => V().h('li', { key: i.id }, `${i.id}:${i.name}`)));
    }, { props: ['items'] });
});

When(re('component receives typed props'), function() {
    const c = vx(this);
    c.tsUse = `
const sel = useSelection([{ id: 1, name: 'a' }]);
sel.select({ id: 2, name: 'b' });
const picked: { id: number; name: string } | null = sel.s.selected;
const rows = [{ id: 1, name: 'a' }];
const used = h(List, { items: rows });
`;
    c.view = mount(this, { components: { List: c.List }, template: '<List :items="[{ id: 1, name: \'a\' }, { id: 2, name: \'b\' }]" />' });
});

Then(re('TypeScript should infer all types'), function() {
    const c = vx(this);
    assertCompiles(c.tsGeneric + c.tsUse);
    assert.deepStrictEqual(c.view.findAll('li').map(li => li.textContent), ['1:a', '2:b']);
});

Then(re('type safety should be maintained'), async function() {
    const c = vx(this);
    assertTypeError(c.tsGeneric + "const sel = useSelection([{ id: 1, name: 'a' }]);\nsel.select({ id: 'x', name: 'b' });");
    assertTypeError(c.tsGeneric + "const bad = h(List, { items: [{ name: 'no id' }] });", [2322, 2345, 2769]);
    c.listState.items.push({ id: 3, name: 'c' });
    await tick();
    assert.strictEqual(c.view.findAll('li').length, 3);
});

// ---------------------------------------------------------------- Options API

Given(re('component using Options API'), function() {
    vx(this).baseline = watchers(this);
});

When(re('I use bindX in data()'), function() {
    const c = vx(this);
    const world = this;
    c.view = mount(this, counted(this, {
        data() {
            return { state: A(world).reactive({ count: 0, user: { name: 'Ada' } }) };
        },
        methods: {
            increment() {
                this.state.count++;
            },
            rename(name) {
                this.state.user.name = name;
            }
        },
        template: '<button @click="increment">{{ state.user.name }}:{{ state.count }}</button>'
    }));
    c.vm = c.view.vm;
    setCheck(this, 'template should update', async () => {
        await tick();
        assert.strictEqual(c.view.text(), 'Grace:2');
    });
});

Then(re('state should be reactive'), function() {
    const c = vx(this);
    assert.strictEqual(V().isReactive(c.vm.state), false, 'Vue should not wrap the bindX state again');
    const seen = [];
    scoped(this, () => A(this).watch(() => c.vm.state.count, (value) => seen.push(value)));
    c.vm.state.count = 1;
    assert.deepStrictEqual(seen, [1], 'bindX tracks writes through this.state');
});

Then(re('this.state should work'), function() {
    const c = vx(this);
    c.vm.increment();
    c.vm.rename('Grace');
    assert.strictEqual(c.vm.state.count, 2);
    assert.strictEqual(c.vm.$data.state.user.name, 'Grace');
});

Given(re('Options API component'), function() {
    const c = vx(this);
    const world = this;
    c.baseline = watchers(this);
    c.runs = 0;
    c.vueRuns = 0;
    c.options = {
        data() {
            const state = A(world).reactive({ count: 1 });
            return { state, bxDouble: A(world).computed(() => { c.runs++; return state.count * 2; }) };
        },
        template: '<p>{{ state.count }}|{{ label }}</p>'
    };
});

When(re('bindX computed in computed: {}'), function() {
    const c = vx(this);
    c.view = mount(this, Object.assign({}, c.options, {
        computed: {
            double() {
                return this.bxDouble();
            },
            label() {
                c.vueRuns++;
                return `x${this.double}`;
            }
        }
    }));
    c.vm = c.view.vm;
});

Then(re('computed should work'), async function() {
    const c = vx(this);
    assert.strictEqual(c.vm.double, 2);
    assert.strictEqual(c.view.text(), '1|x2');
    c.vm.state.count = 4;
    assert.strictEqual(c.vm.double, 8);
    await tick();
    assert.strictEqual(c.view.text(), '4|x8');
});

Then(re('integrate with Vue computed'), async function() {
    const c = vx(this);
    const { runs, vueRuns } = c;
    void c.vm.label;
    void c.vm.label;
    assert.strictEqual(c.vueRuns, vueRuns, 'Vue caches the computed until bindX state changes');
    assert.strictEqual(c.runs, runs);
    c.vm.state.count = 5;
    assert.strictEqual(c.vm.label, 'x10');
    assert.strictEqual(c.vueRuns, vueRuns + 1);
});

When(re('bindX watcher in watch: {}'), function() {
    const c = vx(this);
    const world = this;
    c.vueLog = [];
    c.view = mount(this, Object.assign({}, c.options, {
        computed: { label() { return `x${this.bxDouble()}`; } },
        watch: {
            // Vue's watch option, tracking the bindX state through Vue
            'state.count'(value, old) {
                c.vueLog.push([value, old]);
            }
        },
        created() {
            // A bindX watcher made with the adapter, stopped with the component
            A(world).watch(() => this.state.count, (value, old) => c.log.push([value, old]));
        }
    }));
    c.vm = c.view.vm;
});

Then(re('watcher should execute'), async function() {
    const c = vx(this);
    c.vm.state.count = 2;
    await tick();
    c.vm.state.count = 3;
    await tick();
    assert.deepStrictEqual(c.log, [[2, 1], [3, 2]]);
    assert.deepStrictEqual(c.vueLog, [[2, 1], [3, 2]]);
});

Then(re('lifecycle should be managed'), async function() {
    const c = vx(this);
    c.view.unmount();
    assert.strictEqual(watchers(this), c.baseline);
    c.vm.state.count = 9;
    await tick();
    assert.strictEqual(c.log.length, 2);
    assert.strictEqual(c.vueLog.length, 2);
});

// ---------------------------------------------------------------- SFC

Given(re('component with scoped styles'), function() {
    vx(this).sfc = `
<script setup>
import { reactive } from '@genx/bindx-vue';
const state = reactive({ active: false });
defineExpose({ state });
</script>
<template>
  <p class="label" :class="{ active: state.active }" @click="state.active = !state.active">label</p>
</template>
<style scoped>
.label { color: rgb(0, 0, 255); }
.active { color: rgb(255, 0, 0); }
</style>`;
});

When(re('bindX state controls classes'), async function() {
    const c = vx(this);
    const { component, id } = compileSFC(this, c.sfc);
    c.scopeAttr = `data-v-${id}`;
    c.view = mount(this, component);
    // An unscoped element with the same classes, outside the component
    c.outside = document.createElement('p');
    c.outside.className = 'label active';
    document.body.appendChild(c.outside);
    this.ad.cleanups.push(() => c.outside.remove());
    c.p = c.view.find('p');
    c.before = window.getComputedStyle(c.p).color;
    click(c.p);
    await tick();
});

Then(re('styles should apply correctly'), async function() {
    const c = vx(this);
    assert.strictEqual(c.before, 'rgb(0, 0, 255)');
    assert.ok(c.p.classList.contains('active'));
    assert.strictEqual(window.getComputedStyle(c.p).color, 'rgb(255, 0, 0)');
    c.view.vm.state.active = false;
    await tick();
    assert.strictEqual(window.getComputedStyle(c.p).color, 'rgb(0, 0, 255)');
});

Then(re('scoping should work'), function() {
    const c = vx(this);
    assert.ok(c.p.hasAttribute(c.scopeAttr), 'the element carries the scope attribute');
    assert.ok(!c.outside.hasAttribute(c.scopeAttr));
    assert.notStrictEqual(window.getComputedStyle(c.outside).color, 'rgb(255, 0, 0)', 'scoped styles stay in the component');
});

// ---------------------------------------------------------------- Mixing with Vue reactivity

Given(re('component with both'), function() {
    const c = vx(this);
    const world = this;
    c.runs = { vue: 0, bindx: 0 };
    c.view = mount(this, {
        setup() {
            const { reactive, computed, fromVueRef } = A(world);
            const vref = V().ref(1);
            const state = reactive({ n: 10 });
            // Vue computed reading bindX; bindX computed reading the Vue ref through fromVueRef
            const mirrored = fromVueRef(vref);
            const vueSum = V().computed(() => { c.runs.vue++; return vref.value + state.n; });
            const bindProduct = computed(() => { c.runs.bindx++; return mirrored.value * state.n; });
            Object.assign(c, { vref, state, vueSum, bindProduct });
            return { vref, state, vueSum, bindProduct };
        },
        template: '<p>{{ vref }}|{{ state.n }}|{{ vueSum }}|{{ bindProduct() }}</p>'
    });
    c.changeEither = async () => {
        c.start = c.view.text();
        c.vref.value = 2;
        await tick();
        c.afterVue = c.view.text();
        c.state.n = 20;
        await tick();
        c.afterBindX = c.view.text();
    };
});

Then(re('both should update independently'), function() {
    const c = vx(this);
    assert.strictEqual(c.start, '1|10|11|10');
    assert.strictEqual(c.afterVue, '2|10|12|20');
    assert.strictEqual(c.afterBindX, '2|20|22|40');
});

Then(re('can reference each other'), function() {
    const c = vx(this);
    assert.strictEqual(c.vueSum.value, 22, 'Vue computed reads bindX state');
    assert.strictEqual(c.bindProduct(), 40, 'bindX computed reads the Vue ref via fromVueRef');
});

Then(re('no reactivity conflicts'), async function() {
    const c = vx(this);
    noWarnings(this);
    const runs = { ...c.runs };
    await tick();
    void c.vueSum.value;
    void c.bindProduct();
    assert.deepStrictEqual(c.runs, runs, 'no extra recomputation without a change');
    assert.strictEqual(V().isRef(c.state), false);
    assert.strictEqual(core(this).isReactive(c.vref), false);
});

Given(re('component using both systems'), function() {
    const c = vx(this);
    const world = this;
    c.view = mount(this, {
        setup() {
            c.vstate = V().reactive({ a: 1, child: null });
            c.bstate = A(world).reactive({ b: 1, list: [] });
            // bindX state stored inside Vue reactive state
            c.vstate.child = c.bstate;
            const total = V().computed(() => c.vstate.a + c.bstate.b + c.vstate.child.list.length);
            return { vstate: c.vstate, bstate: c.bstate, total };
        },
        template: '<p>{{ vstate.a }}|{{ bstate.b }}|{{ vstate.child.list.join(",") }}|{{ total }}</p>'
    });
});

When(re('state changes in either'), async function() {
    const c = vx(this);
    c.vstate.a = 2;
    await tick();
    c.afterVue = c.view.text();
    c.bstate.b = 5;
    c.vstate.child.list.push('x');
    await tick();
    c.afterBoth = c.view.text();
    setCheck(this, 'both should work correctly', () => {
        assert.strictEqual(c.afterVue, '2|1||3');
        assert.strictEqual(c.afterBoth, '2|5|x|8');
    });
});

Then(re('can be used together safely'), async function() {
    const c = vx(this);
    noWarnings(this);
    assert.strictEqual(V().isReactive(c.vstate.child), false, 'Vue keeps the bindX state as is');
    assert.strictEqual(c.vstate.child, c.bstate);
    const seen = [];
    scoped(this, () => A(this).watch(() => c.bstate.list.length, (n) => seen.push(n)));
    c.vstate.child.list.push('y');
    assert.deepStrictEqual(seen, [2], 'bindX sees writes made through the Vue state');
    await tick();
    assert.strictEqual(c.view.text(), '2|5|x,y|9');
});

Given(re('utilities: toVueRef(), toVueReactive()'), function() {
    const c = vx(this);
    assert.strictEqual(typeof A(this).toVueRef, 'function');
    assert.strictEqual(typeof A(this).toVueReactive, 'function');
    // A plain bindX store made outside any component
    c.store = core(this).reactive({ count: 0, items: [] });
    c.baseline = watchers(this);
});

When(re('converting bindX to Vue'), function() {
    const c = vx(this);
    const world = this;
    c.view = mount(this, {
        setup() {
            c.countRef = A(world).toVueRef(() => c.store.count);
            c.vstate = A(world).toVueReactive(c.store);
            return { countRef: c.countRef, vstate: c.vstate };
        },
        template: '<p>{{ countRef }}|{{ vstate.items.length }}</p>'
    });
});

Then(re('conversion should maintain reactivity'), async function() {
    const c = vx(this);
    assert.ok(V().isRef(c.countRef));
    c.store.count = 3;
    c.store.items.push('a');
    await tick();
    assert.strictEqual(c.view.text(), '3|1');
});

Then(re('changes should sync'), async function() {
    const c = vx(this);
    c.vstate.count = 7;
    assert.strictEqual(c.store.count, 7, 'writes through the Vue view reach the bindX store');
    assert.strictEqual(c.countRef.value, 7);
    c.vstate.items.splice(0);
    await tick();
    assert.strictEqual(c.view.text(), '7|0');
});

Then(re('both systems track correctly'), async function() {
    const c = vx(this);
    const vueSeen = [];
    const bindSeen = [];
    scoped(this, () => {
        V().watch(c.countRef, (n) => vueSeen.push(n), { flush: 'sync' });
        A(this).watch(() => c.store.count, (n) => bindSeen.push(n));
    });
    c.store.count = 8;
    c.vstate.count = 9;
    assert.deepStrictEqual(vueSeen, [8, 9]);
    assert.deepStrictEqual(bindSeen, [8, 9]);
    c.view.unmount();
    c.store.count = 10;
    assert.strictEqual(c.countRef.value, 9, 'the ref stops following after unmount');
});

// ---------------------------------------------------------------- Rendering work and laziness (no timings)

Given(re('component with 1000 reactive properties'), function() {
    const c = vx(this);
    const world = this;
    const initial = { clicks: 0 };
    for (let i = 0; i < 1000; i++) initial[`p${i}`] = 0;
    c.view = mount(this, counted(this, {
        setup() {
            c.state = A(world).reactive(initial);
            const sum = A(world).computed(() => {
                let total = 0;
                for (let i = 0; i < 1000; i++) total += c.state[`p${i}`];
                return total;
            });
            return { state: c.state, sum };
        },
        template: '<div><b>{{ sum() }}</b><button @click="state.clicks++">{{ state.clicks }}</button></div>'
    }));
});

When(re('properties update frequently'), async function() {
    const c = vx(this);
    c.before = c.updates;
    for (let round = 1; round <= 5; round++) {
        for (let i = 0; i < 1000; i++) c.state[`p${i}`] = round;
    }
    await tick();
});

Then(re('updates should be efficient'), function() {
    const c = vx(this);
    assert.strictEqual(c.updates - c.before, 1, '5000 writes in one tick should render once');
    assert.strictEqual(c.view.find('b').textContent, '5000');
});

Then(re('UI should remain responsive'), async function() {
    const c = vx(this);
    click(c.view.find('button'));
    await tick();
    assert.strictEqual(c.view.find('button').textContent, '1');
});

Given(re('bindX computed properties'), function() {
    const c = vx(this);
    const world = this;
    c.runs = { shown: 0, hidden: 0 };
    c.Component = {
        setup() {
            const { reactive, computed } = A(world);
            c.state = reactive({ n: 1 });
            const shown = computed(() => { c.runs.shown++; return c.state.n + 1; });
            const hidden = computed(() => { c.runs.hidden++; return c.state.n * 100; });
            c.hidden = hidden;
            return { shown, hidden };
        },
        template: '<p>{{ shown() }}</p>'
    };
});

When(re('not accessed in template'), async function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
    c.state.n = 2;
    await tick();
    c.state.n = 3;
    await tick();
});

Then(re('should not execute'), function() {
    assert.strictEqual(vx(this).runs.hidden, 0, 'a computed nobody reads never runs');
});

Then(re('only accessed computed recalculate'), function() {
    const c = vx(this);
    assert.strictEqual(c.view.text(), '4');
    assert.strictEqual(c.runs.shown, 3, 'once per state value');
    assert.strictEqual(c.hidden(), 300);
    assert.strictEqual(c.runs.hidden, 1);
});

// ---------------------------------------------------------------- Teleport

Given(re('component using <Teleport>'), function() {
    const c = vx(this);
    c.target = document.createElement('div');
    c.target.id = 'vx-modal-target';
    document.body.appendChild(c.target);
    this.ad.cleanups.push(() => c.target.remove());
});

When(re('bindX state controls teleported content'), async function() {
    const c = vx(this);
    c.view = mount(this, stateComponent(this, { open: false, title: 'Hi' },
        '<div><button @click="state.open = !state.open">toggle</button>' +
        '<Teleport to="#vx-modal-target"><div v-if="state.open" class="modal">{{ state.title }}</div></Teleport></div>'));
    await tick();
});

Then(re('reactivity should work correctly'), async function() {
    const c = vx(this);
    assert.strictEqual(c.target.querySelector('.modal'), null);
    click(c.view.find('button'));
    await tick();
    assert.ok(c.target.querySelector('.modal'), 'the modal renders into the teleport target');
    assert.strictEqual(c.view.find('.modal'), null, 'not inside the component root');
});

Then(re('state should update teleported content'), async function() {
    const c = vx(this);
    c.state.title = 'Updated';
    await tick();
    assert.strictEqual(c.target.querySelector('.modal').textContent, 'Updated');
    c.state.open = false;
    await tick();
    assert.strictEqual(c.target.querySelector('.modal'), null);
});

// ---------------------------------------------------------------- Suspense and async setup

Given(re('async component using bindX'), function() {
    const c = vx(this);
    const world = this;
    c.baseline = watchers(this);
    c.Async = V().defineAsyncComponent(() => new Promise((resolve) => setTimeout(() => resolve({
        setup() {
            c.state = A(world).reactive({ items: ['a', 'b'], loadedAt: 'ready' });
            c.count = A(world).computed(() => c.state.items.length);
            A(world).watch(() => c.state.items.length, (n) => c.log.push(n));
            return { state: c.state, count: c.count };
        },
        template: '<p class="async">{{ state.loadedAt }}:{{ count() }}</p>'
    }), 5)));
});

When(re('wrapped in <Suspense>'), async function() {
    const c = vx(this);
    c.view = mount(this, {
        components: { Async: c.Async },
        template: '<Suspense><Async /><template #fallback><p class="fallback">loading</p></template></Suspense>'
    });
    c.fallbackShown = !!c.view.find('.fallback');
    await tick(20);
});

Then(re('bindX should work after loading'), async function() {
    const c = vx(this);
    assert.ok(c.fallbackShown, 'Suspense shows the fallback while loading');
    assert.strictEqual(c.view.find('.fallback'), null);
    c.state.items.push('c');
    await tick();
    assert.strictEqual(c.view.find('.async').textContent, 'ready:3');
    assert.deepStrictEqual(c.log, [3]);
});

Then(re('state should initialize correctly'), function() {
    const c = vx(this);
    assert.deepStrictEqual([...c.state.items], ['a', 'b', 'c']);
    assert.ok(watchers(this) > c.baseline, 'the loaded component owns live watchers');
    c.view.unmount();
    assert.strictEqual(watchers(this), c.baseline);
});

Given(re('component with async setup()'), function() {
    const c = vx(this);
    const world = this;
    c.fetchData = () => new Promise((resolve) => setTimeout(() => resolve([{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]), 5));
    c.Loader = {
        async setup() {
            // Adapter state is made before the first await, while the component is current
            c.state = A(world).reactive({ users: [], status: 'loading' });
            c.names = A(world).computed(() => c.state.users.map(u => u.name).join(','));
            const users = await c.fetchData();
            c.afterAwait(users);
            return { state: c.state, names: c.names };
        },
        template: '<p class="users">{{ state.status }}|{{ names() }}</p>'
    };
});

When(re('await fetchData()'), function() {
    const c = vx(this);
    c.afterAwait = () => {};
    c.awaited = true;
});

When(re('set bindX state'), async function() {
    const c = vx(this);
    c.afterAwait = (users) => {
        c.state.users = users;
        c.state.status = 'done';
    };
    c.view = mount(this, {
        components: { Loader: c.Loader },
        template: '<Suspense><Loader /><template #fallback><p class="fallback">loading</p></template></Suspense>'
    });
    await tick(20);
});

Then(re('component should display data'), function() {
    const c = vx(this);
    assert.ok(c.awaited);
    assert.strictEqual(c.view.find('.users').textContent, 'done|Ada,Grace');
});

Then(re('reactivity should work after load'), async function() {
    const c = vx(this);
    c.state.users.push({ id: 3, name: 'Linus' });
    await tick();
    assert.strictEqual(c.view.find('.users').textContent, 'done|Ada,Grace,Linus');
    noWarnings(this);
});

// ---------------------------------------------------------------- Transitions

function transitionHooks(c) {
    c.hooks = [];
    return {
        onBeforeEnter: (el) => c.hooks.push(`before-enter:${el.textContent}`),
        onEnter: (el, done) => { c.hooks.push(`enter:${el.textContent}`); setTimeout(done, 5); },
        onAfterEnter: (el) => c.hooks.push(`after-enter:${el.textContent}`),
        onLeave: (el, done) => { c.hooks.push(`leave:${el.textContent}`); setTimeout(done, 5); },
        onAfterLeave: (el) => c.hooks.push(`after-leave:${el.textContent}`)
    };
}

Given(re('component with <Transition>'), function() {
    const c = vx(this);
    const world = this;
    c.Component = {
        setup() {
            c.state = A(world).reactive({ show: false });
            return { state: c.state, hooks: transitionHooks(c) };
        },
        template: '<div><Transition :css="false" v-bind="hooks"><p v-if="state.show" class="panel">panel</p></Transition></div>'
    };
});

When(re('bindX state controls visibility'), async function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
    c.state.show = true;
    await tick(20);
});

Then(re('transitions should play correctly'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.hooks, ['before-enter:panel', 'enter:panel', 'after-enter:panel']);
    assert.ok(c.view.find('.panel'));
});

Then(re('state changes should trigger transitions'), async function() {
    const c = vx(this);
    c.hooks.length = 0;
    c.state.show = false;
    await tick();
    assert.deepStrictEqual(c.hooks, ['leave:panel']);
    assert.ok(c.view.find('.panel'), 'the element stays until the leave finishes');
    await tick(20);
    assert.deepStrictEqual(c.hooks, ['leave:panel', 'after-leave:panel']);
    assert.strictEqual(c.view.find('.panel'), null);
});

Given(re('bindX computed controlling animation'), function() {
    const c = vx(this);
    const world = this;
    c.Component = {
        setup() {
            c.state = A(world).reactive({ score: 1 });
            c.level = A(world).computed(() => (c.state.score > 5 ? 'high' : 'low'));
            return { level: c.level, hooks: transitionHooks(c) };
        },
        template: '<div><Transition :css="false" mode="out-in" v-bind="hooks"><p :key="level()" class="level">{{ level() }}</p></Transition></div>'
    };
});

When(re('computed value changes'), async function() {
    const c = vx(this);
    c.view = mount(this, c.Component);
    await tick();
    c.hooks.length = 0;
    c.state.score = 9;
    await tick(40);
});

Then(re('animation should trigger'), function() {
    const c = vx(this);
    // out-in: the new element is inserted (before-enter) as the leave
    // completes, and enters only after the old one has left
    assert.deepStrictEqual(c.hooks, ['leave:low', 'before-enter:high', 'after-leave:low', 'enter:high', 'after-enter:high']);
    assert.strictEqual(c.view.find('.level').textContent, 'high');
});

Then(re('reactivity should work smoothly'), async function() {
    const c = vx(this);
    c.hooks.length = 0;
    c.state.score = 7;
    await tick(40);
    assert.deepStrictEqual(c.hooks, [], 'a change that keeps the computed value does not animate');
    c.state.score = 2;
    await tick(40);
    assert.strictEqual(c.hooks.filter(h => h.startsWith('enter:')).join(), 'enter:low');
    assert.strictEqual(c.view.findAll('.level').length, 1);
});

// ---------------------------------------------------------------- Custom directives

Given(re('custom directive using bindX'), function() {
    const c = vx(this);
    c.directives = {
        // v-highlight="color": reads bindX state through its binding
        highlight: {
            mounted: (el, binding) => { el.style.color = binding.value; },
            updated: (el, binding) => { el.style.color = binding.value; }
        },
        // v-count-clicks="state": writes to the bindX state it is given
        countClicks: {
            mounted(el, binding) {
                el._vxClick = () => { binding.value.clicks++; };
                el.addEventListener('click', el._vxClick);
            },
            unmounted(el) {
                el.removeEventListener('click', el._vxClick);
            }
        }
    };
});

When(re('directive accesses bindX state'), function() {
    const c = vx(this);
    c.view = mount(this, Object.assign(stateComponent(this, { color: 'red', clicks: 0 },
        '<p v-highlight="state.color" v-count-clicks="state">{{ state.clicks }}</p>'), { directives: c.directives }));
    c.p = c.view.find('p');
    assert.strictEqual(c.p.style.color, 'red');
});

Then(re('directive should react to changes'), async function() {
    const c = vx(this);
    c.state.color = 'blue';
    await tick();
    assert.strictEqual(c.p.style.color, 'blue');
});

Then(re('can modify bindX state'), async function() {
    const c = vx(this);
    click(c.p);
    click(c.p);
    assert.strictEqual(c.state.clicks, 2);
    await tick();
    assert.strictEqual(c.p.textContent, '2');
});

// ---------------------------------------------------------------- Errors

Given(re('computed property that throws'), function() {
    const c = vx(this);
    const world = this;
    const Risky = {
        setup() {
            const root = A(world).computed(() => {
                if (c.state.value < 0) throw new Error('negative input');
                return Math.sqrt(c.state.value);
            });
            return { root };
        },
        template: '<b class="risky">{{ root() }}</b>'
    };
    c.Component = {
        components: { Risky },
        setup() {
            c.state = A(world).reactive({ value: 4, clicks: 0 });
            return { state: c.state };
        },
        template: '<div><button @click="state.clicks++">{{ state.clicks }}</button><Risky /></div>'
    };
});

When(re('accessed in template'), async function() {
    const c = vx(this);
    c.view = mount(this, c.Component, { errors: true });
    assert.strictEqual(c.view.find('.risky').textContent, '2');
    c.state.value = -1;
    await tick();
    setCheck(this, 'error should be caught', () => {
        assert.strictEqual(c.logged.length, 1, 'the render error reaches the app error handler, not the caller');
        assert.strictEqual(c.logged[0].err.message, 'negative input');
    });
});

Then(re('error should be caught'), async function() {
    await runCheck(this, 'error should be caught');
});

Then(re('component should not crash'), async function() {
    const c = vx(this);
    if (c.componentCheck) return c.componentCheck();
    click(c.view.find('button'));
    await tick();
    assert.strictEqual(c.view.find('button').textContent, '1', 'the rest of the app keeps rendering');
    c.state.value = 9;
    await tick();
    assert.strictEqual(c.view.find('.risky') && c.view.find('.risky').textContent, '3', 'the computed recovers once its input is valid');
});

Then(re('error should be logged'), function() {
    const c = vx(this);
    assert.ok(/render/.test(c.logged[0].info), `logged with Vue's error info, got ${c.logged[0].info}`);
});

Given(re('watcher callback that throws'), function() {
    const c = vx(this);
    const world = this;
    captureErrors(this);
    c.Component = {
        setup() {
            c.state = A(world).reactive({ n: 0 });
            A(world).watch(() => c.state.n, () => { throw new Error('watcher failed'); });
            A(world).watch(() => c.state.n, (n) => c.log.push(n));
            return { state: c.state };
        },
        template: '<p>{{ state.n }}</p>'
    };
    c.view = mount(this, c.Component, { errors: true });
});

When(re('watcher executes'), function() {
    vx(this).state.n = 1;
    setCheck(this, 'error should be caught', () => {
        const c = vx(this);
        assert.ok(c.errors.some(args => args[0] === 'bindX: watcher callback threw' && args[1].message === 'watcher failed'),
            `errors were ${JSON.stringify(c.errors.map(a => String(a[0])))}`);
        assert.deepStrictEqual(c.logged, [], 'the write itself did not throw into Vue');
    });
});

Then(re('other watchers continue'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.log, [1]);
    c.state.n = 2;
    assert.deepStrictEqual(c.log, [1, 2]);
});

Then(re('component remains stable'), async function() {
    const c = vx(this);
    await tick();
    assert.strictEqual(c.view.text(), '2');
    c.state.n = 3;
    await tick();
    assert.strictEqual(c.view.text(), '3');
});

// ---------------------------------------------------------------- @vue/test-utils

const VTU = () => require('@vue/test-utils');

function vtuMount(world, component, options) {
    const wrapper = VTU().mount(component, options);
    world.ad.cleanups.push(() => wrapper.unmount());
    return wrapper;
}

Given(re('test suite using @vue/test-utils'), function() {
    const vtu = VTU();
    assert.strictEqual(typeof vtu.mount, 'function');
    assert.strictEqual(require('@vue/test-utils/package.json').version.split('.')[0], '2');
});

When(re('testing component with bindX'), function() {
    const c = vx(this);
    c.wrapper = vtuMount(this, stateComponent(this, { count: 0 },
        '<div><span class="count">{{ state.count }}</span><button @click="state.count++">+</button></div>'));
});

Then(re('component should render'), function() {
    assert.strictEqual(vx(this).wrapper.find('.count').text(), '0');
});

Then(re('state updates should work in tests'), async function() {
    const c = vx(this);
    await c.wrapper.find('button').trigger('click');
    assert.strictEqual(c.wrapper.find('.count').text(), '1');
    c.state.count = 5;
    await c.wrapper.vm.$nextTick();
    assert.strictEqual(c.wrapper.find('.count').text(), '5');
});

Given(re('component depending on bindX'), function() {
    const c = vx(this);
    c.Component = {
        setup() {
            const store = V().inject('store');
            return { store };
        },
        template: '<p>{{ store.user.name }} has {{ store.items.length }} items</p>'
    };
});

When(re('providing mock state'), function() {
    const c = vx(this);
    c.mock = A(this).createStore({ user: { name: 'Mock' }, items: [1] });
    c.wrapper = vtuMount(this, c.Component, { global: { provide: { store: c.mock } } });
});

Then(re('component should work with mock'), function() {
    assert.strictEqual(vx(this).wrapper.text(), 'Mock has 1 items');
});

Then(re('can control state for testing'), async function() {
    const c = vx(this);
    c.mock.user.name = 'Other';
    c.mock.items.push(2, 3);
    await c.wrapper.vm.$nextTick();
    assert.strictEqual(c.wrapper.text(), 'Other has 3 items');
});

Given(re('component with bindX computed'), function() {
    const c = vx(this);
    const world = this;
    c.Component = {
        props: { factor: { type: Number, default: 2 } },
        setup(props) {
            c.state = A(world).reactive({ base: 3 });
            c.product = A(world).computed(() => c.state.base * props.factor);
            return { state: c.state, product: c.product };
        },
        template: '<p class="product">{{ product() }}</p>'
    };
});

When(re('updating dependencies in test'), async function() {
    const c = vx(this);
    c.wrapper = vtuMount(this, c.Component);
    c.initial = c.wrapper.find('.product').text();
    c.state.base = 5;
    await c.wrapper.vm.$nextTick();
});

Then(re('computed should update'), function() {
    const c = vx(this);
    assert.strictEqual(c.initial, '6');
    assert.strictEqual(c.wrapper.find('.product').text(), '10');
});

Then(re('can assert on computed values'), async function() {
    const c = vx(this);
    assert.strictEqual(c.product(), 10);
    assert.strictEqual(c.wrapper.vm.product(), 10);
    // A bindX computed only tracks bindX state, so a Vue prop change shows
    // after the next bindX write
    c.state.base = 6;
    assert.strictEqual(c.product(), 12);
});

Given(re('component with bindX watchers'), function() {
    const c = vx(this);
    const world = this;
    c.saved = [];
    c.Component = {
        setup() {
            c.state = A(world).reactive({ draft: '' });
            A(world).watch(() => c.state.draft, (value) => c.saved.push(value));
            return { state: c.state };
        },
        template: '<input v-model="state.draft">'
    };
    c.wrapper = vtuMount(this, c.Component);
    c.baseline = watchers(this);
});

When(re('triggering state changes in test'), async function() {
    const c = vx(this);
    await c.wrapper.find('input').setValue('hello');
    c.state.draft = 'hello world';
});

Then(re('watchers should execute'), function() {
    assert.deepStrictEqual(vx(this).saved, ['hello', 'hello world']);
});

Then(re('can assert on side effects'), async function() {
    const c = vx(this);
    await c.wrapper.vm.$nextTick();
    assert.strictEqual(c.wrapper.find('input').element.value, 'hello world', 'a direct state write reaches the input');
    c.wrapper.unmount();
    assert.ok(watchers(this) < c.baseline, 'unmounting through test-utils stops the watchers');
});

// ---------------------------------------------------------------- SSR

Given(re('SSR environment'), function() {
    const c = vx(this);
    c.ssr = require('vue/server-renderer');
    assert.strictEqual(typeof c.ssr.renderToString, 'function');
    c.baseline = watchers(this);
});

When(re('rendering components with bindX'), async function() {
    const c = vx(this);
    const world = this;
    const Page = {
        props: ['user'],
        setup(props) {
            const { reactive, computed, watch } = A(world);
            const state = reactive({ user: props.user, visits: 1 });
            const greeting = computed(() => `Hello ${state.user}`);
            watch(() => state.visits, () => {}, { immediate: true });
            return { state, greeting };
        },
        template: '<main><h1>{{ greeting() }}</h1><p>{{ state.visits }}</p></main>'
    };
    c.html = [];
    for (let i = 0; i < 25; i++) {
        const app = V().createSSRApp(Page, { user: `u${i}` });
        app.config.warnHandler = (msg) => c.warnings.push(msg);
        c.html.push(await c.ssr.renderToString(app));
    }
});

Then(re('watchers should cleanup after render'), function() {
    const c = vx(this);
    assert.strictEqual(watchers(this), c.baseline, 'server renders leave no bindX watchers behind');
    noWarnings(this);
});

Then(re('no memory leaks between requests'), function() {
    const c = vx(this);
    c.html.forEach((html, i) => {
        assert.ok(html.includes(`<h1>Hello u${i}</h1>`), html);
        assert.ok(!html.includes(`u${i + 1}<`), 'no state carried over from another request');
    });
    assert.strictEqual(new Set(c.html).size, c.html.length);
});

// ---------------------------------------------------------------- Plugin

Given(re('app.use(bindXPlugin)'), function() {
    vx(this).plugins = [A(this).bindXPlugin];
});

When(re('components access bindX'), function() {
    const c = vx(this);
    c.injected = [];
    const Leaf = {
        setup() {
            const bx = V().inject('bindX');
            c.injected.push(bx);
            return { shared: V().inject('shared') };
        },
        template: '<i class="leaf">{{ shared.total }}</i>'
    };
    const Branch = {
        components: { Leaf },
        setup() {
            const bx = V().inject('bindX');
            c.injected.push(bx);
            c.state = bx.reactive({ total: 1 });
            c.double = bx.computed(() => c.state.total * 2);
            V().provide('shared', c.state);
            return { state: c.state, double: c.double };
        },
        template: '<div><b class="branch">{{ double() }}</b><Leaf /></div>'
    };
    c.view = mount(this, { components: { Branch }, template: '<Branch />' }, { plugins: c.plugins });
});

Then(re('bindX should be available globally'), function() {
    const c = vx(this);
    const api = c.injected[0];
    for (const name of ['reactive', 'computed', 'watch', 'toVueRef', 'toVueComputed', 'fromVueRef', 'toVueReactive', 'createStore']) {
        assert.strictEqual(api[name], A(this)[name], `plugin provides ${name}`);
    }
    assert.strictEqual(c.view.app.config.globalProperties.$bindX, undefined, 'no global property without the option');
});

Then(re('can be injected via provide/inject'), async function() {
    const c = vx(this);
    assert.strictEqual(c.injected.length, 2);
    assert.strictEqual(c.injected[0], c.injected[1], 'every component injects the same API');
    c.state.total = 5;
    await tick();
    assert.strictEqual(c.view.find('.branch').textContent, '10');
    assert.strictEqual(c.view.find('.leaf').textContent, '5');
});

Given(re('app.use(bindXPlugin, { options })'), function() {
    vx(this).plugins = [[A(this).bindXPlugin, { globalProperties: true }]];
});

When(re('components use bindX'), function() {
    const c = vx(this);
    c.Component = {
        data() {
            return { local: 'x' };
        },
        created() {
            c.state = this.$bindX.reactive({ hits: 0 });
            this.hits = this.$bindX.computed(() => c.state.hits);
            this.$bindX.watch(() => c.state.hits, (n) => c.log.push(n));
        },
        template: '<button @click="hit">{{ hits() }}</button>',
        methods: {
            hit() {
                c.state.hits++;
            }
        }
    };
    c.view = mount(this, c.Component, { plugins: c.plugins });
});

Then(re('options should be applied'), function() {
    const c = vx(this);
    const globals = c.view.app.config.globalProperties.$bindX;
    assert.deepStrictEqual(Object.keys(globals).sort(), ['computed', 'reactive', 'watch']);
    assert.strictEqual(globals.reactive, A(this).reactive);
    assert.strictEqual(c.view.vm.$bindX, globals);
});

Then(re('configuration should work correctly'), async function() {
    const c = vx(this);
    click(c.view.find('button'));
    click(c.view.find('button'));
    await tick();
    assert.strictEqual(c.view.find('button').textContent, '2');
    assert.deepStrictEqual(c.log, [1, 2]);
    // The option adds globals without replacing the injectable API
    assert.strictEqual(typeof c.view.app._context.provides.bindX.createStore, 'function');
    noWarnings(this);
});

// ---------------------------------------------------------------- Documentation examples

Given(re('bindX-vue package README'), function() {
    vx(this).source = docExample('Counter Example');
});

When(re('following counter example'), function() {
    const c = vx(this);
    c.view = mount(this, compileSFC(this, c.source).component);
});

Then(re('should have working counter'), function() {
    const c = vx(this);
    assert.strictEqual(c.view.text(), 'Count: 0Double: 0IncrementDecrementReset');
});

Then(re('increment/decrement should work'), async function() {
    const c = vx(this);
    const [inc, dec, reset] = c.view.findAll('button');
    click(inc); click(inc); click(inc);
    await tick();
    assert.ok(c.view.text().startsWith('Count: 3Double: 6'), c.view.text());
    click(dec);
    await tick();
    assert.ok(c.view.text().startsWith('Count: 2Double: 4'), c.view.text());
    click(reset);
    await tick();
    assert.ok(c.view.text().startsWith('Count: 0Double: 0'), c.view.text());
    noWarnings(this);
});

Given(re('bindX-vue todo example'), function() {
    const c = vx(this);
    c.example = 'todo';
    c.source = docExample('Todo List');
});

Given(re('bindX-vue form example'), function() {
    const c = vx(this);
    const world = this;
    c.example = 'form';
    // The useForm documentation example, with the validation a form adds
    c.Component = {
        setup() {
            const form = A(world).useForm({ username: '', email: '', password: '' });
            A(world).watch(() => form.data.email, (email) => {
                if (email && !email.includes('@')) form.setError('email', 'Enter a valid email');
                else form.clearError('email');
            });
            A(world).watch(() => form.data.password, (password) => {
                if (password && password.length < 8) form.setError('password', 'At least 8 characters');
                else form.clearError('password');
            });
            c.form = form;
            return { form, submitted: c.log };
        },
        template: `<form @submit.prevent>
            <input class="username" v-model="form.data.username">
            <input class="email" v-model="form.data.email">
            <p class="email-error" v-if="form.errors.email">{{ form.errors.email }}</p>
            <input class="password" v-model="form.data.password">
            <p class="password-error" v-if="form.errors.password">{{ form.errors.password }}</p>
            <button :disabled="form.hasErrors()" @click="form.submit(d => submitted.push({ ...d }))">Submit</button>
        </form>`
    };
});

When(re('implementing the example'), function() {
    const c = vx(this);
    if (c.example === 'todo') {
        let id = 100;
        const realNow = Date.now;
        Date.now = () => ++id;
        this.ad.cleanups.push(() => { Date.now = realNow; });
        c.view = mount(this, compileSFC(this, c.source).component);
    } else {
        c.view = mount(this, c.Component);
    }
});

async function addTodo(c, text) {
    const input = c.view.find('input[placeholder="Add todo"]');
    typeInto(input, text);
    input.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    await tick();
}

const todoTexts = (c) => c.view.findAll('li span').map(s => s.textContent);

Then(re('should have full CRUD functionality'), async function() {
    const c = vx(this);
    await addTodo(c, 'write steps');
    await addTodo(c, 'run suite');
    await addTodo(c, '   ');
    await addTodo(c, 'ship');
    assert.deepStrictEqual(todoTexts(c), ['write steps', 'run suite', 'ship'], 'blank text is not added');
    assert.strictEqual(c.view.find('input[placeholder="Add todo"]').value, '', 'input clears after adding');
    assert.ok(c.view.text().endsWith('3 items left'));

    const box = c.view.findAll('li input[type="checkbox"]')[0];
    box.checked = true;
    box.dispatchEvent(new window.Event('change', { bubbles: true }));
    await tick();
    assert.ok(c.view.findAll('li span')[0].classList.contains('completed'));
    assert.ok(c.view.text().endsWith('2 items left'));

    click(c.view.findAll('li button')[1]);
    await tick();
    assert.deepStrictEqual(todoTexts(c), ['write steps', 'ship']);
    assert.ok(c.view.text().endsWith('1 items left'));
});

Then(re('filtering should work reactively'), async function() {
    const c = vx(this);
    const filter = (label) => click(c.view.findAll('button').find(b => b.textContent === label));
    filter('Active');
    await tick();
    assert.deepStrictEqual(todoTexts(c), ['ship']);
    await addTodo(c, 'celebrate');
    assert.deepStrictEqual(todoTexts(c), ['ship', 'celebrate'], 'a new todo shows under the active filter');
    filter('Completed');
    await tick();
    assert.deepStrictEqual(todoTexts(c), ['write steps']);
    filter('All');
    await tick();
    assert.deepStrictEqual(todoTexts(c), ['write steps', 'ship', 'celebrate']);
    noWarnings(this);
});

Then(re('form validation should work'), async function() {
    const c = vx(this);
    const button = c.view.find('button');
    assert.strictEqual(button.disabled, false);
    typeInto(c.view.find('.email'), 'adam');
    typeInto(c.view.find('.password'), 'short');
    await tick();
    assert.strictEqual(c.view.find('.email-error').textContent, 'Enter a valid email');
    assert.strictEqual(c.view.find('.password-error').textContent, 'At least 8 characters');
    assert.strictEqual(button.disabled, true, 'hasErrors() sees keys added to errors');
    assert.strictEqual(c.form.isDirty(), true);
});

Then(re('error messages should be reactive'), async function() {
    const c = vx(this);
    typeInto(c.view.find('.email'), 'adam@genx.software');
    await tick();
    assert.strictEqual(c.view.find('.email-error'), null);
    assert.strictEqual(c.view.find('button').disabled, true, 'the password error remains');
    typeInto(c.view.find('.password'), 'long enough');
    typeInto(c.view.find('.username'), 'adam');
    await tick();
    assert.strictEqual(c.view.find('.password-error'), null);
    const button = c.view.find('button');
    assert.strictEqual(button.disabled, false);
    click(button);
    await tick();
    assert.deepStrictEqual(c.log, [{ username: 'adam', email: 'adam@genx.software', password: 'long enough' }]);
    assert.strictEqual(c.form.isDirty(), false);
    c.form.setError('username', 'Taken');
    await tick();
    assert.strictEqual(button.disabled, true);
    c.form.reset();
    await tick();
    assert.strictEqual(c.view.find('.username').value, '');
    assert.strictEqual(button.disabled, false);
});

// ---------------------------------------------------------------- Stores, modules, factories

Given(re('bindX state exported from module'), function() {
    const world = this;
    // What a store.js module would export, created once at import time
    vx(this).storeModule = (() => {
        const store = A(world).createStore({ cart: [] });
        return {
            store,
            addItem: (item) => store.cart.push(item),
            total: A(world).computed(() => store.cart.reduce((sum, item) => sum + item.price, 0))
        };
    })();
});

When(re('multiple components import'), function() {
    const c = vx(this);
    const mod = c.storeModule;
    c.seen = [];
    const Header = {
        setup() { c.seen.push(mod.store); return { store: mod.store, total: mod.total }; },
        template: '<header>{{ store.cart.length }} items, ${{ total() }}</header>'
    };
    const Catalog = {
        setup() { c.seen.push(mod.store); return { add: () => mod.addItem({ name: 'pen', price: 3 }) }; },
        template: '<button @click="add">add</button>'
    };
    c.views = [mount(this, { components: { Header, Catalog }, template: '<div><Header /><Catalog /></div>' }), mount(this, Header)];
    setCheck(this, 'all share same state', () => {
        assert.strictEqual(c.seen.length, 3);
        assert.ok(c.seen.every(s => s === mod.store));
    });
});

Then(re('updates sync across app'), async function() {
    const c = vx(this);
    click(c.views[0].find('button'));
    click(c.views[0].find('button'));
    await tick();
    assert.strictEqual(c.views[0].find('header').textContent, '2 items, $6');
    assert.strictEqual(c.views[1].text(), '2 items, $6', 'a second app sees the same module state');
    c.storeModule.store.cart.splice(0, 1);
    await tick();
    assert.strictEqual(c.views[1].text(), '1 items, $3');
});

Given(re('bindX state in separate modules'), function() {
    const c = vx(this);
    const world = this;
    // A module keeps its state private and exports getters and actions
    c.defineModule = (initial, actions) => {
        // Module-level state: createStore keeps it Vue-tracked outside components
        const state = A(world).createStore({ ...initial });
        const api = {};
        for (const key of Object.keys(initial)) api[key] = () => state[key];
        for (const [name, fn] of Object.entries(actions)) api[name] = (...args) => fn(state, ...args);
        return Object.freeze(api);
    };
    c.counterActions = { inc: (s) => { s.n++; } };
    c.user = c.defineModule({ name: 'guest' }, { login: (s, name) => { s.name = name; } });
    c.clicks = c.defineModule({ n: 0 }, c.counterActions);
});

When(re('importing and using modules'), function() {
    const c = vx(this);
    c.view = mount(this, {
        setup: () => ({ user: c.user, clicks: c.clicks }),
        template: '<p @click="clicks.inc()">{{ user.name() }}:{{ clicks.n() }}</p>'
    });
});

Then(re('state should be encapsulated'), async function() {
    const c = vx(this);
    assert.deepStrictEqual(Object.keys(c.user).sort(), ['login', 'name']);
    assert.throws(() => { 'use strict'; c.user.name = () => 'hacked'; }, TypeError);
    c.user.login('adam');
    click(c.view.find('p'));
    await tick();
    assert.strictEqual(c.view.text(), 'adam:1');
});

Then(re('modules should be reusable'), async function() {
    const c = vx(this);
    const other = c.defineModule({ n: 10 }, c.counterActions);
    other.inc();
    assert.strictEqual(other.n(), 11);
    assert.strictEqual(c.clicks.n(), 1, 'another instance of the module has its own state');
    await tick();
    assert.strictEqual(c.view.text(), 'adam:1');
});

Given(re('factory function creating bindX state'), function() {
    const c = vx(this);
    const world = this;
    c.createCounter = (start = 0) => {
        const state = A(world).reactive({ count: start });
        const doubled = A(world).computed(() => state.count * 2);
        return { state, doubled, inc: () => { state.count++; } };
    };
});

When(re('called multiple times'), function() {
    const c = vx(this);
    c.made = [c.createCounter(), c.createCounter(5), c.createCounter()];
});

Then(re('each call creates independent state'), function() {
    const c = vx(this);
    c.made[0].inc();
    c.made[0].inc();
    assert.deepStrictEqual(c.made.map(m => m.state.count), [2, 5, 0]);
    assert.deepStrictEqual(c.made.map(m => m.doubled()), [4, 10, 0]);
    assert.notStrictEqual(c.made[0].state, c.made[2].state);
});

Then(re('can be used for component instances'), async function() {
    const c = vx(this);
    const baseline = watchers(this);
    const Counter = {
        props: ['start'],
        setup: (props) => c.createCounter(props.start),
        template: '<button @click="inc">{{ state.count }}/{{ doubled() }}</button>'
    };
    c.view = mount(this, { components: { Counter }, template: '<div><Counter :start="1" /><Counter :start="2" /><Counter :start="3" /></div>' });
    const buttons = c.view.findAll('button');
    click(buttons[1]);
    await tick();
    assert.deepStrictEqual(buttons.map(b => b.textContent), ['1/2', '3/6', '3/6']);
    c.view.unmount();
    assert.strictEqual(watchers(this), baseline, 'per-instance computeds stop with their components');
});

// ---------------------------------------------------------------- Migration from Vue

async function sfcTranscript(world, source, actions) {
    const view = mount(world, compileSFC(world, source).component);
    const frames = [view.text()];
    for (const act of actions) {
        act(view);
        await tick();
        frames.push(view.text());
    }
    view.unmount();
    return frames;
}

function migrationCase(c, vueSource, bindxSource, actions) {
    c.vueSource = vueSource;
    c.bindxSource = bindxSource;
    c.actions = actions;
}

const changedLines = (a, b) => {
    const x = a.split('\n');
    const y = b.split('\n');
    return x.filter((line, i) => line !== y[i]);
};

When(re('replacing with bindX reactive'), async function() {
    const c = vx(this);
    c.frames = [await sfcTranscript(this, c.vueSource, c.actions), await sfcTranscript(this, c.bindxSource, c.actions)];
    setCheck(this, 'migration should be straightforward', () => {
        assert.deepStrictEqual(changedLines(c.vueSource, c.bindxSource), ["import { reactive } from 'vue';"], 'only the import changes');
    });
});

Given(re('component using Vue reactive'), function() {
    const body = (from) => `<template><div><p>{{ state.user.name }} ({{ state.tags.length }})</p>
<button class="rename" @click="state.user.name = 'Grace'">rename</button>
<button class="tag" @click="state.tags.push('x')">tag</button></div></template>
<script setup>
import { reactive } from '${from}';
const state = reactive({ user: { name: 'Ada' }, tags: [] });
</script>`;
    migrationCase(vx(this), body('vue'), body('@genx/bindx-vue'), [
        (v) => click(v.find('.rename')),
        (v) => click(v.find('.tag')),
        (v) => click(v.find('.tag'))
    ]);
});

Then(re('functionality should be equivalent'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.frames[1], c.frames[0]);
    assert.deepStrictEqual(c.frames[0], ['Ada (0)renametag', 'Grace (0)renametag', 'Grace (1)renametag', 'Grace (2)renametag']);
});

Given(re('component using Vue computed'), function() {
    const c = vx(this);
    c.vueSource = `<template><div><p>{{ total }}</p><button @click="state.qty++">+</button></div></template>
<script setup>
import { reactive, computed } from 'vue';
const state = reactive({ qty: 1, price: 4 });
const total = computed(() => state.qty * state.price);
</script>`;
    c.bindxSource = c.vueSource.replace("from 'vue'", "from '@genx/bindx-vue'").replace('{{ total }}', '{{ total() }}');
    c.actions = [(v) => click(v.find('button')), (v) => click(v.find('button'))];
});

When(re('replacing with bindX computed'), async function() {
    const c = vx(this);
    c.frames = [await sfcTranscript(this, c.vueSource, c.actions), await sfcTranscript(this, c.bindxSource, c.actions)];
});

Then(re('behavior should be same'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.frames[1], c.frames[0]);
    assert.deepStrictEqual(c.frames[0], ['4+', '8+', '12+']);
    assert.deepStrictEqual(changedLines(c.vueSource, c.bindxSource).length, 2, 'the import and the call in the template');
});

Then(re('can use () syntax or property access'), async function() {
    const c = vx(this);
    const { reactive, computed, toVueComputed } = A(this);
    const view = mount(this, {
        setup() {
            const state = reactive({ qty: 2 });
            const total = computed(() => state.qty * 3);
            c.state = state;
            c.total = total;
            c.totalRef = toVueComputed(total);
            return { total, totalRef: c.totalRef };
        },
        template: '<p>{{ total() }}={{ totalRef }}</p>'
    });
    assert.strictEqual(c.total(), 6, '() syntax');
    assert.strictEqual(c.totalRef.value, 6, 'property access through toVueComputed');
    c.state.qty = 5;
    await tick();
    assert.strictEqual(view.text(), '15=15');
    assert.strictEqual(c.totalRef.value, 15);
});

Given(re('component using Vue watch'), function() {
    const c = vx(this);
    c.vueSource = `<template><div><button class="n" @click="state.n++">n</button><button class="deep" @click="state.user.tags.push('t')">deep</button></div></template>
<script setup>
import { reactive, watch } from 'vue';
const state = reactive({ n: 0, user: { tags: [] } });
watch(() => state.n, (value, old) => log.push(['n', value, old ?? null]), { immediate: true });
watch(() => state.user, (user) => log.push(['user', user.tags.length]), { deep: true });
</script>`;
    c.bindxSource = c.vueSource.replace("import { reactive, watch } from 'vue';", "import { reactive, watch } from '@genx/bindx-vue';");
    c.actions = [(v) => click(v.find('.n')), (v) => click(v.find('.deep')), (v) => click(v.find('.n'))];
});

When(re('replacing with bindX watch'), async function() {
    const c = vx(this);
    c.logs = [];
    for (const source of [c.vueSource, c.bindxSource]) {
        const log = [];
        const scriptLog = source.replace('<script setup>', '<script setup>\nconst log = globalThis.__vxWatchLog;');
        globalThis.__vxWatchLog = log;
        await sfcTranscript(this, scriptLog, c.actions);
        c.logs.push(log);
    }
    delete globalThis.__vxWatchLog;
});

Then(re('watching should work identically'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.logs[1], c.logs[0]);
    assert.deepStrictEqual(changedLines(c.vueSource, c.bindxSource).length, 1, 'only the import changes');
});

Then(re('options should map correctly'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.logs[0], [['n', 0, null], ['n', 1, 0], ['user', 1], ['n', 2, 1]],
        'immediate runs once at setup and deep sees a nested push');
});

// ---------------------------------------------------------------- Edge cases

Given(re('multiple Vue apps on same page'), function() {
    const c = vx(this);
    const world = this;
    c.makeApp = (label) => ({
        setup() {
            const bx = V().inject('bindX');
            const state = bx.reactive({ n: 0 });
            c.apps[label] = { state, api: bx };
            return { state, label };
        },
        template: '<button @click="state.n++">{{ label }}{{ state.n }}</button>'
    });
    c.apps = {};
    c.baseline = watchers(world);
});

When(re('each uses bindX'), function() {
    const c = vx(this);
    c.views = ['a', 'b'].map(label => mount(this, c.makeApp(label), { plugins: [A(this).bindXPlugin] }));
    setCheck(this, 'no conflicts should occur', async () => {
        assert.strictEqual(c.apps.a.api.reactive, c.apps.b.api.reactive, 'both apps get the one adapter');
        c.views[0].unmount();
        c.apps.b.state.n = 9;
        await tick();
        assert.strictEqual(c.views[1].text(), 'b9', 'the other app keeps working after one unmounts');
        c.views[1].unmount();
        assert.strictEqual(watchers(this), c.baseline);
        noWarnings(this);
    });
});

Then(re('bindX should work independently'), async function() {
    const c = vx(this);
    click(c.views[0].find('button'));
    click(c.views[0].find('button'));
    await tick();
    assert.deepStrictEqual(c.views.map(v => v.text()), ['a2', 'b0']);
});

Given(re('recursive component using bindX'), function() {
    const c = vx(this);
    const world = this;
    // Shared state made outside a component: createStore is the documented way to make it Vue-tracked
    c.tree = A(this).createStore({ label: 'root', children: [
        { label: 'a', children: [{ label: 'a1', children: [] }, { label: 'a2', children: [] }] },
        { label: 'b', children: [{ label: 'b1', children: [{ label: 'b1x', children: [] }] }] }
    ] });
    c.nodes = [];
    c.TreeNode = {
        name: 'TreeNode',
        props: ['node', 'depth'],
        setup(props) {
            const local = A(world).reactive({ open: true });
            const size = A(world).computed(() => props.node.children.length);
            c.nodes.push(local);
            return { local, size };
        },
        template: `<li :data-depth="depth"><span @click="local.open = !local.open">{{ node.label }}[{{ size() }}]</span>
            <ul v-if="local.open"><TreeNode v-for="child in node.children" :key="child.label" :node="child" :depth="depth + 1" /></ul></li>`
    };
});

When(re('rendering nested structure'), function() {
    const c = vx(this);
    c.view = mount(this, { components: { TreeNode: c.TreeNode }, setup: () => ({ tree: c.tree }), template: '<ul><TreeNode :node="tree" :depth="0" /></ul>' });
});

const labels = (c) => c.view.findAll('span').map(s => s.textContent);

Then(re('each instance should have correct state'), async function() {
    const c = vx(this);
    assert.deepStrictEqual(labels(c), ['root[2]', 'a[2]', 'a1[0]', 'a2[0]', 'b[1]', 'b1[1]', 'b1x[0]']);
    assert.strictEqual(c.nodes.length, 7);
    assert.strictEqual(c.view.find('li[data-depth="3"] span').textContent, 'b1x[0]');
    click(c.view.findAll('span')[1]);
    await tick();
    assert.deepStrictEqual(labels(c), ['root[2]', 'a[2]', 'b[1]', 'b1[1]', 'b1x[0]'], 'collapsing one node hides only its subtree');
});

Then(re('reactivity should work at all levels'), async function() {
    const c = vx(this);
    c.tree.children[1].children[0].children[0].label = 'deep';
    c.tree.children[1].children.push({ label: 'b2', children: [] });
    c.tree.label = 'top';
    await tick();
    assert.deepStrictEqual(labels(c), ['top[2]', 'a[2]', 'b[2]', 'b1[1]', 'deep[0]', 'b2[0]']);
});

Given(re('component wrapped in <KeepAlive>'), function() {
    const c = vx(this);
    const world = this;
    c.shared = A(this).reactive({ n: 0 });
    c.setups = 0;
    const Cached = {
        setup() {
            c.setups++;
            const local = A(world).reactive({ clicks: 0 });
            A(world).watch(() => c.shared.n, (value, old) => c.log.push([value, old]));
            return { local };
        },
        template: '<button class="cached" @click="local.clicks++">{{ local.clicks }}</button>'
    };
    const Other = { template: '<i class="other">other</i>' };
    c.Root = {
        components: { Cached, Other },
        setup: () => ({ tab: V().ref('cached') }),
        template: '<KeepAlive><component :is="tab === \'cached\' ? \'Cached\' : \'Other\'" /></KeepAlive>'
    };
});

When(re('component is cached/restored'), async function() {
    const c = vx(this);
    c.view = mount(this, c.Root);
    click(c.view.find('.cached'));
    click(c.view.find('.cached'));
    c.view.vm.tab = 'other';
    await tick();
    assert.ok(c.view.find('.other'));
    c.shared.n = 1;
    c.shared.n = 2;
    c.whileInactive = c.log.slice();
    c.view.vm.tab = 'cached';
    await tick();
});

Then(re('bindX state should persist correctly'), function() {
    const c = vx(this);
    assert.strictEqual(c.setups, 1, 'restored from the cache, not set up again');
    assert.strictEqual(c.view.find('.cached').textContent, '2');
});

Then(re('watchers should pause/resume appropriately'), function() {
    const c = vx(this);
    assert.deepStrictEqual(c.whileInactive, [], 'no callbacks while cached');
    assert.deepStrictEqual(c.log, [[2, 0]], 'one catch-up call with the latest value on restore');
    c.shared.n = 3;
    assert.deepStrictEqual(c.log, [[2, 0], [3, 2]]);
});

Then(re('migration should be straightforward'), async function() {
    await runCheck(this, 'migration should be straightforward');
});
