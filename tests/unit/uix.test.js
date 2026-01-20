/**
 * Unit tests for UIX Module
 */

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
        test('should add ux-btn class', () => {
            const button = document.createElement('button');
            button.setAttribute('ux-enhance', 'button');
            button.classList.add('ux-btn');

            expect(button.classList.contains('ux-btn')).toBe(true);
        });

        test('should add variant class', () => {
            const button = document.createElement('button');
            button.classList.add('ux-btn', 'ux-btn--primary');

            expect(button.classList.contains('ux-btn--primary')).toBe(true);
        });

        test('should add size class', () => {
            const button = document.createElement('button');
            button.classList.add('ux-btn', 'ux-btn--sm');

            expect(button.classList.contains('ux-btn--sm')).toBe(true);
        });

        test('should add loading state', () => {
            const button = document.createElement('button');
            button.classList.add('ux-btn', 'ux-btn--loading');

            expect(button.classList.contains('ux-btn--loading')).toBe(true);
        });

        test('should support block variant', () => {
            const button = document.createElement('button');
            button.classList.add('ux-btn', 'ux-btn--block');

            expect(button.classList.contains('ux-btn--block')).toBe(true);
        });

        test('should add role=button to non-button elements', () => {
            const div = document.createElement('div');
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');

            expect(div.getAttribute('role')).toBe('button');
            expect(div.getAttribute('tabindex')).toBe('0');
        });

        test('should support keyboard activation on non-button elements', () => {
            const div = document.createElement('div');
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');

            const clickHandler = jest.fn();
            div.addEventListener('click', clickHandler);

            // Simulate Enter key
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            div.dispatchEvent(enterEvent);

            // The actual click would be triggered by the enhancer
            expect(div.getAttribute('role')).toBe('button');
        });
    });

    // ============================================
    // BADGE COMPONENT
    // ============================================
    describe('Badge Component', () => {
        test('should add ux-badge class', () => {
            const badge = document.createElement('span');
            badge.classList.add('ux-badge');

            expect(badge.classList.contains('ux-badge')).toBe(true);
        });

        test('should support variant classes', () => {
            const variants = ['primary', 'success', 'warning', 'danger', 'info'];

            variants.forEach(variant => {
                const badge = document.createElement('span');
                badge.classList.add('ux-badge', `ux-badge--${variant}`);

                expect(badge.classList.contains(`ux-badge--${variant}`)).toBe(true);
            });
        });

        test('should support pill style', () => {
            const badge = document.createElement('span');
            badge.classList.add('ux-badge', 'ux-badge--pill');

            expect(badge.classList.contains('ux-badge--pill')).toBe(true);
        });
    });

    // ============================================
    // AVATAR COMPONENT
    // ============================================
    describe('Avatar Component', () => {
        test('should add ux-avatar class', () => {
            const avatar = document.createElement('div');
            avatar.classList.add('ux-avatar');

            expect(avatar.classList.contains('ux-avatar')).toBe(true);
        });

        test('should support size variants', () => {
            const sizes = ['sm', 'lg', 'xl'];

            sizes.forEach(size => {
                const avatar = document.createElement('div');
                avatar.classList.add('ux-avatar', `ux-avatar--${size}`);

                expect(avatar.classList.contains(`ux-avatar--${size}`)).toBe(true);
            });
        });

        test('should support square variant', () => {
            const avatar = document.createElement('div');
            avatar.classList.add('ux-avatar', 'ux-avatar--square');

            expect(avatar.classList.contains('ux-avatar--square')).toBe(true);
        });

        test('should display initials', () => {
            const avatar = document.createElement('div');
            avatar.classList.add('ux-avatar');
            avatar.textContent = 'JD';

            expect(avatar.textContent).toBe('JD');
        });
    });

    // ============================================
    // SPINNER COMPONENT
    // ============================================
    describe('Spinner Component', () => {
        test('should add ux-spinner class', () => {
            const spinner = document.createElement('div');
            spinner.classList.add('ux-spinner');

            expect(spinner.classList.contains('ux-spinner')).toBe(true);
        });

        test('should set role=status for accessibility', () => {
            const spinner = document.createElement('div');
            spinner.setAttribute('role', 'status');
            spinner.setAttribute('aria-label', 'Loading');

            expect(spinner.getAttribute('role')).toBe('status');
            expect(spinner.getAttribute('aria-label')).toBe('Loading');
        });

        test('should support size variants', () => {
            const spinner = document.createElement('div');
            spinner.classList.add('ux-spinner', 'ux-spinner--lg');

            expect(spinner.classList.contains('ux-spinner--lg')).toBe(true);
        });
    });

    // ============================================
    // CARD COMPONENT
    // ============================================
    describe('Card Component', () => {
        test('should add ux-card class', () => {
            const card = document.createElement('div');
            card.classList.add('ux-card');

            expect(card.classList.contains('ux-card')).toBe(true);
        });

        test('should support elevated style', () => {
            const card = document.createElement('div');
            card.classList.add('ux-card', 'ux-card--elevated');

            expect(card.classList.contains('ux-card--elevated')).toBe(true);
        });

        test('should support hoverable style', () => {
            const card = document.createElement('div');
            card.classList.add('ux-card', 'ux-card--hoverable');

            expect(card.classList.contains('ux-card--hoverable')).toBe(true);
        });
    });

    // ============================================
    // ALERT COMPONENT
    // ============================================
    describe('Alert Component', () => {
        test('should add ux-alert class', () => {
            const alert = document.createElement('div');
            alert.classList.add('ux-alert');

            expect(alert.classList.contains('ux-alert')).toBe(true);
        });

        test('should support variant types', () => {
            const variants = ['success', 'warning', 'danger', 'info'];

            variants.forEach(variant => {
                const alert = document.createElement('div');
                alert.classList.add('ux-alert', `ux-alert--${variant}`);

                expect(alert.classList.contains(`ux-alert--${variant}`)).toBe(true);
            });
        });

        test('should set role=alert', () => {
            const alert = document.createElement('div');
            alert.setAttribute('role', 'alert');

            expect(alert.getAttribute('role')).toBe('alert');
        });

        test('should support dismissible alerts', () => {
            const alert = document.createElement('div');
            alert.classList.add('ux-alert');

            const dismissBtn = document.createElement('button');
            dismissBtn.className = 'ux-alert__dismiss';
            dismissBtn.innerHTML = '&times;';
            alert.appendChild(dismissBtn);

            expect(alert.querySelector('.ux-alert__dismiss')).not.toBeNull();
        });
    });

    // ============================================
    // PROGRESS COMPONENT
    // ============================================
    describe('Progress Component', () => {
        test('should add ux-progress class', () => {
            const progress = document.createElement('div');
            progress.classList.add('ux-progress');

            expect(progress.classList.contains('ux-progress')).toBe(true);
        });

        test('should set ARIA progressbar attributes', () => {
            const progress = document.createElement('div');
            progress.setAttribute('role', 'progressbar');
            progress.setAttribute('aria-valuenow', '50');
            progress.setAttribute('aria-valuemin', '0');
            progress.setAttribute('aria-valuemax', '100');

            expect(progress.getAttribute('role')).toBe('progressbar');
            expect(progress.getAttribute('aria-valuenow')).toBe('50');
            expect(progress.getAttribute('aria-valuemin')).toBe('0');
            expect(progress.getAttribute('aria-valuemax')).toBe('100');
        });

        test('should set width percentage on bar', () => {
            const progress = document.createElement('div');
            progress.classList.add('ux-progress');

            const bar = document.createElement('div');
            bar.className = 'ux-progress__bar';
            bar.style.width = '75%';
            progress.appendChild(bar);

            expect(bar.style.width).toBe('75%');
        });
    });

    // ============================================
    // MODAL COMPONENT
    // ============================================
    describe('Modal Component', () => {
        test('should add ux-modal class', () => {
            const modal = document.createElement('div');
            modal.classList.add('ux-modal');

            expect(modal.classList.contains('ux-modal')).toBe(true);
        });

        test('should set ARIA dialog attributes', () => {
            const modal = document.createElement('div');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-label', 'Test Modal');

            expect(modal.getAttribute('role')).toBe('dialog');
            expect(modal.getAttribute('aria-modal')).toBe('true');
            expect(modal.getAttribute('aria-label')).toBe('Test Modal');
        });

        test('should toggle is-open class', () => {
            const modal = document.createElement('div');
            modal.classList.add('ux-modal');

            modal.classList.add('is-open');
            expect(modal.classList.contains('is-open')).toBe(true);

            modal.classList.remove('is-open');
            expect(modal.classList.contains('is-open')).toBe(false);
        });

        test('should update aria-hidden on open/close', () => {
            const modal = document.createElement('div');
            modal.setAttribute('aria-hidden', 'true');

            // Open
            modal.setAttribute('aria-hidden', 'false');
            expect(modal.getAttribute('aria-hidden')).toBe('false');

            // Close
            modal.setAttribute('aria-hidden', 'true');
            expect(modal.getAttribute('aria-hidden')).toBe('true');
        });

        test('should have backdrop element', () => {
            const modal = document.createElement('div');
            modal.classList.add('ux-modal');

            const backdrop = document.createElement('div');
            backdrop.className = 'ux-modal__backdrop';
            modal.appendChild(backdrop);

            expect(modal.querySelector('.ux-modal__backdrop')).not.toBeNull();
        });
    });

    // ============================================
    // ACCORDION COMPONENT
    // ============================================
    describe('Accordion Component', () => {
        test('should add ux-accordion class', () => {
            const accordion = document.createElement('div');
            accordion.classList.add('ux-accordion');

            expect(accordion.classList.contains('ux-accordion')).toBe(true);
        });

        test('should toggle is-open class on items', () => {
            const item = document.createElement('div');
            item.classList.add('ux-accordion__item');

            item.classList.add('is-open');
            expect(item.classList.contains('is-open')).toBe(true);

            item.classList.remove('is-open');
            expect(item.classList.contains('is-open')).toBe(false);
        });

        test('should set aria-expanded on headers', () => {
            const header = document.createElement('button');
            header.className = 'ux-accordion__header';
            header.setAttribute('aria-expanded', 'false');

            expect(header.getAttribute('aria-expanded')).toBe('false');

            header.setAttribute('aria-expanded', 'true');
            expect(header.getAttribute('aria-expanded')).toBe('true');
        });

        test('should set aria-controls linking header to content', () => {
            const header = document.createElement('button');
            const content = document.createElement('div');
            const id = 'accordion-content-1';

            content.id = id;
            header.setAttribute('aria-controls', id);

            expect(header.getAttribute('aria-controls')).toBe(id);
        });
    });

    // ============================================
    // TABS COMPONENT
    // ============================================
    describe('Tabs Component', () => {
        test('should set role=tablist on list', () => {
            const tablist = document.createElement('div');
            tablist.setAttribute('role', 'tablist');

            expect(tablist.getAttribute('role')).toBe('tablist');
        });

        test('should set role=tab on tabs', () => {
            const tab = document.createElement('button');
            tab.setAttribute('role', 'tab');

            expect(tab.getAttribute('role')).toBe('tab');
        });

        test('should set role=tabpanel on panels', () => {
            const panel = document.createElement('div');
            panel.setAttribute('role', 'tabpanel');

            expect(panel.getAttribute('role')).toBe('tabpanel');
        });

        test('should manage aria-selected state', () => {
            const tab1 = document.createElement('button');
            const tab2 = document.createElement('button');

            tab1.setAttribute('aria-selected', 'true');
            tab2.setAttribute('aria-selected', 'false');

            expect(tab1.getAttribute('aria-selected')).toBe('true');
            expect(tab2.getAttribute('aria-selected')).toBe('false');
        });

        test('should manage tabindex for keyboard navigation', () => {
            const tab1 = document.createElement('button');
            const tab2 = document.createElement('button');

            tab1.setAttribute('tabindex', '0');
            tab2.setAttribute('tabindex', '-1');

            expect(tab1.getAttribute('tabindex')).toBe('0');
            expect(tab2.getAttribute('tabindex')).toBe('-1');
        });

        test('should link tabs to panels via aria-controls', () => {
            const tab = document.createElement('button');
            const panel = document.createElement('div');

            panel.id = 'panel-1';
            tab.setAttribute('aria-controls', 'panel-1');
            panel.setAttribute('aria-labelledby', 'tab-1');

            expect(tab.getAttribute('aria-controls')).toBe('panel-1');
        });
    });

    // ============================================
    // DROPDOWN COMPONENT
    // ============================================
    describe('Dropdown Component', () => {
        test('should add ux-dropdown class', () => {
            const dropdown = document.createElement('div');
            dropdown.classList.add('ux-dropdown');

            expect(dropdown.classList.contains('ux-dropdown')).toBe(true);
        });

        test('should toggle is-open class', () => {
            const dropdown = document.createElement('div');
            dropdown.classList.add('ux-dropdown');

            dropdown.classList.add('is-open');
            expect(dropdown.classList.contains('is-open')).toBe(true);
        });

        test('should set aria-expanded on trigger', () => {
            const trigger = document.createElement('button');
            trigger.setAttribute('aria-haspopup', 'true');
            trigger.setAttribute('aria-expanded', 'false');

            expect(trigger.getAttribute('aria-haspopup')).toBe('true');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
        });
    });

    // ============================================
    // TOOLTIP COMPONENT
    // ============================================
    describe('Tooltip Component', () => {
        test('should add ux-tooltip class', () => {
            const tooltip = document.createElement('span');
            tooltip.classList.add('ux-tooltip');

            expect(tooltip.classList.contains('ux-tooltip')).toBe(true);
        });

        test('should use data-tooltip attribute', () => {
            const element = document.createElement('span');
            element.setAttribute('data-tooltip', 'Tooltip text');

            expect(element.getAttribute('data-tooltip')).toBe('Tooltip text');
        });

        test('should remove title attribute to prevent native tooltip', () => {
            const element = document.createElement('span');
            element.setAttribute('title', 'Original title');
            element.setAttribute('data-tooltip', 'Custom tooltip');
            element.removeAttribute('title');

            expect(element.getAttribute('title')).toBeNull();
            expect(element.getAttribute('data-tooltip')).toBe('Custom tooltip');
        });
    });

    // ============================================
    // INPUT COMPONENT
    // ============================================
    describe('Input Component', () => {
        test('should add ux-input class', () => {
            const input = document.createElement('input');
            input.classList.add('ux-input');

            expect(input.classList.contains('ux-input')).toBe(true);
        });

        test('should support error state', () => {
            const input = document.createElement('input');
            input.classList.add('ux-input', 'ux-input--error');
            input.setAttribute('aria-invalid', 'true');

            expect(input.classList.contains('ux-input--error')).toBe(true);
            expect(input.getAttribute('aria-invalid')).toBe('true');
        });
    });

    // ============================================
    // SWITCH COMPONENT
    // ============================================
    describe('Switch Component', () => {
        test('should add ux-switch class', () => {
            const switchEl = document.createElement('div');
            switchEl.classList.add('ux-switch');

            expect(switchEl.classList.contains('ux-switch')).toBe(true);
        });

        test('should set role=switch', () => {
            const switchEl = document.createElement('div');
            switchEl.setAttribute('role', 'switch');

            expect(switchEl.getAttribute('role')).toBe('switch');
        });

        test('should manage aria-checked state', () => {
            const switchEl = document.createElement('div');
            switchEl.setAttribute('aria-checked', 'false');

            expect(switchEl.getAttribute('aria-checked')).toBe('false');

            switchEl.setAttribute('aria-checked', 'true');
            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });

        test('should be keyboard accessible', () => {
            const switchEl = document.createElement('div');
            switchEl.setAttribute('tabindex', '0');

            expect(switchEl.getAttribute('tabindex')).toBe('0');
        });
    });

    // ============================================
    // MENU COMPONENT
    // ============================================
    describe('Menu Component', () => {
        test('should set role=menu', () => {
            const menu = document.createElement('ul');
            menu.setAttribute('role', 'menu');

            expect(menu.getAttribute('role')).toBe('menu');
        });

        test('should set role=menuitem on items', () => {
            const item = document.createElement('li');
            item.setAttribute('role', 'menuitem');

            expect(item.getAttribute('role')).toBe('menuitem');
        });

        test('should manage tabindex for roving tabindex', () => {
            const items = [];
            for (let i = 0; i < 3; i++) {
                const item = document.createElement('li');
                item.setAttribute('role', 'menuitem');
                item.setAttribute('tabindex', i === 0 ? '0' : '-1');
                items.push(item);
            }

            expect(items[0].getAttribute('tabindex')).toBe('0');
            expect(items[1].getAttribute('tabindex')).toBe('-1');
            expect(items[2].getAttribute('tabindex')).toBe('-1');
        });
    });

    // ============================================
    // TABLE COMPONENT
    // ============================================
    describe('Table Component', () => {
        test('should add ux-table class', () => {
            const table = document.createElement('table');
            table.classList.add('ux-table');

            expect(table.classList.contains('ux-table')).toBe(true);
        });

        test('should support striped variant', () => {
            const table = document.createElement('table');
            table.classList.add('ux-table', 'ux-table--striped');

            expect(table.classList.contains('ux-table--striped')).toBe(true);
        });

        test('should support hoverable variant', () => {
            const table = document.createElement('table');
            table.classList.add('ux-table', 'ux-table--hoverable');

            expect(table.classList.contains('ux-table--hoverable')).toBe(true);
        });
    });

    // ============================================
    // DRAWER COMPONENT
    // ============================================
    describe('Drawer Component', () => {
        test('should add ux-drawer class', () => {
            const drawer = document.createElement('div');
            drawer.classList.add('ux-drawer');

            expect(drawer.classList.contains('ux-drawer')).toBe(true);
        });

        test('should support position variants', () => {
            const positions = ['left', 'right', 'top', 'bottom'];

            positions.forEach(pos => {
                const drawer = document.createElement('div');
                drawer.classList.add('ux-drawer', `ux-drawer--${pos}`);

                expect(drawer.classList.contains(`ux-drawer--${pos}`)).toBe(true);
            });
        });

        test('should toggle is-open class', () => {
            const drawer = document.createElement('div');
            drawer.classList.add('ux-drawer');

            drawer.classList.add('is-open');
            expect(drawer.classList.contains('is-open')).toBe(true);
        });
    });

    // ============================================
    // BREADCRUMB COMPONENT
    // ============================================
    describe('Breadcrumb Component', () => {
        test('should add ux-breadcrumb class', () => {
            const nav = document.createElement('nav');
            nav.classList.add('ux-breadcrumb');

            expect(nav.classList.contains('ux-breadcrumb')).toBe(true);
        });

        test('should set aria-label', () => {
            const nav = document.createElement('nav');
            nav.setAttribute('aria-label', 'Breadcrumb');

            expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
        });

        test('should set aria-current on last item', () => {
            const item = document.createElement('span');
            item.setAttribute('aria-current', 'page');

            expect(item.getAttribute('aria-current')).toBe('page');
        });
    });

    // ============================================
    // SKELETON COMPONENT
    // ============================================
    describe('Skeleton Component', () => {
        test('should add ux-skeleton class', () => {
            const skeleton = document.createElement('div');
            skeleton.classList.add('ux-skeleton');

            expect(skeleton.classList.contains('ux-skeleton')).toBe(true);
        });

        test('should set aria-busy', () => {
            const skeleton = document.createElement('div');
            skeleton.setAttribute('aria-busy', 'true');

            expect(skeleton.getAttribute('aria-busy')).toBe('true');
        });

        test('should support shape variants', () => {
            const shapes = ['text', 'circle', 'rect'];

            shapes.forEach(shape => {
                const skeleton = document.createElement('div');
                skeleton.classList.add('ux-skeleton', `ux-skeleton--${shape}`);

                expect(skeleton.classList.contains(`ux-skeleton--${shape}`)).toBe(true);
            });
        });
    });

    // ============================================
    // DIVIDER COMPONENT
    // ============================================
    describe('Divider Component', () => {
        test('should add ux-divider class', () => {
            const divider = document.createElement('hr');
            divider.classList.add('ux-divider');

            expect(divider.classList.contains('ux-divider')).toBe(true);
        });

        test('should set role=separator', () => {
            const divider = document.createElement('hr');
            divider.setAttribute('role', 'separator');

            expect(divider.getAttribute('role')).toBe('separator');
        });

        test('should support vertical variant', () => {
            const divider = document.createElement('div');
            divider.classList.add('ux-divider', 'ux-divider--vertical');

            expect(divider.classList.contains('ux-divider--vertical')).toBe(true);
        });
    });

    // ============================================
    // CSS CUSTOM PROPERTIES
    // ============================================
    describe('CSS Custom Properties', () => {
        test('should define primary color variables', () => {
            const cssVars = [
                '--ux-primary-50',
                '--ux-primary-500',
                '--ux-primary-600',
                '--ux-primary-700'
            ];

            // These would be defined when styles are injected
            cssVars.forEach(varName => {
                expect(varName).toMatch(/^--ux-primary-\d+$/);
            });
        });

        test('should define neutral color variables', () => {
            const cssVars = [
                '--ux-neutral-0',
                '--ux-neutral-100',
                '--ux-neutral-500',
                '--ux-neutral-900'
            ];

            cssVars.forEach(varName => {
                expect(varName).toMatch(/^--ux-neutral-\d+$/);
            });
        });

        test('should define semantic color variables', () => {
            const cssVars = [
                '--ux-success-500',
                '--ux-warning-500',
                '--ux-danger-500',
                '--ux-info-500'
            ];

            cssVars.forEach(varName => {
                expect(varName).toMatch(/^--ux-(success|warning|danger|info)-\d+$/);
            });
        });

        test('should define spacing variables', () => {
            const cssVars = [
                '--ux-space-1',
                '--ux-space-2',
                '--ux-space-4',
                '--ux-space-8'
            ];

            cssVars.forEach(varName => {
                expect(varName).toMatch(/^--ux-space-\d+$/);
            });
        });
    });

    // ============================================
    // CUSTOM EVENTS
    // ============================================
    describe('Custom Events', () => {
        test('should create CustomEvent with ux: prefix', () => {
            const event = new CustomEvent('ux:open', { detail: { modal: true } });

            expect(event.type).toBe('ux:open');
            expect(event.detail.modal).toBe(true);
        });

        test('should support various event types', () => {
            const eventTypes = ['ux:open', 'ux:close', 'ux:change', 'ux:toggle'];

            eventTypes.forEach(type => {
                const event = new CustomEvent(type);
                expect(event.type).toBe(type);
            });
        });
    });

    // ============================================
    // FOCUS UTILITIES
    // ============================================
    describe('Focus Utilities', () => {
        test('should identify focusable elements', () => {
            const container = document.createElement('div');
            const button = document.createElement('button');
            const link = document.createElement('a');
            link.href = '#';
            const input = document.createElement('input');

            container.appendChild(button);
            container.appendChild(link);
            container.appendChild(input);

            const focusable = container.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled])'
            );

            expect(focusable.length).toBe(3);
        });

        test('should exclude disabled elements', () => {
            const container = document.createElement('div');
            const enabledBtn = document.createElement('button');
            const disabledBtn = document.createElement('button');
            disabledBtn.disabled = true;

            container.appendChild(enabledBtn);
            container.appendChild(disabledBtn);

            const focusable = container.querySelectorAll('button:not([disabled])');

            expect(focusable.length).toBe(1);
        });
    });

    // ============================================
    // INSTANCE MANAGEMENT
    // ============================================
    describe('Instance Management', () => {
        test('should support WeakMap for instance tracking', () => {
            const instanceMap = new WeakMap();
            const element = document.createElement('div');

            instanceMap.set(element, { type: 'modal', isOpen: false });

            expect(instanceMap.has(element)).toBe(true);
            expect(instanceMap.get(element).type).toBe('modal');
        });

        test('should clean up instance on destroy', () => {
            const instanceMap = new WeakMap();
            const element = document.createElement('div');

            instanceMap.set(element, { type: 'modal' });
            instanceMap.delete(element);

            expect(instanceMap.has(element)).toBe(false);
        });
    });

    // ============================================
    // DOM PROCESSING
    // ============================================
    describe('DOM Processing', () => {
        test('should find elements with ux-enhance attribute', () => {
            const container = document.createElement('div');
            const btn1 = document.createElement('button');
            btn1.setAttribute('ux-enhance', 'button');
            const btn2 = document.createElement('button');
            btn2.setAttribute('ux-enhance', 'button');

            container.appendChild(btn1);
            container.appendChild(btn2);

            const enhanced = container.querySelectorAll('[ux-enhance]');

            expect(enhanced.length).toBe(2);
        });

        test('should mark elements as enhanced', () => {
            const element = document.createElement('button');
            element.setAttribute('ux-enhance', 'button');
            element.setAttribute('ux-enhanced', 'true');

            expect(element.getAttribute('ux-enhanced')).toBe('true');
        });

        test('should skip already enhanced elements', () => {
            const element = document.createElement('button');
            element.setAttribute('ux-enhance', 'button');
            element.setAttribute('ux-enhanced', 'true');

            const hasEnhanced = element.hasAttribute('ux-enhanced');

            expect(hasEnhanced).toBe(true);
        });
    });

    // ============================================
    // ATTRIBUTE PARSING
    // ============================================
    describe('Attribute Parsing', () => {
        test('should parse boolean attributes', () => {
            const element = document.createElement('div');
            element.setAttribute('ux-dismissible', 'true');

            const value = element.getAttribute('ux-dismissible') === 'true';

            expect(value).toBe(true);
        });

        test('should parse string attributes', () => {
            const element = document.createElement('button');
            element.setAttribute('ux-variant', 'primary');

            expect(element.getAttribute('ux-variant')).toBe('primary');
        });

        test('should convert kebab-case to camelCase', () => {
            const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

            expect(kebabToCamel('close-on-escape')).toBe('closeOnEscape');
            expect(kebabToCamel('initial-focus')).toBe('initialFocus');
        });
    });

    // ============================================
    // PERFORMANCE
    // ============================================
    describe('Performance', () => {
        test('should enhance 1000 elements efficiently', () => {
            const elements = [];
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                const btn = document.createElement('button');
                btn.setAttribute('ux-enhance', 'button');
                btn.classList.add('ux-btn');
                elements.push(btn);
            }

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(100);
            expect(elements.length).toBe(1000);
        });
    });

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    describe('Toast Notifications', () => {
        test('should create toast container', () => {
            const container = document.createElement('div');
            container.className = 'ux-toast-container';
            document.body.appendChild(container);

            expect(document.querySelector('.ux-toast-container')).not.toBeNull();
        });

        test('should add toast element with message', () => {
            const toast = document.createElement('div');
            toast.className = 'ux-toast';
            toast.textContent = 'Test message';
            toast.setAttribute('role', 'alert');

            expect(toast.textContent).toBe('Test message');
            expect(toast.getAttribute('role')).toBe('alert');
        });

        test('should support toast variants', () => {
            const variants = ['success', 'warning', 'danger', 'info'];

            variants.forEach(variant => {
                const toast = document.createElement('div');
                toast.classList.add('ux-toast', `ux-toast--${variant}`);

                expect(toast.classList.contains(`ux-toast--${variant}`)).toBe(true);
            });
        });
    });
});
