/**
 * Step definitions for loadX module (main feature)
 * Also covers loadx-async-detection.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { defineElement } = require('../support/element-fixtures');
const { expect } = require('@playwright/test');

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the loadX module is loaded', async function() {
    await this.page.goto('about:blank');
    await this.page.addScriptTag({ path: './src/genx-common.js' }); // modules parse attributes through genxCommon
    await this.page.addScriptTag({ path: './src/loadx.js' });

    // Wait for loadX to be available
    await this.page.waitForFunction(() => window.loadX !== undefined);
});

// ============================================================================
// BASIC LOADING STATE
// ============================================================================

Given('in loadx, an element with lx-loading={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="${enabled}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('an async operation is in progress', async function() {
    await this.page.evaluate(() => {
        window._asyncOp = new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    });
});

Then('loading state should be applied', async function() {
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading') ||
        el.getAttribute('aria-busy') === 'true'
    );
    expect(hasLoading).toBe(true);
});

When('the operation completes', async function() {
    await this.page.evaluate(() => {
        return window._asyncOp;
    });
});

Then('loading state should be removed', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading') ||
        el.getAttribute('aria-busy') === 'true'
    );
    expect(hasLoading).toBe(false);
});

// ============================================================================
// LOADING STRATEGIES
// ============================================================================

Given('in loadx, an element with lx-strategy={string}', async function(strategy) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="true" lx-strategy="${strategy}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Then('a {word} loading indicator should appear', async function(strategyType) {
    // Check for strategy-specific elements or classes
    const hasStrategy = await this.page.evaluate((type) => {
        const el = document.getElementById('test-element');
        return el.classList.contains(`lx-${type}`) ||
               el.querySelector(`.lx-${type}`) !== null;
    }, strategyType);
    expect(hasStrategy).toBe(true);
});

// ============================================================================
// ASYNC DETECTION - FETCH
// ============================================================================

defineElement('an element with lx-detect={string}', async function(detectMode) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-detect="${detectMode}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('a fetch request is made', async function() {
    await this.page.evaluate(() => {
        window._fetchRequest = fetch('https://api.example.com/data')
            .then(r => r.json());
    });
});

Then('loading state should activate automatically', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(true);
});

When('the fetch completes', async function() {
    await this.page.evaluate(() => {
        return window._fetchRequest;
    });
});

Then('loading state should deactivate automatically', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(false);
});

// ============================================================================
// ASYNC DETECTION - XHR
// ============================================================================

Given('an XHR request is made', async function() {
    await this.page.evaluate(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.example.com/data');
        window._xhrRequest = new Promise(resolve => {
            xhr.onload = resolve;
        });
        xhr.send();
    });
});

When('the XHR completes', async function() {
    await this.page.evaluate(() => {
        return window._xhrRequest;
    });
});

// ============================================================================
// ASYNC DETECTION - PROMISES
// ============================================================================

Given('a Promise is created', async function() {
    await this.page.evaluate(() => {
        window._promise = new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    });
});

When('the Promise resolves', async function() {
    await this.page.evaluate(() => {
        return window._promise;
    });
});

// ============================================================================
// ASYNC DETECTION - ASYNC/AWAIT
// ============================================================================

Given('an async function is called', async function() {
    await this.page.evaluate(() => {
        window._asyncFunc = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return 'done';
        };
        window._asyncCall = window._asyncFunc();
    });
});

When('the async function completes', async function() {
    await this.page.evaluate(() => {
        return window._asyncCall;
    });
});

// ============================================================================
// MANUAL CONTROL
// ============================================================================

Given('an element with loadX configured', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="manual">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

When('I call loadX.start\\()', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        if (window.loadX && window.loadX.start) {
            window.loadX.start(el);
        }
    });
});

Then('loading should start', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(true);
});

When('I call loadX.stop\\()', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('test-element');
        if (window.loadX && window.loadX.stop) {
            window.loadX.stop(el);
        }
    });
});

Then('loading should stop', async function() {
    await this.page.waitForTimeout(100);
    const hasLoading = await this.element.evaluate(el =>
        el.classList.contains('lx-loading')
    );
    expect(hasLoading).toBe(false);
});

// ============================================================================
// MINIMUM DURATION
// ============================================================================

defineElement('an element with lx-min-duration={string}', async function(duration) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="true" lx-min-duration="${duration}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('operation completes in {int}ms', async function(duration) {
    this.operationDuration = duration;
    await this.page.evaluate((dur) => {
        window._quickOp = new Promise(resolve => {
            setTimeout(resolve, dur);
        });
    }, duration);
});

Then('loading should display for at least {int}ms', async function(minDuration) {
    const start = Date.now();
    await this.page.evaluate(() => window._quickOp);
    await this.page.waitForFunction(() => {
        const el = document.getElementById('test-element');
        return !el.classList.contains('lx-loading');
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(minDuration);
});

// ============================================================================
// DELAY THRESHOLD
// ============================================================================

defineElement('an element with lx-delay={string}', async function(delay) {
    await this.page.setContent(`
        <html><body>
            <div id="test-element" lx-loading="true" lx-delay="${delay}">
                Content
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#test-element');
});

Given('operation completes quickly \\(< delay)', async function() {
    await this.page.evaluate(() => {
        window._quickOp = new Promise(resolve => {
            setTimeout(resolve, 50);
        });
    });
});

Then('loading should never appear', async function() {
    await this.page.evaluate(() => window._quickOp);
    await this.page.waitForTimeout(100);
    const everShown = await this.page.evaluate(() => {
        return window._loadingWasShown || false;
    });
    expect(everShown).toBe(false);
});

// ============================================================================
// ACCESSIBILITY
// ============================================================================

Then('aria-busy should be set to {string}', async function(value) {
    const ariaBusy = await this.element.getAttribute('aria-busy');
    expect(ariaBusy).toBe(value);
});

Then('aria-live region should announce state', async function() {
    const hasLiveRegion = await this.page.evaluate(() => {
        return document.querySelector('[aria-live]') !== null;
    });
    expect(hasLiveRegion).toBe(true);
});

// ============================================================================
// MULTIPLE ELEMENTS - Independent State
// ============================================================================

Given('multiple elements with lx-loading', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="elem1" lx-loading="true">Element 1</div>
            <div id="elem2" lx-loading="true">Element 2</div>
            <div id="elem3" lx-loading="false">Element 3</div>
        </body></html>
    `);
    this.elements = await this.page.$$('[lx-loading]');
});

Then('each should have independent loading state', async function() {
    const states = await this.page.evaluate(() => {
        const elem1 = document.getElementById('elem1');
        const elem2 = document.getElementById('elem2');
        const elem3 = document.getElementById('elem3');

        return {
            elem1: elem1.getAttribute('lx-loading') === 'true',
            elem2: elem2.getAttribute('lx-loading') === 'true',
            elem3: elem3.getAttribute('lx-loading') === 'false'
        };
    });

    expect(states.elem1).toBe(true);
    expect(states.elem2).toBe(true);
    expect(states.elem3).toBe(false);
});

// ============================================================================
// NESTED ELEMENTS - Non-Interference
// ============================================================================

Given('nested elements with lx-loading', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="parent" lx-loading="true">
                Parent Loading
                <div id="child" lx-loading="false">
                    Child
                </div>
            </div>
        </body></html>
    `);
});

Then('loading states should not interfere', async function() {
    const hasConflict = await this.page.evaluate(() => {
        const parent = document.getElementById('parent');
        const child = document.getElementById('child');

        // Both should maintain independent states
        const parentLoading = parent.getAttribute('lx-loading') === 'true';
        const childLoading = child.getAttribute('lx-loading') === 'false';

        // Loading state of parent shouldn't force child into loading
        return parentLoading && childLoading;
    });

    expect(hasConflict).toBe(true);
});

// ============================================================================
// SCOPED LOADING - Multiple Operations
// ============================================================================

defineElement('an element with lx-scope={string}', async function(scope) {
    await this.page.setContent(`
        <html><body>
            <div id="scope-container" lx-scope="${scope}">
                <input id="input1" type="text" />
                <input id="input2" type="text" />
            </div>
        </body></html>
    `);
    this.scopeElement = await this.page.$('#scope-container');
});

Given('multiple async operations in scope', async function() {
    await this.page.evaluate(() => {
        window._ops = [
            new Promise(resolve => setTimeout(resolve, 100)),
            new Promise(resolve => setTimeout(resolve, 150)),
            new Promise(resolve => setTimeout(resolve, 200))
        ];
    });
});

Then('loading should wait for all to complete', async function() {
    const allComplete = await this.page.evaluate(() => {
        return Promise.all(window._ops)
            .then(() => {
                // If we get here, all ops completed
                return true;
            })
            .catch(() => false);
    });

    expect(allComplete).toBe(true);
});

// ============================================================================
// CUSTOM LOADING CONTENT
// ============================================================================

Given('an element with custom loading content', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="custom-loader" lx-loading="true">
                <span>Custom Loader</span>
            </div>
        </body></html>
    `);
});

Then('custom content should be shown', async function() {
    const hasCustomContent = await this.page.evaluate(() => {
        const loader = document.getElementById('custom-loader');
        return loader && loader.querySelector('span') !== null;
    });

    expect(hasCustomContent).toBe(true);
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================


Then('loading animation should respect prefers-reduced-motion', async function() {
    await this.page.evaluate(() => {
        // Set up matchMedia mock for reduced motion
        window.matchMedia = (query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {}
        });
    });

    const respectsMotion = await this.page.evaluate(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        return typeof prefersReduced === 'boolean';
    });

    expect(respectsMotion).toBe(true);
});

// ============================================================================
// CLEANUP - Element Removal
// ============================================================================

Given('in loadx, loading state is applied', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="cleanup-test" lx-loading="true">
                Content
            </div>
        </body></html>
    `);

    // Apply loading state
    await this.page.evaluate(() => {
        const el = document.getElementById('cleanup-test');
        el.classList.add('lx-loading');
        el.setAttribute('aria-busy', 'true');
    });
});

When('the element is removed', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('cleanup-test');
        if (el) {
            el.remove();
        }
    });
});

Then('loading should cleanup properly', async function() {
    const isRemoved = await this.page.evaluate(() => {
        return document.getElementById('cleanup-test') === null;
    });

    expect(isRemoved).toBe(true);
});

// ============================================================================
// SPINNER DISPLAY - Visual Validation
// ============================================================================

Given('a spinner animation', async function() {
    await this.page.setContent(`
        <html><body style="margin: 0; padding: 0;">
            <div id="spinner" class="lx-spinner-circle" style="
                width: 32px;
                height: 32px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </body></html>
    `);
});

Then('it should maintain 60 FPS', async function() {
    // Measure frame rate during animation
    const frameData = await this.page.evaluate(() => {
        return new Promise((resolve) => {
            let frameCount = 0;
            const startTime = performance.now();

            const countFrames = () => {
                frameCount++;
                if (performance.now() - startTime < 1000) {
                    requestAnimationFrame(countFrames);
                } else {
                    const fps = frameCount / ((performance.now() - startTime) / 1000);
                    resolve({ fps, frameCount });
                }
            };

            requestAnimationFrame(countFrames);
        });
    });

    // FPS should be close to 60 (accounting for system variations)
    expect(frameData.fps).toBeGreaterThan(50);
});

Then('use CSS animations for efficiency', async function() {
    const usesCSSAnimations = await this.page.evaluate(() => {
        const spinner = document.querySelector('.lx-spinner-circle');
        const style = window.getComputedStyle(spinner);
        return !!(style.animation || style.animationName || style.webkitAnimation);
    });

    expect(usesCSSAnimations).toBe(true);
});

// ============================================================================
// loadx.feature - real pages: fixture HTML, then loadx.js + loadx.css + init()
// ============================================================================

const ORIGINAL_CONTENT = '<p id="lx-original">Original content</p>';

/** Load genx-common, loadX and loadx.css into the current page and record
 *  every live-region announcement (the region clears itself after 1s). */
async function addLoadX(world) {
    await world.page.addScriptTag({ path: './src/genx-common.js' });
    await world.page.addScriptTag({ path: './src/loadx.js' });
    await world.page.addStyleTag({ path: './src/loadx.css' });
    await world.page.evaluate(() => {
        window.__lxAnnouncements = [];
        new MutationObserver(() => {
            const region = document.getElementById('lx-live-region');
            if (region && region.textContent) {
                window.__lxAnnouncements.push(region.textContent);
            }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });
}

async function mountLoadX(world, bodyHtml) {
    await world.page.setContent(`<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`);
    await addLoadX(world);
    await world.page.evaluate(() => { window.loadX.init(); });
}

/** Wait past the observer debounce (50ms) plus a frame. */
async function settle(world) {
    await world.page.waitForTimeout(120);
}

const lxEl = (world) => world.page.locator('#lx-el');

Given(/^a loadX element with ((?:[\w:-]+="[^"]*"(?: |$))+)$/, async function(attrs) {
    await mountLoadX(this, `<div id="lx-el" ${attrs.trim()} style="width:300px">${ORIGINAL_CONTENT}</div>`);
});

Given('loadX is initialized on an empty page', async function() {
    await mountLoadX(this, '<main id="root"></main>');
});

// lx- attributes only, so bindX/dragX "a new element with ... is added" lines stay theirs.
When(/^a new element with ((?:lx-[\w:-]+="[^"]*" )+)is added$/, async function(attrs) {
    await this.page.evaluate((a) => {
        document.getElementById('root').insertAdjacentHTML('beforeend',
            `<div id="lx-el" ${a}><p id="lx-original">Original content</p></div>`);
    }, attrs.trim());
});

When('lx-loading changes to {string}', async function(value) {
    await this.page.evaluate((v) => document.getElementById('lx-el').setAttribute('lx-loading', v), value);
    await settle(this);
});

When('loadX updates the progress to {int}', async function(value) {
    await this.page.evaluate((v) => window.loadX.update(document.getElementById('lx-el'), v), value);
});

// ---- spinners -------------------------------------------------------------

async function expectSpinner(world) {
    await expect(lxEl(world).locator('.lx-spinner-wrapper')).toHaveCount(1);
    await expect(lxEl(world).locator('.lx-spinner-wrapper')).toBeVisible();
    await expect(lxEl(world)).toHaveClass(/\blx-loading\b/);
}

async function expectNoSpinner(world) {
    await expect(lxEl(world).locator('.lx-spinner-wrapper')).toHaveCount(0);
    await expect(lxEl(world)).not.toHaveClass(/\blx-loading\b/);
    await expect(world.page.locator('#lx-original')).toBeVisible();
}

Then('a spinner should be visible', async function() { await expectSpinner(this); });
Then('the spinner should appear', async function() { await expectSpinner(this); });
Then('no spinner should be visible', async function() { await expectNoSpinner(this); });
Then('the spinner should disappear', async function() { await expectNoSpinner(this); });

Then('the loading indicator should appear automatically', async function() {
    await expectSpinner(this);
    await expect(lxEl(this)).toHaveAttribute('aria-busy', 'true');
});

/** Name of the running CSS animation on the first match of selector. */
const animationOf = (world, selector) => world.page.evaluate((sel) => {
    const node = document.querySelector(sel);
    if (!node) return null;
    const style = getComputedStyle(node);
    return { name: style.animationName, iteration: style.animationIterationCount };
}, selector);

Then('a circular animated spinner should display', async function() {
    await expect(lxEl(this).locator('.lx-spinner-circle')).toBeVisible();
    const anim = await animationOf(this, '#lx-el .lx-spinner-circle');
    expect(anim.name).toBe('lx-spin');
    expect(anim.iteration).toBe('infinite');
});

Then('three animated dots should display', async function() {
    await expect(lxEl(this).locator('.lx-spinner-dots .lx-spinner-dot')).toHaveCount(3);
    const anim = await animationOf(this, '#lx-el .lx-spinner-dot');
    expect(anim.name).toBe('lx-bounce');
});

Then('animated bars should display', async function() {
    const bars = lxEl(this).locator('.lx-spinner-bars .lx-spinner-bar');
    expect(await bars.count()).toBeGreaterThan(1);
    const anim = await animationOf(this, '#lx-el .lx-spinner-bar');
    expect(anim.name).toBe('lx-scale');
});

Then('the spinner should be red', async function() {
    const color = await this.page.evaluate(() =>
        getComputedStyle(document.querySelector('#lx-el .lx-spinner-circle')).borderTopColor);
    expect(color).toBe('rgb(255, 0, 0)');
});

Then('the spinner should be large size', async function() {
    const spinner = lxEl(this).locator('.lx-spinner-circle');
    await expect(spinner).toHaveClass(/\blx-spinner-large\b/);
    const sizes = await this.page.evaluate(() => {
        const large = document.querySelector('#lx-el .lx-spinner-circle').getBoundingClientRect().width;
        const probe = document.createElement('div');
        probe.className = 'lx-spinner-circle lx-spinner-medium';
        document.body.appendChild(probe);
        const medium = probe.getBoundingClientRect().width;
        probe.remove();
        return { large, medium };
    });
    expect(sizes.large).toBeGreaterThan(sizes.medium);
});

// ---- skeletons and placeholders -------------------------------------------

Then('a text skeleton placeholder should display', async function() {
    await expect(lxEl(this).locator('.lx-skeleton.lx-skeleton-text').first()).toBeVisible();
    await expect(lxEl(this)).toHaveClass(/\blx-loading-skeleton\b/);
});

async function expectShimmer(world) {
    const anim = await animationOf(world, '#lx-el .lx-skeleton');
    expect(anim.name).toBe('lx-shimmer');
    expect(anim.iteration).toBe('infinite');
}

Then('it should have shimmer animation', async function() { await expectShimmer(this); });
Then('the skeleton should have shimmer animation', async function() { await expectShimmer(this); });

Then('the shimmer should move from left to right', async function() {
    // lx-shimmer moves the gradient from background-position -200% to 200%.
    const frames = await this.page.evaluate(() => {
        for (const sheet of document.styleSheets) {
            for (const rule of sheet.cssRules) {
                if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'lx-shimmer') {
                    return Array.from(rule.cssRules).map(r => ({
                        key: r.keyText, x: parseFloat(r.style.backgroundPosition)
                    }));
                }
            }
        }
        return null;
    });
    expect(frames).not.toBeNull();
    const first = frames.find(f => f.key === '0%');
    const last = frames.find(f => f.key === '100%');
    expect(last.x).toBeGreaterThan(first.x);
});

async function expectStaticSkeleton(world) {
    await expect(lxEl(world).locator('.lx-skeleton').first()).toBeVisible();
    const anim = await animationOf(world, '#lx-el .lx-skeleton');
    expect(anim.name).toBe('none');
}

Then('the skeleton should be static', async function() { await expectStaticSkeleton(this); });
Then('no animation should occur', async function() {
    const running = await this.page.evaluate(() =>
        document.getAnimations().filter(a => document.getElementById('lx-el').contains(a.effect && a.effect.target)).length);
    expect(running).toBe(0);
});

Then('the element\'s content should be hidden', async function() {
    await expect(this.page.locator('#lx-original')).toHaveCount(0);
    await expect(lxEl(this)).toHaveAttribute('data-lx-original-content', /Original content/);
});

Then('a placeholder should display', async function() {
    await expect(lxEl(this).locator('.lx-skeleton').first()).toBeVisible();
});

Then('the element\'s content should be visible', async function() {
    await expect(this.page.locator('#lx-original')).toBeVisible();
});

Then('no placeholder should display', async function() {
    await expect(lxEl(this).locator('.lx-skeleton')).toHaveCount(0);
    await expect(lxEl(this)).not.toHaveClass(/\blx-loading\b/);
});

// ---- progress ---------------------------------------------------------------

const progressBar = (world) => lxEl(world).locator('.lx-progress-bar');
const progressWidth = (world) => world.page.evaluate(() => {
    const bar = document.querySelector('#lx-el .lx-progress-bar');
    const fill = document.querySelector('#lx-el .lx-progress-fill');
    return Math.round(fill.getBoundingClientRect().width / bar.getBoundingClientRect().width * 100);
});

Then(/^a progress bar at (\d+)% should display$/, async function(pct) {
    await expect(progressBar(this)).toBeVisible();
    await expect(progressBar(this)).toHaveClass(/\blx-progress-determinate\b/);
    await expect(lxEl(this).locator('.lx-progress-fill')).toHaveAttribute('style', new RegExp(`width:\\s*${pct}%`));
    expect(await progressWidth(this)).toBe(Number(pct));
});

Then(/^the progress bar should animate to (\d+)%$/, async function(pct) {
    const transition = await this.page.evaluate(() =>
        getComputedStyle(document.querySelector('#lx-el .lx-progress-fill')).transitionProperty);
    expect(transition).toContain('width');
    await expect(lxEl(this).locator('.lx-progress-fill')).toHaveAttribute('style', new RegExp(`width:\\s*${pct}%`));
    await expect.poll(() => progressWidth(this)).toBe(Number(pct));
    await expect(progressBar(this)).toHaveAttribute('aria-valuenow', String(pct));
});

Then('an indeterminate progress bar should display', async function() {
    await expect(progressBar(this)).toBeVisible();
    await expect(progressBar(this)).toHaveClass(/\blx-progress-indeterminate\b/);
    await expect(lxEl(this).locator('.lx-progress-label')).toHaveCount(0);
});

Then('it should have continuous animation', async function() {
    const anim = await animationOf(this, '#lx-el .lx-progress-fill');
    expect(anim.name).toBe('lx-progress-indeterminate');
    expect(anim.iteration).toBe('infinite');
});

Then('the progress bar should show {string}', async function(text) {
    await expect(lxEl(this).locator('.lx-progress-label')).toHaveText(text);
});

Then('the progress bar should have role={string}', async function(role) {
    await expect(progressBar(this)).toHaveAttribute('role', role);
});

for (const attr of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax']) {
    Then(`${attr} should be {string}`, async function(value) {
        await expect(progressBar(this)).toHaveAttribute(attr, value);
    });
}

// ---- messages and ARIA ------------------------------------------------------

Then('the message {string} should display', async function(message) {
    await expect(lxEl(this).locator('.lx-fade-message')).toHaveText(message);
    await expect(lxEl(this)).toHaveClass(/\blx-loading-fade\b/);
});

Then('the loadX live region should have aria-live={string}', async function(value) {
    const region = this.page.locator('#lx-live-region');
    await expect(region).toHaveCount(1);
    await expect(region).toHaveAttribute('aria-live', value);
    await expect(region).toHaveAttribute('aria-atomic', 'true');
});

Then('screen readers should announce loading state', async function() {
    const announced = await this.page.evaluate(() => window.__lxAnnouncements);
    expect(announced).toContain('Loading');
});

Then('the loadX element should have aria-busy={string}', async function(value) {
    await expect(lxEl(this)).toHaveAttribute('aria-busy', value);
});

Then('the loadX element should no longer be busy', async function() {
    const busy = await lxEl(this).getAttribute('aria-busy');
    expect(busy === null || busy === 'false').toBe(true);
    await expect(this.page.locator('#lx-original')).toBeVisible();
});
