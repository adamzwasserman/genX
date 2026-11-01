// Steps for loadx-aria-cleanup.feature. They run in the browser page:
// loadX owns the #lx-live-region element and clears it 1 second after
// each announcement.
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Load and init loadX in the current page unless a step already did
async function ensureLoadX(page) {
    const ready = await page.evaluate(() => !!(window.loadX && window.loadX.config));
    if (ready) return;
    const loaded = await page.evaluate(() => !!(window.loadX && window.loadX.init));
    if (!loaded) {
        await page.addScriptTag({ path: './src/genx-common.js' });
        await page.addScriptTag({ path: './src/loadx.js' });
    }
    await page.evaluate(() => window.loadX.init({ autoDetect: false }));
}

// Poll the live region in the page until test(text) passes or time runs out
function waitForRegion(page, mode, expected, timeoutMs) {
    return page.evaluate(({ mode, expected, timeoutMs }) => new Promise(resolve => {
        const start = Date.now();
        const check = () => {
            const region = document.getElementById('lx-live-region');
            const text = region ? region.textContent : null;
            const ok = mode === 'equals' ? text === expected : text === '';
            if (ok) return resolve(true);
            if (Date.now() - start > timeoutMs) return resolve(false);
            setTimeout(check, 10);
        };
        check();
    }), { mode, expected, timeoutMs });
}

async function createElements(page, specs) {
    await page.evaluate((list) => {
        for (const { id, urgent } of list) {
            const el = document.createElement('div');
            el.id = id;
            el.setAttribute('lx-strategy', 'spinner');
            if (urgent) el.setAttribute('lx-urgent', 'true');
            el.textContent = 'Content to load...';
            document.body.appendChild(el);
        }
    }, specs);
}

function applyLoading(page, id) {
    return page.evaluate((elId) => {
        window.loadX.apply(document.getElementById(elId), { strategy: 'spinner' });
    }, id);
}

Given('an element with lx-strategy={string} and lx-urgent={string}', async function(strategy, urgent) {
    await createElements(this.page, [{ id: 'lx-urgent-element', urgent: urgent === 'true' }]);
    this.ariaElementId = 'lx-urgent-element';
});

Given('multiple elements with loading states', async function() {
    this.ariaElementIds = ['loading-element-0', 'loading-element-1', 'loading-element-2'];
    await createElements(this.page, this.ariaElementIds.map(id => ({ id })));
});

Given('an element in loading state', async function() {
    await createElements(this.page, [{ id: 'lx-loading-element' }]);
    this.ariaElementId = 'lx-loading-element';
    await ensureLoadX(this.page);
    await applyLoading(this.page, this.ariaElementId);
});

When('I apply loading state', async function() {
    await ensureLoadX(this.page);
    await applyLoading(this.page, this.ariaElementId || 'lx-spinner-element');
});

When('I apply loading to element {int}', async function(index) {
    await ensureLoadX(this.page);
    await applyLoading(this.page, this.ariaElementIds[index - 1]);
});

When('I remove loading state', async function() {
    await this.page.evaluate((elId) => {
        window.loadX.remove(document.getElementById(elId));
    }, this.ariaElementId);
});

When('I wait {int} second', async function(seconds) {
    await this.page.waitForTimeout(seconds * 1000);
});

When('I wait {int} second after last announcement', async function(seconds) {
    await this.page.waitForTimeout(seconds * 1000);
});

Then('ARIA live region should announce {string}', async function(expectedText) {
    expect(await waitForRegion(this.page, 'equals', expectedText, 200)).to.be.true;
});

Then('ARIA live region should be empty', async function() {
    expect(await waitForRegion(this.page, 'empty', null, 1500)).to.be.true;
});

Then('ARIA live region should contain latest message', async function() {
    const text = await this.page.evaluate(() => {
        const region = document.getElementById('lx-live-region');
        return region ? region.textContent : null;
    });
    expect(text).to.equal('Loading');
});

Then('in ARIA cleanup, ARIA live region should use aria-live={string}', async function(mode) {
    const actual = await this.page.evaluate(() => {
        const region = document.getElementById('lx-live-region');
        return region ? region.getAttribute('aria-live') : null;
    });
    expect(actual).to.equal(mode);
});

Then('should announce urgently', async function() {
    const state = await this.page.evaluate(() => {
        const region = document.getElementById('lx-live-region');
        return region ? [region.getAttribute('aria-live'), region.textContent] : null;
    });
    expect(state).to.deep.equal(['assertive', 'Loading']);
});
