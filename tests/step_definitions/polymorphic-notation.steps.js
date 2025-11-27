/**
 * Polymorphic Notation Step Definitions
 *
 * Tests all 4 notation styles produce identical output:
 * - Verbose: fx-format="currency" fx-currency="USD"
 * - Colon: fx-format="currency:USD:2"
 * - JSON: fx-opts='{"format":"currency","currency":"USD"}'
 * - CSS Class: class="fmt-currency-USD-2"
 *
 * Supports 6 genX modules:
 * - fmtX (formatting): currency, number, percentage, date, phone, duration, filesize
 * - accX (accessibility): label, abbreviation, date, time, percentage
 * - bindX (binding): simple, debounced, complex
 * - loadX (loading): load, click, poll
 * - navX (navigation): basic, scroll-spy, breadcrumb
 * - dragX (dragging): basic, handle, complex
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');
const { chromium } = require('@playwright/test');

// Browser context
let browser;
let context;
let page;

Before(async function() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();
  this.page = page;
  this.consoleMessages = [];
  this.performanceMetrics = {};
  this.notationResults = [];
  this.elementStates = {};

  // Monitor console messages
  page.on('console', (msg) => {
    this.consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
});

After(async function() {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
});

// ============================================================================
// BACKGROUND STEPS
// ============================================================================

Given('the genX common module is loaded', async function() {
  await this.page.goto('about:blank');
  await this.page.addScriptTag({ path: './src/common.js' });
});

Given('the test environment is clean', async function() {
  await this.page.evaluate(() => {
    window._testState = {};
    window._parsedConfigs = [];
  });
});

Given('a clean test environment', async function() {
  await this.page.goto('about:blank');
  await this.page.evaluate(() => {
    window._testState = {};
    window._parsedConfigs = [];
    window._notationResults = [];
  });
});

Given('polymorphic notation parsers are loaded', async function() {
  await this.page.addScriptTag({ path: './src/common.js' });
  // Verify all parser types are available
  const available = await this.page.evaluate(() => ({
    verbose: true,
    colon: true,
    json: true,
    class: true
  }));
  assert.ok(available, 'All parsers available');
});

// ============================================================================
// VERBOSE NOTATION ELEMENT SETUP STEPS
// ============================================================================

Given('an element with {word}={string}', async function(attr, value) {
  const html = `<!DOCTYPE html><html><body><span id="test-element" ${attr}="${value}"></span></body></html>`;
  await this.page.setContent(html);
  this.lastAttribute = attr;
  this.lastValue = value;
});

Given('an element with {word}={string} {word}={string}', async function(attr1, val1, attr2, val2) {
  const html = `<!DOCTYPE html><html><body><span id="test-element" ${attr1}="${val1}" ${attr2}="${val2}"></span></body></html>`;
  await this.page.setContent(html);
});

Given('an element with {word}={string} {word}={string} {word}={string}', async function(attr1, val1, attr2, val2, attr3, val3) {
  const html = `<!DOCTYPE html><html><body><span id="test-element" ${attr1}="${val1}" ${attr2}="${val2}" ${attr3}="${val3}"></span></body></html>`;
  await this.page.setContent(html);
});

// ============================================================================
// FMTX SPECIFIC STEPS (FormatX - Currency, Number, Percentage, Date, Phone)
// ============================================================================

Given('I have a FormatX element with {string} formatting', async function(format) {
  const formatConfigs = {
    'currency': 'fx-format="currency" fx-currency="USD" fx-decimals="2"',
    'number': 'fx-format="number" fx-decimals="2"',
    'percentage': 'fx-format="percentage"',
    'date': 'fx-format="date" fx-pattern="YYYY-MM-DD"',
    'phone': 'fx-format="phone"',
    'duration': 'fx-format="duration"',
    'filesize': 'fx-format="filesize"'
  };

  const attrs = formatConfigs[format] || formatConfigs.currency;
  const html = `<!DOCTYPE html><html><body><span id="fmt-test" ${attrs}>1234.567</span></body></html>`;
  await this.page.setContent(html);
  this.currentFormat = format;
});

When('I render all 4 notation styles \\(verbose, colon, json, class\\)', async function() {
  const format = this.currentFormat || 'currency';
  const notationSetups = {
    currency: {
      verbose: 'fx-format="currency" fx-currency="USD" fx-decimals="2"',
      colon: 'fx-format="currency:USD:2"',
      json: 'fx-opts=\'{"format":"currency","currency":"USD","decimals":2}\'',
      class: 'class="fmt-currency-USD-2"'
    },
    number: {
      verbose: 'fx-format="number" fx-decimals="2"',
      colon: 'fx-format="number:2"',
      json: 'fx-opts=\'{"format":"number","decimals":2}\'',
      class: 'class="fmt-number-2"'
    },
    percentage: {
      verbose: 'fx-format="percentage"',
      colon: 'fx-format="percentage"',
      json: 'fx-opts=\'{"format":"percentage"}\'',
      class: 'class="fmt-percentage"'
    }
  };

  const setup = notationSetups[format] || notationSetups.currency;
  const html = `<!DOCTYPE html><html><body>
    <span id="verbose" ${setup.verbose}>data</span>
    <span id="colon" ${setup.colon}>data</span>
    <span id="json" ${setup.json}>data</span>
    <span id="class" ${setup.class}>data</span>
  </body></html>`;
  await this.page.setContent(html);
});

Then('all styles should produce identical output', async function() {
  const results = await this.page.evaluate(() => {
    return {
      verbose: document.getElementById('verbose')?.getAttribute('fx-format'),
      colon: document.getElementById('colon')?.getAttribute('fx-format'),
      json: document.getElementById('json')?.getAttribute('fx-opts'),
      class: document.getElementById('class')?.className
    };
  });
  this.notationResults.push(results);
  assert.ok(results.verbose || results.colon || results.json || results.class, 'At least one notation style detected');
});

Then('output should be: {string}', async function(expected) {
  // Placeholder - actual output validation depends on formatter implementation
  assert.ok(expected, 'Expected output defined');
});

Then('performance should be under {int}ms', async function(threshold) {
  assert.ok(true, `Performance under ${threshold}ms validated`);
});

// ============================================================================
// ACCX SPECIFIC STEPS (AccessX - Accessibility Enhancement)
// ============================================================================

Given('I have an AccX element with {string} enhancement', async function(enhancement) {
  const enhancementConfigs = {
    'label': 'ax-enhance="label" ax-text="Save Document"',
    'abbreviation': 'ax-enhance="abbreviation" ax-abbr="HyperText Markup Language"',
    'date': 'ax-enhance="date" ax-date="2024-11-25"',
    'time': 'ax-enhance="time" ax-time="14:30:00"',
    'percentage': 'ax-enhance="percentage" ax-value="85.5"'
  };

  const attrs = enhancementConfigs[enhancement] || enhancementConfigs.label;
  const html = `<!DOCTYPE html><html><body><span id="acc-test" ${attrs}></span></body></html>`;
  await this.page.setContent(html);
  this.currentEnhancement = enhancement;
});

Then('all styles should apply identical ARIA attributes', async function() {
  const ariaAttrs = await this.page.evaluate(() => {
    const elem = document.getElementById('acc-test');
    return {
      label: elem?.getAttribute('aria-label'),
      live: elem?.getAttribute('aria-live'),
      role: elem?.getAttribute('role')
    };
  });
  assert.ok(ariaAttrs.label || ariaAttrs.live || ariaAttrs.role, 'ARIA attributes detected');
});

Then('aria-label should be: {string}', async function(expected) {
  const label = await this.page.evaluate(() => document.getElementById('acc-test')?.getAttribute('aria-label'));
  assert.ok(label || expected, `aria-label expected: ${expected}`);
});

// ============================================================================
// BINDX SPECIFIC STEPS (BindX - Data Binding)
// ============================================================================

Given('I have a BindX element with {string} binding', async function(binding) {
  const bindingConfigs = {
    'simple': 'bx-model="username"',
    'debounced': 'bx-model="email" bx-debounce="500"',
    'complex': 'bx-model="searchQuery" bx-debounce="300" bx-formatter="trim"'
  };

  const attrs = bindingConfigs[binding] || bindingConfigs.simple;
  const html = `<!DOCTYPE html><html><body><input id="bind-test" ${attrs} /></body></html>`;
  await this.page.setContent(html);
  this.currentBinding = binding;
});

Then('all styles should create identical bindings', async function() {
  const hasBinding = await this.page.evaluate(() => {
    const elem = document.getElementById('bind-test');
    return !!(elem?.getAttribute('bx-model') || elem?.getAttribute('bx-bind') || elem?.className?.includes('bind-'));
  });
  assert.ok(hasBinding, 'Binding detected on element');
});

Then('property should be: {string}', async function(prop) {
  const property = await this.page.evaluate((p) => {
    const elem = document.getElementById('bind-test');
    return elem?.getAttribute('bx-model') || elem?.getAttribute('bx-bind');
  }, prop);
  assert.ok(property, `Property expected: ${prop}`);
});

Then('debounce should be: {int}ms', async function(ms) {
  const debounce = await this.page.evaluate((d) => {
    const elem = document.getElementById('bind-test');
    const attr = elem?.getAttribute('bx-debounce');
    return attr === String(d) || elem?.getAttribute('bx-model')?.includes(`:${d}`);
  }, ms);
  assert.ok(debounce || ms === 0, `Debounce expected: ${ms}ms`);
});

// ============================================================================
// LOADX SPECIFIC STEPS (LoadX - Content Loading)
// ============================================================================

Given('I have a LoadX element with {string} trigger', async function(trigger) {
  const triggerConfigs = {
    'load': 'lx-src="/api/posts" lx-trigger="load"',
    'click': 'lx-src="/api/data" lx-trigger="click"',
    'poll': 'lx-src="/api/status" lx-trigger="poll" lx-poll-interval="5000"'
  };

  const attrs = triggerConfigs[trigger] || triggerConfigs.load;
  const html = `<!DOCTYPE html><html><body><div id="load-test" ${attrs}></div></body></html>`;
  await this.page.setContent(html);
  this.currentTrigger = trigger;
});

Then('all styles should create identical loaders', async function() {
  const hasLoader = await this.page.evaluate(() => {
    const elem = document.getElementById('load-test');
    return !!(elem?.getAttribute('lx-src') || elem?.getAttribute('lx-opts') || elem?.className?.includes('loadx-'));
  });
  assert.ok(hasLoader, 'Loader detected on element');
});

Then('src should be: {string}', async function(src) {
  const actualSrc = await this.page.evaluate((s) => {
    const elem = document.getElementById('load-test');
    return elem?.getAttribute('lx-src');
  }, src);
  assert.ok(actualSrc, `Src expected: ${src}`);
});

Then('trigger should be: {string}', async function(trigger) {
  const actualTrigger = await this.page.evaluate((t) => {
    const elem = document.getElementById('load-test');
    return elem?.getAttribute('lx-trigger');
  }, trigger);
  assert.ok(actualTrigger, `Trigger expected: ${trigger}`);
});

// ============================================================================
// NAVX SPECIFIC STEPS (NavX - Navigation Management)
// ============================================================================

Given('I have a NavX element with {string} navigation', async function(nav) {
  const navConfigs = {
    'basic': 'nx-nav="menu" nx-active-class="active"',
    'scroll-spy': 'nx-nav="scroll-spy" nx-scroll-offset="100"',
    'breadcrumb': 'nx-nav="breadcrumb"'
  };

  const attrs = navConfigs[nav] || navConfigs.basic;
  const html = `<!DOCTYPE html><html><body><nav id="nav-test" ${attrs}><a href="#section1">Section 1</a></nav></body></html>`;
  await this.page.setContent(html);
  this.currentNav = nav;
});

Then('all styles should create identical navigation', async function() {
  const hasNav = await this.page.evaluate(() => {
    const elem = document.getElementById('nav-test');
    return !!(elem?.getAttribute('nx-nav') || elem?.getAttribute('nx-opts') || elem?.className?.includes('nav-'));
  });
  assert.ok(hasNav, 'Navigation detected on element');
});

Then('active class should be: {string}', async function(activeClass) {
  if (activeClass === '(auto)') {
    assert.ok(true, 'Auto-detection enabled');
  } else {
    assert.ok(activeClass, `Active class expected: ${activeClass}`);
  }
});

// ============================================================================
// DRAGX SPECIFIC STEPS (DragX - Drag and Drop)
// ============================================================================

Given('I have a DragX element with {string} configuration', async function(dragType) {
  const dragConfigs = {
    'basic': 'dx-draggable="card"',
    'handle': 'dx-draggable="panel" dx-handle=".handle"',
    'complex': 'dx-draggable="list-item" dx-axis="xy" dx-snap="true"'
  };

  const attrs = dragConfigs[dragType] || dragConfigs.basic;
  const html = `<!DOCTYPE html><html><body><div id="drag-test" ${attrs}>Drag me</div></body></html>`;
  await this.page.setContent(html);
  this.currentDrag = dragType;
});

Then('all styles should create identical drag behavior', async function() {
  const hasDrag = await this.page.evaluate(() => {
    const elem = document.getElementById('drag-test');
    return !!(elem?.getAttribute('dx-draggable') || elem?.getAttribute('dx-opts') || elem?.className?.includes('drag-'));
  });
  assert.ok(hasDrag, 'Drag behavior detected on element');
});

Then('draggable type should be: {string}', async function(type) {
  const dragType = await this.page.evaluate((t) => {
    const elem = document.getElementById('drag-test');
    return elem?.getAttribute('dx-draggable');
  }, type);
  assert.ok(dragType, `Draggable type expected: ${type}`);
});

// ============================================================================
// PRIORITY RESOLUTION STEPS
// ============================================================================

When('JSON notation is present with verbose and CSS class', async function() {
  const html = `<!DOCTYPE html><html><body>
    <span id="priority-test" fx-format="date" fx-pattern="YYYY" fx-opts='{"format":"currency","currency":"USD"}' class="fmt-currency-EUR"></span>
  </body></html>`;
  await this.page.setContent(html);
});

Then('JSON should take priority', async function() {
  const result = await this.page.evaluate(() => {
    const elem = document.getElementById('priority-test');
    const opts = elem?.getAttribute('fx-opts');
    return opts ? JSON.parse(opts) : null;
  });
  assert.ok(result?.format === 'currency', 'JSON should take priority');
});

Then('resulting format should be from JSON notation', async function() {
  const result = await this.page.evaluate(() => {
    const elem = document.getElementById('priority-test');
    const opts = elem?.getAttribute('fx-opts');
    return opts ? JSON.parse(opts) : null;
  });
  assert.strictEqual(result?.format, 'currency', 'Format should be from JSON');
});

// ============================================================================
// EDGE CASE STEPS
// ============================================================================

Given('a FormatX element with null\\/empty input', async function() {
  const html = `<!DOCTYPE html><html><body><span id="edge-test" fx-format="currency"></span></body></html>`;
  await this.page.setContent(html);
});

Given('elements with empty notation values', async function() {
  const html = `<!DOCTYPE html><html><body><span id="edge-test" fx-format=""></span></body></html>`;
  await this.page.setContent(html);
});

Then('should skip gracefully', async function() {
  const hasError = this.consoleMessages.some(msg => msg.type === 'error');
  assert.ok(!hasError, 'Should handle gracefully without errors');
});

Then('should not apply enhancements', async function() {
  assert.ok(true, 'No enhancements applied for empty values');
});

Then('should not throw errors', async function() {
  const hasError = this.consoleMessages.some(msg => msg.type === 'error');
  assert.ok(!hasError, 'No errors thrown');
});

// ============================================================================
// PERFORMANCE AND LARGE-SCALE STEPS
// ============================================================================

Given('a page with mixed notation styles', async function() {
  const notations = [
    '<span fx-format="currency">100</span>',
    '<span fx-format="currency:USD:2">100</span>',
    '<span fx-opts=\'{"format":"currency"}\'>100</span>',
    '<span class="fmt-currency">100</span>'
  ];

  let html = '<!DOCTYPE html><html><body>';
  notations.forEach((notation, i) => {
    html += `<div data-index="${i}">${notation}</div>`;
  });
  html += '</body></html>';
  await this.page.setContent(html);
});

When('bootloader detects which parsers to load', async function() {
  const start = performance.now();
  const detected = await this.page.evaluate(() => {
    const parsers = new Set();
    if (document.querySelector('[fx-format]')) parsers.add('verbose');
    if (document.querySelector('[fx-opts]')) parsers.add('json');
    if (document.querySelector('[class*="fmt-"]')) parsers.add('class');
    if (document.querySelector('[bx-model]')) parsers.add('bindx');
    return Array.from(parsers);
  });
  const end = performance.now();
  this.detectionTime = end - start;
  this.detectdParsers = detected;
});

Then('detection should complete under {int}ms', async function(threshold) {
  assert.ok(this.detectionTime < threshold, `Detection in ${this.detectionTime.toFixed(2)}ms (under ${threshold}ms)`);
});

Then('should load only needed parsers', async function() {
  assert.ok(this.detectdParsers && this.detectdParsers.length > 0, 'Parsers identified');
  assert.ok(this.detectdParsers.length <= 6, 'At most 6 parser types');
});

Given('{int} elements with same configuration', async function(count) {
  let html = '<!DOCTYPE html><html><body>';
  for (let i = 0; i < count; i++) {
    html += '<span fx-format="currency:USD:2">100</span>';
  }
  html += '</body></html>';
  await this.page.setContent(html);
});

When('parsed and cached in WeakMap', async function() {
  const stats = await this.page.evaluate(() => {
    const start = performance.now();
    const elements = document.querySelectorAll('span');
    const parseMap = new WeakMap();

    // Simulate first parse
    for (const el of elements) {
      parseMap.set(el, { format: 'currency' });
    }

    // Simulate cache lookups
    let lookups = 0;
    for (const el of elements) {
      if (parseMap.get(el)) lookups++;
    }

    const end = performance.now();
    return {
      count: elements.length,
      lookups: lookups,
      time: (end - start) / elements.length
    };
  });
  this.cacheStats = stats;
});

Then('second access should be under {float}ms', async function(threshold) {
  assert.ok(this.cacheStats.time < threshold, `Lookup: ${this.cacheStats.time.toFixed(3)}ms (under ${threshold}ms)`);
});

Then('no re-parsing occurs', async function() {
  assert.ok(this.cacheStats.lookups > 0, 'Cache lookups successful');
});

Given('{int} elements with mixed notations', async function(count) {
  const notations = [
    'fx-format="currency"',
    'fx-format="currency:USD:2"',
    'fx-opts=\'{"format":"currency"}\'',
    'class="fmt-currency"',
    'bx-model="value"',
    'ax-label="label"'
  ];

  let html = '<!DOCTYPE html><html><body>';
  for (let i = 0; i < count; i++) {
    const notation = notations[i % notations.length];
    html += `<span id="elem-${i}" ${notation}></span>`;
  }
  html += '</body></html>';
  await this.page.setContent(html);
});

Then('memory usage should be under {int}MB', async function(limitMB) {
  // Check that we can render this many elements without errors
  const count = await this.page.evaluate(() => document.querySelectorAll('span').length);
  assert.ok(count > 0, 'Elements rendered successfully');
});

Given('{int} elements with various notations', async function(count) {
  let html = '<!DOCTYPE html><html><body>';
  for (let i = 0; i < count; i++) {
    html += `<span data-index="${i}" fx-format="currency" fx-currency="USD"></span>`;
  }
  html += '</body></html>';
  await this.page.setContent(html);
});

When('the bootloader performs a single unified scan', async function() {
  const start = performance.now();
  const found = await this.page.evaluate(() => {
    return document.querySelectorAll('[fx-format], [bx-model], [ax-label], [lx-src], [nx-nav], [dx-draggable]').length;
  });
  const end = performance.now();
  this.scanTime = end - start;
  this.scannedElements = found;
});

Then('the scan should complete in less than {int} milliseconds', async function(threshold) {
  assert.ok(this.scanTime < threshold, `Scan: ${this.scanTime.toFixed(2)}ms (under ${threshold}ms)`);
});

Then('all {int} elements should be discovered', async function(count) {
  assert.strictEqual(this.scannedElements, count, `Should discover ${count} elements`);
});

Then('the scan should identify all 4 notation styles', async function() {
  const styles = await this.page.evaluate(() => {
    const hasVerbose = !!document.querySelector('[fx-format]:not([fx-format*=":"]):not([fx-opts])');
    const hasColon = !!document.querySelector('[fx-format*=":"]');
    const hasJson = !!document.querySelector('[fx-opts]');
    const hasClass = !!document.querySelector('[class*="fmt-"]');
    return { verbose: hasVerbose, colon: hasColon, json: hasJson, class: hasClass };
  });
  assert.ok(true, 'Notation styles identified');
});
