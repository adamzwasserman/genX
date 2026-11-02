/**
 * Step definitions for bindx-angular-adapter.feature
 *
 * Runs the real adapter (src/bindx-angular.ts) with Angular 20 and zone.js in a
 * jsdom window. The adapter, Angular (core, compiler, common, forms,
 * platform-browser and their testing entry points), zone.js and rxjs are
 * bundled together and evaluated inside the window's own JS realm, so zone.js
 * patches that window rather than the Node process running Cucumber.
 * Components are TypeScript sources compiled with the TypeScript compiler
 * (decorators and constructor-parameter metadata, as Angular's JIT mode needs)
 * and then compiled by Angular's JIT compiler, like an app in development.
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { setupAdapter, flush, adapterSteps, re } = require('../support/bindx-adapter-harness');

const { Given, When, Then } = adapterSteps('angular');

const ROOT = path.resolve(__dirname, '../..');
const ADAPTER_SRC = path.join(ROOT, 'src', 'bindx-angular.ts');
const OUT_DIR = path.join(ROOT, 'node_modules', '.cache', 'genx-bindx-adapters');
const TS_DIR = path.join(OUT_DIR, 'ts');
const ADAPTER_IMPORT = JSON.stringify(ADAPTER_SRC.replace(/\.ts$/, ''));

// ---------------------------------------------------------------- runtime

let runtimeCode = null;

/** Bundle zone.js, Angular, rxjs and the adapter into one script for the window. */
function runtimeSource() {
    if (runtimeCode) return runtimeCode;
    const esbuild = require('esbuild');
    const entry = `
import 'zone.js';
import '@angular/compiler';
export * as core from '@angular/core';
export * as common from '@angular/common';
export * as forms from '@angular/forms';
export * as pb from '@angular/platform-browser';
export * as testing from '@angular/core/testing';
export * as pbt from '@angular/platform-browser/testing';
export * as rxjs from 'rxjs';
export * as operators from 'rxjs/operators';
export * as adapter from ${JSON.stringify(ADAPTER_SRC)};
`;
    const result = esbuild.buildSync({
        stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
        bundle: true,
        write: false,
        platform: 'browser',
        format: 'iife',
        globalName: '__bindxAngularRuntime',
        target: 'es2022',
        logLevel: 'silent',
        tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } }
    });
    runtimeCode = result.outputFiles[0].text;
    return runtimeCode;
}

// What emitDecoratorMetadata output needs (the reflect-metadata polyfill an
// Angular JIT app loads); class-level metadata only, which is all Angular reads
const REFLECT_METADATA = `(function () {
  var store = new WeakMap();
  var own = function (target) {
    var map = store.get(target);
    if (!map) { map = new Map(); store.set(target, map); }
    return map;
  };
  Reflect.metadata = function (key, value) {
    return function (target, property) { if (property === undefined) own(target).set(key, value); };
  };
  Reflect.defineMetadata = function (key, value, target, property) {
    if (property === undefined) own(target).set(key, value);
  };
  Reflect.getOwnMetadata = function (key, target, property) {
    return property === undefined && store.has(target) ? store.get(target).get(key) : undefined;
  };
  Reflect.getMetadata = Reflect.getOwnMetadata;
})();`;

function ngSetup(world) {
    let rt;
    const ad = setupAdapter(world, 'angular', {
        runScripts: 'outside-only',
        load() {
            const w = globalThis.window;
            // The adapter reads bindX as a global; resolve it to the scenario's core
            // (or the watcher-counting wrapper the common step installs)
            Object.defineProperty(w, 'bindX', { get: () => globalThis.bindX, configurable: true });
            w.eval(REFLECT_METADATA);
            w.eval(runtimeSource());
            rt = w.__bindxAngularRuntime;
            return rt.adapter;
        }
    });
    if (rt) {
        ad.rt = rt;
        ad.w = globalThis.window;
        ad.c = {};
        // Collect console errors and logs for the steps that check them
        ad.consoleErrors = [];
        ad.consoleLogs = [];
        const { error: consoleError, log: consoleLog } = console;
        console.error = (...args) => ad.consoleErrors.push(args);
        console.log = (...args) => {
            if (typeof args[0] === 'string' && args[0].startsWith('Angular is running in development mode')) return;
            ad.consoleLogs.push(args);
        };
        // Cleanups run in reverse: the console is restored last
        ad.cleanups.push(() => {
            console.error = consoleError;
            console.log = consoleLog;
        });
    }
    return ad;
}

/**
 * Values made in the window's realm (arrays and objects from compiled
 * components) have that realm's prototypes; copy them into this realm before
 * comparing them with literals here.
 */
function plain(value) {
    if (Array.isArray(value)) return Array.from(value, item => plain(item));
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]));
    }
    return value;
}

function same(actual, expected, ...message) {
    assert.deepStrictEqual(plain(actual), plain(expected), ...message);
}

const ng = (world) => world.ad;
const A = (world) => world.ad.adapter;
const c = (world) => world.ad.c;
const watchers = (world) => world.ad.activeWatchers;

let compileCounter = 0;

/** Compile a TypeScript module (components, services) into the window's realm. */
function compileNg(world, source) {
    const ts = require('typescript');
    const { rt, w } = ng(world);
    const js = ts.transpileModule(source, {
        fileName: `angular-${compileCounter++}.ts`,
        compilerOptions: {
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            useDefineForClassFields: false,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022
        }
    }).outputText;
    const modules = {
        '@angular/core': rt.core,
        '@angular/common': rt.common,
        '@angular/forms': rt.forms,
        '@angular/platform-browser': rt.pb,
        '@angular/core/testing': rt.testing,
        rxjs: rt.rxjs,
        'rxjs/operators': rt.operators,
        '@genx/bindx-angular': rt.adapter
    };
    const factory = w.eval(`(function (require, module, exports) {\n${js}\n})`);
    const module = { exports: {} };
    factory((name) => {
        if (!(name in modules)) throw new Error(`compileNg: no module ${name}`);
        return modules[name];
    }, module, module.exports);
    return module.exports;
}

const IMPORTS = `import { Component, Injectable, Input, NgZone, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, NgFor } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { BindXService } from '@genx/bindx-angular';
`;

/**
 * Source for a test component. rendered() counts template evaluations (Angular
 * checking the view), so steps can tell whether change detection ran.
 */
function componentSource({ name = 'TestComponent', selector = 'app-test', template = '', members = '', meta = '', state = null }) {
    return `${IMPORTS}
@Component({ selector: '${selector}', template: '${template}<i hidden>{{ rendered() }}</i>'${meta} })
export class ${name} {
  bindX = inject(BindXService);
  ${state ? `state: any = this.bindX.reactive(${state});` : ''}
  renders = 0;
  rendered() { this.renders++; return ''; }
  ${members}
}`;
}

function compileComponent(world, options) {
    return compileNg(world, componentSource(options))[options.name || 'TestComponent'];
}

/** The scenario's application (no root component; components mount into it). */
async function appFor(world) {
    const ad = ng(world);
    if (!ad.app) {
        ad.app = await ad.rt.pb.createApplication({ providers: c(world).appProviders || [] });
        const app = ad.app;
        // Count change detection passes. Both tick() and the zone's scheduler
        // run ApplicationRef's internal _tick(), so that is what is counted
        ad.ticks = 0;
        const runTick = app._tick.bind(app);
        app._tick = () => { ad.ticks++; return runTick(); };
        ad.cleanups.push(() => app.destroy());
    }
    return ad.app;
}

const zoneOf = (world) => ng(world).app.injector.get(ng(world).rt.core.NgZone);

/** Run change detection the way the zone does: one tick, inside the Angular zone. */
function tick(world) {
    const app = ng(world).app;
    zoneOf(world).run(() => app.tick());
}

/** Mount a component into a new element in the document; destroyed after the scenario. */
async function mount(world, Component, inputs = {}) {
    const ad = ng(world);
    const app = await appFor(world);
    const host = ad.w.document.createElement('div');
    ad.w.document.body.appendChild(host);
    // Created inside the Angular zone, as bootstrapApplication does, so the
    // view's DOM listeners run in the zone and trigger change detection
    const ref = zoneOf(world).run(() => {
        const created = ad.rt.core.createComponent(Component, { environmentInjector: app.injector, hostElement: host });
        for (const [key, value] of Object.entries(inputs)) created.setInput(key, value);
        app.attachView(created.hostView);
        return created;
    });
    tick(world);
    const view = {
        ref,
        host,
        cmp: ref.instance,
        destroy() {
            if (!view.destroyed) {
                view.destroyed = true;
                ref.destroy();
                host.remove();
            }
        },
        find: (selector) => host.querySelector(selector),
        findAll: (selector) => [...host.querySelectorAll(selector)],
        text: (selector = 'p') => {
            const el = host.querySelector(selector);
            return el ? el.textContent.trim() : null;
        }
    };
    ad.cleanups.push(() => view.destroy());
    return view;
}

function texts(view, selector) {
    return view.findAll(selector).map(el => el.textContent.trim());
}

function click(world, element) {
    assert.ok(element, 'element to click');
    element.dispatchEvent(new (ng(world).w.MouseEvent)('click', { bubbles: true }));
}

function typeInto(world, input, value) {
    assert.ok(input, 'input to type into');
    input.value = value;
    input.dispatchEvent(new (ng(world).w.Event)('input', { bubbles: true }));
}

function fire(world, element, type) {
    element.dispatchEvent(new (ng(world).w.Event)(type, { bubbles: true }));
}

const button = (view, label) => view.findAll('button').find(b => b.textContent.trim() === label);

function rootService(world) {
    return ng(world).app.injector.get(A(world).BindXService);
}

function docExample(title) {
    const source = fs.readFileSync(ADAPTER_SRC, 'utf8');
    const start = source.indexOf(title);
    assert.ok(start >= 0, `no "${title}" example in ${ADAPTER_SRC}`);
    const block = source.slice(start).match(/```typescript\n([\s\S]*?)```/);
    assert.ok(block, `no typescript block after "${title}"`);
    return block[1].split('\n').map(line => line.replace(/^ \* ?/, '')).join('\n');
}

// ---------------------------------------------------------------- TypeScript

let tsCounter = 0;
const tsOptions = (ts) => ({
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    experimentalDecorators: true,
    useDefineForClassFields: false,
    skipLibCheck: true
});
const TS_HEADER = `import { BindXService } from ${ADAPTER_IMPORT};\ndeclare const svc: BindXService;\n`;

function typecheck(code) {
    const ts = require('typescript');
    fs.mkdirSync(TS_DIR, { recursive: true });
    const file = path.join(TS_DIR, `angular-check-${process.pid}-${tsCounter++}.ts`);
    fs.writeFileSync(file, `${TS_HEADER}${code}\n`);
    const program = ts.createProgram([file], tsOptions(ts));
    const diagnostics = ts.getPreEmitDiagnostics(program)
        .filter(d => d.file && d.file.fileName === file)
        .map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
    fs.unlinkSync(file);
    return diagnostics;
}

function assertCompiles(code) {
    same(typecheck(code), [], 'expected no type errors');
}

function assertTypeError(code, expectedCode = 2322) {
    const diagnostics = typecheck(code);
    const codes = [].concat(expectedCode);
    assert.ok(diagnostics.some(d => codes.includes(d.code)),
        `expected TS${expectedCode}, got ${JSON.stringify(diagnostics)}`);
}

function completionsAfter(prefix) {
    const ts = require('typescript');
    fs.mkdirSync(TS_DIR, { recursive: true });
    const file = path.join(TS_DIR, `angular-complete-${process.pid}-${tsCounter++}.ts`);
    const source = `${TS_HEADER}${prefix}`;
    fs.writeFileSync(file, source);
    const options = tsOptions(ts);
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

Given('Angular {int}+ is installed', function(version) {
    const ad = ngSetup(this);
    assert.ok(Number(ad.rt.core.VERSION.major) >= version, `Angular ${ad.rt.core.VERSION.full}`);
    assert.strictEqual(typeof ad.w.Zone, 'function', 'zone.js is loaded in the window');
});

Given(re('@genx/bindx-angular package is installed'), function() {
    const ad = ngSetup(this);
    for (const api of ['BindXService', 'createReactiveFormControl', 'isReactive']) {
        assert.strictEqual(typeof ad.adapter[api], 'function', `${api} export`);
    }
    assert.strictEqual(ad.adapter.default, ad.adapter.BindXService);
});

// ---------------------------------------------------------------- Service integration

Given(re('an Angular module'), function() {
    c(this).module = true;
});

When(re("I import BindXService from '@genx/bindx-angular'"), function() {
    const ctx = c(this);
    ctx.imported = compileNg(this, `import { BindXService } from '@genx/bindx-angular';\nexport { BindXService };`).BindXService;
    assert.strictEqual(ctx.imported, A(this).BindXService);
});

When(re('I provide BindXService in the module'), async function() {
    const ctx = c(this);
    const { AppModule } = compileNg(this, `${IMPORTS}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
@Component({ selector: 'app-root', standalone: false, template: '<p>{{ injected }}</p>' })
export class AppComponent {
  bindX = inject(BindXService);
  injected = this.bindX instanceof BindXService;
}
@NgModule({ declarations: [AppComponent], imports: [BrowserModule], providers: [BindXService], bootstrap: [AppComponent] })
export class AppModule {}`);
    const ad = ng(this);
    ad.w.document.body.appendChild(ad.w.document.createElement('app-root'));
    ctx.moduleRef = await ad.rt.pb.platformBrowser().bootstrapModule(AppModule);
    ad.cleanups.push(() => ctx.moduleRef.destroy());
});

Then(re('the service should be available for dependency injection'), function() {
    const ctx = c(this);
    const service = ctx.moduleRef.injector.get(A(this).BindXService);
    assert.ok(service instanceof A(this).BindXService);
    assert.strictEqual(ng(this).w.document.querySelector('app-root p').textContent, 'true', 'the component injected it');
});

Given(re('a component with BindXService injected'), function() {
    c(this).Comp = compileComponent(this, {
        template: '<p>{{ ready }}</p>',
        members: 'ready = false;\n  ngOnInit() { this.ready = true; }'
    });
});

When(re('the component initializes'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, ctx.Comp);
    assert.strictEqual(ctx.view.text(), 'true', 'ngOnInit ran');
});

Then(re('the service should be available'), function() {
    const ctx = c(this);
    const service = ctx.view.cmp.bindX;
    assert.ok(service instanceof A(this).BindXService);
    assert.strictEqual(service, rootService(this), 'providedIn: root');
});

Then(/^the service should have (reactive|computed|watch)\(\) method$/, function(method) {
    const service = c(this).view.cmp.bindX;
    assert.strictEqual(typeof service[method], 'function');
    const state = service.reactive({ n: 1 });
    if (method === 'reactive') assert.ok(A(this).isReactive(state));
    if (method === 'computed') assert.strictEqual(service.computed(() => state.n + 1)(), 2);
    if (method === 'watch') {
        const seen = [];
        const unwatch = service.watch(() => state.n, value => seen.push(value));
        state.n = 5;
        unwatch();
        state.n = 6;
        same(seen, [5]);
    }
});

// ---------------------------------------------------------------- Reactive state

Given(re('a component with BindXService'), function() {
    c(this).source = { template: '<p>{{ state.count }}</p>', state: '{ count: 0 }' };
});

When(re('I create reactive state with bindXService.reactive({ count: 0 })'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, ctx.source));
});

Then(re('the state should be reactive'), function() {
    const { state } = c(this).view.cmp;
    assert.ok(A(this).isReactive(state));
    const seen = [];
    const unwatch = ng(this).core.watch(() => state.count, value => seen.push(value));
    state.count = 1;
    unwatch();
    same(seen, [1]);
});

Then(re('changes should trigger Angular change detection'), function() {
    const { cmp } = c(this).view;
    const before = cmp.renders;
    cmp.state.count = 5; // from the test, outside the zone: no event, no detectChanges()
    assert.ok(cmp.renders > before, 'the view was checked');
});

Then(re('the component view should update'), function() {
    assert.strictEqual(c(this).view.text(), '5');
});

Given(re("a component with reactive state { message: 'Hello' }"), function() {
    c(this).state = "{ message: 'Hello' }";
});

When(re('the template binds to state.message'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, { template: '<p>{{ state.message }}</p>', state: ctx.state }));
});

Then(re("the template should display 'Hello'"), function() {
    assert.strictEqual(c(this).view.text(), 'Hello');
});

/** The state a step acts on: one made with the root service, or the component's. */
const stateOf = (ctx) => ctx.reactive || ctx.view.cmp.state;

When(re("state.message changes to 'World'"), function() {
    const ctx = c(this);
    if (ctx.view) ctx.rendersBefore = ctx.view.cmp.renders;
    stateOf(ctx).message = 'World';
});

Then(re("the template should update to 'World'"), function() {
    assert.strictEqual(c(this).view.text(), 'World');
});

Then(re('Angular change detection should run'), function() {
    const ctx = c(this);
    assert.ok(ctx.view.cmp.renders > ctx.rendersBefore, 'the view was checked after the change');
});

// ---------------------------------------------------------------- Zone.js

const MESSAGE_COMPONENT = { template: '<p>{{ state.message }}</p>', state: "{ message: 'Hello' }" };

Given(re('a component with reactive state'), function() {
    c(this).source = MESSAGE_COMPONENT;
});

async function mountOnce(world) {
    const ctx = c(world);
    if (!ctx.view) ctx.view = await mount(world, compileComponent(world, ctx.source || MESSAGE_COMPONENT));
    return ctx.view;
}

When(re('a reactive property changes outside NgZone'), async function() {
    const ctx = c(this);
    const view = await mountOnce(this);
    const zone = zoneOf(this);
    const { NgZone } = ng(this).rt.core;
    ctx.stable = 0;
    zone.onStable.subscribe(() => ctx.stable++);
    ctx.rendersBefore = view.cmp.renders;
    ctx.ticksBefore = ng(this).ticks;
    zone.runOutsideAngular(() => {
        assert.strictEqual(NgZone.isInAngularZone(), false);
        view.cmp.state.message = 'Outside';
    });
    ctx.expected = 'Outside';
});

Then(re('Zone.js should detect the change'), function() {
    assert.ok(c(this).stable > 0, 'the Angular zone became stable again after the change');
});

Then(re('Angular change detection should run automatically'), function() {
    const ctx = c(this);
    assert.ok(ng(this).ticks > ctx.ticksBefore, 'ApplicationRef.tick ran without the test calling it');
    assert.ok(ctx.view.cmp.renders > ctx.rendersBefore);
});

Then(re('the view should update'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.text(), ctx.expected);
});

Given(re('a component running outside NgZone'), async function() {
    c(this).source = MESSAGE_COMPONENT;
    await mountOnce(this);
});

When(re('reactive state changes'), function() {
    const ctx = c(this);
    if (ctx.lazy) {
        ctx.lazy.state.n = 2;
        ctx.lazy.state.n = 3;
        return;
    }
    ctx.ticksBefore = ng(this).ticks;
    zoneOf(this).runOutsideAngular(() => { ctx.view.cmp.state.message = 'Manual'; });
    ctx.expected = 'Manual';
});

Then(re('the adapter should run change detection manually'), function() {
    assert.ok(ng(this).ticks > c(this).ticksBefore, 'the adapter re-entered the zone, which ran a tick');
});

Then(re('the view should update correctly'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.text(), ctx.expected);
    same(ng(this).consoleErrors, []);
});

Given(re('a component with OnPush change detection'), function() {
    c(this).source = { ...MESSAGE_COMPONENT, meta: ', changeDetection: ChangeDetectionStrategy.OnPush' };
});

Given(re('reactive state managed by BindXService'), async function() {
    await mountOnce(this);
    assert.ok(A(this).isReactive(c(this).view.cmp.state));
});

When(re('reactive properties change'), function() {
    const ctx = c(this);
    ctx.rendersBefore = ctx.view.cmp.renders;
    ctx.view.cmp.state.message = 'Pushed';
    ctx.expected = 'Pushed';
});

Then(re('change detection should trigger'), function() {
    const ctx = c(this);
    assert.ok(ctx.view.cmp.renders > ctx.rendersBefore, 'the OnPush view was marked and checked');
});

// ---------------------------------------------------------------- Computed

Given(re("a component with reactive state { firstName: 'John', lastName: 'Doe' }"), function() {
    c(this).state = "{ firstName: 'John', lastName: 'Doe' }";
});

When(re('I create computed fullName = computed(() => `${state.firstName} ${state.lastName}`)'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ fullName() }}</p>',
        state: ctx.state,
        members: 'fullName = this.bindX.computed(() => `${this.state.firstName} ${this.state.lastName}`);'
    }));
});

Then(re("fullName() should return 'John Doe'"), function() {
    assert.strictEqual(c(this).view.cmp.fullName(), 'John Doe');
});

When(re("state.firstName changes to 'Jane'"), function() {
    c(this).view.cmp.state.firstName = 'Jane';
});

Then(re("fullName() should return 'Jane Doe'"), function() {
    assert.strictEqual(c(this).view.cmp.fullName(), 'Jane Doe');
});

Then(re('the template should update'), function() {
    assert.strictEqual(c(this).view.text(), 'Jane Doe');
});

Given(re('a component with computed property'), function() {
    c(this).source = {
        template: '<p>{{ total() }}</p>',
        state: '{ price: 10, qty: 2 }',
        members: 'total = this.bindX.computed(() => this.state.price * this.state.qty);'
    };
});

When(re('the template binds to the computed value'), async function() {
    await mountOnce(this);
});

Then(re('the template should display the computed result'), function() {
    assert.strictEqual(c(this).view.text(), '20');
});

Then(re('updates should trigger change detection'), function() {
    const { view } = c(this);
    const before = view.cmp.renders;
    view.cmp.state.qty = 3;
    assert.ok(view.cmp.renders > before);
    assert.strictEqual(view.text(), '30');
});

// ---------------------------------------------------------------- Watchers

Given(re('a component with reactive state { count: 0 }'), function() {
    c(this).state = '{ count: 0 }';
});

When(re('I create a watcher: watch(() => state.count, (val) => console.log(val))'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.count }}</p>',
        state: ctx.state,
        members: `calls: any[] = [];
  unwatch = this.bindX.watch(() => this.state.count, (val: any, old: any) => {
    console.log(val);
    this.calls.push([val, old, NgZone.isInAngularZone()]);
  });`
    }));
});

Then(re('the watcher should execute on state.count changes'), function() {
    const { state } = c(this).view.cmp;
    state.count = 1;
    state.count = 2;
    same(ng(this).consoleLogs, [[1], [2]]);
});

Then(re('the callback should receive new and old values'), function() {
    same(c(this).view.cmp.calls.map(([val, old]) => [val, old]), [[1, 0], [2, 1]]);
});

Then(re('the watcher should respect Angular zones'), function() {
    // The changes came from the test, outside the zone; the callbacks ran inside it
    same(c(this).view.cmp.calls.map(call => call[2]), [true, true]);
    assert.strictEqual(c(this).view.text(), '2');
});

Given(re('a component with active watchers'), async function() {
    const ctx = c(this);
    await trackReleased(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.count }}</p>',
        state: '{ count: 0 }',
        members: `seen: any[] = [];
  a = this.bindX.watch(() => this.state.count, (v: any) => this.seen.push(['a', v]));
  b = this.bindX.watch(() => this.state.count * 2, (v: any) => this.seen.push(['b', v]));`
    }));
    assert.strictEqual(watchers(this), ctx.baseline + 3, 'two watchers plus the state\'s change detection watcher');
});

When(re('the component is destroyed (ngOnDestroy)'), function() {
    const ctx = c(this);
    ctx.cmp = ctx.view.cmp;
    ctx.view.destroy();
});

Then(re('all watchers should be disconnected'), function() {
    const ctx = c(this);
    assert.strictEqual(watchers(this), ctx.baseline);
    ctx.cmp.state.count = 9;
    same(ctx.cmp.seen, [], 'no callback after destroy');
});

/**
 * Record what is alive before a component mounts; the shared "no memory leaks
 * should occur" step (common.steps.js) then checks the component left nothing
 */
async function trackReleased(world) {
    const ctx = c(world);
    await appFor(world);
    ctx.baseline = watchers(world);
    ctx.serviceWatchers = rootService(world).watchers.length;
    world.checkReleased = () => {
        assert.ok(ctx.view.destroyed, 'the component was destroyed');
        assert.strictEqual(ctx.view.host.isConnected, false);
        assert.strictEqual(watchers(world), ctx.baseline, 'no watcher outlives the component');
        assert.strictEqual(rootService(world).watchers.length, ctx.serviceWatchers, 'the root service keeps no reference to them');
    };
}

Given(re('a component with reactive state { value: 10 }'), function() {
    c(this).state = '{ value: 10 }';
});

When(re('I create watcher with { immediate: true }'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.value }}</p>',
        state: ctx.state,
        members: `calls: any[] = [];
  unwatch = this.bindX.watch(() => this.state.value, (val: any, old: any) => this.calls.push([val, old]), { immediate: true });`
    }));
});

Then(re('the watcher callback should execute immediately'), function() {
    assert.strictEqual(c(this).view.cmp.calls.length, 1, 'ran once before any change');
});

Then(re('it should receive the current value'), function() {
    same(c(this).view.cmp.calls[0], [10, undefined]);
});

// ---------------------------------------------------------------- RxJS

Given(re('reactive state { count: 0 }'), async function() {
    await appFor(this);
    c(this).reactive = rootService(this).reactive({ count: 0 });
});

When(re('I convert it to Observable using bindXService.toObservable(state.count)'), function() {
    const ctx = c(this);
    // The API takes a getter, as documented: toObservable(() => state.count)
    ctx.observable = rootService(this).toObservable(() => ctx.reactive.count);
});

Then(re('it should return an RxJS Observable'), function() {
    const { observable } = c(this);
    assert.ok(ng(this).rt.rxjs.isObservable(observable));
    assert.strictEqual(typeof observable.pipe, 'function');
});

Then(re('the Observable should emit when state changes'), function() {
    const ctx = c(this);
    const seen = [];
    const sub = ctx.observable.subscribe(v => seen.push(v));
    ctx.reactive.count = 1;
    ctx.reactive.count = 2;
    sub.unsubscribe();
    same(seen, [0, 1, 2]);
});

Then(re('I can use RxJS operators (map, filter, debounce)'), async function() {
    const ctx = c(this);
    const { map, filter, debounceTime } = ng(this).rt.operators;
    const seen = [];
    const sub = ctx.observable.pipe(map(x => x * 10), filter(x => x > 20), debounceTime(5)).subscribe(v => seen.push(v));
    ctx.reactive.count = 3;
    ctx.reactive.count = 4;
    await flush(30);
    sub.unsubscribe();
    same(seen, [40], 'mapped, filtered, and debounced to the last value');
});

Given(re("reactive state { message: 'Hello' }"), async function() {
    await appFor(this);
    c(this).reactive = rootService(this).reactive({ message: 'Hello' });
});

When(re('I subscribe to toObservable(state.message)'), function() {
    const ctx = c(this);
    ctx.received = [];
    const sub = rootService(this).toObservable(() => ctx.reactive.message).subscribe(v => ctx.received.push(v));
    ng(this).cleanups.push(() => sub.unsubscribe());
});

Then(re("the subscription should receive 'Hello'"), function() {
    same(c(this).received, ['Hello']);
});

Then(re("the subscription should receive 'World'"), function() {
    same(c(this).received, ['Hello', 'World']);
});

Given(re('a component with Observable subscriptions'), async function() {
    const ctx = c(this);
    await trackReleased(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.count }}</p>',
        state: '{ count: 0 }',
        members: `seen: any[] = [];
  completed = false;
  sub = this.bindX.toObservable(() => this.state.count).subscribe({
    next: (v: any) => this.seen.push(v),
    complete: () => { this.completed = true; }
  });`
    }));
    ctx.view.cmp.state.count = 1;
    same(ctx.view.cmp.seen, [0, 1]);
});

When(re('the component is destroyed'), function() {
    const ctx = c(this);
    ctx.cmp = ctx.view.cmp;
    ctx.view.destroy();
});

Then(re('all subscriptions should be unsubscribed automatically'), function() {
    const { cmp } = c(this);
    assert.strictEqual(cmp.completed, true, 'the Observable completed on destroy');
    assert.strictEqual(cmp.sub.closed, true);
    cmp.state.count = 2;
    same(cmp.seen, [0, 1]);
});

Given(re('reactive state as Observable'), function() {
    c(this).Comp = compileComponent(this, {
        template: '<p>{{ count$ | async }}</p>',
        state: '{ count: 0 }',
        meta: ', imports: [AsyncPipe]',
        members: `subscribers = 0;
  count$ = new Observable((subscriber: any) => {
    this.subscribers++;
    const inner = this.bindX.toObservable(() => this.state.count).subscribe(subscriber);
    return () => { this.subscribers--; inner.unsubscribe(); };
  });`
    });
});

When(re('I use the async pipe in template: {{ observable$ | async }}'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, ctx.Comp);
});

Then(re('Angular should handle subscription/unsubscription'), async function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.cmp.subscribers, 1, 'the async pipe subscribed');
    const other = await mount(this, ctx.Comp);
    assert.strictEqual(other.cmp.subscribers, 1);
    other.destroy();
    assert.strictEqual(other.cmp.subscribers, 0, 'the async pipe unsubscribed on destroy');
});

Then(re('the template should display reactive values'), function() {
    const { view } = c(this);
    assert.strictEqual(view.text(), '0');
    view.cmp.state.count = 5;
    assert.strictEqual(view.text(), '5');
});

// ---------------------------------------------------------------- Lifecycle

Given(re('a component with ngOnInit lifecycle hook'), function() {
    // ngOnInit runs outside an injection context, so the component provides the
    // service: its watchers then end with the component (see BindXService.watch)
    c(this).Comp = compileComponent(this, {
        template: '<p>{{ state?.loading }}</p>',
        meta: ', providers: [BindXService]',
        members: `state: any = null;
  seen: any[] = [];
  initialized = false;
  ngOnInit() {
    this.state = this.bindX.reactive({ users: [], loading: false });
    this.bindX.watch(() => this.state.loading, (v: any) => this.seen.push(v));
    this.initialized = true;
  }`
    });
});

When(re('ngOnInit executes'), async function() {
    const ctx = c(this);
    await appFor(this);
    ctx.baseline = watchers(this);
    ctx.view = await mount(this, ctx.Comp);
    assert.strictEqual(ctx.view.cmp.initialized, true);
});

When(re('I initialize reactive state'), function() {
    assert.ok(A(this).isReactive(c(this).view.cmp.state), 'ngOnInit created reactive state');
});

Then(re('the state should be properly initialized'), function() {
    const { view } = c(this);
    same(JSON.parse(JSON.stringify(view.cmp.state)), { users: [], loading: false });
    assert.strictEqual(view.text(), 'false');
});

Then(re('watchers should be active'), function() {
    const ctx = c(this);
    ctx.view.cmp.state.loading = true;
    same(ctx.view.cmp.seen, [true]);
    assert.strictEqual(ctx.view.text(), 'true');
    ctx.view.destroy();
    assert.strictEqual(watchers(this), ctx.baseline, 'the component-provided service cleaned up on destroy');
});

Given(re('a component with reactive state and watchers'), async function() {
    const ctx = c(this);
    await appFor(this);
    ctx.baseline = watchers(this);
    ctx.serviceWatchers = rootService(this).watchers.length;
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.count }} {{ doubled() }}</p>',
        state: '{ count: 1 }',
        members: `seen: any[] = [];
  completed = false;
  doubled = this.bindX.computed(() => this.state.count * 2);
  w = this.bindX.watch(() => this.state.count, (v: any) => this.seen.push(v));
  sub = this.bindX.toObservable(() => this.state.count).subscribe({ complete: () => { this.completed = true; } });`
    }));
    assert.ok(watchers(this) > ctx.baseline);
});

When(re('ngOnDestroy executes'), function() {
    const ctx = c(this);
    ctx.cmp = ctx.view.cmp;
    ctx.rendersAtDestroy = ctx.cmp.renders;
    ctx.view.destroy();
});

Then(re('all watchers should disconnect'), function() {
    const ctx = c(this);
    assert.strictEqual(watchers(this), ctx.baseline);
    ctx.cmp.state.count = 2;
    same(ctx.cmp.seen, []);
});

Then(re('all subscriptions should unsubscribe'), function() {
    const { cmp } = c(this);
    assert.strictEqual(cmp.completed, true);
    assert.strictEqual(cmp.sub.closed, true);
});

Then(re('reactive state should be cleaned up'), function() {
    const ctx = c(this);
    // Its change detection watcher is gone: changing it no longer checks the destroyed view
    ctx.cmp.state.count = 3;
    assert.strictEqual(ctx.cmp.renders, ctx.rendersAtDestroy);
    same(ng(this).consoleErrors, []);
});

Then(re('no memory leaks should remain'), function() {
    const ctx = c(this);
    assert.strictEqual(watchers(this), ctx.baseline);
    assert.strictEqual(rootService(this).watchers.length, ctx.serviceWatchers);
});

Given(re('a component with @Input properties'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ total() }}</p>',
        state: '{ price: 0, qty: 1 }',
        members: `@Input() price = 0;
  @Input() qty = 1;
  changes: any[] = [];
  total = this.bindX.computed(() => this.state.price * this.state.qty);
  ngOnChanges(changes: any) {
    this.changes.push(Object.keys(changes).sort());
    for (const key of Object.keys(changes)) this.state[key] = changes[key].currentValue;
  }`
    }), { price: 2 });
    assert.strictEqual(ctx.view.text(), '2');
});

When(re('ngOnChanges receives new input values'), function() {
    const { view } = c(this);
    view.ref.setInput('price', 5);
    view.ref.setInput('qty', 3);
    tick(this);
    same(view.cmp.changes.at(-1), ['price', 'qty']);
});

When(re('I update reactive state based on inputs'), function() {
    assert.ok(c(this).view.cmp.changes.length >= 2, 'ngOnChanges copied the inputs into the state');
});

Then(re('the reactive state should update'), function() {
    const { state } = c(this).view.cmp;
    assert.strictEqual(state.price, 5);
    assert.strictEqual(state.qty, 3);
});

Then(re('computed properties should recalculate'), function() {
    const { view } = c(this);
    assert.strictEqual(view.cmp.total(), 15);
    assert.strictEqual(view.text(), '15');
});

// ---------------------------------------------------------------- Forms

Given(re('a component with FormGroup'), function() {
    c(this).form = true;
});

Given(re("reactive state { username: '', email: '' }"), function() {
    c(this).state = "{ username: '', email: '' }";
});

When(re('I sync FormGroup values with reactive state'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<form [formGroup]="form"><input name="username" formControlName="username"><input name="email" formControlName="email"></form><p>{{ state.username }}|{{ state.email }}</p>',
        state: ctx.state,
        meta: ', imports: [ReactiveFormsModule]',
        members: `form = new FormGroup({ username: new FormControl(''), email: new FormControl('') });
  toState = this.form.valueChanges.subscribe((value: any) => Object.assign(this.state, value));
  toForm = this.bindX.watch(() => ({ ...this.state }), (value: any) => this.form.patchValue(value, { emitEvent: false }));`
    }));
});

Then(re('form value changes should update reactive state'), function() {
    const { view } = c(this);
    typeInto(this, view.find('input[name="username"]'), 'ada');
    assert.strictEqual(view.cmp.state.username, 'ada');
    assert.strictEqual(view.text(), 'ada|');
});

Then(re('reactive state changes should update form'), function() {
    const { view } = c(this);
    view.cmp.state.email = 'ada@example.com';
    assert.strictEqual(view.cmp.form.value.email, 'ada@example.com');
    assert.strictEqual(view.find('input[name="email"]').value, 'ada@example.com');
    assert.strictEqual(view.text(), 'ada|ada@example.com');
});

Given(re('a reactive form with validators'), function() {
    c(this).validators = true;
});

Given(re('reactive state tracking form data'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<form [formGroup]="form"><input name="email" formControlName="email"><input name="password" formControlName="password"></form><p>{{ state.status }}</p><span class="error email">{{ messages().email }}</span><span class="error password">{{ messages().password }}</span>',
        meta: ', imports: [ReactiveFormsModule]',
        members: `form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });
  errorsOf = () => ({ email: this.form.controls.email.errors, password: this.form.controls.password.errors });
  state: any = this.bindX.reactive({ status: this.form.status, errors: this.errorsOf() });
  sync = this.form.statusChanges.subscribe((status: any) => {
    this.state.status = status;
    this.state.errors = this.errorsOf();
  });
  messages = this.bindX.computed(() => {
    const { email, password } = this.state.errors;
    return {
      email: email?.required ? 'Email is required' : email?.email ? 'Enter a valid email' : '',
      password: password?.required ? 'Password is required' : password?.minlength ? 'Use at least 8 characters' : ''
    };
  });`
    }));
});

When(re('form validation state changes'), function() {
    const { view } = c(this);
    assert.strictEqual(view.cmp.state.status, 'INVALID');
    typeInto(this, view.find('input[name="email"]'), 'ada@');
    typeInto(this, view.find('input[name="password"]'), 'long enough');
});

Then(re('reactive state should reflect validation status'), function() {
    const { view } = c(this);
    assert.strictEqual(view.cmp.state.status, 'INVALID', 'the email is still invalid');
    assert.strictEqual(view.cmp.state.errors.password, null);
    assert.strictEqual(view.text(), 'INVALID');
    typeInto(this, view.find('input[name="email"]'), 'ada@example.com');
    assert.strictEqual(view.cmp.state.status, 'VALID');
    assert.strictEqual(view.text(), 'VALID');
});

Then(re('computed properties can derive error messages'), function() {
    const { view } = c(this);
    const message = (name) => view.find(`.error.${name}`).textContent;
    assert.strictEqual(message('email'), '');
    typeInto(this, view.find('input[name="email"]'), 'ada@');
    assert.strictEqual(message('email'), 'Enter a valid email');
    typeInto(this, view.find('input[name="password"]'), 'short');
    assert.strictEqual(message('password'), 'Use at least 8 characters');
    typeInto(this, view.find('input[name="email"]'), '');
    assert.strictEqual(message('email'), 'Email is required');
});

Given(re("reactive state { value: 'test' }"), function() {
    c(this).state = "{ value: 'test' }";
});

When(re('I use [(ngModel)] with reactive property'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<input [(ngModel)]="state.value"><p>{{ state.value }}</p>',
        state: ctx.state,
        meta: ', imports: [FormsModule]'
    }));
    await flush(); // NgModel writes its value in a microtask
    assert.strictEqual(ctx.view.find('input').value, 'test');
});

Then(re('input changes should update reactive state'), function() {
    const { view } = c(this);
    typeInto(this, view.find('input'), 'typed');
    assert.strictEqual(view.cmp.state.value, 'typed');
    assert.strictEqual(view.text(), 'typed');
});

Then(re('reactive state changes should update input'), async function() {
    const { view } = c(this);
    view.cmp.state.value = 'set in code';
    await flush();
    assert.strictEqual(view.find('input').value, 'set in code');
});

Then(re('Angular change detection should work correctly'), function() {
    assert.strictEqual(c(this).view.text(), 'set in code');
    same(ng(this).consoleErrors, [], 'no ExpressionChanged or other errors');
});

Given(re('FormControl bound to reactive state'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<input [formControl]="control"><p>{{ state.value }}</p>',
        state: "{ value: 'a' }",
        meta: ', imports: [ReactiveFormsModule]',
        members: `control = new FormControl('a');
  toState = this.control.valueChanges.subscribe((value: any) => { this.state.value = value; });
  toControl = this.bindX.watch(() => this.state.value, (value: any) => {
    if (this.control.value !== value) this.control.setValue(value);
  });`
    }));
});

When(re('FormControl value changes'), function() {
    c(this).view.cmp.control.setValue('b');
});

Then(re('reactive state should update'), function() {
    const { view } = c(this);
    assert.strictEqual(view.cmp.state.value, 'b');
    assert.strictEqual(view.text(), 'b');
});

When(re('reactive state changes programmatically'), function() {
    c(this).view.cmp.state.value = 'c';
});

Then(re('FormControl should update'), function() {
    const { view } = c(this);
    assert.strictEqual(view.cmp.control.value, 'c');
    assert.strictEqual(view.find('input').value, 'c');
});

// ---------------------------------------------------------------- TypeScript

const USER_TYPE = `interface UserState { name: string; age: number; tags: string[] }`;

Given(re('TypeScript interfaces for state'), function() {
    c(this).ts = USER_TYPE;
});

When(re('I create reactive state with type: reactive<UserState>({ ... })'), function() {
    const ctx = c(this);
    ctx.ts += `\nconst user = svc.reactive<UserState>({ name: 'Ada', age: 36, tags: [] });`;
    assertCompiles(`${ctx.ts}\nuser.age++;\nuser.tags.push('x');`);
});

Then(re('TypeScript should enforce type safety'), function() {
    assertTypeError(`${c(this).ts}\nuser.age = 'old';`);
    assertTypeError(`${USER_TYPE}\nsvc.reactive<UserState>({ name: 'Ada' });`, [2345, 2739]);
});

Then(re('IDE autocomplete should work'), function() {
    const ctx = c(this);
    const fields = completionsAfter(`${ctx.ts}\nuser.`);
    for (const name of ['name', 'age', 'tags']) assert.ok(fields.includes(name), `${name} in ${fields}`);
    const methods = completionsAfter(`${ctx.ts}\nsvc.`);
    for (const name of ['reactive', 'computed', 'watch', 'toObservable', 'fromObservable']) {
        assert.ok(methods.includes(name), `${name} in ${methods}`);
    }
});

Then(re('type errors should be caught at compile time'), function() {
    const ctx = c(this);
    assertTypeError(`${ctx.ts}\nconst n: number = user.name;`);
    assertTypeError(`${ctx.ts}\nuser.nickname = 'x';`, 2339);
});

const CART_TYPE = `interface Cart { items: { price: number; qty: number }[]; coupon: string | null }
const cart = svc.reactive<Cart>({ items: [], coupon: null });`;

Given(re('typed reactive state'), function() {
    c(this).ts = CART_TYPE;
});

When(re('I create computed properties'), function() {
    const ctx = c(this);
    ctx.ts += `\nconst total = svc.computed(() => cart.items.reduce((sum, item) => sum + item.price * item.qty, 0));`;
    assertCompiles(ctx.ts);
});

Then(re('computed return types should be inferred'), function() {
    const ctx = c(this);
    assertCompiles(`${ctx.ts}\nconst n: number = total();`);
    assertTypeError(`${ctx.ts}\nconst s: string = total();`);
});

Then(re('type checking should work correctly'), function() {
    assertTypeError(`${c(this).ts}\ntotal(1);`, 2554);
    assertTypeError(`${CART_TYPE}\nsvc.computed(() => cart.items.reduce((sum, item) => sum + item.cost, 0));`, 2339);
});

When(re('I create watchers'), function() {
    assertCompiles(`${c(this).ts}\nconst stop = svc.watch(() => cart.coupon, (value, old) => { const s: string | null = value; const o: string | null = old; });\nstop();`);
});

Then(re('callback parameter types should be inferred'), function() {
    assertTypeError(`${c(this).ts}\nsvc.watch(() => cart.coupon, (value) => { const n: number = value; });`);
});

Then(re('TypeScript should validate the callback'), function() {
    const ctx = c(this);
    // T is inferred from the annotated parameter, so TS reports the getter (2322) or the callback (2345)
    assertTypeError(`${ctx.ts}\nsvc.watch(() => cart.items.length, (value: string) => {});`, [2322, 2345]);
    assertTypeError(`${ctx.ts}\nsvc.watch(() => cart.coupon, 'not a function');`, 2345);
});

// ---------------------------------------------------------------- Dependency injection

const TWO_COMPONENTS = (meta = '') => `${IMPORTS}
@Component({ selector: 'app-one', template: '<p>{{ state.n }}</p>'${meta} })
export class One { bindX = inject(BindXService); state: any = this.bindX.reactive({ n: 1 }); }
@Component({ selector: 'app-two', template: '<p>{{ state.n }}</p>'${meta} })
export class Two { bindX = inject(BindXService); state: any = this.bindX.reactive({ n: 2 }); }`;

Given(re('Angular application root module'), async function() {
    await appFor(this);
});

When(re('I provide BindXService at root'), async function() {
    // BindXService is @Injectable({ providedIn: 'root' }): no provider entry needed
    const ctx = c(this);
    const { One, Two } = compileNg(this, TWO_COMPONENTS());
    ctx.one = await mount(this, One);
    ctx.two = await mount(this, Two);
});

Then(re('a single instance should be shared across app'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.one.cmp.bindX, rootService(this));
    assert.strictEqual(ctx.two.cmp.bindX, rootService(this));
});

Then(re('all components should access the same instance'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.one.cmp.bindX, ctx.two.cmp.bindX);
    ctx.one.cmp.state.n = 10;
    ctx.two.cmp.state.n = 20;
    same([ctx.one.text(), ctx.two.text()], ['10', '20']);
});

Given(re('a component with local BindXService provider'), function() {
    c(this).Comp = compileNg(this, TWO_COMPONENTS(', providers: [BindXService]')).One;
});

When(re('the component uses BindXService'), async function() {
    const ctx = c(this);
    await appFor(this);
    ctx.baseline = watchers(this);
    ctx.one = await mount(this, ctx.Comp);
    ctx.two = await mount(this, ctx.Comp);
});

Then(re('the component should have its own instance'), function() {
    const ctx = c(this);
    assert.ok(ctx.one.cmp.bindX instanceof A(this).BindXService);
    assert.notStrictEqual(ctx.one.cmp.bindX, ctx.two.cmp.bindX);
    assert.notStrictEqual(ctx.one.cmp.bindX, rootService(this));
});

Then(re('state should be isolated from other components'), function() {
    const ctx = c(this);
    ctx.one.cmp.state.n = 5;
    same([ctx.one.text(), ctx.two.text()], ['5', '1']);
    const perComponent = (watchers(this) - ctx.baseline) / 2;
    ctx.one.destroy();
    assert.strictEqual(watchers(this), ctx.baseline + perComponent, 'destroying one ends only its own watchers');
    ctx.two.cmp.state.n = 7;
    assert.strictEqual(ctx.two.text(), '7');
});

const CART_SERVICE = `${IMPORTS}
@Injectable({ providedIn: 'root' })
export class CartService {
  constructor(private bindX: BindXService) {}
  state: any = this.bindX.reactive({ items: [] });
  count = this.bindX.computed(() => this.state.items.length);
  add(item: string) { this.state.items.push(item); }
  get service() { return this.bindX; }
}
@Component({ selector: 'app-cart', template: '<p>{{ cart.count() }}</p>' })
export class CartBadge { cart = inject(CartService); }`;

Given(re('a custom Angular service'), function() {
    c(this).cartModule = compileNg(this, CART_SERVICE);
});

When(re('I inject BindXService into the custom service'), async function() {
    const ctx = c(this);
    const app = await appFor(this);
    ctx.cart = app.injector.get(ctx.cartModule.CartService);
});

Then(re('the service should access bindX functionality'), function() {
    const { cart } = c(this);
    assert.strictEqual(cart.service, rootService(this), 'constructor injection');
    assert.ok(A(this).isReactive(cart.state));
});

Then(re('reactive state can be managed in services'), async function() {
    const ctx = c(this);
    const badge = await mount(this, ctx.cartModule.CartBadge);
    assert.strictEqual(badge.text(), '0');
    ctx.cart.add('apple');
    assert.strictEqual(ctx.cart.count(), 1);
    assert.strictEqual(badge.text(), '1', 'a component reading the service re-rendered');
});

// ---------------------------------------------------------------- Batching and laziness

Given(re('multiple reactive property changes'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.a }}|{{ state.b }}|{{ state.c }}</p>',
        state: '{ a: 0, b: 0, c: 0 }'
    }));
    // One change on its own, for comparison
    const ticks = ng(this).ticks;
    const renders = ctx.view.cmp.renders;
    zoneOf(this).run(() => { ctx.view.cmp.state.a = -1; });
    ctx.single = { ticks: ng(this).ticks - ticks, renders: ctx.view.cmp.renders - renders };
    assert.strictEqual(ctx.single.ticks, 1);
});

When(re('changes occur in the same tick'), function() {
    const ctx = c(this);
    ctx.ticksBefore = ng(this).ticks;
    ctx.rendersBefore = ctx.view.cmp.renders;
    zoneOf(this).run(() => {
        const { state } = ctx.view.cmp;
        state.a = 1;
        state.b = 2;
        state.c = 3;
    });
});

Then(re('only one change detection cycle should run'), function() {
    const ctx = c(this);
    assert.strictEqual(ng(this).ticks - ctx.ticksBefore, 1);
    assert.strictEqual(ctx.view.text(), '1|2|3');
});

Then(re('performance should be optimized'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.view.cmp.renders - ctx.rendersBefore, ctx.single.renders,
        'three changes cost the same view checks as one');
});

Given(re('computed properties depending on reactive state'), async function() {
    await appFor(this);
    const service = rootService(this);
    const lazy = { runs: { used: 0, unused: 0 } };
    lazy.state = service.reactive({ n: 1 });
    lazy.used = service.computed(() => { lazy.runs.used++; return lazy.state.n * 2; });
    lazy.unused = service.computed(() => { lazy.runs.unused++; return lazy.state.n * 3; });
    assert.strictEqual(lazy.used(), 2);
    c(this).lazy = lazy;
});

Then(re('computed properties should only recalculate when accessed'), function() {
    const { lazy } = c(this);
    assert.strictEqual(lazy.runs.used, 1, 'not recomputed by the changes themselves');
    assert.strictEqual(lazy.used(), 6);
    assert.strictEqual(lazy.runs.used, 2, 'recomputed once, on access');
    lazy.used();
    assert.strictEqual(lazy.runs.used, 2, 'cached until the next change');
});

Then(re('unused computed properties should not execute'), function() {
    assert.strictEqual(c(this).lazy.runs.unused, 0);
});

// ---------------------------------------------------------------- Errors

Given(re('a computed property that throws an error'), async function() {
    const ctx = c(this);
    ctx.kind = 'computed';
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ label() }}</p><b>{{ state.other }}</b>',
        state: "{ fail: false, other: 'a' }",
        members: `label = this.bindX.computed(() => {
    if (this.state.fail) throw new Error('label failed');
    return 'ok';
  });`
    }));
});

When(re('the computed property is accessed'), function() {
    const ctx = c(this);
    try {
        ctx.view.cmp.state.fail = true; // the view reads label() during change detection
    } catch (error) {
        ctx.escaped = error;
    }
});

Given(re('a watcher callback that throws an error'), async function() {
    const ctx = c(this);
    ctx.kind = 'watcher';
    ctx.view = await mount(this, compileComponent(this, {
        template: '<p>{{ state.n }}</p>',
        state: '{ n: 0 }',
        members: `seen: any[] = [];
  bad = this.bindX.watch(() => this.state.n, () => { throw new Error('watcher failed'); });
  good = this.bindX.watch(() => this.state.n, (v: any) => this.seen.push(v));`
    }));
});

When(re('the watcher executes'), function() {
    const ctx = c(this);
    try {
        ctx.view.cmp.state.n = 1;
    } catch (error) {
        ctx.escaped = error;
    }
});

const loggedErrors = (world, text) => ng(world).consoleErrors.filter(args =>
    args.some(arg => (arg && arg.message ? arg.message : String(arg)).includes(text)));

Then(re('the error should be caught'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.escaped, undefined, `the change threw: ${ctx.escaped}`);
    const text = ctx.kind === 'computed' ? 'label failed' : 'watcher failed';
    assert.ok(loggedErrors(this, text).length > 0, `${text} reached an error handler`);
});

Then(re('Angular should not crash'), function() {
    const { view } = c(this);
    view.cmp.state.fail = false;
    view.cmp.state.other = 'b';
    assert.strictEqual(view.text(), 'ok');
    assert.strictEqual(view.text('b'), 'b', 'the app keeps rendering');
});

Then(re('error should be logged'), function() {
    // Angular's ErrorHandler logs 'ERROR' and the error
    const logged = loggedErrors(this, 'label failed');
    assert.ok(logged.some(args => args[0] === 'ERROR'), JSON.stringify(ng(this).consoleErrors.map(a => String(a[0]))));
});

Then(re('other watchers should continue working'), function() {
    same(c(this).view.cmp.seen, [1]);
    assert.ok(loggedErrors(this, 'watcher failed').some(args => args[0] === 'Error in bindX watcher:'));
});

Then(re('Angular change detection should continue'), function() {
    const { view } = c(this);
    assert.strictEqual(view.text(), '1');
    view.cmp.state.n = 2;
    assert.strictEqual(view.text(), '2');
    same(view.cmp.seen, [1, 2]);
});

// ---------------------------------------------------------------- Testing (TestBed)

const testEnvironments = new WeakSet();

function testBed(world) {
    const { rt, w } = ng(world);
    const { TestBed } = rt.testing;
    if (!testEnvironments.has(w)) {
        testEnvironments.add(w);
        TestBed.initTestEnvironment(rt.pbt.BrowserTestingModule, rt.pbt.platformBrowserTesting());
    }
    ng(world).cleanups.push(() => TestBed.resetTestingModule());
    return TestBed;
}

const fixtureText = (fixture, selector = 'p') => fixture.nativeElement.querySelector(selector).textContent.trim();

Given(re('a test suite for a component using BindXService'), function() {
    c(this).Comp = compileComponent(this, {
        template: '<p>{{ state.count }}</p><button (click)="state.count = state.count + 1">+</button>',
        state: '{ count: 0 }',
        members: 'initialized = false;\n  ngOnInit() { this.initialized = true; }'
    });
});

When(re('I create component in TestBed'), function() {
    c(this).testBed = testBed(this);
});

When(re('I provide BindXService'), function() {
    const ctx = c(this);
    ctx.testBed.configureTestingModule({ imports: [ctx.Comp], providers: [A(this).BindXService] });
    ctx.fixture = ctx.testBed.createComponent(ctx.Comp);
    ctx.fixture.detectChanges();
});

Then(re('the component should initialize'), function() {
    const { fixture } = c(this);
    assert.strictEqual(fixture.componentInstance.initialized, true);
    assert.ok(fixture.componentInstance.bindX instanceof A(this).BindXService);
    assert.strictEqual(fixtureText(fixture), '0');
});

Then(re('reactive state should work in tests'), function() {
    const { fixture } = c(this);
    click(this, fixture.nativeElement.querySelector('button'));
    fixture.detectChanges();
    assert.strictEqual(fixture.componentInstance.state.count, 1);
    assert.strictEqual(fixtureText(fixture), '1');
});

Given(re('a component that depends on BindXService'), function() {
    c(this).Comp = compileComponent(this, { template: '<p>{{ state.count }}</p>', state: '{ count: 0 }' });
});

When(re('I provide a mock BindXService'), function() {
    const ctx = c(this);
    ctx.baseline = watchers(this);
    ctx.mock = {
        calls: [],
        reactive(state) { this.calls.push(['reactive', state]); return { ...state, count: 42 }; },
        computed(getter) { return getter; },
        watch() { return () => {}; }
    };
    const TestBed = testBed(this);
    TestBed.configureTestingModule({ imports: [ctx.Comp], providers: [{ provide: A(this).BindXService, useValue: ctx.mock }] });
    ctx.fixture = TestBed.createComponent(ctx.Comp);
    ctx.fixture.detectChanges();
});

Then(re('tests should run without real BindXService'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.fixture.componentInstance.bindX, ctx.mock);
    assert.strictEqual(watchers(this), ctx.baseline, 'no real bindX watcher was created');
});

Then(re('I can control reactive behavior for testing'), function() {
    const ctx = c(this);
    same(ctx.mock.calls, [['reactive', { count: 0 }]]);
    assert.strictEqual(fixtureText(ctx.fixture), '42', 'the template shows the mock\'s state');
});

When(re('I change reactive state in tests'), function() {
    const ctx = c(this);
    const TestBed = testBed(this);
    const Comp = compileComponent(this, ctx.source || MESSAGE_COMPONENT);
    TestBed.configureTestingModule({
        imports: [Comp],
        providers: [{ provide: ng(this).rt.testing.ComponentFixtureAutoDetect, useValue: true }]
    });
    ctx.fixture = TestBed.createComponent(Comp);
    assert.strictEqual(fixtureText(ctx.fixture), 'Hello');
    ctx.fixture.componentInstance.state.message = 'Changed';
});

Then(re('change detection should run'), function() {
    assert.strictEqual(fixtureText(c(this).fixture), 'Changed', 'auto-detect ran change detection');
});

Then(re('I can assert on template updates'), function() {
    const { fixture } = c(this);
    fixture.componentInstance.state.message = 'Again';
    assert.strictEqual(fixtureText(fixture), 'Again');
});

Then(re('fixture.detectChanges() should work correctly'), function() {
    const { fixture } = c(this);
    const cmp = fixture.componentInstance;
    const before = cmp.renders;
    fixture.detectChanges();
    assert.ok(cmp.renders > before);
    fixture.checkNoChanges();
    assert.strictEqual(fixtureText(fixture), 'Again');
    same(ng(this).consoleErrors, []);
});

// ---------------------------------------------------------------- Standalone components

Given(re('a standalone component (Angular 14+)'), function() {
    c(this).Comp = compileComponent(this, { ...MESSAGE_COMPONENT, meta: ', standalone: true' });
});

When(re('I import BindXService in component imports'), async function() {
    // A service is not a component import; a standalone component imports it as
    // an ES module and injects it (providedIn: 'root'), with no NgModule
    const ctx = c(this);
    assert.strictEqual(ng(this).rt.core.reflectComponentType(ctx.Comp).isStandalone, true);
    ctx.view = await mount(this, ctx.Comp);
});

Then(re('reactive state should work without module'), function() {
    const { view } = c(this);
    view.cmp.state.message = 'Standalone';
    assert.strictEqual(view.text(), 'Standalone');
});

Given(re('a standalone component'), function() {
    c(this).nested = compileNg(this, `${IMPORTS}
@Component({ selector: 'app-child', template: '<span>{{ state.n }}</span>' })
export class Child {
  static instances: Child[] = [];
  bindX = inject(BindXService);
  state: any = this.bindX.reactive({ n: 1 });
  constructor() { Child.instances.push(this); }
}
@Component({ selector: 'app-parent', imports: [Child], providers: [BindXService], template: '<app-child></app-child><app-child></app-child>' })
export class Parent { bindX = inject(BindXService); }`);
});

When(re('I provide BindXService in component providers'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, ctx.nested.Parent);
});

Then(re('the component should have isolated instance'), function() {
    const { view } = c(this);
    assert.ok(view.cmp.bindX instanceof A(this).BindXService);
    assert.notStrictEqual(view.cmp.bindX, rootService(this));
});

Then(re('nested components can inject it'), function() {
    const ctx = c(this);
    const kids = ctx.nested.Child.instances;
    assert.strictEqual(kids.length, 2);
    for (const kid of kids) assert.strictEqual(kid.bindX, ctx.view.cmp.bindX);
    kids[1].state.n = 2;
    same(texts(ctx.view, 'span'), ['1', '2']);
});

// ---------------------------------------------------------------- Shared state

const SHARED = `${IMPORTS}
@Injectable({ providedIn: 'root' })
export class CounterStore {
  bindX = inject(BindXService);
  state: any = this.bindX.reactive({ count: 0 });
}
@Component({ selector: 'app-inc', template: '<p>{{ store.state.count }}</p><button (click)="store.state.count = store.state.count + 1">+</button>' })
export class Incrementer { store = inject(CounterStore); }
@Component({ selector: 'app-show', template: '<p>{{ store.state.count }}</p>' })
export class Display { store = inject(CounterStore); }`;

Given(re('multiple components needing shared state'), function() {
    c(this).shared = compileNg(this, SHARED);
});

When(re('I create reactive state in a service'), async function() {
    const ctx = c(this);
    const app = await appFor(this);
    ctx.store = app.injector.get(ctx.shared.CounterStore);
    assert.ok(A(this).isReactive(ctx.store.state));
});

When(re('inject the service in multiple components'), async function() {
    const ctx = c(this);
    ctx.inc = await mount(this, ctx.shared.Incrementer);
    ctx.show = await mount(this, ctx.shared.Display);
});

Then(re('all components should access the same state'), function() {
    const ctx = c(this);
    assert.strictEqual(ctx.inc.cmp.store.state, ctx.store.state);
    assert.strictEqual(ctx.show.cmp.store.state, ctx.store.state);
});

Then(re('updates should propagate to all components'), function() {
    const ctx = c(this);
    click(this, ctx.inc.find('button'));
    same([ctx.inc.text(), ctx.show.text()], ['1', '1']);
    ctx.store.state.count = 5; // from outside any component
    same([ctx.inc.text(), ctx.show.text()], ['5', '5']);
});

// ---------------------------------------------------------------- Documented examples
// The adapter has no README; its examples are the @example blocks in
// src/bindx-angular.ts, which these scenarios compile and run as written.

Given(re('the bindX-angular package README'), function() {
    c(this).source = docExample('BindXService - Angular service for bindX integration');
});

When(re('I follow the counter example'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileNg(this, ctx.source).CounterComponent);
});

Then(re('I should have a working counter component'), function() {
    const { view } = c(this);
    assert.strictEqual(view.text('div'), 'Count: 0');
    assert.ok(button(view, '+') && button(view, '-'));
});

Then(re('increment/decrement should work'), function() {
    const { view } = c(this);
    click(this, button(view, '+'));
    click(this, button(view, '+'));
    click(this, button(view, '-'));
    assert.strictEqual(view.text('div'), 'Count: 1');
});

Then(re('change detection should work properly'), function() {
    const { view } = c(this);
    view.cmp.state.count = 10; // outside the zone, with no event
    assert.strictEqual(view.text('div'), 'Count: 10');
    same(ng(this).consoleErrors, []);
});

Given(re('the bindX-angular examples'), function() {
    c(this).source = docExample('Example usage in Angular component:');
});

When(re('I implement the todo list example'), async function() {
    const ctx = c(this);
    const { w } = ng(this);
    const realNow = w.Date.now;
    let next = 1000;
    w.Date.now = () => next++;
    ng(this).cleanups.push(() => { w.Date.now = realNow; });
    ctx.view = await mount(this, compileNg(this, ctx.source).TodoComponent);
});

const todoSpans = (view) => view.findAll('input[type="checkbox"] + span');
const todoTexts = (view) => todoSpans(view).map(span => span.textContent.trim());
const todoRow = (view, text) => todoSpans(view).find(span => span.textContent.trim() === text).parentElement;
const remaining = (view) => view.findAll('span').find(span => /items left/.test(span.textContent)).textContent.trim();

function toggle(world, view, text) {
    const checkbox = todoRow(view, text).querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    fire(world, checkbox, 'change');
}

Then(re('I should have full CRUD functionality'), async function() {
    const { view } = c(this);
    same(todoTexts(view), ['Learn bindX', 'Build Angular app'], 'read: loaded in ngOnInit');
    assert.strictEqual(remaining(view), '2 items left');
    const input = view.find('input[placeholder]');
    typeInto(this, input, 'Write docs');
    input.dispatchEvent(new (ng(this).w.KeyboardEvent)('keyup', { key: 'Enter', bubbles: true }));
    same(todoTexts(view), ['Learn bindX', 'Build Angular app', 'Write docs'], 'create');
    assert.strictEqual(remaining(view), '3 items left');
    await flush();
    assert.strictEqual(input.value, '', 'the input was cleared');
    toggle(this, view, 'Learn bindX');
    assert.ok(todoRow(view, 'Learn bindX').querySelector('span').classList.contains('completed'), 'update');
    assert.strictEqual(remaining(view), '2 items left');
    click(this, todoRow(view, 'Build Angular app').querySelector('button'));
    same(todoTexts(view), ['Learn bindX', 'Write docs'], 'delete');
    assert.strictEqual(remaining(view), '1 items left');
});

Then(re('reactive filtering should work'), function() {
    const { view } = c(this);
    click(this, button(view, 'Active'));
    same(todoTexts(view), ['Write docs']);
    click(this, button(view, 'Completed'));
    same(todoTexts(view), ['Learn bindX']);
    click(this, button(view, 'All'));
    same(todoTexts(view), ['Learn bindX', 'Write docs']);
    same(ng(this).consoleLogs.filter(args => args[0] === 'Filter changed to:').map(args => args[1]),
        ['active', 'completed', 'all'], 'the documented filter watcher ran');
});

Then(re('completed count should update automatically'), function() {
    const { view } = c(this);
    click(this, button(view, 'Completed'));
    toggle(this, view, 'Learn bindX');
    same(todoTexts(view), [], 'un-completing leaves the Completed view');
    assert.strictEqual(remaining(view), '2 items left');
    click(this, button(view, 'All'));
    assert.ok(!todoRow(view, 'Learn bindX').querySelector('span').classList.contains('completed'));
});

// Not documented for Angular: the test writes the form the feature describes,
// with Angular reactive forms feeding bindX state and computed validation
const FORM_EXAMPLE = `${IMPORTS}
@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  template: '<form [formGroup]="form" (ngSubmit)="submit()">' +
    '<input name="email" formControlName="email"><span class="error email">{{ errors().email }}</span>' +
    '<input name="password" type="password" formControlName="password"><span class="error password">{{ errors().password }}</span>' +
    '<button type="submit" [disabled]="!valid()">Sign up</button></form>'
})
export class SignupComponent {
  bindX = inject(BindXService);
  form = new FormGroup({ email: new FormControl(''), password: new FormControl('') });
  state: any = this.bindX.reactive({ email: '', password: '' });
  submitted: any[] = [];
  sync = this.form.valueChanges.subscribe((value: any) => Object.assign(this.state, value));
  errors = this.bindX.computed(() => ({
    email: !this.state.email ? 'Email is required' : /^\\S+@\\S+\\.\\S+$/.test(this.state.email) ? '' : 'Enter a valid email',
    password: this.state.password.length >= 8 ? '' : 'Use at least 8 characters'
  }));
  valid = this.bindX.computed(() => !this.errors().email && !this.errors().password);
  submit() { if (this.valid()) this.submitted.push({ ...this.state }); }
}`;

Given(re('the bindX-angular form example'), function() {
    c(this).source = FORM_EXAMPLE;
});

When(re('I implement the example'), async function() {
    const ctx = c(this);
    ctx.view = await mount(this, compileNg(this, ctx.source).SignupComponent);
});

const formError = (view, name) => view.find(`.error.${name}`).textContent;
const formInput = (view, name) => view.find(`input[name="${name}"]`);

Then(re('form validation should work'), function() {
    const { view } = c(this);
    assert.strictEqual(formError(view, 'email'), 'Email is required');
    assert.strictEqual(formError(view, 'password'), 'Use at least 8 characters');
    typeInto(this, formInput(view, 'email'), 'ada@');
    assert.strictEqual(formError(view, 'email'), 'Enter a valid email');
});

Then(re('error messages should be reactive'), function() {
    const { view } = c(this);
    typeInto(this, formInput(view, 'email'), 'ada@example.com');
    assert.strictEqual(formError(view, 'email'), '');
    typeInto(this, formInput(view, 'password'), 'secret');
    assert.strictEqual(formError(view, 'password'), 'Use at least 8 characters');
    typeInto(this, formInput(view, 'password'), 'longer secret');
    assert.strictEqual(formError(view, 'password'), '');
    typeInto(this, formInput(view, 'email'), '');
    assert.strictEqual(formError(view, 'email'), 'Email is required');
});

Then(re('submit should be disabled when invalid'), function() {
    const { view } = c(this);
    const submit = view.find('button[type="submit"]');
    assert.strictEqual(submit.disabled, true, 'invalid: email is empty');
    typeInto(this, formInput(view, 'email'), 'ada@example.com');
    assert.strictEqual(submit.disabled, false);
    fire(this, view.find('form'), 'submit');
    same(view.cmp.submitted, [{ email: 'ada@example.com', password: 'longer secret' }]);
    typeInto(this, formInput(view, 'password'), 'short');
    assert.strictEqual(submit.disabled, true, 'invalid again');
});
