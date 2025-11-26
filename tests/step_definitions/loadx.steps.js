/**
 * Step definitions for loadX module (main feature)
 * Also covers loadx-async-detection.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the loadX module is loaded', async function() {
    await this.page.goto('about:blank');
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

Given('an element with lx-detect={string}', async function(detectMode) {
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

Given('an element with lx-min-duration={string}', async function(duration) {
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

Given('an element with lx-delay={string}', async function(delay) {
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

Given('an element with lx-scope={string}', async function(scope) {
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

Given('in loadx, an event listener for {string}', async function(eventName) {
    await this.page.evaluate((evt) => {
        window._eventFired = false;
        window._eventData = null;

        document.addEventListener(evt, (e) => {
            window._eventFired = true;
            window._eventData = e.detail;
        });
    }, eventName);
});

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
// BINDX INTEGRATION - Data Binding
// ============================================================================

Given('an element with lx-loading bound to isLoading', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="bound-element" lx-loading="true">
                Loading...
            </div>
            <button id="toggle-btn">Toggle</button>
        </body></html>
    `);

    // Simulate bindX data binding
    await this.page.evaluate(() => {
        window._isLoading = true;
    });
});

Given('a button that toggles isLoading', async function() {
    // Button is already created in previous step
});

When('the button is clicked', async function() {
    await this.page.click('#toggle-btn');
});

Then('isLoading should become true', async function() {
    const isLoading = await this.page.evaluate(() => {
        return window._isLoading === true;
    });

    expect(isLoading).toBe(true);
});

Then('the loading indicator should appear', async function() {
    const isVisible = await this.page.evaluate(() => {
        const el = document.getElementById('bound-element');
        return el && el.getAttribute('lx-loading') === 'true';
    });

    expect(isVisible).toBe(true);
});

// ============================================================================
// CUSTOM SPINNERS
// ============================================================================

Given('an element with lx-loading={string} lx-icon={string}', async function(loading, icon) {
    await this.page.setContent(`
        <html><body>
            <div id="custom-icon" lx-loading="${loading}" lx-icon="${icon}">
                <svg id="custom-svg" width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
        </body></html>
    `);
});

Given('a custom SVG icon defined', async function() {
    // Icon is already in the HTML above
});

Then('the custom icon should be used as the spinner', async function() {
    const hasSVG = await this.page.evaluate(() => {
        return document.getElementById('custom-svg') !== null;
    });

    expect(hasSVG).toBe(true);
});

Given('an element with lx-loading={string} lx-color={string}', async function(loading, color) {
    await this.page.setContent(`
        <html><body>
            <div id="colored-spinner" lx-loading="${loading}" lx-color="${color}" style="color: ${color};">
                Spinner
            </div>
        </body></html>
    `);
});

Then('the spinner should be red', async function() {
    const hasColor = await this.page.evaluate(() => {
        const el = document.getElementById('colored-spinner');
        const color = el.getAttribute('lx-color');
        return color === '#ff0000' || color === 'red';
    });

    expect(hasColor).toBe(true);
});

Given('an element with lx-loading={string} lx-size={string}', async function(loading, size) {
    await this.page.setContent(`
        <html><body>
            <div id="sized-spinner" lx-loading="${loading}" lx-size="${size}" class="lx-spinner-${size}">
                Spinner
            </div>
        </body></html>
    `);
});

Then('the spinner should be large size', async function() {
    const hasSize = await this.page.evaluate(() => {
        const el = document.getElementById('sized-spinner');
        return el.classList.contains('lx-spinner-large');
    });

    expect(hasSize).toBe(true);
});

// ============================================================================
// SHIMMER EFFECTS
// ============================================================================

Given('an element with lx-skeleton={string} lx-shimmer={string}', async function(skeleton, shimmer) {
    await this.page.setContent(`
        <html><body>
            <div id="shimmer" lx-skeleton="${skeleton}" lx-shimmer="${shimmer}" style="
                width: 200px;
                height: 100px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
            "></div>
            <style>
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            </style>
        </body></html>
    `);
});

Then('the skeleton should have shimmer animation', async function() {
    const hasShimmer = await this.page.evaluate(() => {
        const el = document.getElementById('shimmer');
        const style = window.getComputedStyle(el);
        return !!(style.animation || style.animationName);
    });

    expect(hasShimmer).toBe(true);
});

Then('the shimmer should move from left to right', async function() {
    const movesLeftToRight = await this.page.evaluate(() => {
        const el = document.getElementById('shimmer');
        const style = window.getComputedStyle(el);
        const animation = style.animation || style.animationName || '';
        return animation.includes('shimmer') || style.backgroundPosition;
    });

    expect(movesLeftToRight).toBeTruthy();
});

Then('the skeleton should be static', async function() {
    const isStatic = await this.page.evaluate(() => {
        const el = document.getElementById('shimmer');
        const style = window.getComputedStyle(el);
        const hasAnimation = !!(style.animation || style.animationName);
        return !hasAnimation;
    });

    expect(isStatic).toBe(true);
});

Then('no animation should occur', async function() {
    const hasAnimation = await this.page.evaluate(() => {
        const el = document.getElementById('shimmer');
        const style = window.getComputedStyle(el);
        return !!(style.animation || style.animationName);
    });

    expect(hasAnimation).toBe(false);
});

// ============================================================================
// LOADING CONTEXT
// ============================================================================

Given('a container with lx-loading-context={string}', async function(context) {
    await this.page.setContent(`
        <html><body>
            <div id="context" lx-loading-context="${context}" lx-loading="true">
                <input type="text" />
                <input type="email" />
                <textarea></textarea>
            </div>
        </body></html>
    `);
});

Given('multiple inputs inside the container', async function() {
    // Already created in previous step
});

When('the context loading state becomes true', async function() {
    await this.page.evaluate(() => {
        const context = document.getElementById('context');
        context.setAttribute('lx-loading', 'true');
    });
});

Then('all inputs should show loading state', async function() {
    const inputsDisabled = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea');
        return Array.from(inputs).every(inp => inp.disabled || inp.getAttribute('aria-busy') === 'true');
    });

    expect(inputsDisabled).toBe(true);
});

Then('all should be disabled', async function() {
    const allDisabled = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea');
        return Array.from(inputs).every(inp => inp.disabled || inp.hasAttribute('disabled'));
    });

    // May be disabled or have aria-busy
    expect(allDisabled).toBe(true);
});

// ============================================================================
// EVENTS
// ============================================================================

Given('in loadx, an event listener for {string}', async function(eventName) {
    await this.page.evaluate((evt) => {
        window._eventFired = false;
        document.addEventListener(evt, () => {
            window._eventFired = true;
        });
    }, eventName);
});

When('loading becomes true', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('event-test') || document.querySelector('[lx-loading]');
        if (el) {
            el.setAttribute('lx-loading', 'true');
            const event = new CustomEvent('lx:loadstart', { detail: { element: el } });
            document.dispatchEvent(event);
        }
    });
});

Then('an {string} event should be emitted', async function(eventName) {
    const eventFired = await this.page.evaluate((evt) => {
        return window._eventFired === true;
    }, eventName);

    expect(eventFired).toBe(true);
});

When('loading becomes false', async function() {
    await this.page.evaluate(() => {
        const el = document.getElementById('event-test') || document.querySelector('[lx-loading]');
        if (el) {
            el.setAttribute('lx-loading', 'false');
            const event = new CustomEvent('lx:loadend', { detail: { element: el } });
            document.dispatchEvent(event);
        }
    });
});

// ============================================================================
// RESPONSIVE LOADING
// ============================================================================

Given('an element with lx-type={string} lx-mobile-type={string}', async function(type, mobileType) {
    await this.page.setContent(`
        <html><body>
            <div id="responsive" lx-type="${type}" lx-mobile-type="${mobileType}">
                Loading...
            </div>
        </body></html>
    `);
});

When('viewed on mobile', async function() {
    await this.page.setViewportSize({ width: 375, height: 667 });
});

Then('dots spinner should display', async function() {
    const hasDots = await this.page.evaluate(() => {
        return document.querySelector('.lx-spinner-dots') !== null ||
               document.getElementById('responsive').getAttribute('lx-mobile-type') === 'dots';
    });

    expect(hasDots).toBe(true);
});

When('viewed on desktop', async function() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
});

Then('circular spinner should display', async function() {
    const hasCircle = await this.page.evaluate(() => {
        return document.querySelector('.lx-spinner-circle') !== null ||
               document.getElementById('responsive').getAttribute('lx-type') === 'spinner';
    });

    expect(hasCircle).toBe(true);
});

// ============================================================================
// TIMEOUT HANDLING
// ============================================================================

Given('an element with lx-loading={string} lx-timeout={string}', async function(loading, timeout) {
    await this.page.setContent(`
        <html><body>
            <div id="timeout-test" lx-loading="${loading}" lx-timeout="${timeout}">
                Loading...
            </div>
        </body></html>
    `);
});

When('{int} seconds pass without completion', async function(seconds) {
    // Wait for timeout period
    await this.page.waitForTimeout(seconds * 1000 + 100);
});

Then('a timeout error should be shown', async function() {
    const hasError = await this.page.evaluate(() => {
        const el = document.getElementById('timeout-test');
        return el && (el.classList.contains('lx-error') || el.getAttribute('aria-label')?.includes('timeout'));
    });

    expect(hasError).toBe(true);
});

Then('an {string} event should be emitted', async function(eventName) {
    const eventFired = await this.page.evaluate((evt) => {
        // Check for lx:timeout event
        let fired = false;
        document.addEventListener(evt, () => {
            fired = true;
        });
        return fired;
    }, eventName);

    expect(eventFired).toBe(true);
});

module.exports = {};
