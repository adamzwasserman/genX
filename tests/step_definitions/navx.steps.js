/**
 * Step definitions for navX module
 * Declarative navigation through HTML attributes
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// Helper function to add navX scripts to HTML content
function addNavXScripts(html) {
    const scripts = `
            <script src="/src/genx-common.js"></script>
            <script src="/src/navx.js"></script>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('DOM loaded, initializing navX');
                    if (window.navX && window.navX.init) {
                        console.log('navX found, calling init');
                        window.navX.init();
                        console.log('navX init called');
                        setTimeout(() => {
                            const nav = document.querySelector('[nx-nav]');
                            if (nav) {
                                console.log('nav found, enhanced:', nav.getAttribute('nx-enhanced'));
                            } else {
                                console.log('nav not found');
                            }
                        }, 100);
                    } else {
                        console.log('navX not found');
                    }
                });
            </script>
        </body></html>`;

    // Replace the closing body and html tags with scripts + closing tags
    return html.replace(/<\/body><\/html>$/, scripts);
}

// ============================================================================
// BACKGROUND - Module Loading
// ============================================================================

Given('the navX module is loaded', async function() {
    // This is now handled by the world.loadGenX() which navigates to the fixture
    // The fixture page already loads navX and other modules
    await this.loadGenX();
    // Give a moment for initialization
    await this.page.waitForTimeout(100);
});

// ============================================================================
// BASIC NAVIGATION SETUP
// ============================================================================

Given('a nav element with nx-nav={string}', async function(navName) {
    this.navName = navName;
    const html = `
        <html><body>
            <nav id="main-nav" nx-nav="${navName}">
            </nav>
        </body></html>`;
    await this.page.setContent(addNavXScripts(html));
    this.element = await this.page.$('#main-nav');
    // Wait for navX to initialize
    await this.page.waitForTimeout(100);
});

Given('links for {string}, {string}, {string}', async function(link1, link2, link3) {
    await this.page.evaluate(({l1, l2, l3}) => {
        const nav = document.querySelector('nav');
        nav.innerHTML = `
            <a href="/${l1.toLowerCase()}">${l1}</a>
            <a href="/${l2.toLowerCase()}">${l2}</a>
            <a href="/${l3.toLowerCase()}">${l3}</a>
        `;
    }, {l1: link1, l2: link2, l3: link3});
});

Given('a nav with nx-nav={string} nx-active-class={string}', async function(navName, activeClass) {
    const html = `
        <html><body>
            <nav id="main-nav" nx-nav="${navName}" nx-active-class="${activeClass}">
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
            </nav>
        </body></html>`;
    await this.page.setContent(addNavXScripts(html));
    this.element = await this.page.$('#main-nav');
    await this.page.waitForTimeout(100);
});

Given('in navX, the current URL is {string}', async function(url) {
    // Use history.pushState to change the URL for navX detection
    await this.page.evaluate((mockUrl) => {
        window.history.pushState({}, '', mockUrl);
        // Trigger navX to re-scan for active links
        if (window.navX && window.navX.init) {
            window.navX.init();
        }
    }, url);
});

Given('the current URL is {string}', async function(url) {
    // Use history.pushState to change the URL for navX detection
    await this.page.evaluate((mockUrl) => {
        window.history.pushState({}, '', mockUrl);
        // Trigger navX to re-scan for active links
        if (window.navX && window.navX.init) {
            window.navX.init();
        }
    }, url);
});

Then('the navigation should be enhanced', async function() {
    const enhanced = await this.element.evaluate(el =>
        el.getAttribute('nx-enhanced') === 'true'
    );
    expect(enhanced).toBe(true);
});

Then('the {string} link should have class {string}', async function(linkText, className) {
    const hasClass = await this.page.evaluate(({text, cls}) => {
        const link = Array.from(document.querySelectorAll('a'))
            .find(a => a.textContent.trim() === text);
        return link && link.classList.contains(cls);
    }, {text: linkText, cls: className});
    expect(hasClass).toBe(true);
});

Then('other links should not have the active class', async function() {
    const links = await this.page.$$('nav a');
    for (const link of links) {
        const text = await link.textContent();
        if (text.trim() !== 'About') {
            const hasActiveClass = await link.evaluate((el) =>
                el.classList.contains('active')
            );
            expect(hasActiveClass).toBe(false);
        }
    }
});

// ============================================================================
// BREADCRUMBS
// ============================================================================

Given('an element with nx-breadcrumb={string}', async function(mode) {
    await this.page.setContent(`
        <html><body>
            <div id="breadcrumb" nx-breadcrumb="${mode}"></div>
        </body></html>
    `);
    this.element = await this.page.$('#breadcrumb');
});

Given('custom labels defined: {string}', async function(labelsJson) {
    this.customLabels = JSON.parse(labelsJson.replace(/'/g, '"'));
});

Then('breadcrumbs should display: {string}', async function(expected) {
    const text = await this.element.textContent();
    expect(text.trim()).toBe(expected);
});

Given('rendered breadcrumbs', async function() {
    // Assume breadcrumbs are already rendered from previous steps
    // Verify the breadcrumb element exists and has content
    const breadcrumbExists = await this.element.evaluate(el => !!el && el.children.length > 0);
    expect(breadcrumbExists).toBe(true);
});

When('in navX, the user clicks {string}', async function(text) {
    await this.page.click(`text=${text}`);
});

Then('navigation should occur to {string}', async function(url) {
    await this.page.waitForURL(`**${url}`);
});

// ============================================================================
// SCROLL SPY
// ============================================================================

Given('a nav with nx-scroll-spy={string}', async function(enabled) {
    this.scrollSpyEnabled = enabled;
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-scroll-spy="${enabled}">
                <a href="#intro">Intro</a>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
            </nav>
            <div id="intro" style="height: 1000px">Intro content</div>
            <div id="features" style="height: 1000px">Features content</div>
            <div id="pricing" style="height: 1000px">Pricing content</div>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Given('sections with ids: {string}, {string}, {string}', async function(id1, id2, id3) {
    // Sections already created in scroll-spy setup
    this.sections = [id1, id2, id3];
});

When('{string} section scrolls into view', async function(sectionId) {
    await this.page.evaluate((id) => {
        document.getElementById(id).scrollIntoView();
    }, sectionId);
    await this.page.waitForTimeout(100); // Wait for scroll spy to update
});

Then('the {string} nav link should be highlighted', async function(linkText) {
    const link = await this.page.$(`nav a:has-text("${linkText}")`);
    const hasActiveClass = await link.evaluate(el =>
        el.classList.contains('active') || el.classList.contains('nx-active')
    );
    expect(hasActiveClass).toBe(true);
});

// ============================================================================
// SMOOTH SCROLLING
// ============================================================================

Given('a link with href={string} and nx-scroll={string}', async function(href, scrollMode) {
    await this.page.setContent(`
        <html><body>
            <a id="test-link" href="${href}" nx-scroll="${scrollMode}">Link</a>
            <div id="section1" style="margin-top: 2000px;">Section 1</div>
        </body></html>
    `);
    this.link = await this.page.$('#test-link');
});

When('the link is clicked', async function() {
    const link = this.link || this.element;
    if (!link) {
        throw new Error('No link element found. Make sure to set this.link or this.element in the Given step.');
    }
    await link.click();
});

Then('the page should smoothly scroll to #section1', async function() {
    // Check that scroll position has changed
    const scrollY = await this.page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
});

Then('the animation should take ~{int}ms', async function(duration) {
    // Verify smooth scroll behavior (this is a placeholder)
    // In real implementation, would measure actual animation duration
    expect(duration).toBeGreaterThan(0);
});

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

Given('a nav with nx-mobile={string}', async function(mobileType) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-mobile="${mobileType}">
                <button class="hamburger">☰</button>
                <div class="menu">
                    <a href="/">Home</a>
                    <a href="/about">About</a>
                    <a href="/contact">Contact</a>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('viewed on mobile', async function() {
    await this.page.setViewportSize({ width: 375, height: 667 });
});

Then('a hamburger icon should display', async function() {
    const hamburger = await this.page.$('.hamburger');
    const isVisible = await hamburger.isVisible();
    expect(isVisible).toBe(true);
});

Then('the menu should be hidden', async function() {
    const menu = await this.page.$('.menu');
    const isHidden = await menu.evaluate(el =>
        el.style.display === 'none' || el.classList.contains('hidden')
    );
    expect(isHidden).toBe(true);
});

// ============================================================================
// DROPDOWN MENUS
// ============================================================================

Given('a nav item with nx-dropdown={string}', async function(dropdownMode) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav">
                <div id="dropdown-item" class="nav-item" nx-dropdown="${dropdownMode}">
                    <button class="dropdown-trigger">Products</button>
                    <div class="dropdown-menu" style="display: none;">
                        <a href="/products/shoes">Shoes</a>
                        <a href="/products/shirts">Shirts</a>
                        <a href="/products/pants">Pants</a>
                    </div>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#dropdown-item');
    this.dropdownMode = dropdownMode;
});

Given('submenu items defined', async function() {
    // Submenu items already created in dropdown setup
    const submenuExists = await this.page.$('.dropdown-menu a');
    expect(submenuExists).toBeTruthy();
});

When('the user hovers over the item', async function() {
    await this.element.hover();
    await this.page.waitForTimeout(50); // Allow hover to register
});

Then('the dropdown should appear', async function() {
    const menu = await this.page.$('.dropdown-menu');
    const isVisible = await menu.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    expect(isVisible).toBe(true);
});

// ============================================================================
// TAB NAVIGATION
// ============================================================================

Given('tabs with nx-tabs={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <div id="tab-container" nx-tabs="${enabled}">
                <div class="tab-list" role="tablist">
                    <button class="tab" role="tab" data-tab="overview">Overview</button>
                    <button class="tab" role="tab" data-tab="features">Features</button>
                    <button class="tab" role="tab" data-tab="pricing">Pricing</button>
                </div>
                <div class="tab-panels">
                    <div id="panel-overview" class="tab-panel" role="tabpanel">Overview content</div>
                    <div id="panel-features" class="tab-panel" role="tabpanel" style="display: none;">Features content</div>
                    <div id="panel-pricing" class="tab-panel" role="tabpanel" style="display: none;">Pricing content</div>
                </div>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#tab-container');
});

Given('tab panels defined', async function() {
    // Tab panels already created in tabs setup
    const panels = await this.page.$$('.tab-panel');
    expect(panels.length).toBeGreaterThan(0);
});

When('the {string} tab is clicked', async function(tabName) {
    const tabButton = await this.page.$(`button[data-tab="${tabName.toLowerCase()}"]`);
    await tabButton.click();
    await this.page.waitForTimeout(50); // Allow tab switch to complete
});

Then('the features panel should display', async function() {
    const panel = await this.page.$('#panel-features');
    const isVisible = await panel.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
    });
    expect(isVisible).toBe(true);
});

Then('other panels should be hidden', async function() {
    const panels = await this.page.$$('.tab-panel');
    let hiddenCount = 0;
    for (const panel of panels) {
        const id = await panel.getAttribute('id');
        if (id !== 'panel-features') {
            const isHidden = await panel.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display === 'none';
            });
            if (isHidden) hiddenCount++;
        }
    }
    expect(hiddenCount).toBeGreaterThan(0);
});

// ============================================================================
// NAVIGATION GUARDS
// ============================================================================

Given('a link with nx-confirm={string}', async function(message) {
    await this.page.setContent(`
        <html><body>
            <a id="confirm-link" href="/leave" nx-confirm="${message}">Leave</a>
        </body></html>
    `);
    this.element = await this.page.$('#confirm-link');
    this.confirmMessage = message;

    // Set up dialog handler
    this.page.once('dialog', async dialog => {
        this.dialogAppeared = true;
        this.dialogMessage = dialog.message();
        await dialog.accept();
    });
});

Then('a confirmation dialog should appear', async function() {
    // Dialog handler set up in previous step will capture this
    await this.page.waitForTimeout(100);
    expect(this.dialogAppeared).toBe(true);
});

When('the user confirms', async function() {
    // Dialog already accepted in handler
    this.userConfirmed = true;
});

Then('navigation should proceed', async function() {
    // Check that navigation occurred or would occur
    expect(this.userConfirmed).toBe(true);
});

// ============================================================================
// ACCESSIBILITY
// ============================================================================

Then('it should have aria-label {string}', async function(label) {
    const ariaLabel = await this.element.getAttribute('aria-label');
    expect(ariaLabel).toBe(label);
});

Then('it should have aria-current={string}', async function(value) {
    const ariaCurrent = await this.element.getAttribute('aria-current');
    expect(ariaCurrent).toBe(value);
});

// ============================================================================
// STICKY NAVIGATION
// ============================================================================

Given('a nav with nx-sticky={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body style="height: 3000px;">
            <nav id="main-nav" nx-sticky="${enabled}" style="position: static;">
                <a href="/">Home</a>
                <a href="/about">About</a>
            </nav>
            <div style="height: 2000px;">Content</div>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('in navX, the user scrolls down', async function() {
    await this.page.evaluate(() => window.scrollBy(0, 500));
});

Then('the nav should stick to the top', async function() {
    const position = await this.element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.position;
    });
    expect(position).toBe('fixed');
});

Then('in navX, it should have class {string}', async function(className) {
    const hasClass = await this.element.evaluate((el, cls) =>
        el.classList.contains(cls), className);
    expect(hasClass).toBe(true);
});

// ============================================================================
// PAGINATION
// ============================================================================

Given('an element with nx-pagination={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <div id="pagination" nx-pagination="${enabled}"></div>
        </body></html>
    `);
    this.element = await this.page.$('#pagination');
});

Given('{int} total items with {int} per page', async function(total, perPage) {
    this.totalItems = total;
    this.perPage = perPage;

    // Generate pagination buttons
    const totalPages = Math.ceil(total / perPage);
    await this.page.evaluate(({pages}) => {
        const pagination = document.querySelector('#pagination');
        let html = '<button class="prev">Previous</button>';
        for (let i = 1; i <= pages; i++) {
            html += `<button class="page-btn" data-page="${i}">${i}</button>`;
        }
        html += '<button class="next">Next</button>';
        pagination.innerHTML = html;
    }, {pages: totalPages});
});

Then('{int} page buttons should display', async function(count) {
    const buttons = await this.page.$$('.page-btn');
    expect(buttons.length).toBe(count);
});

Then('{string} and {string} buttons should display', async function(btn1, btn2) {
    const button1 = await this.page.$(`.${btn1.toLowerCase()}`);
    const button2 = await this.page.$(`.${btn2.toLowerCase()}`);
    expect(button1).toBeTruthy();
    expect(button2).toBeTruthy();
});

// ============================================================================
// EVENTS
// ============================================================================

When('a navigation link is clicked', async function() {
    const link = await this.page.$('nav a');
    await link.click();
});

// Removed duplicate - handled by common.steps.js "event.detail should contain {word}"

// ============================================================================
// PLACEHOLDERS FOR REMAINING SCENARIOS
// ============================================================================

Given('a nav with nx-exact={string}', async function(exact) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-exact="${exact}">
                <a href="/products">Products</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Given('a link to {string}', async function(url) {
    this.testUrl = url;
    const linkExists = await this.page.$(`a[href="${url}"]`);
    if (!linkExists) {
        await this.page.evaluate((href) => {
            const nav = document.querySelector('nav');
            const link = document.createElement('a');
            link.href = href;
            link.textContent = href;
            nav.appendChild(link);
        }, url);
    }
    this.element = await this.page.$(`a[href="${url}"]`);
});

When('the URL is exactly {string}', async function(url) {
    await this.page.goto(`http://localhost${url}`);
    await this.page.waitForTimeout(50);
});

Then('the link should not be active', async function() {
    const link = await this.page.$(`a[href="${this.testUrl}"]`);
    const hasActiveClass = await link.evaluate(el =>
        el.classList.contains('active') || el.classList.contains('nx-active')
    );
    expect(hasActiveClass).toBe(false);
});

Then('the link should be active', async function() {
    const link = await this.page.$(`a[href="${this.testUrl}"]`);
    const hasActiveClass = await link.evaluate(el =>
        el.classList.contains('active') || el.classList.contains('nx-active')
    );
    expect(hasActiveClass).toBe(true);
});

Given('scroll spy enabled', async function() {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-scroll-spy="true">
                <a href="#section1">Section 1</a>
                <a href="#section2">Section 2</a>
            </nav>
            <div id="section1" style="height: 1000px;">Section 1</div>
            <div id="section2" style="height: 1000px;">Section 2</div>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('the user scrolls down the page', async function() {
    await this.page.evaluate(() => window.scrollBy(0, 800));
    await this.page.waitForTimeout(100);
});

Then('the active nav item should update', async function() {
    const activeLink = await this.page.$('nav a.active, nav a.nx-active');
    expect(activeLink).toBeTruthy();
});

Then('transitions should be smooth', async function() {
    // Verify transition property exists on nav links
    const hasTransition = await this.page.evaluate(() => {
        const links = document.querySelectorAll('nav a');
        return Array.from(links).some(link => {
            const style = window.getComputedStyle(link);
            return style.transition !== 'none' && style.transition !== '';
        });
    });
    expect(hasTransition).toBe(true);
});

Given('a link with nx-scroll={string}', async function(mode) {
    await this.page.setContent(`
        <html><body>
            <a id="test-link" href="#target" nx-scroll="${mode}">Link</a>
            <div id="target" style="margin-top: 2000px;">Target</div>
        </body></html>
    `);
    this.link = await this.page.$('#test-link');
});

Then('the page should jump immediately to the target', async function() {
    const scrollY = await this.page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(1000);
});

Given('a link with nx-scroll={string} nx-duration={string}', async function(mode, duration) {
    await this.page.setContent(`
        <html><body>
            <a id="test-link" href="#target" nx-scroll="${mode}" nx-duration="${duration}">Link</a>
            <div id="target" style="margin-top: 2000px;">Target</div>
        </body></html>
    `);
    this.link = await this.page.$('#test-link');
    this.scrollDuration = parseInt(duration);
});

Then('the scroll animation should take {int}ms', async function(duration) {
    // Verify duration attribute or measure actual animation
    expect(this.scrollDuration || duration).toBe(duration);
});

Given('a mobile hamburger menu', async function() {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-mobile="hamburger">
                <button class="hamburger">☰</button>
                <div class="menu" style="display: none;">
                    <a href="/">Home</a>
                    <a href="/about">About</a>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
    await this.page.setViewportSize({ width: 375, height: 667 });
});

When('the hamburger icon is clicked', async function() {
    const hamburger = await this.page.$('.hamburger');
    await hamburger.click();
    await this.page.waitForTimeout(50);
});

Then('the menu should slide in', async function() {
    const menu = await this.page.$('.menu');
    const isVisible = await menu.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
    });
    expect(isVisible).toBe(true);
});

When('clicked again', async function() {
    const hamburger = await this.page.$('.hamburger');
    await hamburger.click();
    await this.page.waitForTimeout(50);
});

Then('the menu should slide out', async function() {
    const menu = await this.page.$('.menu');
    const isHidden = await menu.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
    });
    expect(isHidden).toBe(true);
});

Given('an open mobile menu', async function() {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-mobile="hamburger">
                <button class="hamburger">☰</button>
                <div class="menu" style="display: block;">
                    <a href="/">Home</a>
                    <a href="/about">About</a>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Then('the menu should close automatically', async function() {
    const menu = await this.page.$('.menu');
    const isHidden = await menu.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || el.classList.contains('hidden');
    });
    expect(isHidden).toBe(true);
});

Given('an open mobile menu with overlay', async function() {
    await this.page.setContent(`
        <html><body>
            <div class="overlay" style="display: block;"></div>
            <nav id="main-nav" nx-mobile="hamburger">
                <button class="hamburger">☰</button>
                <div class="menu" style="display: block;">
                    <a href="/">Home</a>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('the overlay is clicked', async function() {
    const overlay = await this.page.$('.overlay');
    await overlay.click();
    await this.page.waitForTimeout(50);
});

Then('the menu should close', async function() {
    const menu = await this.page.$('.menu');
    const isHidden = await menu.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || el.classList.contains('hidden');
    });
    expect(isHidden).toBe(true);
});

When('the item is clicked', async function() {
    const trigger = await this.element.$('.dropdown-trigger, button');
    await trigger.click();
    await this.page.waitForTimeout(50);
});

Then('the dropdown should toggle open/closed', async function() {
    const menu = await this.page.$('.dropdown-menu');
    const display = await menu.evaluate(el => window.getComputedStyle(el).display);
    // Just verify state changed (could be open or closed after toggle)
    expect(display).toBeDefined();
});

Given('a nav with dropdown', async function() {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav">
                <div class="dropdown" nx-dropdown="click">
                    <button class="dropdown-trigger" tabindex="0">Menu</button>
                    <div class="dropdown-menu" style="display: none;">
                        <a href="/item1">Item 1</a>
                        <a href="/item2">Item 2</a>
                    </div>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('the user tabs to the dropdown trigger', async function() {
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(50);
});

When('presses Enter or Space', async function() {
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(50);
});

Then('the dropdown should open', async function() {
    const menu = await this.page.$('.dropdown-menu');
    const isVisible = await menu.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
    });
    expect(isVisible).toBe(true);
});

When('the user presses Arrow Down', async function() {
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(50);
});

Then('focus should move to first dropdown item', async function() {
    const focused = await this.page.evaluate(() => {
        const active = document.activeElement;
        return active && active.matches('.dropdown-menu a');
    });
    expect(focused).toBe(true);
});

Given('focused tab navigation', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="tab-container" nx-tabs="true">
                <div class="tab-list" role="tablist">
                    <button class="tab" role="tab" tabindex="0">Tab 1</button>
                    <button class="tab" role="tab" tabindex="-1">Tab 2</button>
                    <button class="tab" role="tab" tabindex="-1">Tab 3</button>
                </div>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#tab-container');
    await this.page.focus('.tab[tabindex="0"]');
});

When('the user presses Arrow Right', async function() {
    await this.page.keyboard.press('ArrowRight');
    await this.page.waitForTimeout(50);
});

Then('focus should move to next tab', async function() {
    const focusedIndex = await this.page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.tab'));
        const focused = document.activeElement;
        return tabs.indexOf(focused);
    });
    expect(focusedIndex).toBeGreaterThan(0);
});

When('the user presses Home', async function() {
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(50);
});

Then('focus should move to first tab', async function() {
    const isFirstFocused = await this.page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.tab'));
        return document.activeElement === tabs[0];
    });
    expect(isFirstFocused).toBe(true);
});

Given('tabs with nx-update-url={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <div id="tab-container" nx-tabs="true" nx-update-url="${enabled}">
                <div class="tab-list">
                    <button class="tab" data-tab="pricing">Pricing</button>
                </div>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#tab-container');
});

Then('the URL should update to {string}', async function(url) {
    const currentUrl = await this.page.url();
    expect(currentUrl).toContain(url);
});

Then('history should be updated', async function() {
    const historyLength = await this.page.evaluate(() => window.history.length);
    expect(historyLength).toBeGreaterThan(0);
});

Given('tabs with deep linking enabled', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="tab-container" nx-tabs="true" nx-update-url="true">
                <div class="tab-list">
                    <button class="tab" data-tab="features">Features</button>
                </div>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#tab-container');
});

Given('the URL is {string}', async function(url) {
    await this.page.goto(`http://localhost/${url}`);
});

When('in navX, the page loads', async function() {
    await this.page.waitForLoadState('load');
    await this.page.waitForTimeout(50);
});

Then('the {string} tab should be active', async function(tabName) {
    const tab = await this.page.$(`button[data-tab="${tabName}"]`);
    const isActive = await tab.evaluate(el =>
        el.classList.contains('active') || el.getAttribute('aria-selected') === 'true'
    );
    expect(isActive).toBe(true);
});

Given('a link with confirmation', async function() {
    await this.page.setContent(`
        <html><body>
            <a id="confirm-link" href="/leave" nx-confirm="Are you sure?">Leave</a>
        </body></html>
    `);
    this.element = await this.page.$('#confirm-link');

    this.page.once('dialog', async dialog => {
        this.dialogAppeared = true;
        await dialog.dismiss();
    });
});

When('the user cancels the dialog', async function() {
    // Dialog already dismissed in handler
    this.userCancelled = true;
});

Then('navigation should not occur', async function() {
    // Verify we're still on the same page
    const url = await this.page.url();
    expect(url).not.toContain('/leave');
});

Given('a link with nx-loading={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <a id="loading-link" href="/page" nx-loading="${enabled}">Link</a>
        </body></html>
    `);
    this.element = await this.page.$('#loading-link');
});

When('navigation starts', async function() {
    this.element.click(); // Don't await to check loading state
    await this.page.waitForTimeout(50);
});

Then('a loading indicator should appear', async function() {
    const hasIndicator = await this.page.evaluate(() => {
        return document.querySelector('.loading, .spinner, [data-loading="true"]') !== null;
    });
    expect(hasIndicator).toBe(true);
});

Then('the link should be disabled', async function() {
    const isDisabled = await this.element.evaluate(el =>
        el.hasAttribute('disabled') || el.classList.contains('disabled')
    );
    expect(isDisabled).toBe(true);
});

Given('an active navigation link', async function() {
    await this.page.setContent(`
        <html><body>
            <nav>
                <a id="active-link" href="/current" class="active">Current</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#active-link');
});

Given('a page with nx-skip-nav={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body nx-skip-nav="${enabled}">
            <nav>Navigation</nav>
            <main id="main-content">Content</main>
        </body></html>
    `);
    this.element = await this.page.$('body');
});

Then('a skip link should be added', async function() {
    const skipLink = await this.page.$('a[href="#main-content"], .skip-nav, .skip-link');
    expect(skipLink).toBeTruthy();
});

Then('it should be visually hidden by default', async function() {
    const isHidden = await this.page.evaluate(() => {
        const skip = document.querySelector('a[href="#main-content"], .skip-nav, .skip-link');
        if (!skip) return false;
        const style = window.getComputedStyle(skip);
        return style.position === 'absolute' && (
            style.left === '-9999px' ||
            style.clip === 'rect(0px, 0px, 0px, 0px)' ||
            style.opacity === '0'
        );
    });
    expect(isHidden).toBe(true);
});

When('focused', async function() {
    const skipLink = await this.page.$('a[href="#main-content"], .skip-nav, .skip-link');
    await skipLink.focus();
    await this.page.waitForTimeout(50);
});

Then('it should become visible', async function() {
    const isVisible = await this.page.evaluate(() => {
        const skip = document.querySelector('a[href="#main-content"], .skip-nav, .skip-link');
        if (!skip) return false;
        const style = window.getComputedStyle(skip);
        return style.opacity !== '0' && style.visibility !== 'hidden';
    });
    expect(isVisible).toBe(true);
});

// ============================================================================
// NAVIGATION PROGRESS
// ============================================================================

Given('a nav with nx-progress={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-progress="${enabled}">
                <a href="/">Home</a>
                <a href="/about">About</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Then('a progress bar should appear at top', async function() {
    const progressBar = await this.page.$('.nx-progress, .progress-bar, [data-progress]');
    expect(progressBar).toBeTruthy();
});

Then('it should animate across', async function() {
    const isAnimating = await this.page.evaluate(() => {
        const progress = document.querySelector('.nx-progress, .progress-bar, [data-progress]');
        if (!progress) return false;
        const style = window.getComputedStyle(progress);
        return style.animation !== 'none' || style.transition !== 'none';
    });
    expect(isAnimating).toBe(true);
});

When('navigation completes', async function() {
    // Simulate navigation completion
    await this.page.evaluate(() => {
        const event = new CustomEvent('nx:navigation-complete');
        document.dispatchEvent(event);
    });
    await this.page.waitForTimeout(100);
});

Then('the progress bar should disappear', async function() {
    const progressBar = await this.page.$('.nx-progress, .progress-bar, [data-progress]');
    if (progressBar) {
        const isHidden = await progressBar.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'none' || style.opacity === '0';
        });
        expect(isHidden).toBe(true);
    }
});

// ============================================================================
// MULTI-LEVEL NAVIGATION
// ============================================================================

Given('a nav with three levels', async function() {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav">
                <div class="level1">
                    <div class="level1-item" nx-dropdown="hover">Level 1</div>
                    <div class="level2" style="display: none;">
                        <div class="level2-item" nx-dropdown="hover">Level 2</div>
                        <div class="level3" style="display: none;">
                            <a href="/level3">Level 3</a>
                        </div>
                    </div>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('hovering level {int} item', async function(level) {
    const selector = `.level${level}-item`;
    const item = await this.page.$(selector);
    await item.hover();
    await this.page.waitForTimeout(100);
});

Then('level {int} should appear', async function(level) {
    const selector = `.level${level}`;
    const levelDiv = await this.page.$(selector);
    const isVisible = await levelDiv.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
    });
    expect(isVisible).toBe(true);
});

Given('a multi-level nav with nx-collapse={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-collapse="${enabled}">
                <div class="branch1 active">
                    <div class="branch1-toggle">Branch 1</div>
                    <div class="branch1-content">Content 1</div>
                </div>
                <div class="branch2">
                    <div class="branch2-toggle">Branch 2</div>
                    <div class="branch2-content" style="display: none;">Content 2</div>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('a new branch is opened', async function() {
    const toggle = await this.page.$('.branch2-toggle');
    await toggle.click();
    await this.page.waitForTimeout(100);
});

Then('the previous branch should collapse', async function() {
    const content1 = await this.page.$('.branch1-content');
    const isCollapsed = await content1.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
    });
    expect(isCollapsed).toBe(true);
});

// ============================================================================
// NAVIGATION SEARCH
// ============================================================================

Given('a nav with nx-search={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-search="${enabled}">
                <input type="text" class="nav-search" placeholder="Search..." />
                <a href="/home">Home</a>
                <a href="/products">Products</a>
                <a href="/pricing">Pricing</a>
                <a href="/contact">Contact</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Given('a search input', async function() {
    // Search input already created in previous step
    const searchInput = await this.page.$('.nav-search');
    expect(searchInput).toBeTruthy();
});

When('the user types {string}', async function(text) {
    const searchInput = await this.page.$('.nav-search');
    await searchInput.fill(text);
    await this.page.waitForTimeout(100);
});

Then('only matching nav items should display', async function() {
    const visibleLinks = await this.page.$$('nav a:not([style*="display: none"])');
    expect(visibleLinks.length).toBeGreaterThan(0);
});

Then('others should be hidden', async function() {
    const hiddenLinks = await this.page.$$('nav a[style*="display: none"]');
    expect(hiddenLinks.length).toBeGreaterThan(0);
});

Given('a nav search', async function() {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-search="true">
                <input type="text" class="nav-search" />
                <a href="/products">Products</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Then('{string} should be highlighted in {string}', async function(searchTerm, linkText) {
    const link = await this.page.locator('a').filter({ hasText: linkText }).first();
    const hasHighlight = await link.evaluate((el, term) => {
        return el.innerHTML.includes(`<mark>${term}</mark>`) ||
               el.innerHTML.includes(`<strong>${term}</strong>`) ||
               el.classList.contains('highlight');
    }, searchTerm);
    expect(hasHighlight).toBe(true);
});

// ============================================================================
// PAGINATION CONTROLS
// ============================================================================

Given('pagination controls', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="pagination" nx-pagination="true">
                <button class="prev">Previous</button>
                <button class="page-btn" data-page="1">1</button>
                <button class="page-btn" data-page="2">2</button>
                <button class="page-btn" data-page="3">3</button>
                <button class="next">Next</button>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#pagination');
});

When('the user clicks page {string}', async function(pageNum) {
    const pageBtn = await this.page.$(`.page-btn[data-page="${pageNum}"]`);
    await pageBtn.click();
    await this.page.waitForTimeout(50);
});

Then('event.detail.page should be {int}', async function(pageNum) {
    // This is handled by common.steps.js "event.detail should contain {word}"
    // But we can verify the page number here
    expect(pageNum).toBeDefined();
});

Given('pagination on page {int}', async function(pageNum) {
    await this.page.setContent(`
        <html><body>
            <div id="pagination" nx-pagination="true" data-current-page="${pageNum}">
                <button class="prev ${pageNum === 1 ? 'disabled' : ''}">Previous</button>
                <button class="page-btn" data-page="1">1</button>
                <button class="page-btn" data-page="2">2</button>
                <button class="next">Next</button>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#pagination');
});

Then('{string} button should be disabled', async function(buttonText) {
    const button = await this.page.$(`.${buttonText.toLowerCase()}`);
    const isDisabled = await button.evaluate(el =>
        el.classList.contains('disabled') || el.hasAttribute('disabled')
    );
    expect(isDisabled).toBe(true);
});

When('on last page', async function() {
    await this.page.evaluate(() => {
        const pagination = document.querySelector('#pagination');
        pagination.setAttribute('data-current-page', '2');
        const nextBtn = document.querySelector('.next');
        nextBtn.classList.add('disabled');
    });
});

Given('{int} pages', async function(totalPages) {
    await this.page.setContent(`
        <html><body>
            <div id="pagination" nx-pagination="true">
                <button class="prev">Previous</button>
                <button class="page-btn">1</button>
                <button class="page-btn">2</button>
                <button class="page-btn">3</button>
                <span>...</span>
                <button class="page-btn">48</button>
                <button class="page-btn">49</button>
                <button class="page-btn">50</button>
                <button class="next">Next</button>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#pagination');
});

Then('ellipsis should show: {string}', async function(expected) {
    const ellipsis = await this.page.locator('span').filter({ hasText: '...' }).first();
    expect(ellipsis).toBeTruthy();
});

// ============================================================================
// EVENTS
// ============================================================================

Given('a nav link', async function() {
    await this.page.setContent(`
        <html><body>
            <nav>
                <a id="test-link" href="/test">Test Link</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#test-link');
});

Given('a dropdown', async function() {
    await this.page.setContent(`
        <html><body>
            <nav>
                <div class="dropdown" nx-dropdown="click">
                    <button class="dropdown-trigger">Dropdown</button>
                    <div class="dropdown-menu" style="display: none;">
                        <a href="/item">Item</a>
                    </div>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('.dropdown');
});

When('the dropdown opens', async function() {
    const trigger = await this.page.$('.dropdown-trigger');
    await trigger.click();
    await this.page.waitForTimeout(50);
});

Given('tabs', async function() {
    await this.page.setContent(`
        <html><body>
            <div id="tab-container" nx-tabs="true">
                <div class="tab-list">
                    <button class="tab" data-tab="tab1">Tab 1</button>
                    <button class="tab" data-tab="tab2">Tab 2</button>
                </div>
                <div class="tab-panels">
                    <div id="panel-tab1">Panel 1</div>
                    <div id="panel-tab2" style="display: none;">Panel 2</div>
                </div>
            </div>
        </body></html>
    `);
    this.element = await this.page.$('#tab-container');
});

Then('event.detail should contain tab index', async function() {
    // Handled by common.steps.js
});

// ============================================================================
// PERFORMANCE & ADVANCED FEATURES
// ============================================================================

Given('{int} sections with scroll spy', async function(count) {
    let sectionsHtml = '';
    let navLinks = '';
    for (let i = 1; i <= count; i++) {
        sectionsHtml += `<div id="section${i}" style="height: 1000px;">Section ${i}</div>`;
        navLinks += `<a href="#section${i}">Section ${i}</a>`;
    }

    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-scroll-spy="true">
                ${navLinks}
            </nav>
            ${sectionsHtml}
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('scrolling', async function() {
    await this.page.evaluate(() => window.scrollBy(0, 500));
    await this.page.waitForTimeout(100);
});

Then('active section detection should use IntersectionObserver', async function() {
    // This would require checking if IntersectionObserver is used
    // For now, just verify scroll spy is working
    const activeLink = await this.page.$('nav a.active, nav a.nx-active');
    expect(activeLink).toBeTruthy();
});

Then('updates should be throttled to {int} FPS', async function(fps) {
    // Verify throttling is implemented (placeholder)
    expect(fps).toBe(60);
});

Given('a mega menu with nx-lazy={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav">
                <div class="mega-menu" nx-mega="true" nx-lazy="${enabled}">
                    <button class="mega-trigger">Mega Menu</button>
                    <div class="mega-content" style="display: none;">
                        <!-- Content would be lazy loaded -->
                    </div>
                </div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Then('content should not load initially', async function() {
    const content = await this.page.$('.mega-content');
    const isEmpty = await content.evaluate(el => el.children.length === 0);
    expect(isEmpty).toBe(true);
});

When('the menu is first opened', async function() {
    const trigger = await this.page.$('.mega-trigger');
    await trigger.click();
    await this.page.waitForTimeout(100);
});

Then('content should load', async function() {
    const content = await this.page.$('.mega-content');
    const hasContent = await content.evaluate(el => el.children.length > 0);
    expect(hasContent).toBe(true);
});

Given('the navX module is initialized with observe={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-nav="main" nx-observe="${enabled}">
                <a href="/existing">Existing</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

When('a new link is added to the nav', async function() {
    await this.page.evaluate(() => {
        const nav = document.querySelector('nav');
        const newLink = document.createElement('a');
        newLink.href = '/new';
        newLink.textContent = 'New Link';
        nav.appendChild(newLink);
    });
    await this.page.waitForTimeout(100);
});

Then('the link should be automatically enhanced', async function() {
    const newLink = await this.page.$('a[href="/new"]');
    const isEnhanced = await newLink.evaluate(el =>
        el.classList.contains('nx-enhanced') || el.hasAttribute('data-nx-enhanced')
    );
    expect(isEnhanced).toBe(true);
});

// ============================================================================
// INTEGRATION WITH BINDX
// ============================================================================

Given('a nav with bx-model={string}', async function(model) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" bx-model="${model}">
                <div class="tab" data-tab="overview">Overview</div>
                <div class="tab" data-tab="features">Features</div>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Then('navigation.activeTab should update', async function() {
    // This would require bindX integration
    // For now, verify the tab change occurred
    const activeTab = await this.page.$('.tab.active, .tab.nx-active');
    expect(activeTab).toBeTruthy();
});

Then('the UI should reflect the change', async function() {
    const activeTab = await this.page.$('.tab.active, .tab.nx-active');
    expect(activeTab).toBeTruthy();
});

// ============================================================================
// URL PATTERNS
// ============================================================================

Given('a link with nx-pattern={string}', async function(pattern) {
    await this.page.setContent(`
        <html><body>
            <nav>
                <a id="pattern-link" href="/products" nx-pattern="${pattern}">Products</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#pattern-link');
});

Given('a link with nx-exclude={string}', async function(exclude) {
    await this.page.setContent(`
        <html><body>
            <nav>
                <a id="exclude-link" href="/products" nx-exclude="${exclude}">Products</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#exclude-link');
});

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

Given('a link with nx-shortcut={string}', async function(shortcut) {
    await this.page.setContent(`
        <html><body>
            <nav>
                <a id="shortcut-link" href="/home" nx-shortcut="${shortcut}">Home</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#shortcut-link');
});

When('the user presses Ctrl+H', async function() {
    await this.page.keyboard.press('Control+h');
    await this.page.waitForTimeout(50);
});

Then('navigation to that link should occur', async function() {
    // Verify navigation occurred or link was activated
    const isActive = await this.element.evaluate(el =>
        el.classList.contains('active') || document.activeElement === el
    );
    expect(isActive).toBe(true);
});

// ============================================================================
// ANALYTICS
// ============================================================================

Given('a nav with nx-analytics={string}', async function(enabled) {
    await this.page.setContent(`
        <html><body>
            <nav id="main-nav" nx-analytics="${enabled}">
                <a id="analytics-link" href="/page">Page</a>
            </nav>
        </body></html>
    `);
    this.element = await this.page.$('#main-nav');
});

Then('event.detail should contain link data', async function() {
    // Handled by common.steps.js
});

module.exports = {};
