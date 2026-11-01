/**
 * Step definitions for navX module
 * Declarative navigation through HTML attributes
 *
 * Every fixture is a real page: mountNav() serves the markup at the path the
 * scenario needs, with genx-common and navX loaded, so navX auto-initializes
 * exactly as it would on a site. Steps then act through the browser (clicks,
 * keys, scrolling, history) and check what navX did to the DOM.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { defineElement } = require('../support/element-fixtures');
const { expect } = require('@playwright/test');
const { baseUrl } = require('../fixtures/server');

// ============================================================================
// FIXTURE HELPERS
// ============================================================================

/**
 * Serve `body` at `path` (pathname plus optional #hash) and load it.
 * Remembers the fixture so later steps can change the URL or the markup and
 * remount. Options: head (extra <head> markup), initScript (runs before any
 * page script), clock (install Playwright's fake clock first).
 */
async function mountNav(world, body, options = {}) {
    const state = world.navx = Object.assign(world.navx || {}, { body }, options);
    const path = state.path || '/';
    const [pathname] = path.split('#');
    const base = baseUrl();
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>navX fixture</title>
<style>body { margin: 0; font: 16px sans-serif; }</style>
${state.head || ''}
</head><body>
${body}
<script src="${base}/src/genx-common.js"></script>
<script src="${base}/src/navx.js"></script>
</body></html>`;

    if (state.route) {
        await world.page.unroute(state.route.match, state.route.handler);
    }
    const match = url => url.pathname === pathname;
    const handler = route => route.fulfill({ status: 200, contentType: 'text/html', body: html });
    state.route = { match, handler };
    await world.page.route(match, handler);

    if (options.clock && !state.clockInstalled) {
        await world.page.clock.install();
        state.clockInstalled = true;
    }
    if (options.initScript && !state.initScriptAdded) {
        await world.page.addInitScript(options.initScript);
        state.initScriptAdded = true;
    }

    await world.page.goto(base + path);
    await world.page.waitForFunction(() => window.navX && window.navX.isInitialized());
}

/** Change the fixture markup and reload it at the current fixture path. */
async function remount(world, body) {
    await mountNav(world, body !== undefined ? body : world.navx.body);
}

/** Load the current fixture at a different path. */
async function visit(world, path) {
    world.navx.path = path;
    await mountNav(world, world.navx.body);
}

/**
 * Answer requests to `pathname` with 204 No Content. The click still starts a
 * real navigation, but the browser keeps the current page, so the scenario can
 * inspect it afterwards.
 */
async function holdNavigation(world, pathname) {
    world.navx.held = world.navx.held || [];
    await world.page.route(url => url.pathname === pathname, (route) => {
        world.navx.held.push(route.request().url());
        return route.fulfill({ status: 204, body: '' });
    });
}

/** Path of the current page URL. */
function currentPath(world) {
    return new URL(world.page.url()).pathname;
}

/** Click without waiting for any navigation the click starts. */
async function clickNoWait(locator) {
    await locator.click({ noWaitAfter: true });
}

// Text of a link, case-insensitively and ignoring surrounding space
function byText(world, selector, text) {
    return world.page.locator(selector).filter({ hasText: new RegExp(`^\\s*${text}\\s*$`, 'i') }).first();
}

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the navX module is loaded', async function() {
    // The shared fixture page loads genx-common and navX; each scenario then
    // mounts its own page with mountNav()
    await this.loadGenX();
    await this.page.waitForFunction(() => window.navX && window.navX.isInitialized());
});

// ============================================================================
// BASIC NAVIGATION
// ============================================================================

Given('a nav element with nx-nav={string}', async function(navName) {
    this.navx = { path: '/' };
    await mountNav(this, `<nav id="main-nav" nx-nav="${navName}"></nav>`);
    this.element = this.page.locator('#main-nav');
});

Given('links for {string}, {string}, {string}', async function(link1, link2, link3) {
    const links = [link1, link2, link3]
        .map(text => `<a href="/${text.toLowerCase()}">${text}</a>`).join('\n');
    await remount(this, this.navx.body.replace('</nav>', `${links}</nav>`));
    this.element = this.page.locator('#main-nav');
});

Then('the navigation should be enhanced', async function() {
    await expect(this.element).toHaveAttribute('nx-enhanced', 'true');
    await expect(this.element).toHaveAttribute('role', 'navigation');
    const links = this.element.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
        await expect(links.nth(i)).toHaveAttribute('nx-link-enhanced', 'true');
    }
});

Given('a nav with nx-nav={string} nx-active-class={string}', async function(navName, activeClass) {
    this.navx = { path: '/' };
    this.activeClass = activeClass;
    await mountNav(this, `
        <nav id="main-nav" nx-nav="${navName}" nx-active-class="${activeClass}">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
        </nav>`);
    this.element = this.page.locator('#main-nav');
});

Given('in navX, the current URL is {string}', async function(url) {
    // The page is loaded at that URL, as a visitor arriving there would see it
    await visit(this, url);
});

Then('the {string} link should have class {string}', async function(linkText, className) {
    const link = byText(this, 'nav a', linkText);
    await expect(link).toHaveClass(new RegExp(`(^|\\s)${className}(\\s|$)`));
    await expect(link).toHaveAttribute('aria-current', 'page');
});

Then('other links should not have the active class', async function() {
    const activeClass = this.activeClass || 'nx-active';
    const active = await this.page.$$eval('nav a', (links, cls) =>
        links.filter(a => a.classList.contains(cls)).map(a => a.textContent.trim()), activeClass);
    expect(active).toEqual(['About']);
});

Given('a nav with nx-exact={string}', async function(exact) {
    this.navx = { path: '/' };
    await mountNav(this, `<nav id="main-nav" nx-nav="main" nx-exact="${exact}"></nav>`);
    this.element = this.page.locator('#main-nav');
});

Given('a link to {string}', async function(url) {
    this.testUrl = url;
    await remount(this, this.navx.body.replace('</nav>', `<a href="${url}">${url}</a></nav>`));
});

When('the URL is exactly {string}', async function(url) {
    // Client-side navigation: navX must recheck active links after pushState
    await this.page.evaluate(u => window.history.pushState({}, '', u), url);
});

Then('the link should not be active', async function() {
    const link = this.page.locator(`a[href="${this.testUrl}"]`);
    await expect(link).not.toHaveClass(/(^|\s)nx-active(\s|$)/);
    await expect(link).not.toHaveAttribute('aria-current', 'page');
});

Then('the link should be active', async function() {
    const link = this.page.locator(`a[href="${this.testUrl}"]`);
    await expect(link).toHaveClass(/(^|\s)nx-active(\s|$)/);
    await expect(link).toHaveAttribute('aria-current', 'page');
});

// ============================================================================
// BREADCRUMBS
// ============================================================================

defineElement('an element with nx-breadcrumb={string}', async function(mode) {
    this.navx = { path: '/products/electronics/phones' };
    await mountNav(this, `<div id="breadcrumb" nx-breadcrumb="${mode}"></div>`);
    this.element = this.page.locator('#breadcrumb');
});

Given(/^custom labels defined: (\{.*\})$/, async function(labelsJson) {
    const labels = JSON.parse(labelsJson);
    const opts = JSON.stringify({ labels }).replace(/'/g, '&#39;');
    await remount(this, this.navx.body.replace('<div id="breadcrumb"', `<div id="breadcrumb" nx-opts='${opts}'`));
});

Then('breadcrumbs should display: {string}', async function(expected) {
    const text = await this.page.locator('#breadcrumb .nx-breadcrumb-list').innerText();
    expect(text.replace(/\s+/g, ' ').trim()).toBe(expected);
});

Given('rendered breadcrumbs', async function() {
    this.navx = { path: '/products/electronics/phones' };
    await mountNav(this, '<div id="breadcrumb" nx-breadcrumb="auto"></div>');
    await expect(this.page.locator('#breadcrumb a')).toHaveCount(3);
});

When('in navX, the user clicks {string}', async function(text) {
    await byText(this, 'a, button', text).click();
});

Then('navigation should occur to {string}', async function(url) {
    await this.page.waitForURL(u => u.pathname === url);
    expect(currentPath(this)).toBe(url);
});

// ============================================================================
// SCROLL SPY
// ============================================================================

const spySections = (ids, height) => ids.map(id =>
    `<section id="${id}" style="height:${height}px">${id}</section>`).join('\n');
const spyLinks = ids => ids.map(id =>
    `<a href="#${id}">${id.charAt(0).toUpperCase() + id.slice(1)}</a>`).join('\n');

Given('a nav with nx-scroll-spy={string}', async function(enabled) {
    this.navx = { path: '/', spyAttrs: `nx-scroll-spy="${enabled}"` };
    await mountNav(this, `<nav id="spy" ${this.navx.spyAttrs}></nav>`);
    this.element = this.page.locator('#spy');
});

Given('sections with ids: {string}, {string}, {string}', async function(id1, id2, id3) {
    const ids = [id1, id2, id3];
    await remount(this, `
        <nav id="spy" ${this.navx.spyAttrs} style="position:fixed;top:0;right:0">${spyLinks(ids)}</nav>
        ${spySections(ids, 1000)}
        <div style="height:1000px"></div>`);
});

When('{string} section scrolls into view', async function(sectionId) {
    await this.page.evaluate(id => document.getElementById(id).scrollIntoView(), sectionId);
});

Then('the {string} nav link should be highlighted', async function(linkText) {
    const link = byText(this, '#spy a', linkText);
    await expect(link).toHaveClass(/(^|\s)nx-active(\s|$)/);
    await expect(this.page.locator('#spy a.nx-active')).toHaveCount(1);
});

Given('scroll spy enabled', async function() {
    this.navx = { path: '/' };
    await mountNav(this, `
        <nav id="spy" nx-scroll-spy="true" style="position:fixed;top:0;right:0">${spyLinks(['section1', 'section2'])}</nav>
        ${spySections(['section1', 'section2'], 1000)}
        <div style="height:1000px"></div>`);
    await expect(this.page.locator('#spy a[href="#section1"]')).toHaveClass(/nx-active/);
    // Record how many links are active after every change, to catch flicker
    await this.page.evaluate(() => {
        window._spyStates = [];
        const nav = document.getElementById('spy');
        new MutationObserver(() => {
            window._spyStates.push(nav.querySelectorAll('a.nx-active').length);
        }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
});

When('the user scrolls down the page', async function() {
    // Far enough that the first section has left the top half of the viewport
    await this.page.mouse.move(200, 200);
    await this.page.mouse.wheel(0, 1100);
    await this.page.waitForFunction(() => window.scrollY >= 1100);
});

Then('the active nav item should update', async function() {
    await expect(this.page.locator('#spy a[href="#section2"]')).toHaveClass(/nx-active/);
    await expect(this.page.locator('#spy a[href="#section1"]')).not.toHaveClass(/nx-active/);
});

Then('transitions should be smooth', async function() {
    // The highlight moves straight from one link to the next: after every
    // change exactly one link is active, never none or two
    const states = await this.page.evaluate(() => window._spyStates);
    expect(states.length).toBeGreaterThan(0);
    expect(states.every(n => n === 1)).toBe(true);
});

Given('a nav with nx-scroll-spy={string} nx-offset={string}', async function(enabled, offset) {
    this.navx = { path: '/' };
    this.spyOffset = parseInt(offset, 10);
    await mountNav(this, `
        <nav id="spy" nx-scroll-spy="${enabled}" nx-offset="${offset}" style="position:fixed;top:0;right:0">${spyLinks(['one', 'two'])}</nav>
        ${spySections(['one', 'two'], 1000)}
        <div style="height:1000px"></div>`);
});

Then('sections should activate {int}px before reaching top', async function(px) {
    const scrollToTop = async (y) => {
        // Put the top of section "two" at y pixels from the top of the viewport
        await this.page.evaluate(top => window.scrollTo(0, document.getElementById('two').offsetTop - top), y);
    };
    const two = this.page.locator('#spy a[href="#two"]');
    const one = this.page.locator('#spy a[href="#one"]');

    await scrollToTop(px + 50);
    await expect(one).toHaveClass(/nx-active/);
    await expect(two).not.toHaveClass(/nx-active/);

    // Still px - 50 short of the top, yet already current
    await scrollToTop(px - 50);
    await expect(two).toHaveClass(/nx-active/);
    await expect(one).not.toHaveClass(/nx-active/);
});

// ============================================================================
// SMOOTH SCROLLING
// ============================================================================

const scrollFixture = (href, attrs) => `
    <nav id="main-nav" nx-nav="main"><a id="test-link" href="${href}" ${attrs}>Link</a></nav>
    <div style="height:2000px"></div>
    <div id="${href.slice(1)}" style="height:400px">Target</div>
    <div style="height:2000px"></div>`;

// Watch window.scrollY from the click until it reaches the target
async function watchScroll(world) {
    await world.page.evaluate(() => {
        const link = document.getElementById('test-link');
        const target = document.getElementById(link.getAttribute('href').slice(1));
        window._scrollWatch = { positions: [] };
        link.addEventListener('click', () => {
            const goal = target.getBoundingClientRect().top + window.scrollY;
            const start = performance.now();
            window._scrollWatch.goal = goal;
            const tick = () => {
                window._scrollWatch.positions.push(window.scrollY);
                if (Math.abs(window.scrollY - goal) <= 1) {
                    window._scrollWatch.elapsed = performance.now() - start;
                    return;
                }
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, { capture: true });
    });
}

Given('a link with href={string} and nx-scroll={string}', async function(href, scrollMode) {
    this.navx = { path: '/' };
    await mountNav(this, scrollFixture(href, `nx-scroll="${scrollMode}"`));
    this.navx.link = this.page.locator('#test-link');
    await watchScroll(this);
});

Given('a link with nx-scroll={string}', async function(mode) {
    this.navx = { path: '/' };
    await mountNav(this, scrollFixture('#target', `nx-scroll="${mode}"`));
    this.navx.link = this.page.locator('#test-link');
    await watchScroll(this);
});

Given('a link with nx-scroll={string} nx-duration={string}', async function(mode, duration) {
    this.navx = { path: '/' };
    await mountNav(this, scrollFixture('#target', `nx-scroll="${mode}" nx-duration="${duration}"`));
    this.navx.link = this.page.locator('#test-link');
    await watchScroll(this);
});

When('the link is clicked', async function() {
    const link = this.navx.link;
    if (this.navx && this.navx.expectDialog) {
        // A confirm() blocks the page; click from a task and catch the dialog
        this.dialogPromise = this.page.waitForEvent('dialog');
        await link.evaluate(el => setTimeout(() => el.click(), 0));
        this.dialog = await this.dialogPromise;
        return;
    }
    await clickNoWait(link);
});

Then(/^the page should smoothly scroll to #(\S+)$/, async function(id) {
    await this.page.waitForFunction(() => window._scrollWatch.elapsed !== undefined);
    const watch = await this.page.evaluate(() => window._scrollWatch);
    // Smooth: the page passed through positions between start and target
    const between = watch.positions.filter(y => y > 1 && y < watch.goal - 1);
    expect(between.length).toBeGreaterThan(1);
    const top = await this.page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
    expect(Math.abs(top)).toBeLessThanOrEqual(1);
});

Then('the animation should take ~{int}ms', async function(duration) {
    await this.page.waitForFunction(() => window._scrollWatch.elapsed !== undefined);
    const elapsed = await this.page.evaluate(() => window._scrollWatch.elapsed);
    expect(Math.abs(elapsed - duration)).toBeLessThan(duration * 0.5);
});

Then('the page should jump immediately to the target', async function() {
    await this.page.waitForFunction(() => window._scrollWatch.elapsed !== undefined);
    const watch = await this.page.evaluate(() => window._scrollWatch);
    // The first frame after the click is already at the target
    expect(Math.abs(watch.positions[0] - watch.goal)).toBeLessThanOrEqual(1);
});

Then('the scroll animation should take {int}ms', async function(duration) {
    await this.page.waitForFunction(() => window._scrollWatch.elapsed !== undefined, null, { timeout: duration * 3 });
    const elapsed = await this.page.evaluate(() => window._scrollWatch.elapsed);
    expect(Math.abs(elapsed - duration)).toBeLessThan(duration * 0.25);
});

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

const mobileFixture = (mode) => `
    <div id="mobile" nx-mobile="${mode}" style="position:relative;z-index:2;background:#fff">
        <button class="hamburger" data-mobile-trigger>&#9776;</button>
        <nav class="mobile-menu" data-mobile-menu>
            <a href="#home">Home</a>
            <a href="#about">About</a>
        </nav>
    </div>
    <div id="home" style="height:800px">Home</div>
    <div id="about" style="height:800px">About</div>`;

Given('a nav with nx-mobile={string}', async function(mobileType) {
    this.navx = { path: '/' };
    await mountNav(this, mobileFixture(mobileType));
    this.element = this.page.locator('#mobile');
});

When('viewed on mobile', async function() {
    await this.page.setViewportSize({ width: 375, height: 667 });
});

Then('a hamburger icon should display', async function() {
    const trigger = this.page.locator('.hamburger');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', /.+/);
});

Then('the menu should be hidden', async function() {
    await expect(this.page.locator('.mobile-menu')).toBeHidden();
});

Given('a mobile hamburger menu', async function() {
    this.navx = { path: '/' };
    await this.page.setViewportSize({ width: 375, height: 667 });
    await mountNav(this, mobileFixture('hamburger'));
    this.element = this.page.locator('#mobile');
});

When('the hamburger icon is clicked', async function() {
    await this.page.locator('.hamburger').click();
});

When('in navX, clicked again', async function() {
    await this.page.locator('.hamburger').click();
});

Then('the menu should slide in', async function() {
    const menu = this.page.locator('.mobile-menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveClass(/nx-mobile-menu-open/);
    await expect(this.page.locator('.hamburger')).toHaveAttribute('aria-expanded', 'true');
});

Then('the menu should slide out', async function() {
    const menu = this.page.locator('.mobile-menu');
    await expect(menu).toBeHidden();
    await expect(menu).not.toHaveClass(/nx-mobile-menu-open/);
    await expect(this.page.locator('.hamburger')).toHaveAttribute('aria-expanded', 'false');
});

async function openMobileMenu(world, extra = '') {
    world.navx = { path: '/' };
    await world.page.setViewportSize({ width: 375, height: 667 });
    await mountNav(world, extra + mobileFixture('hamburger'));
    await world.page.locator('.hamburger').click();
    await expect(world.page.locator('.mobile-menu')).toBeVisible();
}

Given('an open mobile menu', async function() {
    await openMobileMenu(this);
});

When('a navigation link is clicked', async function() {
    await this.page.locator('.mobile-menu a').first().click();
});

Then('the menu should close automatically', async function() {
    await expect(this.page.locator('.mobile-menu')).toBeHidden();
    await expect(this.page.locator('.hamburger')).toHaveAttribute('aria-expanded', 'false');
});

Given('an open mobile menu with overlay', async function() {
    await openMobileMenu(this, '<div class="overlay" style="position:fixed;inset:0;z-index:1;background:rgba(0,0,0,.4)"></div>');
});

When('the overlay is clicked', async function() {
    // A spot on the overlay away from the menu
    await this.page.locator('.overlay').click({ position: { x: 300, y: 600 } });
});

Then('the menu should close', async function() {
    await expect(this.page.locator('.mobile-menu')).toBeHidden();
    await expect(this.page.locator('.hamburger')).toHaveAttribute('aria-expanded', 'false');
});

// ============================================================================
// DROPDOWN MENUS
// ============================================================================

const dropdownFixture = (mode, items = ['Item 1', 'Item 2']) => `
    <nav id="main-nav" nx-nav="main">
        <div id="dropdown" nx-dropdown="${mode}">
            <button class="dropdown-trigger">Menu</button>
            <ul class="dropdown-menu">
                ${items.map((t, i) => `<li><a href="#item${i + 1}">${t}</a></li>`).join('')}
            </ul>
        </div>
    </nav>
    <p id="elsewhere" style="margin-top:300px">Elsewhere</p>`;

Given('a nav item with nx-dropdown={string}', async function(dropdownMode) {
    this.navx = { path: '/', clock: dropdownMode === 'hover', dropdownMode };
    await mountNav(this, dropdownFixture(dropdownMode));
    this.element = this.page.locator('#dropdown');
});

Given('submenu items defined', async function() {
    await remount(this, dropdownFixture(this.navx.dropdownMode, ['Item 1', 'Item 2', 'Item 3']));
    await expect(this.page.locator('.dropdown-menu [role="menuitem"]')).toHaveCount(3);
});

When('the user hovers over the item', async function() {
    await this.page.locator('.dropdown-trigger').hover();
});

Then('the dropdown should appear', async function() {
    await expect(this.page.locator('.dropdown-menu')).toBeVisible();
    await expect(this.page.locator('.dropdown-trigger')).toHaveAttribute('aria-expanded', 'true');
});

When('the user moves away', async function() {
    await this.page.locator('#elsewhere').hover();
});

Then('the dropdown should disappear after {int}ms', async function(ms) {
    // The fake clock makes the delay exact: open just before it, closed after
    const menu = this.page.locator('.dropdown-menu');
    await this.page.clock.runFor(ms - 1);
    await expect(menu).toBeVisible();
    await this.page.clock.runFor(2);
    await expect(menu).toBeHidden();
});

When('the item is clicked', async function() {
    await this.page.locator('.dropdown-trigger').click();
});

Then('the dropdown should toggle open\\/closed', async function() {
    const menu = this.page.locator('.dropdown-menu');
    const trigger = this.page.locator('.dropdown-trigger');
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.click();
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

Given('a nav with dropdown', async function() {
    this.navx = { path: '/' };
    await mountNav(this, dropdownFixture('click'));
});

When('the user tabs to the dropdown trigger', async function() {
    await this.page.keyboard.press('Tab');
    await expect(this.page.locator('.dropdown-trigger')).toBeFocused();
});

When('presses Enter or Space', async function() {
    await this.page.keyboard.press('Enter');
});

Then('the dropdown should open', async function() {
    await expect(this.page.locator('.dropdown-menu')).toBeVisible();
    await expect(this.page.locator('.dropdown-trigger')).toHaveAttribute('aria-expanded', 'true');
});

When('the user presses Arrow Down', async function() {
    await this.page.keyboard.press('ArrowDown');
});

Then('focus should move to first dropdown item', async function() {
    await expect(this.page.locator('.dropdown-menu a').first()).toBeFocused();
});

// ============================================================================
// TABS
// ============================================================================

const tabsFixture = (attrs, names, panels = true) => `
    <div id="tab-container" ${attrs}>
        <div class="tab-list" role="tablist">
            ${names.map(n => `<button class="tab" role="tab" data-tab="${n.toLowerCase()}">${n}</button>`).join('')}
        </div>
        ${panels ? names.map(n => `<div class="panel" role="tabpanel" id="${n.toLowerCase()}-panel">${n} panel</div>`).join('') : ''}
    </div>`;

Given('tabs with nx-tabs={string}', async function(enabled) {
    this.navx = { path: '/', tabsAttrs: `nx-tabs="${enabled}"` };
    await mountNav(this, tabsFixture(this.navx.tabsAttrs, ['Overview', 'Features', 'Pricing'], false));
    this.element = this.page.locator('#tab-container');
});

Given('tab panels defined', async function() {
    await remount(this, tabsFixture(this.navx.tabsAttrs, ['Overview', 'Features', 'Pricing']));
    await expect(this.page.locator('[role="tabpanel"]')).toHaveCount(3);
});

When('the {string} tab is clicked', async function(tabName) {
    await byText(this, '[role="tab"]', tabName).click();
});

Then(/^the (\w+) panel should display$/, async function(name) {
    const panel = this.page.locator(`#${name}-panel`);
    await expect(panel).toBeVisible();
    const tabId = await this.page.locator(`[data-tab="${name}"]`).getAttribute('id');
    await expect(panel).toHaveAttribute('aria-labelledby', tabId);
    await expect(this.page.locator(`[data-tab="${name}"]`)).toHaveAttribute('aria-selected', 'true');
});

Then('other panels should be hidden', async function() {
    const visible = await this.page.$$eval('[role="tabpanel"]', ps => ps.filter(p => !p.hidden).map(p => p.id));
    expect(visible).toHaveLength(1);
    await expect(this.page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
});

Given('focused tab navigation', async function() {
    this.navx = { path: '/' };
    await mountNav(this, tabsFixture('nx-tabs="true"', ['Tab 1', 'Tab 2', 'Tab 3']));
    await this.page.locator('[role="tab"]').first().focus();
});

When('the user presses Arrow Right', async function() {
    await this.page.keyboard.press('ArrowRight');
});

Then('focus should move to next tab', async function() {
    const second = this.page.locator('[role="tab"]').nth(1);
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute('aria-selected', 'true');
});

When('the user presses Home', async function() {
    await this.page.keyboard.press('Home');
});

Then('focus should move to first tab', async function() {
    await expect(this.page.locator('[role="tab"]').first()).toBeFocused();
});

Given('tabs with nx-orientation={string}', async function(orientation) {
    this.navx = { path: '/' };
    await mountNav(this, tabsFixture(`nx-tabs="true" nx-orientation="${orientation}"`, ['One', 'Two', 'Three']));
});

Then('tabs should be displayed vertically', async function() {
    await expect(this.page.locator('[role="tablist"]')).toHaveAttribute('aria-orientation', 'vertical');
    const boxes = await this.page.$$eval('[role="tab"]', tabs => tabs.map(t => {
        const r = t.getBoundingClientRect();
        return { x: r.left, y: r.top, h: r.height };
    }));
    for (let i = 1; i < boxes.length; i++) {
        expect(boxes[i].x).toBe(boxes[0].x);
        expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].h);
    }
});

Then('Arrow Up\\/Down should navigate', async function() {
    const tabs = this.page.locator('[role="tab"]');
    await tabs.first().focus();
    await this.page.keyboard.press('ArrowDown');
    await expect(tabs.nth(1)).toBeFocused();
    await this.page.keyboard.press('ArrowUp');
    await expect(tabs.first()).toBeFocused();
});

Given('tabs with nx-update-url={string}', async function(enabled) {
    this.navx = { path: '/' };
    await mountNav(this, tabsFixture(`nx-tabs="true" nx-update-url="${enabled}"`, ['Features', 'Pricing']));
    this.historyLength = await this.page.evaluate(() => window.history.length);
});

Then('the URL should update to {string}', async function(url) {
    await this.page.waitForURL(u => u.hash === url);
    expect(new URL(this.page.url()).hash).toBe(url);
});

Then('history should be updated', async function() {
    const historyLength = await this.page.evaluate(() => window.history.length);
    expect(historyLength).toBe(this.historyLength + 1);
});

Given('tabs with deep linking enabled', async function() {
    this.navx = { path: '/', tabsAttrs: 'nx-tabs="true" nx-update-url="true"' };
    this.navx.deepBody = tabsFixture(this.navx.tabsAttrs, ['Overview', 'Features', 'Pricing']);
});

Given('the URL is {string}', async function(url) {
    this.navx.path = '/' + url.replace(/^\//, '');
});

When('in navX, the page loads', async function() {
    await mountNav(this, this.navx.deepBody || this.navx.body);
});

Then('the {string} tab should be active', async function(tabName) {
    const tab = this.page.locator(`[role="tab"][data-tab="${tabName}"]`);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(tab).toHaveClass(/nx-active/);
    await expect(this.page.locator(`#${tabName}-panel`)).toBeVisible();
});

// ============================================================================
// NAVIGATION GUARDS AND LOADING STATES
// ============================================================================

const guardFixture = attrs => `
    <nav id="main-nav" nx-nav="main"><a id="guarded" href="/leave" ${attrs}>Leave</a></nav>`;

Given('a link with nx-confirm={string}', async function(message) {
    this.navx = { path: '/', expectDialog: true };
    this.confirmMessage = message;
    await mountNav(this, guardFixture(`nx-confirm="${message}"`));
    this.element = this.navx.link = this.page.locator('#guarded');
});

Then('a confirmation dialog should appear', async function() {
    expect(this.dialog.type()).toBe('confirm');
    expect(this.dialog.message()).toBe(this.confirmMessage);
});

When('the user confirms', async function() {
    await this.dialog.accept();
});

Then('navigation should proceed', async function() {
    await this.page.waitForURL(u => u.pathname === '/leave');
});

Given('a link with confirmation', async function() {
    this.navx = { path: '/', expectDialog: true };
    await mountNav(this, guardFixture('nx-confirm="Are you sure?"'));
    this.element = this.navx.link = this.page.locator('#guarded');
    await this.page.evaluate(() => {
        window._cancelled = false;
        document.addEventListener('nx:navigation-cancelled', () => {
            window._cancelled = true; 
        });
    });
});

When('the user cancels the dialog', async function() {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.element.evaluate(el => setTimeout(() => el.click(), 0));
    this.dialog = await dialogPromise;
    await this.dialog.dismiss();
});

Then('navigation should not occur', async function() {
    await this.page.waitForFunction(() => window._cancelled === true);
    // A navigation would have replaced this page and its flag
    await this.page.waitForTimeout(200);
    expect(currentPath(this)).toBe('/');
    expect(await this.page.evaluate(() => window._cancelled)).toBe(true);
});

Given('a link with nx-before-navigate={string}', async function(fnName) {
    this.navx = { path: '/' };
    this.guardName = fnName;
    await mountNav(this, guardFixture(`nx-before-navigate="${fnName}"`));
    this.element = this.navx.link = this.page.locator('#guarded');
});

Given(/^(\w+) returns false$/, async function(fnName) {
    await this.page.evaluate((name) => {
        window._guardCalls = [];
        window[name] = (href) => {
            window._guardCalls.push(href); return false; 
        };
    }, fnName);
});

Then('navigation should be prevented', async function() {
    await this.page.waitForFunction(() => window._guardCalls && window._guardCalls.length === 1);
    await this.page.waitForTimeout(200);
    expect(currentPath(this)).toBe('/');
    expect(await this.page.evaluate(() => window._guardCalls)).toEqual(['/leave']);
});

Given('a link with nx-loading={string}', async function(enabled) {
    this.navx = { path: '/' };
    await mountNav(this, guardFixture(`nx-loading="${enabled}"`));
    // The next page is slow, so the loading state stays visible
    await holdNavigation(this, '/leave');
    this.element = this.navx.link = this.page.locator('#guarded');
});

Then('a loading indicator should appear', async function() {
    await expect(this.element).toHaveClass(/(^|\s)nx-loading(\s|$)/);
});

Then('the link should be disabled', async function() {
    await expect(this.element).toHaveAttribute('aria-disabled', 'true');
    expect(await this.element.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
});

// ============================================================================
// ACCESSIBILITY
// ============================================================================

Then('it should have role={string}', async function(role) {
    await expect(this.element).toHaveAttribute('role', role);
});

Then('aria-label should be {string}', async function(label) {
    await expect(this.element).toHaveAttribute('aria-label', label);
});

Given('an active navigation link', async function() {
    this.navx = { path: '/current' };
    await mountNav(this, `
        <nav nx-nav="main">
            <a href="/">Home</a>
            <a id="active-link" href="/current">Current</a>
        </nav>`);
    this.element = this.page.locator('#active-link');
});

Then('it should have aria-current={string}', async function(value) {
    await expect(this.element).toHaveAttribute('aria-current', value);
    await expect(this.page.locator('[aria-current]')).toHaveCount(1);
});

Given('a dropdown menu', async function() {
    this.navx = { path: '/' };
    await mountNav(this, dropdownFixture('click'));
    this.element = this.page.locator('.dropdown-trigger');
});

Then('the trigger should have aria-haspopup={string}', async function(value) {
    await expect(this.page.locator('.dropdown-trigger')).toHaveAttribute('aria-haspopup', value);
});

Then('aria-expanded should reflect state', async function() {
    await expect(this.page.locator('.dropdown-menu')).toBeHidden();
    await expect(this.page.locator('.dropdown-trigger')).toHaveAttribute('aria-expanded', 'false');
});

When(/^(?:the )?dropdown opens$/, async function() {
    await this.page.locator('.dropdown-trigger').click();
    await expect(this.page.locator('.dropdown-menu')).toBeVisible();
});

Then('aria-expanded should be {string}', async function(value) {
    await expect(this.page.locator('.dropdown-trigger')).toHaveAttribute('aria-expanded', value);
});

// ============================================================================
// STICKY NAVIGATION
// ============================================================================

const stickyFixture = (attrs, above) => `
    ${above ? `<header style="height:${above}px">Header</header>` : ''}
    <nav id="sticky-nav" ${attrs} style="height:50px;background:#eee">Nav</nav>
    <main style="height:3000px">Content</main>`;

Given('a nav with nx-sticky={string}', async function(enabled) {
    this.navx = { path: '/' };
    await mountNav(this, stickyFixture(`nx-sticky="${enabled}"`, 200));
    this.element = this.page.locator('#sticky-nav');
    await expect(this.element).not.toHaveAttribute('data-stuck', 'true');
});

When('in navX, the user scrolls down', async function() {
    await this.page.mouse.move(200, 300);
    await this.page.mouse.wheel(0, 600);
    await this.page.waitForFunction(() => window.scrollY >= 600);
});

Then('the nav should stick to the top', async function() {
    await expect(this.element).toHaveAttribute('data-stuck', 'true');
    await expect(this.element).toHaveClass(/nx-stuck/);
    const top = await this.element.evaluate(el => el.getBoundingClientRect().top);
    expect(top).toBe(0);
});

Then('in navX, it should have class {string}', async function(className) {
    await expect(this.element).toHaveClass(new RegExp(`(^|\\s)${className}(\\s|$)`));
});

Given('a nav with nx-sticky={string} nx-sticky-offset={string}', async function(enabled, offset) {
    this.navx = { path: '/' };
    await mountNav(this, stickyFixture(`nx-sticky="${enabled}" nx-sticky-offset="${offset}"`, 0));
    this.element = this.page.locator('#sticky-nav');
});

Then('the nav should stick after scrolling {int}px', async function(px) {
    await this.page.evaluate(y => window.scrollTo(0, y), px - 20);
    // Give the observer a frame either way, then check it has not stuck yet
    await this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await expect(this.element).not.toHaveAttribute('data-stuck', 'true');
    await this.page.evaluate(y => window.scrollTo(0, y), px + 20);
    await expect(this.element).toHaveAttribute('data-stuck', 'true');
});

// ============================================================================
// PAGINATION
// ============================================================================

defineElement('an element with nx-pagination={string}', async function(enabled) {
    this.navx = { path: '/', pagerAttrs: `nx-pagination="${enabled}"` };
    await mountNav(this, `<div id="pagination" ${this.navx.pagerAttrs}></div>`);
    this.element = this.page.locator('#pagination');
});

async function mountPager(world, attrs) {
    world.navx = world.navx || { path: '/' };
    world.navx.path = '/';
    await mountNav(world, `<div id="pagination" nx-pagination="true" ${attrs}></div>`);
    world.element = world.page.locator('#pagination');
}

Given('{int} total items with {int} per page', async function(total, perPage) {
    await mountPager(this, `data-total-items="${total}" data-per-page="${perPage}"`);
});

Then('{int} page buttons should display', async function(count) {
    await expect(this.page.locator('#pagination .page-btn')).toHaveCount(count);
});

Then('{string} and {string} buttons should display', async function(btn1, btn2) {
    await expect(byText(this, '#pagination button', btn1)).toBeVisible();
    await expect(byText(this, '#pagination button', btn2)).toBeVisible();
});

Given('pagination controls', async function() {
    await mountPager(this, 'data-total-items="100" data-per-page="10"');
    await this.page.evaluate(() => {
        window.addEventListener('nx:page-change', (e) => {
            window._testEventFired = true;
            window._testEventDetail = { page: e.detail.page };
        });
    });
});

When('the user clicks page {string}', async function(pageNum) {
    await this.page.locator(`#pagination .page-btn[data-page="${pageNum}"]`).click();
});

Then('event.detail.page should be {int}', async function(pageNum) {
    expect(await this.page.evaluate(() => window._testEventDetail.page)).toBe(pageNum);
    await expect(this.element).toHaveAttribute('data-current-page', String(pageNum));
});

Given('pagination on page {int}', async function(pageNum) {
    await mountPager(this, `data-total-pages="10" data-current-page="${pageNum}"`);
});

Then('{string} button should be disabled', async function(buttonText) {
    await expect(byText(this, '#pagination button', buttonText)).toBeDisabled();
});

When('on last page', async function() {
    await this.page.locator('#pagination .page-btn').last().click();
    await expect(this.element).toHaveAttribute('data-current-page', '10');
});

Given('{int} pages', async function(totalPages) {
    await mountPager(this, `data-total-pages="${totalPages}"`);
});

Then('ellipsis should show: {string}', async function(expected) {
    const text = await this.page.$$eval('#pagination .page-btn, #pagination .page-ellipsis',
        els => els.map(e => e.textContent.trim()).join(' '));
    expect(text).toBe(expected);
});

// ============================================================================
// EVENTS
// ============================================================================

Given('a nav link', async function() {
    this.navx = { path: '/' };
    await mountNav(this, '<nav nx-nav="main"><a id="nav-link" href="/target">Target</a></nav>');
    await holdNavigation(this, '/target');
    this.element = this.navx.link = this.page.locator('#nav-link');
});

Given('a dropdown', async function() {
    this.navx = { path: '/' };
    await mountNav(this, dropdownFixture('click'));
});

Given('tabs', async function() {
    this.navx = { path: '/' };
    await mountNav(this, tabsFixture('nx-tabs="true"', ['One', 'Two', 'Three']));
});

When('a tab is clicked', async function() {
    await this.page.locator('[role="tab"]').nth(1).click();
});

Then('event.detail should contain tab index', async function() {
    const detail = await this.page.evaluate(() => ({ index: window._testEventDetail.index }));
    expect(detail.index).toBe(1);
});

// ============================================================================
// PERFORMANCE
// ============================================================================

Given('{int} sections with scroll spy', async function(count) {
    this.navx = { path: '/' };
    const ids = Array.from({ length: count }, (v, i) => `s${i + 1}`);
    // Count observers and scroll listeners before navX runs
    const initScript = () => {
        window._io = { created: 0, observed: 0 };
        window._scrollListeners = 0;
        const IO = window.IntersectionObserver;
        window.IntersectionObserver = function(cb, opts) {
            window._io.created++;
            const io = new IO(cb, opts);
            const observe = io.observe.bind(io);
            io.observe = (el) => {
                window._io.observed++; observe(el); 
            };
            return io;
        };
        const add = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, ...rest) {
            if (type === 'scroll' || type === 'wheel') {
                window._scrollListeners++;
            }
            return add.call(this, type, ...rest);
        };
    };
    await mountNav(this, `
        <nav id="spy" nx-scroll-spy="true" style="position:fixed;top:0;right:0">${spyLinks(ids)}</nav>
        ${spySections(ids, 300)}
        <div style="height:1000px"></div>`, { initScript });
    this.sectionCount = count;
});

When('scrolling', async function() {
    // Record which frame each highlight change lands in
    await this.page.evaluate(() => {
        window._frame = 0;
        const count = () => {
            window._frame++; requestAnimationFrame(count); 
        };
        requestAnimationFrame(count);
        window._changes = [];
        new MutationObserver(() => window._changes.push(window._frame))
            .observe(document.getElementById('spy'), { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await this.page.mouse.move(200, 200);
    for (let i = 0; i < 20; i++) {
        await this.page.mouse.wheel(0, 300);
    }
    await this.page.waitForFunction(() => window.scrollY > 5000);
    await expect(this.page.locator('#spy a.nx-active')).toHaveCount(1);
});

Then('active section detection should use IntersectionObserver', async function() {
    const io = await this.page.evaluate(() => window._io);
    expect(io.created).toBeGreaterThanOrEqual(1);
    expect(io.observed).toBeGreaterThanOrEqual(this.sectionCount);
    const first = await this.page.locator('#spy a.nx-active').getAttribute('href');
    expect(first).not.toBe('#s1');
});

Then('updates should be throttled to {int} FPS', async function(fps) {
    // No per-scroll-event work: navX adds no scroll or wheel listeners, and the
    // highlight changes at most once per animation frame
    expect(fps).toBe(60);
    expect(await this.page.evaluate(() => window._scrollListeners)).toBe(0);
    const frames = await this.page.evaluate(() => window._changes);
    expect(frames.length).toBeGreaterThan(0);
    const perFrame = {};
    frames.forEach(f => {
        perFrame[f] = (perFrame[f] || 0) + 1; 
    });
    // One change record per frame (a single batch removes the old class and adds the new)
    const busiest = Math.max(...Object.values(perFrame));
    expect(busiest).toBeLessThanOrEqual(1);
});

// ============================================================================
// MUTATION OBSERVER
// ============================================================================

Given(/^the navX module is initialized with observe=(?:"(\w+)"|(\w+))$/, async function(quoted, bare) {
    const observe = (quoted || bare) === 'true';
    this.navx = { path: '/docs' };
    await mountNav(this, '<nav id="main-nav" nx-nav="main"><a href="/">Home</a></nav>');
    if (!observe) {
        await this.page.evaluate(() => {
            window.navX.destroy(); window.navX.init({ observe: false }); 
        });
    }
    expect(await this.page.evaluate(() => window.navX.isInitialized())).toBe(true);
});

When('a new link is added to the nav', async function() {
    await this.page.evaluate(() => {
        const link = document.createElement('a');
        link.id = 'new-link';
        link.href = '/docs';
        link.textContent = 'Docs';
        document.getElementById('main-nav').appendChild(link);
    });
});

Then('the link should be automatically enhanced', async function() {
    const link = this.page.locator('#new-link');
    await expect(link).toHaveAttribute('nx-link-enhanced', 'true');
    // It is the current page, so it is marked active like the original links
    await expect(link).toHaveClass(/nx-active/);
    await expect(link).toHaveAttribute('aria-current', 'page');
});

// ============================================================================
// URL PATTERNS
// ============================================================================

Given('a link with nx-pattern={string}', async function(pattern) {
    // The href alone would not match /products/..., so only the pattern can
    this.navx = { path: '/' };
    this.testUrl = '/shop';
    await mountNav(this, `<nav nx-nav="main"><a href="/shop" nx-pattern="${pattern}">Shop</a></nav>`);
});

Given('a link with nx-exclude={string}', async function(exclude) {
    // The href alone would match /products/archive by prefix; the exclusion must win
    this.navx = { path: '/' };
    this.testUrl = '/products';
    await mountNav(this, `<nav nx-nav="main"><a href="/products" nx-exclude="${exclude}">Products</a></nav>`);
});

// ============================================================================
// NAVIGATION SHORTCUTS
// ============================================================================

Given('a link with nx-shortcut={string}', async function(shortcut) {
    this.navx = { path: '/' };
    await mountNav(this, `<a id="shortcut-link" href="/home-page" nx-shortcut="${shortcut}">Home</a>`);
});

When('the user presses Ctrl+H', async function() {
    await this.page.keyboard.press('Control+h');
});

Then('navigation to that link should occur', async function() {
    await this.page.waitForURL(u => u.pathname === '/home-page');
});
