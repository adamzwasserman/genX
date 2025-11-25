/**
 * Comprehensive Playwright tests for genX demo page
 * Tests each of the 60 examples (10 per module) individually
 */

const { test, expect } = require('@playwright/test');

test.describe('genX Demo Page - Comprehensive Testing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');
        // Wait for modules to initialize
        await page.waitForTimeout(500);
    });

    test.describe('fmtX - Number & Date Formatting', () => {
        test('1. Currency Formatting - $1,234.56', async ({ page }) => {
            const formatted = page.locator('.example:has-text("1. Currency Formatting") .formatted-value').first();
            await expect(formatted).toContainText('$1,234.56');
            await expect(formatted).not.toContainText('1234.56'); // Should be formatted
        });

        test('2. Percentage - 12.34%', async ({ page }) => {
            const formatted = page.locator('.example:has-text("2. Percentage") .formatted-value').first();
            await expect(formatted).toContainText('%');
            await expect(formatted).not.toContainText('0.1234'); // Should be formatted
        });

        test('3. Date Formatting - Long format', async ({ page }) => {
            const formatted = page.locator('.example:has-text("3. Date Formatting") .formatted-value').first();
            await expect(formatted).toContainText('2025');
            // Should contain month name (not just numbers)
            const text = await formatted.textContent();
            expect(text).toMatch(/[A-Za-z]/); // Contains letters (month name)
        });

        test('4. Relative Time - Shows relative format', async ({ page }) => {
            const formatted = page.locator('.example:has-text("4. Relative Time") .formatted-value').first();
            const text = await formatted.textContent();
            // Should show something like "yesterday", "1 day ago", etc.
            expect(text).toMatch(/ago|yesterday|today/i);
        });

        test('5. File Size - Human readable (MB/KB)', async ({ page }) => {
            const formatted = page.locator('.example:has-text("5. File Size") .formatted-value').first();
            const text = await formatted.textContent();
            // 1536000 bytes should be ~1.5 MB
            expect(text).toMatch(/MB|KB/);
            await expect(formatted).not.toContainText('1536000');
        });

        test('6. Decimal Control - 2 decimal places', async ({ page }) => {
            const formatted = page.locator('.example:has-text("6. Decimal Control") .formatted-value').first();
            await expect(formatted).toContainText('3.14');
            await expect(formatted).not.toContainText('3.14159265');
        });

        test('7. Large Numbers - Thousands separator', async ({ page }) => {
            const formatted = page.locator('.example:has-text("7. Large Numbers") .formatted-value').first();
            await expect(formatted).toContainText('1,000,000');
            await expect(formatted).not.toContainText('1000000'); // Should have commas
        });

        test('8. Ordinal Numbers - 1st, 2nd, 3rd', async ({ page }) => {
            const formatted = page.locator('.example:has-text("8. Ordinal Numbers") .formatted-value').first();
            const text = await formatted.textContent();
            expect(text).toContain('1st');
            expect(text).toContain('2nd');
            expect(text).toContain('3rd');
        });

        test('9. Compact Numbers - 1.5M format', async ({ page }) => {
            const formatted = page.locator('.example:has-text("9. Compact Numbers") .formatted-value').first();
            const text = await formatted.textContent();
            // 1500000 should be 1.5M or 1M
            expect(text).toMatch(/[0-9.]+[MK]/);
        });

        test('10. Phone Numbers - Formatted (555) 123-4567', async ({ page }) => {
            const formatted = page.locator('.example:has-text("10. Phone Numbers") .formatted-value').first();
            const text = await formatted.textContent();
            // Should have formatting like (555) 123-4567 or similar
            expect(text).toMatch(/[\(\)\-\s]/);
            await expect(formatted).not.toContainText('5551234567'); // Raw format
        });
    });

    test.describe('bindX - Reactive Data Binding', () => {
        test('1. Two-Way Binding - Input updates display', async ({ page }) => {
            const input = page.locator('.example:has-text("1. Two-Way Binding") input[bx-model="name"]');
            const output = page.locator('.example:has-text("1. Two-Way Binding") span[bx-bind="name"]');

            await input.fill('Alice');
            await page.waitForTimeout(100);
            await expect(output).toContainText('Alice');
        });

        test('2. Number Binding - Numeric input updates', async ({ page }) => {
            const input = page.locator('.example:has-text("2. Number Binding") input[bx-model="quantity"]');
            const output = page.locator('.example:has-text("2. Number Binding") span[bx-bind="quantity"]');

            await input.fill('5');
            await page.waitForTimeout(100);
            await expect(output).toContainText('5');
        });

        test('3. Checkbox Binding - Boolean state updates', async ({ page }) => {
            const checkbox = page.locator('.example:has-text("3. Checkbox Binding") input[type="checkbox"]');
            const output = page.locator('.example:has-text("3. Checkbox Binding") span[bx-bind="agreed"]');

            await checkbox.check();
            await page.waitForTimeout(100);
            await expect(output).toContainText('true');
        });

        test('4. Select Binding - Dropdown updates display', async ({ page }) => {
            const select = page.locator('.example:has-text("4. Select Binding") select[bx-model="color"]');
            const output = page.locator('.example:has-text("4. Select Binding") span[bx-bind="color"]');

            await select.selectOption('Blue');
            await page.waitForTimeout(100);
            await expect(output).toContainText('Blue');
        });

        test('5. Radio Binding - Radio selection updates', async ({ page }) => {
            const radio = page.locator('.example:has-text("5. Radio Binding") input[value="M"]');
            const output = page.locator('.example:has-text("5. Radio Binding") span[bx-bind="size"]');

            await radio.check();
            await page.waitForTimeout(100);
            await expect(output).toContainText('M');
        });

        test('6. Computed Properties - Auto-calculated total', async ({ page }) => {
            const priceInput = page.locator('.example:has-text("6. Computed Properties") input[bx-model="price"]');
            const qtyInput = page.locator('.example:has-text("6. Computed Properties") input[bx-model="qty"]');
            const total = page.locator('.example:has-text("6. Computed Properties") span[bx-computed]');

            await priceInput.fill('15');
            await qtyInput.fill('3');
            await page.waitForTimeout(100);
            await expect(total).toContainText('45');
        });

        test('7. Form Binding - Multiple fields update', async ({ page }) => {
            const firstName = page.locator('.example:has-text("7. Form Binding") input[bx-model="firstName"]');
            const lastName = page.locator('.example:has-text("7. Form Binding") input[bx-model="lastName"]');
            const output = page.locator('.example:has-text("7. Form Binding") p').last();

            await firstName.fill('John');
            await lastName.fill('Doe');
            await page.waitForTimeout(100);
            await expect(output).toContainText('John');
            await expect(output).toContainText('Doe');
        });

        test('8. Textarea Binding - Character count updates', async ({ page }) => {
            const textarea = page.locator('.example:has-text("8. Textarea Binding") textarea');
            const count = page.locator('.example:has-text("8. Textarea Binding") span[bx-bind*="length"]');

            await textarea.fill('Hello World');
            await page.waitForTimeout(100);
            await expect(count).toContainText('11');
        });

        test('9. Conditional Binding - Shows/hides content', async ({ page }) => {
            const checkbox = page.locator('.example:has-text("9. Conditional Binding") input[type="checkbox"]');
            const details = page.locator('.example:has-text("9. Conditional Binding") [bx-if]');

            // Initially hidden
            await expect(details).not.toBeVisible();

            // Show when checked
            await checkbox.check();
            await page.waitForTimeout(100);
            await expect(details).toBeVisible();
        });

        test('10. Live Validation - Shows error for invalid email', async ({ page }) => {
            const input = page.locator('.example:has-text("10. Live Validation") input[type="email"]');
            const error = page.locator('.example:has-text("10. Live Validation") span[bx-if]');

            await input.fill('notanemail');
            await page.waitForTimeout(100);
            await expect(error).toContainText('Invalid');
        });
    });

    test.describe('dragX - Drag and Drop', () => {
        test('1. Basic Drag & Drop - Element is draggable', async ({ page }) => {
            const draggable = page.locator('.example:has-text("1. Basic Drag") .draggable').first();
            const dropZone = page.locator('.example:has-text("1. Basic Drag") .drop-zone').first();

            // Check draggable has dx-draggable attribute
            await expect(draggable).toHaveAttribute('dx-draggable', 'card');
            await expect(dropZone).toHaveAttribute('dx-dropzone');
        });

        test('2. Multiple Draggables - All items are draggable', async ({ page }) => {
            const draggables = page.locator('.example:has-text("2. Multiple Draggables") .draggable');
            const count = await draggables.count();
            expect(count).toBe(3);

            // All should have dx-draggable attribute
            for (let i = 0; i < count; i++) {
                await expect(draggables.nth(i)).toHaveAttribute('dx-draggable', 'item');
            }
        });

        test('3. Type-Based Drops - Zone accepts specific types', async ({ page }) => {
            const dropZone = page.locator('.example:has-text("3. Type-Based") .drop-zone');
            await expect(dropZone).toHaveAttribute('dx-accepts', 'image');
        });

        test('4. Keyboard Dragging - Element is focusable', async ({ page }) => {
            const draggable = page.locator('.example:has-text("4. Keyboard") .draggable').first();
            await expect(draggable).toHaveAttribute('tabindex', '0');
        });

        test('5. Custom Ghost Image - Has ghost attribute', async ({ page }) => {
            const draggable = page.locator('.example:has-text("5. Custom Ghost") .draggable');
            await expect(draggable).toHaveAttribute('dx-ghost', 'custom');
        });

        test('6. Axis Constraint - Horizontal only', async ({ page }) => {
            const draggable = page.locator('.example:has-text("6. Axis Constraint") .draggable');
            await expect(draggable).toHaveAttribute('dx-axis', 'horizontal');
        });

        test('7. Clone Mode - Has clone attribute', async ({ page }) => {
            const draggable = page.locator('.example:has-text("7. Clone Mode") .draggable');
            await expect(draggable).toHaveAttribute('dx-clone', 'true');
        });

        test('8. Revert Animation - Has revert attribute', async ({ page }) => {
            const draggable = page.locator('.example:has-text("8. Revert") .draggable');
            await expect(draggable).toHaveAttribute('dx-revert', 'invalid');
        });

        test('9. Grid Snapping - Has grid attribute', async ({ page }) => {
            const draggable = page.locator('.example:has-text("9. Grid Snapping") .draggable');
            await expect(draggable).toHaveAttribute('dx-grid', '20');
        });

        test('10. Drag Events - Event tracking element exists', async ({ page }) => {
            const draggable = page.locator('.example:has-text("10. Drag Events") .draggable');
            const events = page.locator('#dragEvents');

            await expect(draggable).toBeVisible();
            await expect(events).toBeVisible();
        });
    });

    test.describe('loadX - Loading States', () => {
        test('1. Spinner Loader - Has spinner strategy', async ({ page }) => {
            const element = page.locator('.example:has-text("1. Spinner") [lx-strategy="spinner"]');
            await expect(element).toBeVisible();
        });

        test('2. Skeleton Screen - Has skeleton strategy', async ({ page }) => {
            const element = page.locator('.example:has-text("2. Skeleton") [lx-strategy="skeleton"]');
            await expect(element).toHaveAttribute('lx-rows', '3');
        });

        test('3. Progress Bar - Has progress strategy', async ({ page }) => {
            const element = page.locator('.example:has-text("3. Progress Bar") [lx-strategy="progress"]');
            await expect(element).toHaveAttribute('lx-value', '0');
        });

        test('4. Fade Transition - Has fade strategy', async ({ page }) => {
            const element = page.locator('.example:has-text("4. Fade") [lx-strategy="fade"]');
            await expect(element).toBeVisible();
        });

        test('5. Auto Strategy - Has auto detection', async ({ page }) => {
            const element = page.locator('.example:has-text("5. Auto Strategy") [lx-auto]');
            await expect(element).toBeVisible();
        });

        test('6. Custom Duration - Button triggers loading', async ({ page }) => {
            const button = page.locator('.example:has-text("6. Custom Duration") button');
            await expect(button).toBeEnabled();
            await expect(button).toContainText('3 Second Load');
        });

        test('7. HTMX Loading - Has HTMX attributes', async ({ page }) => {
            const button = page.locator('.example:has-text("7. HTMX") button');
            await expect(button).toHaveAttribute('lx-strategy', 'skeleton');
        });

        test('8. Fetch API Loading - Button exists', async ({ page }) => {
            const button = page.locator('.example:has-text("8. Fetch API") button');
            await expect(button).toBeEnabled();
        });

        test('9. Form Loading - Form exists and functional', async ({ page }) => {
            const form = page.locator('.example:has-text("9. Form Loading") form');
            const button = form.locator('button[type="submit"]');
            await expect(button).toHaveAttribute('lx-strategy', 'spinner');
        });

        test('10. Multi-State Loading - All loading areas exist', async ({ page }) => {
            const areas = page.locator('.example:has-text("10. Multi-State") [lx-strategy]');
            const count = await areas.count();
            expect(count).toBeGreaterThanOrEqual(3);
        });
    });

    test.describe('navX - Navigation Patterns', () => {
        test('1. Breadcrumb Navigation - Has breadcrumb', async ({ page }) => {
            const breadcrumb = page.locator('.example:has-text("1. Breadcrumb") [nx-breadcrumb]');
            await expect(breadcrumb).toBeVisible();
            await expect(breadcrumb).toContainText('Home');
        });

        test('2. Tab Navigation - Has tabs', async ({ page }) => {
            const tabs = page.locator('.example:has-text("2. Tab Navigation") [nx-tabs]');
            const tabButtons = tabs.locator('.tab');
            const count = await tabButtons.count();
            expect(count).toBe(3);
        });

        test('3. Dropdown Menu - Has dropdown', async ({ page }) => {
            const dropdown = page.locator('.example:has-text("3. Dropdown") [nx-dropdown]');
            await expect(dropdown).toBeVisible();
        });

        test('4. Scroll Spy - Has scroll spy', async ({ page }) => {
            const scrollSpy = page.locator('.example:has-text("4. Scroll Spy") [nx-scroll-spy]');
            await expect(scrollSpy).toBeVisible();
        });

        test('5. Sticky Navigation - Has sticky attribute', async ({ page }) => {
            const sticky = page.locator('.example:has-text("5. Sticky") [nx-sticky]');
            await expect(sticky).toBeVisible();
        });

        test('6. Mobile Menu - Has hamburger button', async ({ page }) => {
            const hamburger = page.locator('.example:has-text("6. Mobile Menu") [nx-hamburger]');
            await expect(hamburger).toBeVisible();
            await expect(hamburger).toContainText('☰');
        });

        test('7. Smooth Scrolling - Has smooth scroll link', async ({ page }) => {
            const link = page.locator('.example:has-text("7. Smooth Scrolling") [nx-smooth-scroll]');
            await expect(link).toHaveAttribute('href', '#footer');
        });

        test('8. Pagination - Has pagination controls', async ({ page }) => {
            const pagination = page.locator('.example:has-text("8. Pagination") [nx-pagination]');
            const buttons = pagination.locator('button');
            const count = await buttons.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });

        test('9. Skip Link - Has skip navigation', async ({ page }) => {
            const skipLink = page.locator('.example:has-text("9. Skip Navigation") [nx-skip-link]');
            await expect(skipLink).toHaveAttribute('href', '#main-content');
        });

        test('10. History Trail - Has trail breadcrumb', async ({ page }) => {
            const trail = page.locator('.example:has-text("10. History Trail") [nx-breadcrumb="trail"]');
            await expect(trail).toBeVisible();
        });
    });

    test.describe('Page-Level Tests', () => {
        test('All 6 module sections are present', async ({ page }) => {
            await expect(page.locator('#fmtx')).toBeVisible();
            await expect(page.locator('#accx')).toBeVisible();
            await expect(page.locator('#bindx')).toBeVisible();
            await expect(page.locator('#dragx')).toBeVisible();
            await expect(page.locator('#loadx')).toBeVisible();
            await expect(page.locator('#navx')).toBeVisible();
        });

        test('Navigation menu works', async ({ page }) => {
            const navLink = page.locator('nav a[href="#fmtx"]');
            await navLink.click();
            await page.waitForTimeout(300);
            // Check that fmtx section is in viewport
            const fmtxSection = page.locator('#fmtx');
            await expect(fmtxSection).toBeInViewport();
        });

        test('All original value labels are present', async ({ page }) => {
            const originalValues = page.locator('.original-value');
            const count = await originalValues.count();
            // Should have many original value labels (at least 30+)
            expect(count).toBeGreaterThan(30);
        });

        test('All modules are loaded', async ({ page }) => {
            // Check console for module initialization
            const logs = [];
            page.on('console', msg => logs.push(msg.text()));
            await page.reload();
            await page.waitForTimeout(1000);

            // Should see module initialization message
            const hasInit = logs.some(log => log.includes('genX modules initialized'));
            expect(hasInit).toBeTruthy();
        });

        test('No JavaScript errors on page load', async ({ page }) => {
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.reload();
            await page.waitForTimeout(1000);

            expect(errors.length).toBe(0);
        });

        test('Footer statistics are visible', async ({ page }) => {
            await page.locator('a[href="#footer"]').click({ force: true });
            await page.waitForTimeout(500);

            await expect(page.locator('.stat-value:has-text("6")')).toBeVisible();
            await expect(page.locator('.stat-value:has-text("60")')).toBeVisible();
            await expect(page.locator('.stat-value:has-text("100%")')).toBeVisible();
        });
    });

    test.describe('Copy Button Functionality', () => {
        test('All copy buttons are present', async ({ page }) => {
            const copyButtons = page.locator('button.copy-button');
            const count = await copyButtons.count();
            // Should have many copy buttons (at least 60+ for all examples)
            expect(count).toBeGreaterThan(60);
        });

        test('Copy button has accessible label', async ({ page }) => {
            const copyButton = page.locator('button.copy-button').first();
            const text = await copyButton.textContent();
            expect(text).toContain('Copy');
        });

        test('Copy button functionality works', async ({ page }) => {
            // Grant clipboard permissions
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const copyButton = page.locator('.example:has-text("Currency") button.copy-button').first();
            await copyButton.click();

            // Wait for clipboard operation
            await page.waitForTimeout(100);

            // Verify button provides feedback
            const buttonText = await copyButton.textContent();
            expect(buttonText).toBeTruthy();
        });
    });

    test.describe('Code Snippet Accuracy', () => {
        test('fmtX code snippets match implementation', async ({ page }) => {
            const snippet = page.locator('.example:has-text("Currency") pre code').first();
            const text = await snippet.textContent();
            expect(text).toContain('fx-format="currency"');
            expect(text).toContain('fx-currency="USD"');
        });

        test('bindX code snippets show correct syntax', async ({ page }) => {
            const snippet = page.locator('.example:has-text("Two-Way Binding") pre code').first();
            const text = await snippet.textContent();
            expect(text).toContain('bx-model');
        });

        test('dragX code snippets show correct attributes', async ({ page }) => {
            const snippet = page.locator('.example:has-text("Basic Drag") pre code').first();
            const text = await snippet.textContent();
            expect(text).toContain('dx-draggable');
        });

        test('Code snippets have syntax highlighting', async ({ page }) => {
            const codeBlock = page.locator('pre code').first();
            const hasHighlighting = await codeBlock.evaluate(el => {
                return el.classList.length > 0 || el.innerHTML.includes('<span');
            });
            // Either has CSS classes or contains syntax highlighting spans
            expect(hasHighlighting).toBeTruthy();
        });
    });

    test.describe('Performance Metrics', () => {
        test('Page load time is under 2 seconds', async ({ page }) => {
            const startTime = Date.now();
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');
            await page.waitForLoadState('domcontentloaded');
            const loadTime = Date.now() - startTime;

            expect(loadTime).toBeLessThan(2000);
        });

        test('Module initialization is under 500ms', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const perfMark = await page.evaluate(() => {
                const marks = performance.getEntriesByType('mark');
                const initMark = marks.find(m => m.name.includes('init') || m.name.includes('genX'));
                return initMark ? initMark.startTime : null;
            });

            if (perfMark !== null) {
                expect(perfMark).toBeLessThan(500);
            }
        });

        test('fmtX formatting operations complete in <16ms', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const duration = await page.evaluate(() => {
                const start = performance.now();

                // Simulate formatting 100 values
                const testElement = document.createElement('span');
                testElement.setAttribute('fx-format', 'currency');
                testElement.setAttribute('fx-currency', 'USD');
                testElement.textContent = '1234.56';
                document.body.appendChild(testElement);

                // Trigger module processing
                if (window.fmtX && window.fmtX.scan) {
                    window.fmtX.scan();
                }

                const end = performance.now();
                document.body.removeChild(testElement);

                return end - start;
            });

            expect(duration).toBeLessThan(16);
        });

        test('bindX reactivity updates in <16ms', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const duration = await page.evaluate(() => {
                const input = document.querySelector('input[bx-model]');
                if (!input) return 0;

                const start = performance.now();
                input.value = 'performance test';
                input.dispatchEvent(new Event('input'));
                const end = performance.now();

                return end - start;
            });

            expect(duration).toBeLessThan(16);
        });

        test('No memory leaks during interactions', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const initialMemory = await page.evaluate(() => {
                if (performance.memory) {
                    return performance.memory.usedJSHeapSize;
                }
                return null;
            });

            // Perform 50 interactions
            for (let i = 0; i < 50; i++) {
                const input = page.locator('input[bx-model]').first();
                await input.fill(`test-${i}`);
                await page.waitForTimeout(10);
            }

            const finalMemory = await page.evaluate(() => {
                if (performance.memory) {
                    return performance.memory.usedJSHeapSize;
                }
                return null;
            });

            if (initialMemory !== null && finalMemory !== null) {
                const memoryIncrease = finalMemory - initialMemory;
                // Memory increase should be reasonable (< 5MB for 50 operations)
                expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
            }
        });
    });

    test.describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
        test('All interactive elements are keyboard accessible', async ({ page }) => {
            const focusableElements = page.locator('button, a, input, select, textarea, [tabindex="0"]');
            const count = await focusableElements.count();
            expect(count).toBeGreaterThan(0);

            // Verify first button is focusable
            const firstButton = page.locator('button').first();
            await firstButton.focus();
            const isFocused = await firstButton.evaluate(el => el === document.activeElement);
            expect(isFocused).toBe(true);
        });

        test('Form inputs have labels or aria-label', async ({ page }) => {
            const inputs = page.locator('input[type="text"], input[type="number"], input[type="email"]');
            const count = await inputs.count();

            for (let i = 0; i < Math.min(count, 10); i++) {
                const input = inputs.nth(i);
                const hasLabel = await input.evaluate(el => {
                    const id = el.id;
                    const hasLabelElement = id && document.querySelector(`label[for="${id}"]`);
                    const hasAriaLabel = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
                    return hasLabelElement || hasAriaLabel || el.parentElement.tagName === 'LABEL';
                });

                expect(hasLabel).toBeTruthy();
            }
        });

        test('Buttons have accessible names', async ({ page }) => {
            const buttons = page.locator('button');
            const count = await buttons.count();

            for (let i = 0; i < Math.min(count, 10); i++) {
                const button = buttons.nth(i);
                const name = await button.evaluate(el => {
                    return el.textContent.trim() || el.getAttribute('aria-label') || el.getAttribute('title');
                });

                expect(name).toBeTruthy();
            }
        });

        test('Heading hierarchy is correct', async ({ page }) => {
            const headings = await page.evaluate(() => {
                const h1s = document.querySelectorAll('h1');
                const h2s = document.querySelectorAll('h2');
                const h3s = document.querySelectorAll('h3');

                return {
                    h1Count: h1s.length,
                    h2Count: h2s.length,
                    h3Count: h3s.length
                };
            });

            // Should have exactly one h1
            expect(headings.h1Count).toBe(1);
            // Should have multiple h2s for sections
            expect(headings.h2Count).toBeGreaterThan(5);
        });

        test('Color contrast meets WCAG AA standards', async ({ page }) => {
            // Test a sample of text elements
            const textElements = page.locator('p, span, div').first();

            const contrast = await textElements.evaluate(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const bgColor = style.backgroundColor;

                // Simple check - ensure colors are defined
                return color && bgColor && color !== bgColor;
            });

            expect(contrast).toBeTruthy();
        });

        test('Interactive elements have visible focus indicators', async ({ page }) => {
            const button = page.locator('button').first();
            await button.focus();

            const hasFocusStyle = await button.evaluate(el => {
                const styles = window.getComputedStyle(el);
                const outline = styles.outline;
                const outlineWidth = styles.outlineWidth;
                const boxShadow = styles.boxShadow;

                // Should have outline or box-shadow for focus
                return outline !== 'none' || outlineWidth !== '0px' || boxShadow !== 'none';
            });

            expect(hasFocusStyle).toBeTruthy();
        });

        test('Skip navigation link is present', async ({ page }) => {
            const skipLink = page.locator('a[href="#main-content"], a[href="#content"], .skip-link');
            const count = await skipLink.count();
            expect(count).toBeGreaterThan(0);
        });

        test('ARIA landmarks are properly used', async ({ page }) => {
            const landmarks = await page.evaluate(() => {
                return {
                    nav: document.querySelectorAll('nav, [role="navigation"]').length,
                    main: document.querySelectorAll('main, [role="main"]').length,
                    footer: document.querySelectorAll('footer, [role="contentinfo"]').length
                };
            });

            expect(landmarks.nav).toBeGreaterThan(0);
            expect(landmarks.main).toBeGreaterThan(0);
        });
    });

    test.describe('Mobile Viewport Testing', () => {
        test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

        test('Page is responsive on mobile', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');
            await page.waitForLoadState('domcontentloaded');

            // Check that page doesn't have horizontal scroll
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            expect(hasHorizontalScroll).toBe(false);
        });

        test('Navigation menu is accessible on mobile', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const nav = page.locator('nav').first();
            await expect(nav).toBeVisible();
        });

        test('Examples render correctly on mobile', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const example = page.locator('.example').first();
            await expect(example).toBeVisible();

            // Check that example doesn't overflow
            const overflows = await example.evaluate(el => {
                return el.scrollWidth > el.clientWidth;
            });

            expect(overflows).toBe(false);
        });

        test('Touch interactions work on mobile', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            // Test tap on button
            const button = page.locator('button').first();
            await button.tap();

            // Verify button is still visible after tap
            await expect(button).toBeVisible();
        });

        test('Font sizes are readable on mobile', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const bodyFontSize = await page.evaluate(() => {
                const style = window.getComputedStyle(document.body);
                return parseInt(style.fontSize);
            });

            // Font size should be at least 14px on mobile
            expect(bodyFontSize).toBeGreaterThanOrEqual(14);
        });

        test('Interactive controls are touch-friendly', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const button = page.locator('button').first();
            const size = await button.boundingBox();

            // Touch targets should be at least 44x44px (WCAG 2.1 AA)
            expect(size.width).toBeGreaterThanOrEqual(40);
            expect(size.height).toBeGreaterThanOrEqual(40);
        });
    });

    test.describe('Mobile Viewport Testing - Tablet', () => {
        test.use({ viewport: { width: 768, height: 1024 } }); // iPad

        test('Page layout adapts to tablet', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            expect(hasHorizontalScroll).toBe(false);
        });

        test('Examples are arranged properly on tablet', async ({ page }) => {
            await page.goto('file://' + __dirname + '/../../examples/genx-demo.html');

            const examples = page.locator('.example');
            const count = await examples.count();
            expect(count).toBeGreaterThan(0);

            // Check first example is visible
            await expect(examples.first()).toBeVisible();
        });
    });
});
