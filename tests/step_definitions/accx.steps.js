/**
 * Step definitions for accX module
 * Accessibility enhancement through HTML attributes
 *
 * Every scenario runs on a real page served from the test server with
 * genx-common loaded. Given steps build the markup in that page; "the element
 * is processed" then loads src/accx.js, which scans the document and starts
 * its MutationObserver exactly as it does on a site. Then steps check the DOM
 * accX produced and act through the browser (focus, keys, clicks, typing).
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { defineElement } = require('../support/element-fixtures');
const { expect } = require('@playwright/test');
const { baseUrl } = require('../fixtures/server');

const FIXTURE_PATH = '/__accx/fixture';

// ============================================================================
// FIXTURE HELPERS
// ============================================================================

/** Serve an empty page with genx-common at FIXTURE_PATH and open it. */
async function mountAccx(world) {
    const base = baseUrl();
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>accX fixture</title>
<style>body { margin: 0; font: 16px sans-serif; }</style>
</head><body>
<script src="${base}/src/genx-common.js"></script>
</body></html>`;
    await world.page.route(url => url.pathname === FIXTURE_PATH,
        route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await world.page.goto(base + FIXTURE_PATH);
    await world.page.waitForFunction(() => !!window.genxCommon);
    world.accx = { loaded: false };
    // fmtx.steps.js owns "the element is processed"; it calls this hook.
    world.processElement = () => loadAccx(world);
}

/**
 * Load accX into the page. On first load accX scans the document and starts
 * observing; later calls rescan for elements added since.
 */
async function loadAccx(world) {
    if (!world.accx.loaded) {
        await world.page.addScriptTag({ url: `${baseUrl()}/src/accx.js` });
        await world.page.waitForFunction(() => !!window.AccessX);
        world.accx.loaded = true;
    } else {
        await world.page.evaluate(() => window.AccessX.scan());
    }
}

/** Append markup to the fixture body and remember the element under test. */
async function addMarkup(world, html, selector = '#test') {
    await world.page.evaluate(markup => {
        document.body.insertAdjacentHTML('beforeend', markup);
    }, html);
    world.accx.selector = selector;
}

/** Build an attribute string from [name, value] pairs, HTML-escaped. */
function attrs(pairs) {
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return pairs.map(([n, v]) => `${n}="${esc(v)}"`).join(' ');
}

const target = world => world.page.locator((world.accx && world.accx.selector) || '#test');

async function expectAttr(locator, name, value) {
    await expect(locator).toHaveAttribute(name, value);
}

/** Install a counting spy on innerHTML/outerHTML setters before processing. */
async function spyOnInnerHTML(world) {
    await world.page.evaluate(() => {
        window.__htmlWrites = 0;
        for (const prop of ['innerHTML', 'outerHTML']) {
            const desc = Object.getOwnPropertyDescriptor(Element.prototype, prop);
            Object.defineProperty(Element.prototype, prop, {
                configurable: true,
                get: desc.get,
                set(value) {
                    window.__htmlWrites++;
                    desc.set.call(this, value);
                }
            });
        }
    });
}

/** Remember the child nodes of every cell so later steps can check identity. */
async function rememberCellNodes(world) {
    await world.page.evaluate(() => {
        window.__cellNodes = new Map();
        document.querySelectorAll('#test td').forEach(td => {
            window.__cellNodes.set(td.textContent, Array.from(td.childNodes));
        });
    });
}

// ============================================================================
// BACKGROUND
// ============================================================================

Given('the accX module is loaded', async function() {
    await mountAccx(this);
});

Given('the accX module is initialized', async function() {
    await loadAccx(this);
});

Given('the accX module is initialized with observe=true', async function() {
    await loadAccx(this);
    // The legacy global starts with auto: true and observe: true; prove the
    // observer is live by checking that accX marks a probe it never scanned.
    await this.page.evaluate(() => {
        const probe = document.createElement('span');
        probe.id = 'ax-observer-probe';
        probe.setAttribute('ax-enhance', 'live');
        document.body.appendChild(probe);
    });
    await expect(this.page.locator('#ax-observer-probe')).toHaveAttribute('ax-enhanced', 'true');
});

// ============================================================================
// GENERIC ELEMENTS
// ============================================================================

defineElement('an element with ax-enhance={string} ax-sr-text={string}', async function(enhance, srText) {
    await addMarkup(this, `<span id="test" ${attrs([['ax-enhance', enhance], ['ax-sr-text', srText]])}></span>`);
});

defineElement('an element with ax-enhance={string} ax-type={string} ax-full={string}', async function(enhance, type, full) {
    await addMarkup(this, `<abbr id="test" ${attrs([['ax-enhance', enhance], ['ax-type', type], ['ax-full', full]])}></abbr>`);
});

defineElement('an element with ax-enhance={string} ax-type={string} ax-meaning={string}', async function(enhance, type, meaning) {
    await addMarkup(this, `<span id="test" ${attrs([['ax-enhance', enhance], ['ax-type', type], ['ax-meaning', meaning]])}></span>`);
});

defineElement('an element with ax-enhance={string} ax-type={string}', async function(enhance, type) {
    await addMarkup(this, `<span id="test" ${attrs([['ax-enhance', enhance], ['ax-type', type]])}></span>`);
});

defineElement('an element with ax-enhance={string} ax-priority={string} ax-status={string}', async function(enhance, priority, status) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['ax-priority', priority], ['ax-status', status]])}></div>`);
});

defineElement('an element with ax-enhance={string} ax-priority={string} ax-alert={string}', async function(enhance, priority, alert) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['ax-priority', priority], ['ax-alert', alert]])}></div>`);
});

defineElement('an element with ax-enhance={string}', async function(enhance) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance]])}>Test Element</div>`);
});

Given('the element contains {string}', async function(content) {
    await target(this).evaluate((el, text) => {
        el.textContent = text;
    }, content);
});

Then(/^the element should have (aria-label|aria-live|aria-atomic|role|title)="([^"]*)"$/, async function(name, value) {
    await expectAttr(target(this), name, value);
});

Then('the element should have aria-label matching {string}', async function(pattern) {
    const label = await target(this).getAttribute('aria-label');
    expect(label).toMatch(new RegExp(pattern));
});

// ============================================================================
// SCREEN READER TEXT
// ============================================================================

const srSpan = world => world.page.locator('#test > span.ax-sr-only');

Then('a screen reader only span should be added', async function() {
    await expect(srSpan(this)).toHaveCount(1);
    // The visible content stays in place next to the added span
    await expect(this.page.locator('#test')).toContainText('$25.00');
});

Then('the span should contain {string}', async function(expected) {
    await expect(srSpan(this)).toHaveText(expected);
});

Then('the span should have class {string}', async function(className) {
    await expect(srSpan(this)).toHaveClass(new RegExp(`(^|\\s)${className}(\\s|$)`));
});

Then('the span should be visually hidden but screen reader accessible', async function() {
    const info = await srSpan(this).evaluate(el => {
        const cs = getComputedStyle(el);
        return {
            position: cs.position, width: cs.width, height: cs.height,
            overflow: cs.overflow, display: cs.display, visibility: cs.visibility,
            ariaHidden: el.getAttribute('aria-hidden')
        };
    });
    expect(info.position).toBe('absolute');
    expect(info.width).toBe('1px');
    expect(info.height).toBe('1px');
    expect(info.overflow).toBe('hidden');
    // display:none, visibility:hidden or aria-hidden would hide it from screen readers too
    expect(info.display).not.toBe('none');
    expect(info.visibility).toBe('visible');
    expect(info.ariaHidden).not.toBe('true');
});

// ============================================================================
// FORM FIELDS
// ============================================================================

Given('an input with ax-enhance={string} ax-required={string} ax-help={string}', async function(enhance, required, help) {
    await addMarkup(this, `<div><input id="test" type="email" ${attrs([['ax-enhance', enhance], ['ax-required', required], ['ax-help', help]])}></div>`);
});

Given('an input with ax-enhance={string} ax-invalid={string} ax-error={string}', async function(enhance, invalid, error) {
    await addMarkup(this, `<div><input id="test" type="email" ${attrs([['ax-enhance', enhance], ['ax-invalid', invalid], ['ax-error', error]])}></div>`);
});

Given('a textarea with ax-enhance={string} ax-show-count={string} maxlength={string}', async function(enhance, showCount, maxlength) {
    await addMarkup(this, `<div><textarea id="test" ${attrs([['ax-enhance', enhance], ['ax-show-count', showCount], ['maxlength', maxlength]])}></textarea></div>`);
});

Given('the input has id={string}', async function(id) {
    await target(this).evaluate((el, value) => {
        el.id = value;
    }, id);
    this.accx.selector = `#${id}`;
});

Then('the input should have aria-required={string}', async function(value) {
    await expectAttr(target(this), 'aria-required', value);
});

Then('the input should have aria-invalid={string}', async function(value) {
    await expectAttr(target(this), 'aria-invalid', value);
});

Then('a help text element should be created', async function() {
    const id = await target(this).getAttribute('id');
    await expect(this.page.locator(`#${id}-help.ax-help-text`)).toHaveCount(1);
    this.accx.help = this.page.locator(`#${id}-help`);
});

Then('the help text should contain {string}', async function(expected) {
    await expect(this.accx.help).toHaveText(expected);
});

Then('the input should have aria-describedby pointing to help text', async function() {
    const helpId = await this.accx.help.getAttribute('id');
    const describedBy = (await target(this).getAttribute('aria-describedby')) || '';
    expect(describedBy.split(/\s+/)).toContain(helpId);
});

Then('an error message element should be created', async function() {
    const id = await target(this).getAttribute('id');
    this.accx.error = this.page.locator(`#${id}-error`);
    await expect(this.accx.error).toHaveCount(1);
    await expect(this.accx.error).toHaveAttribute('role', 'alert');
});

Then('the error message should contain {string}', async function(expected) {
    await expect(this.accx.error).toHaveText(expected);
});

Then('the input should have aria-errormessage pointing to error element', async function() {
    const errorId = await this.accx.error.getAttribute('id');
    await expectAttr(target(this), 'aria-errormessage', errorId);
});

Then('a character counter should be added', async function() {
    const id = await target(this).getAttribute('id');
    this.accx.counter = this.page.locator(`#${id}-count.ax-char-count`);
    await expect(this.accx.counter).toHaveCount(1);
    await expect(this.accx.counter).toHaveAttribute('aria-live', 'polite');
    const describedBy = (await target(this).getAttribute('aria-describedby')) || '';
    expect(describedBy.split(/\s+/)).toContain(`${id}-count`);
});

Then('in accX, it should display {string}', async function(expected) {
    await expect(this.accx.counter).toHaveText(expected);
});

When('in accX, the user types {string}', async function(text) {
    await target(this).click();
    await target(this).pressSequentially(text);
});

// ============================================================================
// NAVIGATION
// ============================================================================

Given('a nav element with ax-enhance={string} ax-label={string}', async function(enhance, label) {
    await addMarkup(this, `<nav id="test" ${attrs([['ax-enhance', enhance], ['ax-label', label]])}><a href="/">Home</a></nav>`);
});

Given('a nav with ax-enhance={string} ax-current={string}', async function(enhance, current) {
    await addMarkup(this, `<nav id="test" ${attrs([['ax-enhance', enhance], ['ax-current', current]])}><a href="/">Home</a></nav>`);
});

Given('a link href={string}', async function(href) {
    await this.page.evaluate(h => {
        const link = document.createElement('a');
        link.id = 'test-link';
        link.href = h;
        link.textContent = h;
        document.getElementById('test').appendChild(link);
    }, href);
});

Given('in accX, the current URL is {string}', async function(url) {
    // Same-origin history change: location.pathname becomes the URL under test
    await this.page.evaluate(u => history.replaceState(null, '', u), url);
    await expect(this.page).toHaveURL(new RegExp(`${url.replace(/[/.]/g, '\\$&')}$`));
});

Then('the nav should have role={string}', async function(value) {
    await expectAttr(target(this), 'role', value);
});

Then('the nav should have aria-label={string}', async function(value) {
    await expectAttr(target(this), 'aria-label', value);
});

Then('the link should have aria-current={string}', async function(value) {
    await expectAttr(this.page.locator('#test-link'), 'aria-current', value);
    // Only the matching link is marked
    await expect(this.page.locator('#test a[aria-current]')).toHaveCount(1);
});

// ============================================================================
// BUTTONS
// ============================================================================

Given('a button with ax-enhance={string} ax-pressed={string}', async function(enhance, pressed) {
    await addMarkup(this, `<button id="test" ${attrs([['ax-enhance', enhance], ['ax-pressed', pressed]])}>Toggle</button>`);
});

Given('a button with ax-enhance={string} ax-loading={string}', async function(enhance, loading) {
    await addMarkup(this, `<button id="test" ${attrs([['ax-enhance', enhance], ['ax-loading', loading]])}>Save</button>`);
});

// HTML keeps the first of two same-named attributes, so the element gets
// ax-enhance set to the first value.
Given('a button with ax-enhance={string} ax-enhance={string}', async function(enhance, _second) {
    await addMarkup(this, `<button id="test" ${attrs([['ax-enhance', enhance]])}>Focus me</button>`);
});

Given('a div with ax-enhance={string} onclick={string}', async function(enhance, onclick) {
    await this.page.evaluate(() => {
        window.__clicks = 0;
        window.handleClick = () => {
            window.__clicks++;
        };
    });
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['onclick', onclick]])}>Do it</div>`);
});

Then(/^the (button|div) should have (role|tabindex|aria-[\w-]+)="([^"]*)"$/, async function(_kind, name, value) {
    await expectAttr(target(this), name, value);
});

Then('the div should be keyboard accessible', async function() {
    await this.page.keyboard.press('Tab');
    await expect(target(this)).toBeFocused();
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.page.evaluate(() => window.__clicks)).toBe(1);
    await this.page.keyboard.press(' ');
    await expect.poll(() => this.page.evaluate(() => window.__clicks)).toBe(2);
});

// ============================================================================
// TABLES
// ============================================================================

const TABLE_ROWS = [['Product', 'Price', 'Stock'], ['Apples', '$1', '10'], ['Pears', '$2', '5']];

function tableMarkup(attrPairs, rows = TABLE_ROWS) {
    const body = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table id="test" ${attrs(attrPairs)}><tbody>${body}</tbody></table>`;
}

Given('a table with ax-enhance={string} ax-auto-headers={string}', async function(enhance, autoHeaders) {
    await addMarkup(this, tableMarkup([['ax-enhance', enhance], ['ax-auto-headers', autoHeaders]]));
    await spyOnInnerHTML(this);
});

Given('a table with ax-enhance={string} ax-row-headers={string}', async function(enhance, rowHeaders) {
    await addMarkup(this, tableMarkup([['ax-enhance', enhance], ['ax-row-headers', rowHeaders]]));
    await spyOnInnerHTML(this);
    await rememberCellNodes(this);
});

Given('a table with ax-enhance={string} ax-caption={string}', async function(enhance, caption) {
    await addMarkup(this, tableMarkup([['ax-enhance', enhance], ['ax-caption', caption]]));
});

Given('a table with ax-enhance={string}', async function(enhance) {
    await addMarkup(this, tableMarkup([['ax-enhance', enhance]]));
});

Given('a th element with ax-sortable={string}', async function(sortable) {
    await this.page.evaluate(value => {
        const firstRow = document.querySelector('#test tr');
        const th = document.createElement('th');
        th.id = 'test-th';
        th.textContent = 'Name';
        th.setAttribute('ax-sortable', value);
        firstRow.insertBefore(th, firstRow.firstChild);
    }, sortable);
});

Given('the first row contains:', async function(dataTable) {
    const cells = dataTable.raw()[0];
    await this.page.evaluate(values => {
        const row = document.querySelector('#test tr');
        row.replaceChildren(...values.map(v => {
            const td = document.createElement('td');
            td.textContent = v;
            return td;
        }));
    }, cells);
    await rememberCellNodes(this);
});

Then('the first row cells should be converted to <th> elements', async function() {
    const cells = await this.page.evaluate(() =>
        Array.from(document.querySelector('#test tr').children).map(c => [c.tagName, c.textContent]));
    expect(cells).toEqual([['TH', 'Product'], ['TH', 'Price']]);
    this.accx.headerCells = '#test tr:first-child > th';
});

Then('the first cell of each row should be <th>', async function() {
    const firstCells = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('#test tr')).map(r => r.children[0].tagName));
    expect(firstCells).toEqual(['TH', 'TH', 'TH']);
    // Only the first cell of a body row becomes a header
    const secondCells = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('#test tr')).slice(1).map(r => r.children[1].tagName));
    expect(secondCells).toEqual(['TD', 'TD']);
    this.accx.headerCells = '#test tr:not(:first-child) > th:first-child';
});

Then('each th should have scope={string}', async function(scope) {
    const scopes = await this.page.locator(this.accx.headerCells).evaluateAll(ths => ths.map(th => th.scope));
    expect(scopes.length).toBeGreaterThan(0);
    expect(scopes.every(s => s === scope)).toBe(true);
});

async function expectSafeMoves(world) {
    const result = await world.page.evaluate(() => {
        let moved = 0;
        let total = 0;
        window.__cellNodes.forEach((nodes, text) => {
            const th = Array.from(document.querySelectorAll('#test th')).find(h => h.textContent === text);
            if (th) {
                total++;
                if (nodes.length && nodes.every((n, i) => th.childNodes[i] === n)) {
                    moved++;
                }
            }
        });
        return { moved, total, writes: window.__htmlWrites };
    });
    // innerHTML/outerHTML were never assigned while processing
    expect(result.writes).toBe(0);
    // Each new header holds the very nodes that were in the old cell
    expect(result.total).toBeGreaterThan(0);
    expect(result.moved).toBe(result.total);
}

Then('no innerHTML should be used \\(XSS-safe)', async function() {
    await expectSafeMoves(this);
});

Then('DOM nodes should be moved safely without innerHTML', async function() {
    await expectSafeMoves(this);
});

Then('a caption element should be added', async function() {
    await expect(this.page.locator('#test > caption')).toHaveCount(1);
    const first = await this.page.locator('#test').evaluate(t => t.firstElementChild.tagName);
    expect(first).toBe('CAPTION');
});

Then('the caption should contain {string}', async function(expected) {
    await expect(this.page.locator('#test > caption')).toHaveText(expected);
});

Then('the th should have aria-sort={string}', async function(value) {
    await expectAttr(this.page.locator('#test-th'), 'aria-sort', value);
});

Then('the th should have role={string}', async function(value) {
    await expectAttr(this.page.locator('#test-th'), 'role', value);
});

When('the th is clicked', async function() {
    await this.page.locator('#test-th').click();
});

Then('aria-sort should change to {string}', async function(value) {
    await expectAttr(this.page.locator('#test-th'), 'aria-sort', value);
});

// Malicious markup is parsed in the page (scripts parsed this way stay inert)
// so the test sees whether accX ever re-parses cell content.
Given('a table with malicious content in cells:', async function(docString) {
    await this.page.evaluate(cellHtml => {
        window.__xss = false;
        window.alert = () => {
            window.__xss = true;
        };
        const table = document.createElement('table');
        table.id = 'test';
        const tbody = document.createElement('tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = cellHtml.trim();
        tbody.appendChild(tr);
        table.appendChild(tbody);
        document.body.appendChild(table);
    }, docString);
    this.accx.selector = '#test';
    await rememberCellNodes(this);
});

Given('the table has ax-enhance={string} ax-auto-headers={string}', async function(enhance, autoHeaders) {
    await target(this).evaluate((el, [e, a]) => {
        el.setAttribute('ax-enhance', e);
        el.setAttribute('ax-auto-headers', a);
    }, [enhance, autoHeaders]);
    await spyOnInnerHTML(this);
});

Then('the script should not execute', async function() {
    expect(await this.page.evaluate(() => window.__xss)).toBe(false);
    // The script element was moved into the header, still inert
    await expect(this.page.locator('#test th script')).toHaveCount(1);
});

Then('DOM manipulation should be safe', async function() {
    expect(await this.page.evaluate(() => window.__htmlWrites)).toBe(0);
    expect(this.pageErrors).toEqual([]);
});

Then('child nodes should be moved via appendChild', async function() {
    await expectSafeMoves(this);
});

// ============================================================================
// IMAGES
// ============================================================================

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

Given('an img with ax-enhance={string} ax-decorative={string}', async function(enhance, decorative) {
    await addMarkup(this, `<img id="test" src="${PIXEL}" ${attrs([['ax-enhance', enhance], ['ax-decorative', decorative]])}>`);
});

Given('an img with ax-enhance={string} ax-description={string}', async function(enhance, description) {
    await addMarkup(this, `<img id="test" src="${PIXEL}" ${attrs([['ax-enhance', enhance], ['ax-description', description]])}>`);
    this.accx.description = description;
});

Given('the img has alt={string}', async function(alt) {
    await target(this).evaluate((el, value) => el.setAttribute('alt', value), alt);
});

Then(/^the img should have (alt|role|aria-[\w-]+)="([^"]*)"$/, async function(name, value) {
    await expectAttr(target(this), name, value);
});

Then('a description element should be created', async function() {
    this.accx.descEl = this.page.locator('#test + span.ax-sr-only');
    await expect(this.accx.descEl).toHaveText(this.accx.description);
});

Then('the img should have aria-describedby pointing to description', async function() {
    const id = await this.accx.descEl.getAttribute('id');
    expect(id).toBeTruthy();
    await expectAttr(target(this), 'aria-describedby', id);
});

// ============================================================================
// MODAL
// ============================================================================

Given('a div with ax-enhance={string} ax-trap-focus={string} ax-close-on-escape={string}', async function(enhance, trap, close) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['ax-trap-focus', trap], ['ax-close-on-escape', close]])}>
        <h2>Confirm</h2>
        <button id="modal-first">OK</button>
        <button id="modal-last">Cancel</button>
    </div>`);
});

Given('the div has id={string}', async function(id) {
    await target(this).evaluate((el, value) => {
        el.id = value;
    }, id);
    this.accx.selector = `#${id}`;
});

Then('focus should be trapped within the modal', async function() {
    const first = this.page.locator('#modal-first');
    const last = this.page.locator('#modal-last');
    await last.focus();
    await this.page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await this.page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
});

Then('pressing Escape should close the modal', async function() {
    await this.page.keyboard.press('Escape');
    await expect(target(this)).toBeHidden();
    await expectAttr(target(this), 'aria-hidden', 'true');
});

// ============================================================================
// SKIP LINK AND LANDMARKS
// ============================================================================

Given('a div with ax-enhance={string} ax-target={string}', async function(enhance, targetSel) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['ax-target', targetSel]])}></div><main id="main"><p>Content</p></main>`);
});

Given('a div with ax-enhance={string} ax-role={string} ax-label={string}', async function(enhance, role, label) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['ax-role', role], ['ax-label', label]])}></div>`);
});

Given('a div with ax-enhance={string} ax-role={string}', async function(enhance, role) {
    await addMarkup(this, `<div id="test" ${attrs([['ax-enhance', enhance], ['ax-role', role]])}></div>`);
});

const skipLink = world => world.page.locator('body > a.ax-skip-link');

Then('a skip link should be created', async function() {
    await expect(skipLink(this)).toHaveCount(1);
    const first = await this.page.evaluate(() => document.body.firstElementChild.className);
    expect(first).toContain('ax-skip-link');
});

Then('the link text should be {string}', async function(text) {
    await expect(skipLink(this)).toHaveText(text);
});

Then('the link href should be {string}', async function(href) {
    await expectAttr(skipLink(this), 'href', href);
});

Then('the link should be hidden until focused', async function() {
    const box = await skipLink(this).boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(0);
    await this.page.keyboard.press('Tab');
    await expect(skipLink(this)).toBeFocused();
    await expect.poll(async () => (await skipLink(this).boundingBox()).y).toBeGreaterThanOrEqual(0);
});

// ============================================================================
// FOCUS
// ============================================================================

Then('focus styles should be enhanced', async function() {
    await expect(target(this)).toHaveClass(/(^|\s)ax-focus-enhanced(\s|$)/);
    await target(this).focus();
    const outline = await target(this).evaluate(el => {
        const cs = getComputedStyle(el);
        return { width: cs.outlineWidth, style: cs.outlineStyle };
    });
    expect(outline).toEqual({ width: '3px', style: 'solid' });
});

Then('keyboard navigation should work', async function() {
    // Start keyboard navigation just before the button, then Tab onto it
    await target(this).evaluate(el => {
        const start = document.createElement('span');
        start.tabIndex = -1;
        el.before(start);
        start.focus();
    });
    await this.page.keyboard.press('Tab');
    await expect(target(this)).toBeFocused();
});

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

When(/^AccessX\.announce\("([^"]*)", "([^"]*)"\) is called$/, async function(message, priority) {
    // Watch for regions accX adds to the body, so the check does not depend
    // on when the step looks.
    await this.page.evaluate(() => {
        window.__regions = [];
        new MutationObserver(records => {
            records.forEach(r => r.addedNodes.forEach(n => {
                if (n.nodeType === 1 && n.hasAttribute('aria-live')) {
                    window.__regions.push(n);
                }
            }));
        }).observe(document.body, { childList: true });
    });
    await this.page.evaluate(([m, p]) => window.AccessX.announce(m, p), [message, priority]);
    this.accx.message = message;
});

Then('a temporary live region should be created', async function() {
    await expect.poll(() => this.page.evaluate(() => window.__regions.length)).toBe(1);
    await this.page.evaluate(() => {
        window.__regions[0].id = window.__regions[0].id || 'ax-test-region';
    });
    this.accx.it = this.page.locator(`#${await this.page.evaluate(() => window.__regions[0].id)}`);
});

Then(/^in accX, it should have (aria-[\w-]+)="([^"]*)"$/, async function(name, value) {
    await expectAttr(this.accx.it, name, value);
});

Then('in accX, it should contain {string}', async function(text) {
    await expect(this.accx.it).toHaveText(text);
});

Then('it should be removed after announcement', async function() {
    await expect(this.accx.it).toHaveCount(0, { timeout: 5000 });
    expect(await this.page.evaluate(() => window.__regions[0].isConnected)).toBe(false);
});

// ============================================================================
// VALIDATION
// ============================================================================

Given('an img element without alt attribute', async function() {
    await addMarkup(this, `<img id="test" src="${PIXEL}">`);
});

Given('an input without an associated label', async function() {
    await addMarkup(this, '<div><input id="test" type="text"></div>');
    await expect(this.page.locator('label[for="test"]')).toHaveCount(0);
    expect(await target(this).evaluate(el => !!el.closest('label'))).toBe(false);
});

Given('the input has no aria-label or aria-labelledby', async function() {
    expect(await target(this).getAttribute('aria-label')).toBeNull();
    expect(await target(this).getAttribute('aria-labelledby')).toBeNull();
});

async function validateTarget(world) {
    await loadAccx(world);
    world.accx.issues = await target(world).evaluate(el =>
        window.AccessX.validate(el).map(({ issue, severity }) => ({ issue, severity })));
}

When('AccessX.validate\\() is called on the image', async function() {
    await validateTarget(this);
});

When('AccessX.validate\\() is called', async function() {
    await validateTarget(this);
});

Then('it should return an error', async function() {
    const errors = this.accx.issues.filter(i => i.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    this.accx.issue = errors[0];
});

Then('the error should indicate {string}', async function(text) {
    expect(this.accx.issue.issue).toBe(text);
});

Then('the severity should be {string}', async function(severity) {
    expect(this.accx.issue.severity).toBe(severity);
});

// ============================================================================
// DYNAMIC CONTENT
// ============================================================================

When('a new element is added:', async function(docString) {
    await this.page.evaluate(html => {
        const wrap = document.createElement('div');
        wrap.id = 'ax-added';
        wrap.insertAdjacentHTML('beforeend', html.trim());
        document.body.appendChild(wrap);
    }, docString);
    this.accx.selector = '#ax-added > :first-child';
    this.accx.it = target(this);
});

Then('the MutationObserver should detect it', async function() {
    // Only the observer can mark it: nothing rescans after the insert
    await expect(target(this)).toHaveAttribute('ax-enhanced', 'true');
});

Then('the button should be automatically enhanced', async function() {
    await expectAttr(target(this), 'role', 'button');
});

// ============================================================================
// PERFORMANCE (@perf; not part of the default run)
// ============================================================================

Given('{int} elements with various ax- attributes', async function(count) {
    await this.page.evaluate(n => {
        const kinds = [
            '<span ax-enhance="label" ax-type="percentage">5%</span>',
            '<button ax-enhance="button">Go</button>',
            '<div ax-enhance="live"></div>',
            '<span ax-enhance="srOnly" ax-sr-text="x">y</span>'
        ];
        const frag = document.createElement('div');
        frag.id = 'perf-root';
        frag.innerHTML = Array.from({ length: n }, (_, i) => kinds[i % kinds.length]).join('');
        document.body.appendChild(frag);
    }, count);
});

// "the operation should complete in less than {int}ms" (common.steps.js)
// reads this.operationTime.
When('all accX elements are processed', async function() {
    const start = Date.now();
    await loadAccx(this);
    this.operationTime = Date.now() - start;
});

Then('in accX, it should maintain 60 FPS', async function() {
    const frame = await this.page.evaluate(() => new Promise(resolve => {
        const t0 = performance.now();
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - t0)));
    }));
    expect(frame).toBeLessThan(2 * 1000 / 60 + 5);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

Then('it should log a warning', async function() {
    await expect.poll(() => this.consoleMessages
        .filter(m => m.type === 'warning')
        .some(m => m.text.includes('Unknown enhancement type'))).toBe(true);
});

Then('other enhancements should continue working', async function() {
    await this.page.evaluate(() => {
        const el = document.createElement('span');
        el.id = 'ax-after-error';
        el.setAttribute('ax-enhance', 'label');
        el.setAttribute('ax-type', 'percentage');
        el.textContent = '5%';
        document.body.appendChild(el);
    });
    await expect(this.page.locator('#ax-after-error')).toHaveAttribute('aria-label', '5% percent');
});

module.exports = {};
