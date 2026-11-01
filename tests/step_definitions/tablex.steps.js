/**
 * Step definitions for tableX module
 * Declarative table enhancements through HTML attributes
 *
 * Givens describe a table; the table is mounted (content first, then
 * src/tablex.js, so its DOM-ready initAll sees the markup) the first time a
 * step needs it.
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const path = require('path');

const TABLEX = path.resolve(__dirname, '../../src/tablex.js');
const DEFAULT_DEBOUNCE = 300;

const PEOPLE = [
    ['John Smith', '30', 'NYC'],
    ['Jane Doe', '25', 'LA'],
    ['Bob Johnson', '35', 'Chicago'],
    ['Alice Brown', '28', 'Boston']
];

const escapeHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function describeTable(world, tableAttrs, headers, rows, options = {}) {
    world.tx = {
        tableAttrs,
        headers,
        rows,
        before: options.before || '',
        debounce: options.debounce !== undefined ? options.debounce : DEFAULT_DEBOUNCE,
        input: options.input || '.tx-filter-input',
        mounted: false
    };
}

async function mounted(world) {
    if (!world.tx) {
        throw new Error('No tableX table was described by an earlier step');
    }
    if (world.tx.mounted) {
        return;
    }
    const { tableAttrs, headers, rows, before } = world.tx;
    const head = headers.map(h => typeof h === 'string'
        ? `<th>${escapeHtml(h)}</th>`
        : `<th ${h.attrs}>${escapeHtml(h.text)}</th>`).join('');
    const body = rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
    await world.page.setContent(`<!DOCTYPE html><html><body>
        ${before}
        <table id="test-table" ${tableAttrs}>
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
        </table>
    </body></html>`);
    await world.page.addScriptTag({ path: TABLEX });
    await world.page.waitForFunction(() => window.tableX !== undefined);
    world.tx.mounted = true;
    world.element = world.page.locator('#test-table');
}

const header = (world, text) =>
    world.page.locator('#test-table thead th').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) });

const columnTexts = (world, col = 1) =>
    world.page.$$eval(`#test-table tbody tr td:nth-child(${col})`, cells => cells.map(c => c.textContent.trim()));

const visibleRowTexts = (world) =>
    world.page.$$eval('#test-table tbody tr', rows => rows
        .filter(r => r.style.display !== 'none')
        .map(r => r.querySelector('td').textContent.trim()));

const allRowTexts = (world) =>
    world.page.$$eval('#test-table tbody tr', rows => rows.map(r => ({
        text: r.textContent.trim(),
        first: r.querySelector('td').textContent.trim(),
        visible: r.style.display !== 'none'
    })));

const pageInfo = (world) => world.page.locator('.tx-pagination-info');
const pagerButton = (world, text) => world.page.locator('.tx-pagination button', { hasText: text });

async function typeFilter(world, text) {
    await mounted(world);
    await world.page.locator(world.tx.input).fill(text);
    await world.page.waitForTimeout(world.tx.debounce + 150);
}

const numberedRows = (count) => Array.from({ length: count }, (_, i) => [`Row ${i + 1}`, String(i + 1)]);

// ============================================================================
// BACKGROUND
// ============================================================================

Given('the tableX module is loaded', async function() {
    await this.page.goto('about:blank');
    this.tx = null;
});

// ============================================================================
// SORTING
// ============================================================================

Given('a table with tx-sort={string}', async function(enabled) {
    describeTable(this, 'tx-sortable', ['Name', 'Age', 'City'], [
        ['John', '30', 'NYC'],
        ['Jane', '25', 'LA'],
        ['Bob', '35', 'Chicago']
    ]);
    this.tx.sortFlag = enabled;
    await mounted(this);
});

Given('columns: {string}, {string}, {string}', async function(col1, col2, col3) {
    await mounted(this);
    const texts = await this.page.$$eval('#test-table thead th', ths => ths.map(th => th.textContent.trim()));
    expect(texts).toEqual([col1, col2, col3]);
});

Given('data rows', async function() {
    await mounted(this);
    expect(await this.page.locator('#test-table tbody tr').count()).toBeGreaterThan(0);
});

When('the user clicks the {string} header', async function(headerText) {
    await mounted(this);
    await header(this, headerText).click();
});

Then('rows should be sorted by age ascending', async function() {
    expect(await columnTexts(this, 2)).toEqual(['25', '30', '35']);
});

Then('a sort indicator should appear', async function() {
    const th = header(this, 'Age');
    await expect(th).toHaveClass(/\btx-sort-active\b/);
    await expect(th).toHaveClass(/\btx-sort-asc\b/);
});

Given('a sorted column \\(ascending)', async function() {
    describeTable(this, 'tx-sortable', ['Age'], [['30'], ['25'], ['35']]);
    await mounted(this);
    await header(this, 'Age').click();
    expect(await columnTexts(this)).toEqual(['25', '30', '35']);
});

When('the header is clicked again', async function() {
    await this.page.locator('#test-table thead th').first().click();
});

Then('rows should be sorted descending', async function() {
    expect(await columnTexts(this)).toEqual(['35', '30', '25']);
});

Then('the sort indicator should flip', async function() {
    const th = this.page.locator('#test-table thead th').first();
    await expect(th).toHaveClass(/\btx-sort-desc\b/);
    await expect(th).not.toHaveClass(/\btx-sort-asc\b/);
    await expect(th).toHaveAttribute('aria-sort', 'descending');
});

Given('a table with text data', async function() {
    describeTable(this, 'tx-sortable', ['Name'], [['Zebra'], ['apple'], ['Banana']]);
    await mounted(this);
});

When('sorting by {string}', async function(column) {
    await mounted(this);
    await header(this, column).click();
});

Then('rows should be alphabetically sorted', async function() {
    expect(await columnTexts(this)).toEqual(['apple', 'Banana', 'Zebra']);
});

Then('sorting should be case-insensitive', async function() {
    // A case-sensitive (code point) sort would put "Banana" and "Zebra" before "apple"
    const names = await columnTexts(this);
    expect(names[0]).toBe('apple');
    expect(names.indexOf('Banana')).toBeLessThan(names.indexOf('Zebra'));
});

Given('a table with numeric data', async function() {
    describeTable(this, 'tx-sortable', ['Price'], [['100'], ['2'], ['10']]);
    await mounted(this);
});

Then('rows should be numerically sorted', async function() {
    expect(await columnTexts(this)).toEqual(['2', '10', '100']);
});

Then('{string} should come after {string} \\(not alphabetical)', async function(a, b) {
    const values = await columnTexts(this);
    expect(values.indexOf(a)).toBeGreaterThan(values.indexOf(b));
});

Given('a table with date columns', async function() {
    describeTable(this, 'tx-sortable', ['Created'], [['Dec 1, 2024'], ['2024-01-15'], ['06/30/2024']]);
    await mounted(this);
});

Then('rows should be chronologically sorted', async function() {
    const times = await this.page.$$eval('#test-table tbody tr td', cells =>
        cells.map(c => new Date(c.textContent.trim()).getTime()));
    expect(times.every(t => !Number.isNaN(t))).toBe(true);
    for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
});

Then('date parsing should handle multiple formats', async function() {
    // ISO, US numeric and month-name dates sort as dates, not as strings
    expect(await columnTexts(this)).toEqual(['2024-01-15', '06/30/2024', 'Dec 1, 2024']);
});

Given('a column with tx-sortable={string}', async function(enabled) {
    describeTable(this, 'tx-sortable', [{ text: 'Name', attrs: `tx-sortable="${enabled}"` }, 'Age'], [
        ['John', '30'],
        ['Jane', '25'],
        ['Bob', '35']
    ]);
    await mounted(this);
});

Then('the header should not be clickable', async function() {
    const th = header(this, 'Name');
    expect(await th.evaluate(el => getComputedStyle(el).cursor)).not.toBe('pointer');
    await expect(th).not.toHaveAttribute('tabindex', /.*/);
    await th.click();
    expect(await columnTexts(this)).toEqual(['John', 'Jane', 'Bob']);
    // The other column is still sortable
    await expect(header(this, 'Age')).toHaveClass(/\btx-sortable\b/);
});

Then('no sort indicator should appear', async function() {
    const th = header(this, 'Name');
    await expect(th).not.toHaveClass(/\btx-sort(able|-active|-asc|-desc)\b/);
    await expect(th).not.toHaveAttribute('aria-sort', /.*/);
});

// ============================================================================
// FILTERING
// ============================================================================

Given('a table with tx-filter={string}', async function(value) {
    describeTable(this, `tx-filter="${value}"`, ['Name', 'Age', 'City'], PEOPLE);
});

Given('a filter input', async function() {
    await mounted(this);
    await expect(this.page.locator(this.tx.input)).toBeVisible();
});

When('in tableX, the user types {string}', async function(text) {
    await typeFilter(this, text);
});

Then('only rows containing {string} should display', async function(text) {
    const rows = await allRowTexts(this);
    const needle = text.toLowerCase();
    const visible = rows.filter(r => r.visible);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every(r => r.text.toLowerCase().includes(needle))).toBe(true);
    expect(rows.filter(r => r.text.toLowerCase().includes(needle)).every(r => r.visible)).toBe(true);
});

Then('other rows should be hidden', async function() {
    const rows = await this.page.locator('#test-table tbody tr').all();
    let hidden = 0;
    for (const row of rows) {
        if (!(await row.textContent()).includes('John')) {
            await expect(row).toBeHidden();
            await expect(row).toHaveAttribute('aria-hidden', 'true');
            hidden++;
        }
    }
    expect(hidden).toBeGreaterThan(0);
});

Given('a table with tx-filter-columns={string}', async function(columns) {
    describeTable(this, `tx-filterable tx-filter-columns="${columns}"`, ['Name', 'City'], [
        ['John', 'Boston'],
        ['Mary', 'Johnstown'],
        ['Peter', 'LA']
    ]);
});

When('filtering', async function() {
    await typeFilter(this, 'John');
});

Then('only the {string} column should be searched', async function(column) {
    expect(column.toLowerCase()).toBe('name');
    // "Johnstown" sits in the City column, so Mary's row must stay hidden
    expect(await visibleRowTexts(this)).toEqual(['John']);
});

Given('a table with case-insensitive filter', async function() {
    describeTable(this, 'tx-filterable', ['Name'], [['john lower'], ['John Upper'], ['Jane']]);
});

Then('rows with {string} or {string} should match', async function(a, b) {
    const rows = await allRowTexts(this);
    for (const row of rows) {
        expect(row.visible).toBe(row.text.includes(a) || row.text.includes(b));
    }
    expect(rows.filter(r => r.visible)).toHaveLength(2);
});

Given('a filtered table', async function() {
    describeTable(this, 'tx-filterable', ['Name', 'Age', 'City'], PEOPLE);
    await typeFilter(this, 'Jane');
    expect(await visibleRowTexts(this)).toEqual(['Jane Doe']);
});

When('the filter input is cleared', async function() {
    await typeFilter(this, '');
});

Then('all rows should reappear', async function() {
    expect(await visibleRowTexts(this)).toEqual(PEOPLE.map(r => r[0]));
    await expect(this.page.locator('#test-table tbody tr[aria-hidden]')).toHaveCount(0);
});

Given('a filter input with tx-filter-debounce={string}', async function(ms) {
    describeTable(this, `tx-filterable tx-filter-debounce="${ms}"`, ['Name', 'Age', 'City'], PEOPLE,
        { debounce: parseInt(ms, 10) });
    await mounted(this);
    await this.page.evaluate(() => {
        window.__txFilterRuns = 0;
        document.querySelector('#test-table').addEventListener('tx:filter', () => {
            window.__txFilterRuns++;
        });
    });
});

When('the user types quickly', async function() {
    await this.page.locator(this.tx.input).pressSequentially('Jane', { delay: 20 });
});

Then('filtering should be debounced', async function() {
    expect(await this.page.evaluate(() => window.__txFilterRuns)).toBe(0);
    expect(await visibleRowTexts(this)).toHaveLength(PEOPLE.length);
});

Then('only execute after typing stops', async function() {
    await this.page.waitForFunction(() => window.__txFilterRuns > 0, null, { timeout: 3000 });
    await this.page.waitForTimeout(this.tx.debounce + 100);
    expect(await this.page.evaluate(() => window.__txFilterRuns)).toBe(1);
    expect(await visibleRowTexts(this)).toEqual(['Jane Doe']);
});

// ============================================================================
// PAGINATION
// ============================================================================

Given('a table with tx-paginate={string} tx-per-page={string}', async function(enabled, perPage) {
    describeTable(this, `tx-paginate="${enabled}" tx-per-page="${perPage}"`, ['Item', 'Number'], []);
});

Given('{int} total rows', async function(count) {
    this.tx.rows = numberedRows(count);
});

When('the page renders', async function() {
    await mounted(this);
    await this.page.waitForLoadState('load');
});

Then('only the first {int} rows should display', async function(count) {
    expect(await visibleRowTexts(this)).toEqual(numberedRows(count).map(r => r[0]));
});

Then('pagination controls should show {int} pages', async function(pageCount) {
    await expect(pageInfo(this)).toHaveText(`Page 1 of ${pageCount}`);
});

async function paginatedTable(world, pageNum) {
    describeTable(world, 'tx-paginate tx-per-page="10"', ['Item', 'Number'], numberedRows(50));
    await mounted(world);
    for (let p = 1; p < pageNum; p++) {
        await pagerButton(world, 'Next').click();
    }
    await expect(pageInfo(world)).toHaveText(`Page ${pageNum} of 5`);
}

Given('a paginated table on page {int}', async function(pageNum) {
    await paginatedTable(this, pageNum);
});

Given('a paginated table', async function() {
    await paginatedTable(this, 1);
});

When('in tableX, the user clicks {string}', async function(text) {
    await pagerButton(this, text).click();
});

Then('page {int} should display', async function(pageNum) {
    await expect(pageInfo(this)).toHaveText(`Page ${pageNum} of 5`);
});

Then('rows {int}-{int} should be visible', async function(start, end) {
    const expected = numberedRows(end).slice(start - 1).map(r => r[0]);
    expect(await visibleRowTexts(this)).toEqual(expected);
});

Then('the {string} pagination button should be disabled', async function(text) {
    const button = pagerButton(this, text);
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
});

When('the table is on its last page', async function() {
    while (await pagerButton(this, 'Next').isEnabled()) {
        await pagerButton(this, 'Next').click();
    }
    await expect(pageInfo(this)).toHaveText('Page 5 of 5');
});

// ============================================================================
// ACCESSIBILITY
// ============================================================================

Then('the table should expose role {string}', async function(role) {
    await mounted(this);
    await expect(this.page.getByRole(role)).toHaveCount(1);
    expect(await this.page.getByRole(role).evaluate(el => el.id)).toBe('test-table');
});

Then('headers should have role {string}', async function(role) {
    const ths = this.page.locator('#test-table thead th');
    const count = await ths.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
        await expect(ths.nth(i)).toHaveAttribute('role', role);
    }
    await expect(this.page.getByRole(role)).toHaveCount(count);
});

Then('cells should have role {string}', async function(role) {
    const tdCount = await this.page.locator('#test-table tbody td').count();
    expect(tdCount).toBeGreaterThan(0);
    await expect(this.page.getByRole(role)).toHaveCount(tdCount);
});

Given('a sortable column', async function() {
    describeTable(this, 'tx-sortable', ['Name', 'Age', 'City'], PEOPLE);
    await mounted(this);
});

Then('the header should have aria-sort={string}', async function(value) {
    await expect(this.page.locator('#test-table thead th').first()).toHaveAttribute('aria-sort', value);
});

When('sorted ascending', async function() {
    await this.page.locator('#test-table thead th').first().click();
});

Then('aria-sort should be {string}', async function(value) {
    await expect(this.page.locator('#test-table thead th').first()).toHaveAttribute('aria-sort', value);
});

When('a column is sorted', async function() {
    await mounted(this);
    await header(this, 'Name').click();
});

Then('an aria-live region should announce the change', async function() {
    const region = this.page.locator('.tx-sr-only[aria-live="polite"]').filter({ hasText: /Sorted by/ });
    await expect(region).toHaveCount(1);
    await expect(region).toHaveText('Sorted by Name in ascending order');
    await expect(region).toHaveAttribute('aria-atomic', 'true');
});

Then('all controls should be keyboard accessible', async function() {
    const buttons = this.page.locator('.tx-pagination button');
    expect(await buttons.count()).toBe(2);
    expect(await buttons.evaluateAll(els => els.every(el => el.tagName === 'BUTTON'))).toBe(true);
    await pagerButton(this, 'Next').focus();
    await this.page.keyboard.press('Enter');
    await expect(pageInfo(this)).toHaveText('Page 2 of 5');
    await pagerButton(this, 'Previous').focus();
    await this.page.keyboard.press('Space');
    await expect(pageInfo(this)).toHaveText('Page 1 of 5');
    await pagerButton(this, 'Next').focus();
    await this.page.keyboard.press('Enter');
    await expect(pageInfo(this)).toHaveText('Page 2 of 5');
});

Then('Tab should navigate between controls', async function() {
    await pagerButton(this, 'Previous').focus();
    await this.page.keyboard.press('Tab');
    expect(await this.page.evaluate(() => document.activeElement.className)).toBe('tx-pagination-next');
    await this.page.keyboard.press('Shift+Tab');
    expect(await this.page.evaluate(() => document.activeElement.className)).toBe('tx-pagination-prev');
});

// ============================================================================
// VIRTUAL SCROLLING
// ============================================================================

Given('a table with tx-virtual={string}', async function(enabled) {
    describeTable(this, `tx-virtual="${enabled}"`, ['Item', 'Number'], []);
});

Given(/^(\d{1,3}(?:,\d{3})+) rows$/, async function(count) {
    this.tx.rows = numberedRows(parseInt(count.replace(/,/g, ''), 10));
});

When('the table renders', async function() {
    await mounted(this);
    await this.page.waitForLoadState('load');
});

Then('only visible rows should be in DOM', async function() {
    const total = this.tx.rows.length;
    await expect(this.page.locator('.tx-virtual-scroll-container #test-table')).toHaveCount(1);
    await expect(this.element).toHaveAttribute('aria-rowcount', String(total));
    const rendered = await this.page.locator('#test-table tbody tr').count();
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(200);
    expect(await this.page.locator('#test-table tbody tr td').first().textContent()).toBe('Row 1');
    this.tx.renderedBefore = rendered;
});

When('in tableX, scrolling', async function() {
    await this.page.locator('.tx-virtual-scroll-container').evaluate(el => {
        el.scrollTop = el.scrollHeight / 2;
        el.dispatchEvent(new Event('scroll'));
    });
});

Then('rows should be dynamically added\\/removed', async function() {
    const firstCell = this.page.locator('#test-table tbody tr td').first();
    await expect(firstCell).not.toHaveText('Row 1');
    const first = parseInt((await firstCell.textContent()).replace('Row ', ''), 10);
    expect(first).toBeGreaterThan(1000);
    const rendered = await this.page.locator('#test-table tbody tr').count();
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(200);
});

Given(/^a table with (\d{1,3}(?:,\d{3})*) rows$/, async function(count) {
    describeTable(this, 'tx-sortable', ['Item', 'Number'], numberedRows(parseInt(count.replace(/,/g, ''), 10)).reverse());
    await mounted(this);
});

When('sorting', async function() {
    await this.page.locator('#test-table thead th').nth(1).click();
});

// ============================================================================
// EVENTS
// ============================================================================

Given('a table', async function() {
    describeTable(this, 'tx-sortable tx-filterable tx-filter-debounce="50"', ['Name', 'Age', 'City'], PEOPLE,
        { debounce: 50 });
    await mounted(this);
});

Then('event.detail should contain column and direction', async function() {
    const detail = await this.page.evaluate(() => window._testEventDetail);
    expect(detail.column).toBe(0);
    expect(detail.direction).toBe('asc');
});

When('filtering occurs', async function() {
    await typeFilter(this, 'Jane');
});

Then('event.detail should contain filter term', async function() {
    const detail = await this.page.evaluate(() => window._testEventDetail);
    expect(detail.filterTerm).toBe('Jane');
    expect(detail.matches).toBe(1);
});

When('the page changes', async function() {
    await pagerButton(this, 'Next').click();
    const detail = await this.page.evaluate(() => window._testEventDetail);
    expect(detail).toEqual({ page: 2, totalPages: 5 });
});

module.exports = {};
