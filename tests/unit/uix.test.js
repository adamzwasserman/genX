/**
 * Unit tests for UIX Module
 *
 * These tests verify that the UIX enhancers actually transform DOM elements
 * by adding correct classes, ARIA attributes, and event handlers.
 */

// Mock UIX module for testing
let UIX;
let enhance;

beforeAll(() => {
    // Load the UIX module - it exposes uxXFactory globally
    require('../../src/uix.js');
    UIX = window.UIX || window.uxXFactory?.init?.();
    enhance = window.uxXFactory?.enhance;
});

describe('UIX Module', () => {
    beforeEach(() => {
        // Clean up any existing UIX styles
        const existingStyle = document.getElementById('uix-styles');
        if (existingStyle) existingStyle.remove();

        // Clean up toast container
        const toastContainer = document.querySelector('.ux-toast-container');
        if (toastContainer) toastContainer.remove();

        // Reset document body
        document.body.innerHTML = '';
    });

    // ============================================
    // BUTTON COMPONENT
    // ============================================
    describe('Button Component', () => {
        test('enhancer adds ux-btn class', () => {
            const button = document.createElement('button');
            button.setAttribute('ux-enhance', 'button');
            document.body.appendChild(button);

            enhance.button(button, {});

            expect(button.classList.contains('ux-btn')).toBe(true);
        });

        test('enhancer adds variant class', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);

            enhance.button(button, { variant: 'primary' });

            expect(button.classList.contains('ux-btn')).toBe(true);
            expect(button.classList.contains('ux-btn--primary')).toBe(true);
        });

        test('enhancer adds size class', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);

            enhance.button(button, { size: 'sm' });

            expect(button.classList.contains('ux-btn--sm')).toBe(true);
        });

        test('enhancer adds loading state', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);

            enhance.button(button, { loading: true });

            expect(button.classList.contains('ux-btn--loading')).toBe(true);
        });

        test('enhancer adds block variant', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);

            enhance.button(button, { block: true });

            expect(button.classList.contains('ux-btn--block')).toBe(true);
        });

        test('enhancer adds role=button and tabindex to non-button elements', () => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            enhance.button(div, {});

            expect(div.getAttribute('role')).toBe('button');
            expect(div.getAttribute('tabindex')).toBe('0');
        });

        test('enhancer enables keyboard activation on non-button elements', () => {
            const div = document.createElement('div');
            document.body.appendChild(div);
            const clickHandler = jest.fn();
            div.addEventListener('click', clickHandler);

            enhance.button(div, {});

            // Simulate Enter key
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            div.dispatchEvent(enterEvent);

            expect(clickHandler).toHaveBeenCalled();
        });

        test('enhancer applies custom colors via CSS variables', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);

            enhance.button(button, { bg: '#ff0000', color: '#ffffff' });

            expect(button.style.getPropertyValue('--ux-btn-bg')).toBe('#ff0000');
            expect(button.style.getPropertyValue('--ux-btn-color')).toBe('#ffffff');
        });
    });

    // ============================================
    // BADGE COMPONENT
    // ============================================
    describe('Badge Component', () => {
        test('enhancer adds ux-badge class', () => {
            const badge = document.createElement('span');
            document.body.appendChild(badge);

            enhance.badge(badge, {});

            expect(badge.classList.contains('ux-badge')).toBe(true);
        });

        test('enhancer adds variant classes', () => {
            const variants = ['primary', 'success', 'warning', 'danger', 'info'];

            variants.forEach(variant => {
                const badge = document.createElement('span');
                document.body.appendChild(badge);

                enhance.badge(badge, { variant });

                expect(badge.classList.contains('ux-badge')).toBe(true);
                expect(badge.classList.contains(`ux-badge--${variant}`)).toBe(true);
            });
        });

        test('enhancer adds pill style', () => {
            const badge = document.createElement('span');
            document.body.appendChild(badge);

            enhance.badge(badge, { pill: true });

            expect(badge.classList.contains('ux-badge--pill')).toBe(true);
        });

        test('enhancer adds size class', () => {
            const badge = document.createElement('span');
            document.body.appendChild(badge);

            enhance.badge(badge, { size: 'lg' });

            expect(badge.classList.contains('ux-badge--lg')).toBe(true);
        });
    });

    // ============================================
    // AVATAR COMPONENT
    // ============================================
    describe('Avatar Component', () => {
        test('enhancer adds ux-avatar class', () => {
            const avatar = document.createElement('div');
            document.body.appendChild(avatar);

            enhance.avatar(avatar, {});

            expect(avatar.classList.contains('ux-avatar')).toBe(true);
        });

        test('enhancer adds size variants', () => {
            const sizes = ['sm', 'lg', 'xl'];

            sizes.forEach(size => {
                const avatar = document.createElement('div');
                document.body.appendChild(avatar);

                enhance.avatar(avatar, { size });

                expect(avatar.classList.contains(`ux-avatar--${size}`)).toBe(true);
            });
        });

        test('enhancer adds square variant', () => {
            const avatar = document.createElement('div');
            document.body.appendChild(avatar);

            enhance.avatar(avatar, { square: true });

            expect(avatar.classList.contains('ux-avatar--square')).toBe(true);
        });

        test('enhancer sets initials as text content', () => {
            const avatar = document.createElement('div');
            document.body.appendChild(avatar);

            enhance.avatar(avatar, { initials: 'JD' });

            expect(avatar.textContent).toBe('JD');
        });
    });

    // ============================================
    // SPINNER COMPONENT
    // ============================================
    describe('Spinner Component', () => {
        test('enhancer adds ux-spinner class', () => {
            const spinner = document.createElement('div');
            document.body.appendChild(spinner);

            enhance.spinner(spinner, {});

            expect(spinner.classList.contains('ux-spinner')).toBe(true);
        });

        test('enhancer sets role=status and aria-label for accessibility', () => {
            const spinner = document.createElement('div');
            document.body.appendChild(spinner);

            enhance.spinner(spinner, {});

            expect(spinner.getAttribute('role')).toBe('status');
            expect(spinner.getAttribute('aria-label')).toBe('Loading');
        });

        test('enhancer sets custom aria-label', () => {
            const spinner = document.createElement('div');
            document.body.appendChild(spinner);

            enhance.spinner(spinner, { label: 'Processing...' });

            expect(spinner.getAttribute('aria-label')).toBe('Processing...');
        });

        test('enhancer adds size variants', () => {
            const spinner = document.createElement('div');
            document.body.appendChild(spinner);

            enhance.spinner(spinner, { size: 'lg' });

            expect(spinner.classList.contains('ux-spinner--lg')).toBe(true);
        });
    });

    // ============================================
    // CARD COMPONENT
    // ============================================
    describe('Card Component', () => {
        test('enhancer adds ux-card class', () => {
            const card = document.createElement('div');
            document.body.appendChild(card);

            enhance.card(card, {});

            expect(card.classList.contains('ux-card')).toBe(true);
        });

        test('enhancer adds elevated style', () => {
            const card = document.createElement('div');
            document.body.appendChild(card);

            enhance.card(card, { elevated: true });

            expect(card.classList.contains('ux-card--elevated')).toBe(true);
        });

        test('enhancer adds hoverable style', () => {
            const card = document.createElement('div');
            document.body.appendChild(card);

            enhance.card(card, { hoverable: true });

            expect(card.classList.contains('ux-card--hoverable')).toBe(true);
        });

        test('enhancer auto-generates header with title', () => {
            const card = document.createElement('div');
            card.textContent = 'Card content';
            document.body.appendChild(card);

            enhance.card(card, { title: 'My Card' });

            const header = card.querySelector('.ux-card__header');
            const title = card.querySelector('.ux-card__title');
            expect(header).not.toBeNull();
            expect(title).not.toBeNull();
            expect(title.textContent).toBe('My Card');
        });
    });

    // ============================================
    // ALERT COMPONENT
    // ============================================
    describe('Alert Component', () => {
        test('enhancer adds ux-alert class', () => {
            const alert = document.createElement('div');
            document.body.appendChild(alert);

            enhance.alert(alert, {});

            expect(alert.classList.contains('ux-alert')).toBe(true);
        });

        test('enhancer adds variant types', () => {
            const variants = ['success', 'warning', 'danger', 'info'];

            variants.forEach(variant => {
                const alert = document.createElement('div');
                document.body.appendChild(alert);

                enhance.alert(alert, { variant });

                expect(alert.classList.contains(`ux-alert--${variant}`)).toBe(true);
            });
        });

        test('enhancer sets role=alert', () => {
            const alert = document.createElement('div');
            document.body.appendChild(alert);

            enhance.alert(alert, {});

            expect(alert.getAttribute('role')).toBe('alert');
        });

        test('enhancer adds dismiss button when dismissible', () => {
            const alert = document.createElement('div');
            alert.textContent = 'Alert message';
            document.body.appendChild(alert);

            enhance.alert(alert, { dismissible: true });

            const dismissBtn = alert.querySelector('.ux-alert__dismiss');
            expect(dismissBtn).not.toBeNull();
            expect(dismissBtn.getAttribute('aria-label')).toBe('Dismiss');
        });

        test('dismiss button removes alert on click', () => {
            const alert = document.createElement('div');
            document.body.appendChild(alert);

            enhance.alert(alert, { dismissible: true });

            const dismissBtn = alert.querySelector('.ux-alert__dismiss');
            dismissBtn.click();

            expect(document.body.contains(alert)).toBe(false);
        });
    });

    // ============================================
    // PROGRESS COMPONENT
    // ============================================
    describe('Progress Component', () => {
        test('enhancer adds ux-progress class', () => {
            const progress = document.createElement('div');
            document.body.appendChild(progress);

            enhance.progress(progress, {});

            expect(progress.classList.contains('ux-progress')).toBe(true);
        });

        test('enhancer sets ARIA progressbar attributes', () => {
            const progress = document.createElement('div');
            document.body.appendChild(progress);

            enhance.progress(progress, { value: 50 });

            expect(progress.getAttribute('role')).toBe('progressbar');
            expect(progress.getAttribute('aria-valuenow')).toBe('50');
            expect(progress.getAttribute('aria-valuemin')).toBe('0');
            expect(progress.getAttribute('aria-valuemax')).toBe('100');
        });

        test('enhancer creates progress bar with correct width', () => {
            const progress = document.createElement('div');
            document.body.appendChild(progress);

            enhance.progress(progress, { value: 75 });

            const bar = progress.querySelector('.ux-progress__bar');
            expect(bar).not.toBeNull();
            expect(bar.style.width).toBe('75%');
        });

        test('enhancer handles custom max value', () => {
            const progress = document.createElement('div');
            document.body.appendChild(progress);

            enhance.progress(progress, { value: 50, max: 200 });

            expect(progress.getAttribute('aria-valuemax')).toBe('200');
            const bar = progress.querySelector('.ux-progress__bar');
            expect(bar.style.width).toBe('25%');
        });
    });

    // ============================================
    // SKELETON COMPONENT
    // ============================================
    describe('Skeleton Component', () => {
        test('enhancer adds ux-skeleton class', () => {
            const skeleton = document.createElement('div');
            document.body.appendChild(skeleton);

            enhance.skeleton(skeleton, {});

            expect(skeleton.classList.contains('ux-skeleton')).toBe(true);
        });

        test('enhancer sets aria-busy', () => {
            const skeleton = document.createElement('div');
            document.body.appendChild(skeleton);

            enhance.skeleton(skeleton, {});

            expect(skeleton.getAttribute('aria-busy')).toBe('true');
        });

        test('enhancer adds shape variants', () => {
            const shapes = ['text', 'circle', 'rect'];

            shapes.forEach(shape => {
                const skeleton = document.createElement('div');
                document.body.appendChild(skeleton);

                enhance.skeleton(skeleton, { shape });

                expect(skeleton.classList.contains(`ux-skeleton--${shape}`)).toBe(true);
            });
        });

        test('enhancer defaults to text shape', () => {
            const skeleton = document.createElement('div');
            document.body.appendChild(skeleton);

            enhance.skeleton(skeleton, {});

            expect(skeleton.classList.contains('ux-skeleton--text')).toBe(true);
        });
    });

    // ============================================
    // INPUT COMPONENT
    // ============================================
    describe('Input Component', () => {
        test('enhancer adds ux-input class', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);

            enhance.input(input, {});

            expect(input.classList.contains('ux-input')).toBe(true);
        });

        test('enhancer adds error state with aria-invalid', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);

            enhance.input(input, { error: true });

            expect(input.classList.contains('ux-input--error')).toBe(true);
            expect(input.getAttribute('aria-invalid')).toBe('true');
        });

        test('enhancer adds size class', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);

            enhance.input(input, { size: 'lg' });

            expect(input.classList.contains('ux-input--lg')).toBe(true);
        });
    });

    // ============================================
    // SWITCH COMPONENT
    // ============================================
    describe('Switch Component', () => {
        test('enhancer adds ux-switch class', () => {
            const switchEl = document.createElement('label');
            document.body.appendChild(switchEl);

            enhance.switch(switchEl, {});

            expect(switchEl.classList.contains('ux-switch')).toBe(true);
        });

        test('enhancer sets role=switch', () => {
            const switchEl = document.createElement('label');
            document.body.appendChild(switchEl);

            enhance.switch(switchEl, {});

            expect(switchEl.getAttribute('role')).toBe('switch');
        });

        test('enhancer creates track element', () => {
            const switchEl = document.createElement('label');
            document.body.appendChild(switchEl);

            enhance.switch(switchEl, {});

            const track = switchEl.querySelector('.ux-switch__track');
            expect(track).not.toBeNull();
        });

        test('enhancer syncs with checkbox state', () => {
            const switchEl = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            switchEl.appendChild(checkbox);
            document.body.appendChild(switchEl);

            enhance.switch(switchEl, {});

            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });

        test('enhancer adds size class', () => {
            const switchEl = document.createElement('label');
            document.body.appendChild(switchEl);

            enhance.switch(switchEl, { size: 'sm' });

            expect(switchEl.classList.contains('ux-switch--sm')).toBe(true);
        });
    });

    // ============================================
    // MODAL COMPONENT
    // ============================================
    describe('Modal Component', () => {
        test('enhancer adds ux-modal class', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, {});

            expect(modal.classList.contains('ux-modal')).toBe(true);
        });

        test('enhancer sets ARIA dialog attributes', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, { label: 'Test Modal' });

            expect(modal.getAttribute('role')).toBe('dialog');
            expect(modal.getAttribute('aria-modal')).toBe('true');
            expect(modal.getAttribute('aria-label')).toBe('Test Modal');
        });

        test('enhancer adds size variant', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, { size: 'lg' });

            expect(modal.classList.contains('ux-modal--lg')).toBe(true);
        });

        test('enhancer creates backdrop element', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, {});

            const backdrop = modal.querySelector('.ux-modal__backdrop');
            expect(backdrop).not.toBeNull();
        });

        test('enhancer exposes uxOpen and uxClose methods', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, {});

            expect(typeof modal.uxOpen).toBe('function');
            expect(typeof modal.uxClose).toBe('function');
        });

        test('uxOpen adds is-open class', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, {});
            modal.uxOpen();

            expect(modal.classList.contains('is-open')).toBe(true);
        });

        test('uxClose removes is-open class', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);

            enhance.modal(modal, {});
            modal.uxOpen();
            modal.uxClose();

            expect(modal.classList.contains('is-open')).toBe(false);
        });
    });

    // ============================================
    // TABS COMPONENT
    // ============================================
    describe('Tabs Component', () => {
        test('enhancer creates tab list with correct roles', () => {
            const tabs = document.createElement('div');
            tabs.innerHTML = '<div>Panel 1</div><div>Panel 2</div>';
            document.body.appendChild(tabs);

            enhance.tabs(tabs, { tabs: 'Tab 1, Tab 2' });

            const tablist = tabs.querySelector('[role="tablist"]');
            expect(tablist).not.toBeNull();
        });

        test('enhancer creates tabs with role=tab', () => {
            const tabs = document.createElement('div');
            tabs.innerHTML = '<div>Panel 1</div><div>Panel 2</div>';
            document.body.appendChild(tabs);

            enhance.tabs(tabs, { tabs: 'Tab 1, Tab 2' });

            const tabElements = tabs.querySelectorAll('[role="tab"]');
            expect(tabElements.length).toBe(2);
        });

        test('enhancer sets role=tabpanel on panels', () => {
            const tabs = document.createElement('div');
            tabs.innerHTML = '<div>Panel 1</div><div>Panel 2</div>';
            document.body.appendChild(tabs);

            enhance.tabs(tabs, { tabs: 'Tab 1, Tab 2' });

            const panels = tabs.querySelectorAll('[role="tabpanel"]');
            expect(panels.length).toBe(2);
        });

        test('enhancer sets aria-selected on active tab', () => {
            const tabs = document.createElement('div');
            tabs.innerHTML = '<div>Panel 1</div><div>Panel 2</div>';
            document.body.appendChild(tabs);

            enhance.tabs(tabs, { tabs: 'Tab 1, Tab 2' });

            const activeTab = tabs.querySelector('[aria-selected="true"]');
            expect(activeTab).not.toBeNull();
        });
    });

    // ============================================
    // DROPDOWN COMPONENT
    // ============================================
    describe('Dropdown Component', () => {
        test('enhancer adds ux-dropdown class', () => {
            const dropdown = document.createElement('div');
            dropdown.innerHTML = '<button class="ux-dropdown__trigger">Menu</button><div class="ux-dropdown__menu"></div>';
            document.body.appendChild(dropdown);

            enhance.dropdown(dropdown, {});

            expect(dropdown.classList.contains('ux-dropdown')).toBe(true);
        });

        test('enhancer sets aria-haspopup on trigger', () => {
            const dropdown = document.createElement('div');
            dropdown.innerHTML = '<button class="ux-dropdown__trigger">Menu</button><div class="ux-dropdown__menu"></div>';
            document.body.appendChild(dropdown);

            enhance.dropdown(dropdown, {});

            const trigger = dropdown.querySelector('.ux-dropdown__trigger');
            expect(trigger.getAttribute('aria-haspopup')).toBe('true');
        });

        test('trigger click toggles is-open class', () => {
            const dropdown = document.createElement('div');
            dropdown.innerHTML = '<button class="ux-dropdown__trigger">Menu</button><div class="ux-dropdown__menu"></div>';
            document.body.appendChild(dropdown);

            enhance.dropdown(dropdown, {});

            const trigger = dropdown.querySelector('.ux-dropdown__trigger');
            trigger.click();

            expect(dropdown.classList.contains('is-open')).toBe(true);
        });
    });

    // ============================================
    // TOOLTIP COMPONENT
    // ============================================
    describe('Tooltip Component', () => {
        test('enhancer adds ux-tooltip class', () => {
            const tooltip = document.createElement('span');
            tooltip.setAttribute('data-tooltip', 'Tooltip text');
            document.body.appendChild(tooltip);

            enhance.tooltip(tooltip, {});

            expect(tooltip.classList.contains('ux-tooltip')).toBe(true);
        });

        test('enhancer removes title attribute to prevent native tooltip', () => {
            const tooltip = document.createElement('span');
            tooltip.setAttribute('title', 'Original title');
            tooltip.setAttribute('data-tooltip', 'Custom tooltip');
            document.body.appendChild(tooltip);

            enhance.tooltip(tooltip, {});

            expect(tooltip.getAttribute('title')).toBeNull();
        });
    });

    // ============================================
    // MENU COMPONENT
    // ============================================
    describe('Menu Component', () => {
        test('enhancer sets role=menu', () => {
            const menu = document.createElement('ul');
            menu.innerHTML = '<li>Item 1</li><li>Item 2</li>';
            document.body.appendChild(menu);

            enhance.menu(menu, {});

            expect(menu.getAttribute('role')).toBe('menu');
        });

        test('enhancer sets role=menuitem on items with ux-menu__item class', () => {
            const menu = document.createElement('ul');
            menu.innerHTML = '<li class="ux-menu__item">Item 1</li><li class="ux-menu__item">Item 2</li>';
            document.body.appendChild(menu);

            enhance.menu(menu, {});

            const items = menu.querySelectorAll('[role="menuitem"]');
            expect(items.length).toBe(2);
        });

        test('enhancer implements roving tabindex', () => {
            const menu = document.createElement('ul');
            menu.innerHTML = '<li class="ux-menu__item">Item 1</li><li class="ux-menu__item">Item 2</li><li class="ux-menu__item">Item 3</li>';
            document.body.appendChild(menu);

            enhance.menu(menu, {});

            const items = menu.querySelectorAll('[role="menuitem"]');
            expect(items[0].getAttribute('tabindex')).toBe('0');
            expect(items[1].getAttribute('tabindex')).toBe('-1');
            expect(items[2].getAttribute('tabindex')).toBe('-1');
        });
    });

    // ============================================
    // TABLE COMPONENT
    // ============================================
    describe('Table Component', () => {
        test('enhancer adds ux-table class', () => {
            const table = document.createElement('table');
            document.body.appendChild(table);

            enhance.table(table, {});

            expect(table.classList.contains('ux-table')).toBe(true);
        });

        test('enhancer adds striped variant', () => {
            const table = document.createElement('table');
            document.body.appendChild(table);

            enhance.table(table, { striped: true });

            expect(table.classList.contains('ux-table--striped')).toBe(true);
        });

        test('enhancer adds hoverable variant', () => {
            const table = document.createElement('table');
            document.body.appendChild(table);

            enhance.table(table, { hoverable: true });

            expect(table.classList.contains('ux-table--hoverable')).toBe(true);
        });
    });

    // ============================================
    // DRAWER COMPONENT
    // ============================================
    describe('Drawer Component', () => {
        test('enhancer adds ux-drawer class', () => {
            const drawer = document.createElement('div');
            document.body.appendChild(drawer);

            enhance.drawer(drawer, {});

            expect(drawer.classList.contains('ux-drawer')).toBe(true);
        });

        test('enhancer adds position variants', () => {
            const positions = ['left', 'right', 'top', 'bottom'];

            positions.forEach(position => {
                const drawer = document.createElement('div');
                document.body.appendChild(drawer);

                enhance.drawer(drawer, { position });

                expect(drawer.classList.contains(`ux-drawer--${position}`)).toBe(true);
            });
        });

        test('enhancer exposes uxOpen and uxClose methods', () => {
            const drawer = document.createElement('div');
            document.body.appendChild(drawer);

            enhance.drawer(drawer, {});

            expect(typeof drawer.uxOpen).toBe('function');
            expect(typeof drawer.uxClose).toBe('function');
        });

        test('uxOpen adds is-open class', () => {
            const drawer = document.createElement('div');
            document.body.appendChild(drawer);

            enhance.drawer(drawer, {});
            drawer.uxOpen();

            expect(drawer.classList.contains('is-open')).toBe(true);
        });
    });

    // ============================================
    // BREADCRUMB COMPONENT
    // ============================================
    describe('Breadcrumb Component', () => {
        test('enhancer adds ux-breadcrumb class', () => {
            const nav = document.createElement('nav');
            document.body.appendChild(nav);

            enhance.breadcrumb(nav, {});

            expect(nav.classList.contains('ux-breadcrumb')).toBe(true);
        });

        test('enhancer sets aria-label', () => {
            const nav = document.createElement('nav');
            document.body.appendChild(nav);

            enhance.breadcrumb(nav, {});

            expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
        });

        test('enhancer sets aria-current on last item', () => {
            const nav = document.createElement('nav');
            nav.innerHTML = '<span class="ux-breadcrumb__item">Home</span><span class="ux-breadcrumb__item">Current</span>';
            document.body.appendChild(nav);

            enhance.breadcrumb(nav, {});

            const items = nav.querySelectorAll('.ux-breadcrumb__item');
            expect(items[items.length - 1].getAttribute('aria-current')).toBe('page');
        });
    });

    // ============================================
    // DIVIDER COMPONENT
    // ============================================
    describe('Divider Component', () => {
        test('enhancer adds ux-divider class', () => {
            const divider = document.createElement('hr');
            document.body.appendChild(divider);

            enhance.divider(divider, {});

            expect(divider.classList.contains('ux-divider')).toBe(true);
        });

        test('enhancer sets role=separator', () => {
            const divider = document.createElement('hr');
            document.body.appendChild(divider);

            enhance.divider(divider, {});

            expect(divider.getAttribute('role')).toBe('separator');
        });

        test('enhancer adds vertical variant', () => {
            const divider = document.createElement('div');
            document.body.appendChild(divider);

            enhance.divider(divider, { vertical: true });

            expect(divider.classList.contains('ux-divider--vertical')).toBe(true);
        });
    });

    // ============================================
    // NAV COMPONENT
    // ============================================
    describe('Nav Component', () => {
        test('enhancer adds ux-nav class', () => {
            const nav = document.createElement('nav');
            document.body.appendChild(nav);

            enhance.nav(nav, {});

            expect(nav.classList.contains('ux-nav')).toBe(true);
        });

        test('enhancer adds vertical variant', () => {
            const nav = document.createElement('nav');
            document.body.appendChild(nav);

            enhance.nav(nav, { vertical: true });

            expect(nav.classList.contains('ux-nav--vertical')).toBe(true);
        });
    });

    // ============================================
    // TAG COMPONENT
    // ============================================
    describe('Tag Component', () => {
        test('enhancer adds ux-tag class', () => {
            const tag = document.createElement('span');
            document.body.appendChild(tag);

            enhance.tag(tag, {});

            expect(tag.classList.contains('ux-tag')).toBe(true);
        });

        test('enhancer adds variant class', () => {
            const tag = document.createElement('span');
            document.body.appendChild(tag);

            enhance.tag(tag, { variant: 'success' });

            expect(tag.classList.contains('ux-tag--success')).toBe(true);
        });

        test('enhancer adds size class', () => {
            const tag = document.createElement('span');
            document.body.appendChild(tag);

            enhance.tag(tag, { size: 'sm' });

            expect(tag.classList.contains('ux-tag--sm')).toBe(true);
        });
    });

    // ============================================
    // ACCORDION COMPONENT
    // ============================================
    describe('Accordion Component', () => {
        test('enhancer adds ux-accordion class', () => {
            const accordion = document.createElement('div');
            accordion.innerHTML = `
                <div class="ux-accordion__item">
                    <button class="ux-accordion__header">Header 1</button>
                    <div class="ux-accordion__content">Content 1</div>
                </div>
            `;
            document.body.appendChild(accordion);

            enhance.accordion(accordion, {});

            expect(accordion.classList.contains('ux-accordion')).toBe(true);
        });

        test('enhancer sets aria-expanded on headers', () => {
            const accordion = document.createElement('div');
            accordion.innerHTML = `
                <div class="ux-accordion__item">
                    <button class="ux-accordion__header">Header 1</button>
                    <div class="ux-accordion__content">Content 1</div>
                </div>
            `;
            document.body.appendChild(accordion);

            enhance.accordion(accordion, {});

            const header = accordion.querySelector('.ux-accordion__header');
            expect(header.hasAttribute('aria-expanded')).toBe(true);
        });

        test('header click toggles item open state', () => {
            const accordion = document.createElement('div');
            accordion.innerHTML = `
                <div class="ux-accordion__item">
                    <button class="ux-accordion__header">Header 1</button>
                    <div class="ux-accordion__content">Content 1</div>
                </div>
            `;
            document.body.appendChild(accordion);

            enhance.accordion(accordion, {});

            const header = accordion.querySelector('.ux-accordion__header');
            const item = accordion.querySelector('.ux-accordion__item');

            header.click();

            expect(item.classList.contains('is-open')).toBe(true);
            expect(header.getAttribute('aria-expanded')).toBe('true');
        });
    });

    // ============================================
    // CUSTOM EVENTS
    // ============================================
    describe('Custom Events', () => {
        test('modal dispatches ux:open event', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);
            const openHandler = jest.fn();
            modal.addEventListener('ux:open', openHandler);

            enhance.modal(modal, {});
            modal.uxOpen();

            expect(openHandler).toHaveBeenCalled();
        });

        test('modal dispatches ux:close event', () => {
            const modal = document.createElement('div');
            document.body.appendChild(modal);
            const closeHandler = jest.fn();
            modal.addEventListener('ux:close', closeHandler);

            enhance.modal(modal, {});
            modal.uxOpen();
            modal.uxClose();

            expect(closeHandler).toHaveBeenCalled();
        });

        test('switch dispatches ux:change event', () => {
            const switchEl = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            switchEl.appendChild(checkbox);
            document.body.appendChild(switchEl);
            const changeHandler = jest.fn();
            switchEl.addEventListener('ux:change', changeHandler);

            enhance.switch(switchEl, {});
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));

            expect(changeHandler).toHaveBeenCalled();
        });
    });

    // ============================================
    // DOM PROCESSING (processElement)
    // ============================================
    describe('DOM Processing', () => {
        test('processElement enhances element with ux-enhance attribute', () => {
            const button = document.createElement('button');
            button.setAttribute('ux-enhance', 'button');
            button.setAttribute('ux-variant', 'primary');
            document.body.appendChild(button);

            UIX.processElement(button);

            expect(button.classList.contains('ux-btn')).toBe(true);
            expect(button.classList.contains('ux-btn--primary')).toBe(true);
            expect(button.getAttribute('ux-enhanced')).toBe('true');
        });

        test('processElement skips already enhanced elements', () => {
            const button = document.createElement('button');
            button.setAttribute('ux-enhance', 'button');
            button.setAttribute('ux-enhanced', 'true');
            document.body.appendChild(button);

            UIX.processElement(button);

            // Should not add class since already enhanced
            expect(button.classList.contains('ux-btn')).toBe(false);
        });

        test('processElement parses boolean attributes', () => {
            const card = document.createElement('div');
            card.setAttribute('ux-enhance', 'card');
            card.setAttribute('ux-elevated', 'true');
            document.body.appendChild(card);

            UIX.processElement(card);

            expect(card.classList.contains('ux-card--elevated')).toBe(true);
        });

        test('scan processes all ux-enhance elements', () => {
            document.body.innerHTML = `
                <button ux-enhance="button" ux-variant="primary">Button 1</button>
                <button ux-enhance="button" ux-variant="secondary">Button 2</button>
                <span ux-enhance="badge" ux-variant="success">Badge</span>
            `;

            UIX.scan();

            const buttons = document.querySelectorAll('.ux-btn');
            const badges = document.querySelectorAll('.ux-badge');
            expect(buttons.length).toBe(2);
            expect(badges.length).toBe(1);
        });
    });

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    describe('Toast Notifications', () => {
        test('toast creates container and element with correct attributes', () => {
            const toastEl = window.uxXFactory.toast('Test message');

            // Check the returned element directly (avoids stale container issues)
            expect(toastEl).not.toBeNull();
            expect(toastEl.classList.contains('ux-toast')).toBe(true);
            expect(toastEl.textContent).toContain('Test message');
            expect(toastEl.getAttribute('role')).toBe('alert');

            // Check container was created
            const container = toastEl.parentElement;
            expect(container.classList.contains('ux-toast-container')).toBe(true);
        });

        test('toast supports type variants', () => {
            const types = ['success', 'warning', 'danger', 'info'];

            types.forEach(type => {
                const toastEl = window.uxXFactory.toast(`${type} message`, { type });

                expect(toastEl.classList.contains(`ux-toast--${type}`)).toBe(true);
            });
        });
    });

    // ============================================
    // PERFORMANCE
    // ============================================
    describe('Performance', () => {
        test('enhances 1000 elements efficiently', () => {
            const container = document.createElement('div');
            for (let i = 0; i < 1000; i++) {
                const btn = document.createElement('button');
                btn.setAttribute('ux-enhance', 'button');
                btn.setAttribute('ux-variant', 'primary');
                container.appendChild(btn);
            }
            document.body.appendChild(container);

            const startTime = Date.now();
            UIX.scan(container);
            const duration = Date.now() - startTime;

            const enhancedButtons = container.querySelectorAll('.ux-btn');
            expect(enhancedButtons.length).toBe(1000);
            expect(duration).toBeLessThan(500); // Should complete in under 500ms
        });
    });
});
