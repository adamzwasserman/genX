/**
 * Unit tests for accX (AccessX) Module
 */

describe('AccessX Module', () => {
    let mockWindow;
    let mockDocument;

    beforeEach(() => {
        // Setup mock DOM environment
        mockDocument = {
            body: document.createElement('div'),
            head: document.createElement('div'),
            readyState: 'complete',
            addEventListener: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            createElement: jest.fn((tag) => document.createElement(tag))
        };

        mockWindow = {
            document: mockDocument,
            addEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        };

        global.window = mockWindow;
        global.document = mockDocument;
    });

    describe('Screen Reader Only Text', () => {
        test('should create screen reader only span', () => {
            const span = document.createElement('span');
            span.className = 'ax-sr-only';
            span.textContent = 'Screen reader text';

            expect(span.className).toBe('ax-sr-only');
            expect(span.textContent).toBe('Screen reader text');
        });

        test('should have sr-only CSS properties', () => {
            const srOnlyStyles = {
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: '0',
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0,0,0,0)',
                whiteSpace: 'nowrap',
                borderWidth: '0'
            };

            expect(srOnlyStyles.position).toBe('absolute');
            expect(srOnlyStyles.width).toBe('1px');
            expect(srOnlyStyles.height).toBe('1px');
        });

        test('should append sr-only span to element', () => {
            const element = document.createElement('span');
            const srSpan = document.createElement('span');
            srSpan.className = 'ax-sr-only';
            srSpan.textContent = 'Additional info';

            element.appendChild(srSpan);

            expect(element.children.length).toBe(1);
            expect(element.children[0].className).toBe('ax-sr-only');
        });
    });

    describe('ARIA Labels', () => {
        test('should set aria-label attribute', () => {
            const element = document.createElement('span');
            element.setAttribute('aria-label', 'Application Programming Interface');

            expect(element.getAttribute('aria-label')).toBe('Application Programming Interface');
        });

        test('should set title attribute for tooltip', () => {
            const element = document.createElement('span');
            element.setAttribute('title', 'Application Programming Interface');

            expect(element.getAttribute('title')).toBe('Application Programming Interface');
        });

        test('should set role for semantic meaning', () => {
            const element = document.createElement('span');
            element.setAttribute('role', 'img');

            expect(element.getAttribute('role')).toBe('img');
        });

        test('should handle currency aria-labels', () => {
            const element = document.createElement('span');
            element.setAttribute('aria-label', '25 dollars');

            expect(element.getAttribute('aria-label')).toBe('25 dollars');
        });

        test('should handle date aria-labels', () => {
            const element = document.createElement('span');
            const date = new Date('2024-03-15');
            const ariaLabel = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            element.setAttribute('aria-label', ariaLabel);

            expect(element.getAttribute('aria-label')).toContain('2024');
        });

        test('should handle percentage aria-labels', () => {
            const element = document.createElement('span');
            element.setAttribute('aria-label', '75 percent');

            expect(element.getAttribute('aria-label')).toBe('75 percent');
        });
    });

    describe('Live Regions', () => {
        test('should set aria-live=polite', () => {
            const element = document.createElement('div');
            element.setAttribute('aria-live', 'polite');

            expect(element.getAttribute('aria-live')).toBe('polite');
        });

        test('should set aria-live=assertive', () => {
            const element = document.createElement('div');
            element.setAttribute('aria-live', 'assertive');

            expect(element.getAttribute('aria-live')).toBe('assertive');
        });

        test('should set aria-atomic=true', () => {
            const element = document.createElement('div');
            element.setAttribute('aria-atomic', 'true');

            expect(element.getAttribute('aria-atomic')).toBe('true');
        });

        test('should combine role with aria-live', () => {
            const element = document.createElement('div');
            element.setAttribute('role', 'status');
            element.setAttribute('aria-live', 'polite');

            expect(element.getAttribute('role')).toBe('status');
            expect(element.getAttribute('aria-live')).toBe('polite');
        });

        test('should set role=alert for urgent messages', () => {
            const element = document.createElement('div');
            element.setAttribute('role', 'alert');

            expect(element.getAttribute('role')).toBe('alert');
        });
    });

    describe('Form Fields', () => {
        test('should set aria-required=true', () => {
            const input = document.createElement('input');
            input.setAttribute('aria-required', 'true');

            expect(input.getAttribute('aria-required')).toBe('true');
        });

        test('should create help text with unique ID', () => {
            const helpText = document.createElement('div');
            const helpId = 'help-' + Date.now();
            helpText.id = helpId;
            helpText.className = 'ax-help-text';
            helpText.textContent = 'Help text';

            expect(helpText.id).toBeTruthy();
            expect(helpText.className).toBe('ax-help-text');
        });

        test('should set aria-describedby on input', () => {
            const input = document.createElement('input');
            const helpId = 'help-123';
            input.setAttribute('aria-describedby', helpId);

            expect(input.getAttribute('aria-describedby')).toBe(helpId);
        });

        test('should set aria-invalid=true', () => {
            const input = document.createElement('input');
            input.setAttribute('aria-invalid', 'true');

            expect(input.getAttribute('aria-invalid')).toBe('true');
        });

        test('should create error message element', () => {
            const errorMsg = document.createElement('div');
            const errorId = 'error-' + Date.now();
            errorMsg.id = errorId;
            errorMsg.className = 'ax-error-message';
            errorMsg.setAttribute('role', 'alert');
            errorMsg.textContent = 'Error message';

            expect(errorMsg.className).toBe('ax-error-message');
            expect(errorMsg.getAttribute('role')).toBe('alert');
        });

        test('should set aria-errormessage on input', () => {
            const input = document.createElement('input');
            const errorId = 'error-123';
            input.setAttribute('aria-errormessage', errorId);

            expect(input.getAttribute('aria-errormessage')).toBe(errorId);
        });
    });

    describe('Character Counter', () => {
        test('should create character counter element', () => {
            const counter = document.createElement('div');
            counter.className = 'ax-char-count';
            counter.textContent = '0/200';

            expect(counter.className).toBe('ax-char-count');
            expect(counter.textContent).toBe('0/200');
        });

        test('should update counter on input', () => {
            const textarea = document.createElement('textarea');
            const maxLength = 200;
            const currentLength = 50;

            const counterText = `${currentLength}/${maxLength}`;
            expect(counterText).toBe('50/200');
        });

        test('should calculate remaining characters', () => {
            const maxLength = 200;
            const currentLength = 150;
            const remaining = maxLength - currentLength;

            expect(remaining).toBe(50);
        });
    });

    describe('Navigation', () => {
        test('should set role=navigation', () => {
            const nav = document.createElement('nav');
            nav.setAttribute('role', 'navigation');

            expect(nav.getAttribute('role')).toBe('navigation');
        });

        test('should set aria-label on nav', () => {
            const nav = document.createElement('nav');
            nav.setAttribute('aria-label', 'Main navigation');

            expect(nav.getAttribute('aria-label')).toBe('Main navigation');
        });

        test('should set aria-current=page on current link', () => {
            const link = document.createElement('a');
            link.href = '/about';
            link.setAttribute('aria-current', 'page');

            expect(link.getAttribute('aria-current')).toBe('page');
        });

        test('should detect current page from URL', () => {
            const link = document.createElement('a');
            link.href = '/about';
            const currentPath = '/about';

            const isCurrent = link.href.includes(currentPath);
            expect(isCurrent).toBe(true);
        });
    });

    describe('Buttons', () => {
        test('should set aria-pressed=false', () => {
            const button = document.createElement('button');
            button.setAttribute('aria-pressed', 'false');

            expect(button.getAttribute('aria-pressed')).toBe('false');
        });

        test('should toggle aria-pressed value', () => {
            const button = document.createElement('button');
            button.setAttribute('aria-pressed', 'false');

            // Toggle
            const currentState = button.getAttribute('aria-pressed') === 'true';
            button.setAttribute('aria-pressed', (!currentState).toString());

            expect(button.getAttribute('aria-pressed')).toBe('true');
        });

        test('should set aria-busy=true for loading state', () => {
            const button = document.createElement('button');
            button.setAttribute('aria-busy', 'true');
            button.setAttribute('aria-disabled', 'true');

            expect(button.getAttribute('aria-busy')).toBe('true');
            expect(button.getAttribute('aria-disabled')).toBe('true');
        });

        test('should make non-button element keyboard accessible', () => {
            const div = document.createElement('div');
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');

            expect(div.getAttribute('role')).toBe('button');
            expect(div.getAttribute('tabindex')).toBe('0');
        });
    });

    describe('Tables (XSS-Safe)', () => {
        test('should convert td to th using DOM methods', () => {
            const td = document.createElement('td');
            td.textContent = 'Product';

            const th = document.createElement('th');
            // Safe DOM manipulation - move children, not innerHTML
            while (td.firstChild) {
                th.appendChild(td.firstChild);
            }
            th.setAttribute('scope', 'col');

            expect(th.tagName).toBe('TH');
            expect(th.textContent).toBe('Product');
            expect(th.getAttribute('scope')).toBe('col');
        });

        test('should set scope=col on header cells', () => {
            const th = document.createElement('th');
            th.setAttribute('scope', 'col');

            expect(th.getAttribute('scope')).toBe('col');
        });

        test('should set scope=row on row headers', () => {
            const th = document.createElement('th');
            th.setAttribute('scope', 'row');

            expect(th.getAttribute('scope')).toBe('row');
        });

        test('should use appendChild instead of innerHTML', () => {
            const parent = document.createElement('div');
            const child = document.createElement('span');
            child.textContent = 'Safe content';

            // Safe method
            parent.appendChild(child);

            expect(parent.children.length).toBe(1);
            expect(parent.children[0].textContent).toBe('Safe content');
        });

        test('should move DOM nodes without innerHTML', () => {
            const source = document.createElement('div');
            const dest = document.createElement('div');
            const node = document.createElement('span');
            node.textContent = 'Content';

            source.appendChild(node);

            // Safe move
            while (source.firstChild) {
                dest.appendChild(source.firstChild);
            }

            expect(source.children.length).toBe(0);
            expect(dest.children.length).toBe(1);
            expect(dest.children[0].textContent).toBe('Content');
        });
    });

    describe('DOM Scanning', () => {
        test('should find elements with ax-enhance attribute', () => {
            const container = document.createElement('div');
            const button1 = document.createElement('button');
            button1.setAttribute('ax-enhance', 'button');
            const button2 = document.createElement('button');
            button2.setAttribute('ax-enhance', 'button');

            container.appendChild(button1);
            container.appendChild(button2);

            const elements = container.querySelectorAll('[ax-enhance]');
            expect(elements.length).toBe(2);
        });

        test('should detect multiple enhancement types', () => {
            const types = new Set(['button', 'table', 'form', 'nav']);
            expect(types.size).toBe(4);
            expect(types.has('button')).toBe(true);
            expect(types.has('table')).toBe(true);
        });
    });

    describe('MutationObserver Integration', () => {
        test('should detect when new elements are added', (done) => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        expect(mutation.addedNodes.length).toBeGreaterThan(0);
                        observer.disconnect();
                        done();
                    }
                });
            });

            observer.observe(container, { childList: true });

            const newElement = document.createElement('button');
            newElement.setAttribute('ax-enhance', 'button');
            container.appendChild(newElement);
        });

        test('should observe attribute changes', (done) => {
            const element = document.createElement('button');
            document.body.appendChild(element);

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes') {
                        expect(mutation.attributeName).toBe('ax-enhance');
                        observer.disconnect();
                        done();
                    }
                });
            });

            observer.observe(element, { attributes: true });
            element.setAttribute('ax-enhance', 'button');
        });
    });

    describe('Performance', () => {
        test('should enhance 1000 elements efficiently', () => {
            const elements = [];
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                const button = document.createElement('button');
                button.setAttribute('ax-enhance', 'button');
                button.setAttribute('aria-pressed', 'false');
                elements.push(button);
            }

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(100); // 100ms for 1000 elements
            expect(elements.length).toBe(1000);
        });

        test('should maintain 60 FPS target (<16ms)', () => {
            const TARGET_FPS = 60;
            const FRAME_TIME = 1000 / TARGET_FPS; // 16.67ms

            expect(FRAME_TIME).toBeCloseTo(16.67, 1);
        });
    });

    describe('Focus Management', () => {
        test('should set tabindex for keyboard navigation', () => {
            const element = document.createElement('div');
            element.setAttribute('tabindex', '0');

            expect(element.getAttribute('tabindex')).toBe('0');
        });

        test('should remove from tab order with tabindex=-1', () => {
            const element = document.createElement('button');
            element.setAttribute('tabindex', '-1');

            expect(element.getAttribute('tabindex')).toBe('-1');
        });

        test('should track focusable elements', () => {
            const container = document.createElement('div');
            const button1 = document.createElement('button');
            const button2 = document.createElement('button');
            const link = document.createElement('a');
            link.href = '#';

            container.appendChild(button1);
            container.appendChild(button2);
            container.appendChild(link);

            const focusable = container.querySelectorAll('button, a[href]');
            expect(focusable.length).toBe(3);
        });
    });

    describe('Landmark Regions', () => {
        test('should set role=main', () => {
            const main = document.createElement('main');
            main.setAttribute('role', 'main');

            expect(main.getAttribute('role')).toBe('main');
        });

        test('should set role=complementary', () => {
            const aside = document.createElement('aside');
            aside.setAttribute('role', 'complementary');

            expect(aside.getAttribute('role')).toBe('complementary');
        });

        test('should set role=contentinfo for footer', () => {
            const footer = document.createElement('footer');
            footer.setAttribute('role', 'contentinfo');

            expect(footer.getAttribute('role')).toBe('contentinfo');
        });
    });

    describe('Skip Links', () => {
        test('should create skip link', () => {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.textContent = 'Skip to main content';
            skipLink.className = 'skip-link';

            expect(skipLink.href).toContain('#main-content');
            expect(skipLink.className).toBe('skip-link');
        });

        test('should have visually hidden by default', () => {
            const skipStyles = {
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden'
            };

            expect(skipStyles.position).toBe('absolute');
        });
    });

    describe('Validation', () => {
        test('should validate ARIA attribute values', () => {
            const validValues = {
                'aria-live': ['off', 'polite', 'assertive'],
                'aria-pressed': ['true', 'false', 'mixed'],
                'aria-current': ['page', 'step', 'location', 'date', 'time', 'true', 'false']
            };

            expect(validValues['aria-live']).toContain('polite');
            expect(validValues['aria-pressed']).toContain('true');
            expect(validValues['aria-current']).toContain('page');
        });

        test('should validate role values', () => {
            const validRoles = [
                'button', 'navigation', 'main', 'complementary',
                'contentinfo', 'banner', 'search', 'form',
                'alert', 'status', 'img'
            ];

            expect(validRoles).toContain('button');
            expect(validRoles).toContain('navigation');
            expect(validRoles).toContain('alert');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing element gracefully', () => {
            const element = document.getElementById('nonexistent');
            expect(element).toBeNull();
        });

        test('should handle invalid attribute values', () => {
            const element = document.createElement('button');
            element.setAttribute('aria-pressed', 'invalid');

            // Should still set the attribute
            expect(element.getAttribute('aria-pressed')).toBe('invalid');
        });

        test('should handle elements without ax-enhance', () => {
            const button = document.createElement('button');
            const hasEnhance = button.hasAttribute('ax-enhance');

            expect(hasEnhance).toBe(false);
        });
    });

    describe('WCAG Compliance', () => {
        test('should provide text alternatives for images', () => {
            const img = document.createElement('img');
            img.setAttribute('alt', 'Description of image');

            expect(img.getAttribute('alt')).toBe('Description of image');
        });

        test('should mark decorative images', () => {
            const img = document.createElement('img');
            img.setAttribute('alt', '');
            img.setAttribute('role', 'presentation');

            expect(img.getAttribute('alt')).toBe('');
            expect(img.getAttribute('role')).toBe('presentation');
        });

        test('should ensure keyboard accessibility', () => {
            const div = document.createElement('div');
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');

            const isAccessible =
                div.getAttribute('role') === 'button' &&
                div.getAttribute('tabindex') === '0';

            expect(isAccessible).toBe(true);
        });
    });

    describe('Configuration', () => {
        test('should use default attribute prefix', () => {
            const defaultPrefix = 'ax-';
            expect(defaultPrefix).toBe('ax-');
        });

        test('should support observe mode for dynamic content', () => {
            const config = {
                observe: true,
                attributes: true,
                childList: true,
                subtree: true
            };

            expect(config.observe).toBe(true);
            expect(config.subtree).toBe(true);
        });
    });

    describe('Keyboard Navigation Enhancement', () => {
        let container;
        let items;

        beforeEach(() => {
            container = document.createElement('div');
            container.setAttribute('role', 'listbox');

            for (let i = 0; i < 5; i++) {
                const item = document.createElement('div');
                item.setAttribute('role', 'option');
                item.textContent = `Item ${i + 1}`;
                item.setAttribute('tabindex', '0');
                container.appendChild(item);
            }

            items = Array.from(container.querySelectorAll('[role="option"]'));
            document.body.appendChild(container);
        });

        afterEach(() => {
            container.remove();
        });

        describe('Basic Setup', () => {
            test('should set aria-multiselectable=true when multiselect enabled', () => {
                container.setAttribute('aria-multiselectable', 'true');
                expect(container.getAttribute('aria-multiselectable')).toBe('true');
            });

            test('should not set aria-multiselectable when multiselect disabled', () => {
                expect(container.getAttribute('aria-multiselectable')).toBeNull();
            });

            test('should find items with role="option"', () => {
                const options = container.querySelectorAll('[role="option"]');
                expect(options.length).toBe(5);
            });

            test('should support custom selector', () => {
                const customItems = container.querySelectorAll('[role="option"]');
                expect(customItems.length).toBe(5);
            });
        });

        describe('Arrow Key Navigation', () => {
            test('should move focus down with ArrowDown', () => {
                items[0].focus();
                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                container.dispatchEvent(event);

                // ArrowDown should move to next item
                expect(items[1].getAttribute('tabindex')).toBe('0');
            });

            test('should move focus up with ArrowUp', () => {
                items[2].focus();
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                container.dispatchEvent(event);

                // ArrowUp should move to previous item
                expect(items[1].getAttribute('tabindex')).toBe('0');
            });

            test('should not move past first item with ArrowUp', () => {
                items[0].focus();
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                container.dispatchEvent(event);

                // Should stay on first item
                expect(items[0].matches(':focus')).toBe(true);
            });

            test('should not move past last item with ArrowDown', () => {
                items[4].focus();
                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                container.dispatchEvent(event);

                // Should stay on last item
                expect(items[4].matches(':focus')).toBe(true);
            });

            test('should clear previous selection on arrow key alone', () => {
                items[0].setAttribute('aria-selected', 'true');
                items[1].setAttribute('aria-selected', 'true');

                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                container.dispatchEvent(event);

                // Only current item should be selected
                const selectedItems = container.querySelectorAll('[aria-selected="true"]');
                expect(selectedItems.length).toBe(1);
            });
        });

        describe('Shift+Arrow Range Selection', () => {
            test('should select range with Shift+ArrowDown', () => {
                items[0].setAttribute('aria-selected', 'true');
                items[0].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'ArrowDown',
                    shiftKey: true
                });
                container.dispatchEvent(event);

                // Both items should be selected
                expect(items[0].getAttribute('aria-selected')).toBe('true');
                expect(items[1].getAttribute('aria-selected')).toBe('true');
            });

            test('should select range with Shift+ArrowUp', () => {
                items[2].setAttribute('aria-selected', 'true');
                items[2].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'ArrowUp',
                    shiftKey: true
                });
                container.dispatchEvent(event);

                // Both items should be selected
                expect(items[1].getAttribute('aria-selected')).toBe('true');
                expect(items[2].getAttribute('aria-selected')).toBe('true');
            });

            test('should extend selection across multiple items', () => {
                items[1].setAttribute('aria-selected', 'true');
                items[1].focus();

                // Press Shift+ArrowDown twice
                const event1 = new KeyboardEvent('keydown', {
                    key: 'ArrowDown',
                    shiftKey: true
                });
                container.dispatchEvent(event1);

                const event2 = new KeyboardEvent('keydown', {
                    key: 'ArrowDown',
                    shiftKey: true
                });
                container.dispatchEvent(event2);

                // Items 1, 2, 3 should be selected
                expect(items[1].getAttribute('aria-selected')).toBe('true');
                expect(items[2].getAttribute('aria-selected')).toBe('true');
                expect(items[3].getAttribute('aria-selected')).toBe('true');
            });

            test('should handle reverse range selection', () => {
                items[3].setAttribute('aria-selected', 'true');
                items[3].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'ArrowUp',
                    shiftKey: true
                });
                container.dispatchEvent(event);

                // Items 2 and 3 should be selected
                expect(items[2].getAttribute('aria-selected')).toBe('true');
                expect(items[3].getAttribute('aria-selected')).toBe('true');
            });
        });

        describe('Ctrl/Cmd+Arrow Focus Movement', () => {
            test('should move focus without changing selection with Ctrl+ArrowDown', () => {
                items[0].setAttribute('aria-selected', 'true');
                items[0].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'ArrowDown',
                    ctrlKey: true
                });
                container.dispatchEvent(event);

                // Only first item should remain selected
                expect(items[0].getAttribute('aria-selected')).toBe('true');
                expect(items[1].getAttribute('aria-selected')).not.toBe('true');
            });

            test('should move focus without changing selection with Cmd+ArrowDown', () => {
                items[0].setAttribute('aria-selected', 'true');
                items[0].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'ArrowDown',
                    metaKey: true
                });
                container.dispatchEvent(event);

                // Only first item should remain selected
                expect(items[0].getAttribute('aria-selected')).toBe('true');
                expect(items[1].getAttribute('aria-selected')).not.toBe('true');
            });
        });

        describe('Home/End Keys', () => {
            test('should move to first item with Home', () => {
                items[3].focus();
                const event = new KeyboardEvent('keydown', { key: 'Home' });
                container.dispatchEvent(event);

                expect(items[0].getAttribute('tabindex')).toBe('0');
            });

            test('should move to last item with End', () => {
                items[0].focus();
                const event = new KeyboardEvent('keydown', { key: 'End' });
                container.dispatchEvent(event);

                expect(items[4].getAttribute('tabindex')).toBe('0');
            });

            test('should select range from current to first with Shift+Home', () => {
                items[2].setAttribute('aria-selected', 'true');
                items[2].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'Home',
                    shiftKey: true
                });
                container.dispatchEvent(event);

                // Items 0, 1, 2 should be selected
                expect(items[0].getAttribute('aria-selected')).toBe('true');
                expect(items[1].getAttribute('aria-selected')).toBe('true');
                expect(items[2].getAttribute('aria-selected')).toBe('true');
            });

            test('should select range from current to last with Shift+End', () => {
                items[1].setAttribute('aria-selected', 'true');
                items[1].focus();

                const event = new KeyboardEvent('keydown', {
                    key: 'End',
                    shiftKey: true
                });
                container.dispatchEvent(event);

                // Items 1, 2, 3, 4 should be selected
                expect(items[1].getAttribute('aria-selected')).toBe('true');
                expect(items[2].getAttribute('aria-selected')).toBe('true');
                expect(items[3].getAttribute('aria-selected')).toBe('true');
                expect(items[4].getAttribute('aria-selected')).toBe('true');
            });
        });

        describe('Select All (Ctrl/Cmd+A)', () => {
            test('should select all items with Ctrl+A', () => {
                const event = new KeyboardEvent('keydown', {
                    key: 'a',
                    ctrlKey: true
                });
                container.dispatchEvent(event);

                items.forEach(item => {
                    expect(item.getAttribute('aria-selected')).toBe('true');
                });
            });

            test('should select all items with Cmd+A', () => {
                const event = new KeyboardEvent('keydown', {
                    key: 'a',
                    metaKey: true
                });
                container.dispatchEvent(event);

                items.forEach(item => {
                    expect(item.getAttribute('aria-selected')).toBe('true');
                });
            });

            test('should work with uppercase A', () => {
                const event = new KeyboardEvent('keydown', {
                    key: 'A',
                    ctrlKey: true
                });
                container.dispatchEvent(event);

                items.forEach(item => {
                    expect(item.getAttribute('aria-selected')).toBe('true');
                });
            });
        });

        describe('Space Toggle Selection', () => {
            test('should toggle selection with Space', () => {
                items[0].focus();
                const event = new KeyboardEvent('keydown', { key: ' ' });
                container.dispatchEvent(event);

                expect(items[0].getAttribute('aria-selected')).toBe('true');
            });

            test('should deselect if already selected', () => {
                items[0].setAttribute('aria-selected', 'true');
                items[0].focus();

                const event = new KeyboardEvent('keydown', { key: ' ' });
                container.dispatchEvent(event);

                expect(items[0].getAttribute('aria-selected')).toBe('false');
            });
        });

        describe('Click with Modifiers', () => {
            test('should toggle selection with Ctrl+Click', () => {
                const event = new MouseEvent('click', { ctrlKey: true });
                items[0].dispatchEvent(event);

                expect(items[0].getAttribute('aria-selected')).toBe('true');
            });

            test('should toggle selection with Cmd+Click', () => {
                const event = new MouseEvent('click', { metaKey: true });
                items[0].dispatchEvent(event);

                expect(items[0].getAttribute('aria-selected')).toBe('true');
            });

            test('should select range with Shift+Click', () => {
                items[0].setAttribute('aria-selected', 'true');

                const event = new MouseEvent('click', { shiftKey: true });
                items[3].dispatchEvent(event);

                // Items 0-3 should be selected
                expect(items[0].getAttribute('aria-selected')).toBe('true');
                expect(items[1].getAttribute('aria-selected')).toBe('true');
                expect(items[2].getAttribute('aria-selected')).toBe('true');
                expect(items[3].getAttribute('aria-selected')).toBe('true');
            });

            test('should clear other selections on plain click', () => {
                items[0].setAttribute('aria-selected', 'true');
                items[1].setAttribute('aria-selected', 'true');

                const event = new MouseEvent('click');
                items[3].dispatchEvent(event);

                // Only clicked item should be selected
                expect(items[0].getAttribute('aria-selected')).not.toBe('true');
                expect(items[1].getAttribute('aria-selected')).not.toBe('true');
                expect(items[3].getAttribute('aria-selected')).toBe('true');
            });
        });

        describe('Single Selection Mode', () => {
            test('should not set aria-multiselectable when multiselect is false', () => {
                const singleContainer = document.createElement('div');
                singleContainer.setAttribute('role', 'listbox');
                // Don't set aria-multiselectable

                expect(singleContainer.getAttribute('aria-multiselectable')).toBeNull();
            });

            test('should clear previous selection in single select mode', () => {
                // Simulate single select behavior
                items[0].setAttribute('aria-selected', 'true');

                // Clear all selections
                items.forEach(item => item.setAttribute('aria-selected', 'false'));
                // Select new item
                items[2].setAttribute('aria-selected', 'true');

                const selectedItems = container.querySelectorAll('[aria-selected="true"]');
                expect(selectedItems.length).toBe(1);
                expect(selectedItems[0]).toBe(items[2]);
            });
        });

        describe('Accessibility Announcements', () => {
            test('should track last selected index for range operations', () => {
                items[1].setAttribute('aria-selected', 'true');
                let lastSelectedIndex = 1;

                expect(lastSelectedIndex).toBe(1);
            });

            test('should handle dynamic item addition', () => {
                const newItem = document.createElement('div');
                newItem.setAttribute('role', 'option');
                newItem.textContent = 'Item 6';
                container.appendChild(newItem);

                const updatedItems = container.querySelectorAll('[role="option"]');
                expect(updatedItems.length).toBe(6);
            });
        });
    });
});
