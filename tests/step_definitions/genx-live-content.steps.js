/**
 * Step definitions for tests/features/genx-live-content.feature
 *
 * Serves the real files from a fake origin (http://genx.test) through Playwright
 * routing: src/cloak.js, the bootloader bundle (src/bootloader.bundle.js built with
 * esbuild, as `npm run build` does), and the src/ modules and parsers the bootloader
 * fetches. Nothing is stubbed; the tests watch the DOM the real code produces.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { sourceFor } = require('../fixtures/genx-sources');

const ORIGIN = 'http://genx.test';

Given('the genX bundle is served from a test origin', async function () {
    this.live = { readyScripts: [] };
    await this.page.route(`${ORIGIN}/**`, async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === '/page.html') {
            return route.fulfill({ status: 200, contentType: 'text/html', body: this.live.html });
        }
        const body = sourceFor(url.pathname);
        if (body === null) return route.fulfill({ status: 404, body: 'Not Found' });
        return route.fulfill({ status: 200, contentType: 'application/javascript', body });
    });
});

Given('the live page body is:', function (docString) {
    this.live.body = docString;
});

Given('a swap adds {string} to {string} at genx:ready', function (html, containerId) {
    // Registered before cloak.js, so it runs first at genx:ready: the content exists,
    // unformatted, when the cloak handles ready. That is the reload-replay race.
    this.live.readyScripts.push(
        `window.addEventListener('genx:ready', function () {
            document.getElementById(${JSON.stringify(containerId)})
                .insertAdjacentHTML('beforeend', ${JSON.stringify(html)});
        });`
    );
    const id = html.match(/id='([^']+)'/);
    this.live.watchId = id && id[1];
});

Given('the cloak also hides {string} elements until they gain {string}', function (mark, done) {
    // No genX module ever sets this done-marker, so only the timeout can reveal it.
    this.live.markers = [{ mark: 'fx-format', done: 'fx-raw' }, { mark, done }];
});

const renderLive = async function (cloakTimeoutMs) {
    const cfg = { cdn: ORIGIN, cloak: true };
    if (cloakTimeoutMs) cfg.cloakTimeoutMs = cloakTimeoutMs;
    if (this.live.markers) cfg.cloakMarkers = this.live.markers;
    const readyScripts = this.live.readyScripts.join('\n');
    const watch = this.live.watchId;
    const recorder = watch
        ? `<script>window.addEventListener('genx:ready', function () {
              var el = document.getElementById(${JSON.stringify(watch)});
              window.__atReady = el && {
                  visibility: getComputedStyle(el).visibility,
                  formatted: el.hasAttribute('fx-raw')
              };
          });</script>`
        : '';
    this.live.html = [
        '<!DOCTYPE html><html><head>',
        `<script>window.genxConfig = ${JSON.stringify(cfg)};</script>`,
        readyScripts ? `<script>${readyScripts}</script>` : '',
        `<script src="${ORIGIN}/cloak.js"></script>`,
        recorder,
        `<script src="${ORIGIN}/bootloader.js"></script>`,
        '</head><body>',
        this.live.body || '',
        '</body></html>'
    ].join('');
    await this.page.addInitScript(() => {
        window.addEventListener('genx:ready', () => { window.__genxReady = true; });
    });
    await this.page.goto(`${ORIGIN}/page.html`, { waitUntil: 'load' });
};

When('the live page loads with the cloak enabled', async function () {
    await renderLive.call(this);
});

When('the live page loads with the cloak enabled and a {int}ms timeout', async function (ms) {
    await renderLive.call(this, ms);
});

When('genX has finished booting', async function () {
    await this.page.waitForFunction(() => window.__genxReady === true, null, { timeout: 5000 });
});

When('an HTMX-style swap replaces {string} with {string}', async function (id, html) {
    await this.page.evaluate(({ id, html }) => {
        document.getElementById(id).innerHTML = html;
    }, { id, html });
});

When('{int}ms pass', async function (ms) {
    await this.page.waitForTimeout(ms);
});

Then('at genx:ready element {string} was hidden and unformatted', async function (id) {
    const at = await this.page.evaluate(() => window.__atReady);
    assert.ok(at, `expected a genx:ready record for ${id}`);
    assert.strictEqual(at.formatted, false, `${id} should still be raw at genx:ready (the race)`);
    assert.strictEqual(at.visibility, 'hidden', `${id} must not be revealed raw at genx:ready`);
});

Then('element {string} becomes formatted', async function (id) {
    await this.page.waitForFunction(id => {
        const el = document.getElementById(id);
        return el && el.hasAttribute('fx-raw') && el.textContent.trim() !== el.getAttribute('fx-raw');
    }, id, { timeout: 3000 });
});

Then('element {string} is failsafe-marked', async function (id) {
    const marked = await this.page.evaluate(id => document.getElementById(id).hasAttribute('genx-uncloak'), id);
    assert.strictEqual(marked, true, `${id} should carry genx-uncloak (revealed by the timeout)`);
});
