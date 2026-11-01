/**
 * Real-page fixture for bindX scenarios.
 *
 * mountBindx() serves an empty page from the test server with genx-common
 * and bindX loaded and an empty <div id="app">. Given steps append markup to
 * #app and put test data in window._testData. The first step that needs live
 * bindings calls render(), which wraps the data with bindX.reactive(), scans
 * #app with bindX.scan() (keeping the returned bindings in window.__bindings)
 * and starts bindX's MutationObserver through bindX.init(). Data changes made
 * after render go through the reactive proxy, as an app's would.
 *
 * bindX's CommonJS exports (registry, batch queue, withTracking) are kept on
 * window.__bxi for steps that check internals the feature names.
 */

const { baseUrl } = require('../fixtures/server');

const FIXTURE_PATH = '/__bindx/fixture';

/** Serve and open the fixture page. Safe to call more than once. */
async function mountBindx(world) {
    if (world.bx && world.bx.mounted) {
        return;
    }
    const base = baseUrl();
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>bindX fixture</title></head>
<body><div id="app"></div>
<script>
// Steps such as "the test environment is clean" replace the body; bind into
// whatever container is left.
window.__app = () => document.getElementById('app') ||
    document.getElementById('test-container') || document.body;
</script>
<script src="${base}/src/genx-common.js"></script>
<script>
// bindX exports its internals (registry, batch queue, tracking) through
// module.exports for tests. Give it one while it loads, then keep the
// exports on window.__bxi and remove the shim.
window.module = { exports: {} };
</script>
<script src="${base}/src/bindx.js"></script>
<script>window.__bxi = window.module.exports; delete window.module;</script>
</body></html>`;
    await world.page.route(url => url.pathname === FIXTURE_PATH,
        route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await world.page.goto(base + FIXTURE_PATH);
    await world.page.waitForFunction(() => typeof window.bindX?.scan === 'function');
    await world.page.evaluate(() => {
        window._testData = {};
    });
    world.bx = { mounted: true, rendered: false, fmtx: false };
    world.render = () => render(world);
}

/** Load fmtX into the page (for bx-format and fx-format scenarios). */
async function loadFmtx(world) {
    await mountBindx(world);
    if (!world.bx.fmtx) {
        await world.page.addScriptTag({ url: `${baseUrl()}/src/fmtx.js` });
        await world.page.waitForFunction(() => !!window.fxXFactory);
        world.bx.fmtx = true;
    }
}

/**
 * Append markup to #app. The first element added becomes this.element unless
 * a selector is given.
 */
async function addMarkup(world, html, selector) {
    await mountBindx(world);
    await world.page.evaluate(markup => {
        window.__app().insertAdjacentHTML('beforeend', markup);
    }, html);
    if (selector) {
        world.element = world.page.locator(selector).first();
    }
}

/** Replace the contents of #app. */
async function setMarkup(world, html, selector) {
    await mountBindx(world);
    await world.page.evaluate(markup => {
        window.__app().innerHTML = markup;
    }, html);
    if (selector) {
        world.element = world.page.locator(selector).first();
    }
}

/** Make the data reactive, scan #app and start the observer (once). */
async function render(world) {
    await mountBindx(world);
    if (world.bx.rendered) {
        return;
    }
    await world.page.evaluate(() => {
        window._reactive = window.bindX.reactive(window._testData);
        window.__bindings = window.bindX.scan(window.__app(), window._reactive);
        window.__bx = window.bindX.init(window._reactive, { observe: true });
        window.__trackDestroy = bindings => bindings.forEach(binding => {
            const destroy = binding.destroy;
            binding.destroy = (...args) => {
                binding.__destroyed = true;
                return destroy.apply(binding, args);
            };
        });
        window.__trackDestroy(window.__bindings);
    });
    world.bx.rendered = true;
    world.checkReleased = () => checkReleased(world);
}

/**
 * Every binding created for the scenario was destroyed, and a data change at
 * each bound path no longer reaches its element.
 */
async function checkReleased(world) {
    const counts = await world.page.evaluate(() => ({
        total: window.__bindings.length,
        destroyed: window.__bindings.filter(b => b.__destroyed).length
    }));
    if (counts.total === 0 || counts.destroyed !== counts.total) {
        throw new Error(`bindings not released: ${JSON.stringify(counts)}`);
    }
    const sentinel = '__released_check__';
    await world.page.evaluate(value => {
        window.__bindings.forEach(b => window.bindX.setNestedProperty(window._reactive, b.path, value));
    }, sentinel);
    await nextFrames(world);
    const reached = await world.page.evaluate(value => window.__bindings.filter(b => {
        const el = b.element;
        return el && (el.value === value || el.textContent === value);
    }).length, sentinel);
    if (reached !== 0) {
        throw new Error(`${reached} destroyed binding(s) still update their element`);
    }
}

/** Rescan #app for bindings added since render (what bindX.init().scan does). */
async function rescan(world) {
    await world.page.evaluate(() => {
        const added = window.__bx.scan(window.__app());
        window.__trackDestroy(added);
        window.__bindings.push(...added);
    });
}

/**
 * Parse a value written in a feature line: "text" or 'text' is a string,
 * true/false/null are literals, numbers are numbers, JSON otherwise.
 */
function parseValue(raw) {
    const text = String(raw).trim();
    if (/^"[^"]*"$/.test(text) || /^'[^']*'$/.test(text)) {
        return text.slice(1, -1);
    }
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    try {
        return JSON.parse(text);
    } catch (_error) {
        return text;
    }
}

/**
 * Set a dotted path on the test data. Before render it writes the plain
 * object; after render it writes through the reactive proxy and waits two
 * animation frames so batched DOM updates have run.
 */
async function setData(world, path, value) {
    await mountBindx(world);
    await world.page.evaluate(({ p, v, live }) => {
        const root = live ? window._reactive : window._testData;
        const parts = p.split('.');
        let obj = root;
        for (const key of parts.slice(0, -1)) {
            if (obj[key] === undefined || obj[key] === null || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }
        obj[parts[parts.length - 1]] = v;
    }, { p: path, v: value, live: world.bx.rendered });
    if (world.bx.rendered) {
        await nextFrames(world);
    }
}

/** Read a dotted path from the test data. */
async function getData(world, path) {
    return world.page.evaluate(p => p.split('.').reduce(
        (obj, key) => (obj === undefined || obj === null ? undefined : obj[key]), window._testData), path);
}

/** Wait for two animation frames (bindX batches DOM updates per frame). */
async function nextFrames(world) {
    await world.page.evaluate(() => new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/** Console messages of the given types logged so far in this scenario. */
function consoleOf(world, ...types) {
    return (world.consoleMessages || []).filter(m => types.includes(m.type));
}

module.exports = {
    mountBindx, loadFmtx, addMarkup, setMarkup, render, rescan,
    parseValue, setData, getData, nextFrames, consoleOf
};
