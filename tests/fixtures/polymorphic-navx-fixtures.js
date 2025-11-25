/**
 * NavX (navX) Polymorphic Notation Test Fixtures
 *
 * Tests all 4 notation styles produce identical navigation behavior:
 * 1. Verbose: nx-nav="menu" nx-active-class="active" nx-scroll-spy="true"
 * 2. Colon: nx-nav="menu:active:true"
 * 3. JSON: nx-opts='{"nav":"menu","active_class":"active","scroll_spy":true}'
 * 4. CSS Class: class="nav-menu-active-true"
 */

export const navxBasicNavigationFixtures = {
    name: 'Basic navigation with active link tracking',
    verbose: `<nav nx-nav="main" nx-active-class="active">
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>`,
    colon: `<nav nx-nav="main:active">
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>`,
    json: `<nav nx-opts='{"nav":"main","active_class":"active"}'>
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>`,
    cssClass: `<nav class="nav-main-active">
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>`,
    expectedActiveClass: 'active',
    expectedBehavior: 'Active link should have "active" class based on current URL',
    description: 'Basic navigation with active state tracking'
};

export const navxBreadcrumbFixtures = {
    name: 'Hierarchical breadcrumb navigation',
    verbose: `<nav nx-breadcrumb="trail" nx-separator=" / " nx-home-label="Home">
        <span>Home</span>
        <span>Products</span>
        <span>Electronics</span>
    </nav>`,
    colon: `<nav nx-breadcrumb="trail: / :Home">
        <span>Home</span>
        <span>Products</span>
        <span>Electronics</span>
    </nav>`,
    json: `<nav nx-opts='{"breadcrumb":"trail","separator":" / ","home_label":"Home"}'>
        <span>Home</span>
        <span>Products</span>
        <span>Electronics</span>
    </nav>`,
    cssClass: `<nav class="nav-breadcrumb-trail- / -Home">
        <span>Home</span>
        <span>Products</span>
        <span>Electronics</span>
    </nav>`,
    expectedSeparator: ' / ',
    expectedBehavior: 'Should show path breadcrumbs separated by " / "',
    description: 'Breadcrumb trail with custom separator'
};

export const navxTabNavigationFixtures = {
    name: 'Tab navigation with pane switching',
    verbose: `<div nx-tabs="settings" nx-active-tab="general">
        <div role="tablist">
            <button role="tab" data-tab="general">General</button>
            <button role="tab" data-tab="advanced">Advanced</button>
        </div>
        <div id="pane-general">General settings</div>
        <div id="pane-advanced">Advanced settings</div>
    </div>`,
    colon: `<div nx-tabs="settings:general">
        <div role="tablist">
            <button role="tab" data-tab="general">General</button>
            <button role="tab" data-tab="advanced">Advanced</button>
        </div>
        <div id="pane-general">General settings</div>
        <div id="pane-advanced">Advanced settings</div>
    </div>`,
    json: `<div nx-opts='{"tabs":"settings","active_tab":"general"}'>
        <div role="tablist">
            <button role="tab" data-tab="general">General</button>
            <button role="tab" data-tab="advanced">Advanced</button>
        </div>
        <div id="pane-general">General settings</div>
        <div id="pane-advanced">Advanced settings</div>
    </div>`,
    cssClass: `<div class="nav-tabs-settings-general">
        <div role="tablist">
            <button role="tab" data-tab="general">General</button>
            <button role="tab" data-tab="advanced">Advanced</button>
        </div>
        <div id="pane-general">General settings</div>
        <div id="pane-advanced">Advanced settings</div>
    </div>`,
    expectedActiveTab: 'general',
    expectedBehavior: 'General tab should be active, switching shows correct pane',
    description: 'Tab interface with content panes'
};

export const navxScrollSpyFixtures = {
    name: 'Scroll spy navigation',
    verbose: `<nav nx-nav="sidebar" nx-scroll-spy="true" nx-active-class="current">
        <a href="#section-1" data-section="section-1">Section 1</a>
        <a href="#section-2" data-section="section-2">Section 2</a>
        <a href="#section-3" data-section="section-3">Section 3</a>
    </nav>`,
    colon: `<nav nx-nav="sidebar:current:true">
        <a href="#section-1" data-section="section-1">Section 1</a>
        <a href="#section-2" data-section="section-2">Section 2</a>
        <a href="#section-3" data-section="section-3">Section 3</a>
    </nav>`,
    json: `<nav nx-opts='{"nav":"sidebar","scroll_spy":true,"active_class":"current"}'>
        <a href="#section-1" data-section="section-1">Section 1</a>
        <a href="#section-2" data-section="section-2">Section 2</a>
        <a href="#section-3" data-section="section-3">Section 3</a>
    </nav>`,
    cssClass: `<nav class="nav-sidebar-current-true">
        <a href="#section-1" data-section="section-1">Section 1</a>
        <a href="#section-2" data-section="section-2">Section 2</a>
        <a href="#section-3" data-section="section-3">Section 3</a>
    </nav>`,
    expectedScrollSpy: true,
    expectedActiveClass: 'current',
    expectedBehavior: 'Link to current section gets "current" class as user scrolls',
    description: 'Navigation highlights current section during scroll'
};

export const navxScrollSpyOffsetFixture = {
    name: 'Scroll spy with offset threshold',
    verbose: `<nav nx-nav="toc" nx-scroll-spy="true" nx-scroll-offset="100" nx-active-class="active">
        <a href="#intro">Introduction</a>
        <a href="#setup">Setup</a>
        <a href="#usage">Usage</a>
    </nav>`,
    colon: `<nav nx-nav="toc:active:true:100">
        <a href="#intro">Introduction</a>
        <a href="#setup">Setup</a>
        <a href="#usage">Usage</a>
    </nav>`,
    json: `<nav nx-opts='{"nav":"toc","scroll_spy":true,"scroll_offset":100,"active_class":"active"}'>
        <a href="#intro">Introduction</a>
        <a href="#setup">Setup</a>
        <a href="#usage">Usage</a>
    </nav>`,
    cssClass: `<nav class="nav-toc-active-true-100">
        <a href="#intro">Introduction</a>
        <a href="#setup">Setup</a>
        <a href="#usage">Usage</a>
    </nav>`,
    expectedScrollOffset: 100,
    expectedBehavior: 'Section becomes active when 100px from top of viewport',
    description: 'Scroll spy with pixel offset for threshold'
};

export const navxStickyNavigationFixtures = {
    name: 'Sticky navigation header',
    verbose: `<header nx-sticky="true" nx-sticky-class="is-stuck" nx-scroll-threshold="50">
        <nav><a href="/">Home</a></nav>
    </header>`,
    colon: `<header nx-sticky="true:is-stuck:50">
        <nav><a href="/">Home</a></nav>
    </header>`,
    json: `<header nx-opts='{"sticky":true,"sticky_class":"is-stuck","scroll_threshold":50}'>
        <nav><a href="/">Home</a></nav>
    </header>`,
    cssClass: `<header class="nav-sticky-is-stuck-50">
        <nav><a href="/">Home</a></nav>
    </header>`,
    expectedSticky: true,
    expectedStickyClass: 'is-stuck',
    expectedThreshold: 50,
    expectedBehavior: 'Header gets "is-stuck" class after scrolling 50px',
    description: 'Sticky header with scroll detection'
};

export const navxMobileMenuFixtures = {
    name: 'Mobile hamburger menu',
    verbose: `<nav nx-mobile="true" nx-mobile-toggle=".hamburger" nx-mobile-menu=".nav-mobile" nx-mobile-class="open">
        <button class="hamburger">Menu</button>
        <div class="nav-mobile"><a href="/home">Home</a></div>
    </nav>`,
    colon: `<nav nx-mobile="true:.hamburger:.nav-mobile:open">
        <button class="hamburger">Menu</button>
        <div class="nav-mobile"><a href="/home">Home</a></div>
    </nav>`,
    json: `<nav nx-opts='{"mobile":true,"mobile_toggle":".hamburger","mobile_menu":".nav-mobile","mobile_class":"open"}'>
        <button class="hamburger">Menu</button>
        <div class="nav-mobile"><a href="/home">Home</a></div>
    </nav>`,
    cssClass: `<nav class="nav-mobile-true-.hamburger-.nav-mobile-open">
        <button class="hamburger">Menu</button>
        <div class="nav-mobile"><a href="/home">Home</a></div>
    </nav>`,
    expectedToggle: '.hamburger',
    expectedMobileClass: 'open',
    expectedBehavior: 'Hamburger button toggles "open" class on mobile menu',
    description: 'Mobile responsive hamburger menu'
};

export const navxDropdownFixtures = {
    name: 'Dropdown menu navigation',
    verbose: `<nav nx-dropdown="true" nx-dropdown-trigger="hover" nx-dropdown-close-on="click-outside">
        <a href="#" nx-dropdown-toggle>Products</a>
        <div nx-dropdown-menu>
            <a href="/product-a">Product A</a>
            <a href="/product-b">Product B</a>
        </div>
    </nav>`,
    colon: `<nav nx-dropdown="true:hover:click-outside">
        <a href="#" nx-dropdown-toggle>Products</a>
        <div nx-dropdown-menu>
            <a href="/product-a">Product A</a>
            <a href="/product-b">Product B</a>
        </div>
    </nav>`,
    json: `<nav nx-opts='{"dropdown":true,"dropdown_trigger":"hover","dropdown_close_on":"click-outside"}'>
        <a href="#" nx-dropdown-toggle>Products</a>
        <div nx-dropdown-menu>
            <a href="/product-a">Product A</a>
            <a href="/product-b">Product B</a>
        </div>
    </nav>`,
    cssClass: `<nav class="nav-dropdown-hover-click-outside">
        <a href="#" class="nav-dropdown-toggle">Products</a>
        <div class="nav-dropdown-menu">
            <a href="/product-a">Product A</a>
            <a href="/product-b">Product B</a>
        </div>
    </nav>`,
    expectedTrigger: 'hover',
    expectedCloseOn: 'click-outside',
    expectedBehavior: 'Menu opens on hover, closes when clicking outside',
    description: 'Dropdown menu with customizable triggers'
};

export const navxBreadcrumbAutoGenerateFixture = {
    name: 'Auto-generated breadcrumb from URL',
    verbose: `<nav nx-breadcrumb="auto" nx-auto-format="Title Case" nx-separator=" > ">
        <!-- Auto-generated from URL -->
    </nav>`,
    colon: `<nav nx-breadcrumb="auto:Title Case: > ">
        <!-- Auto-generated from URL -->
    </nav>`,
    json: `<nav nx-opts='{"breadcrumb":"auto","auto_format":"Title Case","separator":" > "}'>
        <!-- Auto-generated from URL -->
    </nav>`,
    cssClass: `<nav class="nav-breadcrumb-auto-Title-Case- > ">
        <!-- Auto-generated from URL -->
    </nav>`,
    expectedFormat: 'Title Case',
    expectedBehavior: 'Breadcrumbs generated automatically from URL path',
    description: 'Auto-generate breadcrumbs from current URL'
};

export const navxLinkPrefetchingFixture = {
    name: 'Prefetch links on hover',
    verbose: `<nav nx-nav="main" nx-prefetch="hover" nx-prefetch-timeout="500">
        <a href="/page-1">Page 1</a>
        <a href="/page-2">Page 2</a>
    </nav>`,
    colon: `<nav nx-nav="main:prefetch:500">
        <a href="/page-1">Page 1</a>
        <a href="/page-2">Page 2</a>
    </nav>`,
    json: `<nav nx-opts='{"nav":"main","prefetch":"hover","prefetch_timeout":500}'>
        <a href="/page-1">Page 1</a>
        <a href="/page-2">Page 2</a>
    </nav>`,
    cssClass: `<nav class="nav-main-prefetch-500">
        <a href="/page-1">Page 1</a>
        <a href="/page-2">Page 2</a>
    </nav>`,
    expectedPrefetch: 'hover',
    expectedTimeout: 500,
    expectedBehavior: 'Page resources fetched 500ms after hover',
    description: 'Prefetch linked pages on hover for faster navigation'
};

export const navxKeyboardNavigationFixture = {
    name: 'Keyboard navigation support',
    verbose: `<nav nx-nav="keyboard" nx-keyboard="true" nx-keyboard-keys="arrow" nx-cycle="true">
        <a href="/prev">Previous</a>
        <a href="/current" class="active">Current</a>
        <a href="/next">Next</a>
    </nav>`,
    colon: `<nav nx-nav="keyboard:arrow:true">
        <a href="/prev">Previous</a>
        <a href="/current" class="active">Current</a>
        <a href="/next">Next</a>
    </nav>`,
    json: `<nav nx-opts='{"nav":"keyboard","keyboard":true,"keyboard_keys":"arrow","cycle":true}'>
        <a href="/prev">Previous</a>
        <a href="/current" class="active">Current</a>
        <a href="/next">Next</a>
    </nav>`,
    cssClass: `<nav class="nav-keyboard-arrow-true">
        <a href="/prev">Previous</a>
        <a href="/current" class="active">Current</a>
        <a href="/next">Next</a>
    </nav>`,
    expectedKeyboardKeys: 'arrow',
    expectedCycle: true,
    expectedBehavior: 'Arrow keys navigate between links, cycling at ends',
    description: 'Full keyboard navigation with cycling'
};

export const navxInvalidConfigFixture = {
    name: 'Invalid navigation configuration',
    verbose: `<nav nx-nav="">No navigation</nav>`,
    colon: `<nav nx-nav="">No navigation</nav>`,
    json: `<nav nx-opts='{"nav":""}'>No navigation</nav>`,
    cssClass: `<nav class="nav-">No navigation</nav>`,
    expectedNav: '',
    expectedBehavior: 'No navigation enhancement applied',
    description: 'Empty nav ID should not create navigation'
};

/**
 * Test page with all navX notation styles
 */
export function createNavXTestPage(navType = 'basic') {
    const fixtures = {
        basic: navxBasicNavigationFixtures,
        breadcrumb: navxBreadcrumbFixtures,
        tabs: navxTabNavigationFixtures,
        scrollSpy: navxScrollSpyFixtures,
        sticky: navxStickyNavigationFixtures,
        mobile: navxMobileMenuFixtures,
        dropdown: navxDropdownFixtures,
        keyboard: navxKeyboardNavigationFixture
    };

    const fixture = fixtures[navType] || fixtures.basic;

    return `
        <div data-test="navx-polymorphic-notation">
            <section data-notation="verbose">
                <h3>Verbose Notation</h3>
                ${fixture.verbose}
            </section>
            <section data-notation="colon">
                <h3>Colon Notation</h3>
                ${fixture.colon}
            </section>
            <section data-notation="json">
                <h3>JSON Notation</h3>
                ${fixture.json}
            </section>
            <section data-notation="class">
                <h3>CSS Class Notation</h3>
                ${fixture.cssClass}
            </section>
        </div>
    `;
}

/**
 * Performance test: All notation styles with 1000 elements
 */
export function createNavXPerformanceTest(count = 1000) {
    const templates = [
        '<a href="/page-{{i}}" nx-nav="menu">Link {{i}}</a>',
        '<a href="/page-{{i}}" nx-nav="menu">Link {{i}}</a>',
        '<a href="/page-{{i}}" nx-opts=\'{"nav":"menu"}\'>Link {{i}}</a>',
        '<a href="/page-{{i}}" class="nav-menu">Link {{i}}</a>'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        elements.push(template.replace(/\{\{i\}\}/g, i));
    }

    return `
        <nav data-test="navx-performance" data-count="${count}">
            ${elements.join('\n')}
        </nav>
    `;
}

/**
 * Priority resolution test
 */
export const navxPriorityTestFixture = {
    name: 'Priority resolution - JSON > Colon > Verbose > Class',
    description: 'JSON should take priority over other notations',
    element: `<nav nx-nav="verbose" nx-opts='{"nav":"json"}' class="nav-class">
        <a href="/">Link</a>
    </nav>`,
    expectedNav: 'json',
    reason: 'nx-opts (JSON) takes priority'
};

export default {
    navxBasicNavigationFixtures,
    navxBreadcrumbFixtures,
    navxTabNavigationFixtures,
    navxScrollSpyFixtures,
    navxScrollSpyOffsetFixture,
    navxStickyNavigationFixtures,
    navxMobileMenuFixtures,
    navxDropdownFixtures,
    navxBreadcrumbAutoGenerateFixture,
    navxLinkPrefetchingFixture,
    navxKeyboardNavigationFixture,
    navxInvalidConfigFixture,
    createNavXTestPage,
    createNavXPerformanceTest,
    navxPriorityTestFixture
};
