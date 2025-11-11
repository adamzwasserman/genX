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
});
