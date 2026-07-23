/**
 * Step definitions for tests/features/genx-cloak.feature
 *
 * The cloak's contract is defined against the two REAL signals genX emits:
 *   - fx-raw stamped on an element   (fmtx.js formatElement, line ~543)
 *   - the genx:ready window event     (bootloader.js bootstrap, line ~335)
 * plus the genx:error event this feature adds. These steps drive those exact
 * signals and read the real browser style engine — no mocks, no stubs.
 *
 * src/cloak.js is inlined into the page head (before body) so it installs the
 * cloak synchronously, before first paint, exactly as it ships in production.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const CLOAK_SRC = fs.readFileSync(path.join(process.cwd(), 'src', 'cloak.js'), 'utf8');

const DEFAULT_TIMEOUT_MS = 400;

// --- Given: configuration + page body ---

Given('a static server is serving the genX source', function () {
    // Server + shared browser are started in tests/support/hooks.js. Nothing to do.
    assert.ok(this.page, 'a page should be available');
});

Given('genX cloak is left at its default', function () {
    this.genxConfig = {};
});

Given('genX cloak is enabled', function () {
    this.genxConfig = { cloak: true };
});

Given('genX cloak is enabled with a {int}ms timeout', function (ms) {
    this.genxConfig = { cloak: true, cloakTimeoutMs: ms };
    this.timeoutMs = ms;
});

Given('the page body is:', function (docString) {
    this.bodyHtml = docString;
});

// --- When: render + genX signals ---

When('the cloak page is rendered', async function () {
    const configJson = JSON.stringify(this.genxConfig || {});
    const html = [
        '<!DOCTYPE html><html><head>',
        `<script>window.genxConfig = ${configJson};</script>`,
        `<script>${CLOAK_SRC}</script>`,
        '</head><body>',
        this.bodyHtml || '',
        '</body></html>'
    ].join('');
    await this.page.setContent(html, { waitUntil: 'load' });
    // Flush the watchdog MutationObserver microtask so per-batch failsafe timers arm.
    await this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
});

When('genX formats element {string} as {string}', async function (id, formatted) {
    // Mirror fmtx: stamp fx-raw from the current raw value, then write the formatted text.
    await this.page.evaluate(({ id, formatted }) => {
        const el = document.getElementById(id);
        el.setAttribute('fx-raw', el.textContent.trim());
        el.textContent = formatted;
    }, { id, formatted });
});

When('genX signals ready', async function () {
    await this.page.evaluate(() => window.dispatchEvent(new CustomEvent('genx:ready', { detail: {} })));
});

When('genX signals a load error', async function () {
    await this.page.evaluate(() => window.dispatchEvent(new CustomEvent('genx:error', { detail: {} })));
});

When('the failsafe timeout elapses', async function () {
    const ms = this.timeoutMs || DEFAULT_TIMEOUT_MS;
    await this.page.waitForTimeout(ms + 100);
});

When('a number {string} is swapped into {string} as element {string}', async function (value, containerId, id) {
    await this.page.evaluate(({ value, containerId, id }) => {
        const c = document.getElementById(containerId);
        c.insertAdjacentHTML('beforeend', `<span id="${id}" fx-format="percent">${value}</span>`);
    }, { value, containerId, id });
    await this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
});

// --- Then: stylesheet presence, visibility, layout, content ---

const computedVisibility = (page, id) =>
    page.evaluate(id => {
        const el = document.getElementById(id);
        return el ? getComputedStyle(el).visibility : 'MISSING';
    }, id);

Then('no cloak stylesheet is present', async function () {
    const has = await this.page.evaluate(() => !!document.querySelector('style[data-genx-cloak]'));
    assert.strictEqual(has, false, 'expected no cloak stylesheet');
});

Then('a cloak stylesheet is present', async function () {
    const has = await this.page.evaluate(() => !!document.querySelector('style[data-genx-cloak]'));
    assert.strictEqual(has, true, 'expected a cloak stylesheet');
});

Then('element {string} is visible', async function (id) {
    assert.strictEqual(await computedVisibility(this.page, id), 'visible', `expected ${id} visible`);
});

Then('element {string} is hidden', async function (id) {
    assert.strictEqual(await computedVisibility(this.page, id), 'hidden', `expected ${id} hidden`);
});

Then('element {string} is hidden before any genX signal', async function (id) {
    assert.strictEqual(await computedVisibility(this.page, id), 'hidden', `expected ${id} hidden pre-signal`);
});

Then('element {string} still reserves layout space', async function (id) {
    const box = await this.page.evaluate(id => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return { w: r.width, display: getComputedStyle(el).display, vis: getComputedStyle(el).visibility };
    }, id);
    assert.strictEqual(box.vis, 'hidden', `expected ${id} hidden`);
    assert.notStrictEqual(box.display, 'none', 'cloak must use visibility, not display:none');
    assert.ok(box.w > 0, `expected ${id} to reserve layout width, got ${box.w}`);
});

Then('element {string} shows {string}', async function (id, text) {
    const actual = await this.page.evaluate(id => document.getElementById(id).textContent.trim(), id);
    assert.strictEqual(actual, text, `expected ${id} to show "${text}", got "${actual}"`);
});
