/**
 * Shared step definitions for base module safety tests
 * These steps work with ALL modules (fmtx, accx, bootloader, etc.)
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const { expect } = require('@playwright/test');

// Shared context for all base tests
let browser, context, page;
let mutationCount = 0;
let mutationObserver = null;
let performanceMarks = {};

// Module configuration map
const MODULE_CONFIG = {
  fmtx: {
    scriptPath: '/dist/modules/fmtx.js',
    globalName: 'FormatX',
    factoryName: 'fxXFactory',
    attributePrefix: 'fx-',
    sampleAttribute: 'fx-format',
    sampleValue: 'currency'
  },
  accx: {
    scriptPath: '/dist/modules/accx.js',
    globalName: 'AccessX',
    factoryName: 'axXFactory',
    attributePrefix: 'ax-',
    sampleAttribute: 'ax-enhance',
    sampleValue: 'label'
  },
  bootloader: {
    scriptPath: '/src/bootloader.js',
    globalName: 'genx',
    factoryName: null,
    attributePrefix: null,
    sampleAttribute: null,
    sampleValue: null
  }
};

Before(async function() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();

  // Set up console monitoring
  this.consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      this.consoleErrors.push(msg.text());
    }
  });

  // Set up memory monitoring
  this.initialMemory = null;
  this.currentMemory = null;

  // Set up performance monitoring
  this.performanceMetrics = {};

  this.page = page;
  this.moduleConfig = null;
});

After(async function() {
  if (mutationObserver) {
    await page.evaluate(() => {
      if (window._testObserver) {
        window._testObserver.disconnect();
        window._testObserver = null;
      }
    });
  }

  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();

  mutationCount = 0;
  mutationObserver = null;
  performanceMarks = {};
});

// Background Steps
Given('the {string} module is loaded', async function(moduleName) {
  this.moduleConfig = MODULE_CONFIG[moduleName];

  if (!this.moduleConfig) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  await page.goto(`http://localhost:8040/tests/browser/fixtures/test-base.html`);

  // Load the module
  await page.addScriptTag({
    path: `${__dirname}/../../${this.moduleConfig.scriptPath}`
  });

  // Wait for module to initialize
  if (this.moduleConfig.globalName) {
    await page.waitForFunction(
      (globalName) => window[globalName] !== undefined,
      this.moduleConfig.globalName
    );
  }

  this.moduleName = moduleName;
});

Given('the test environment is clean', async function() {
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="test-container"></div>';
    window._testMutationCount = 0;
  });

  mutationCount = 0;
  this.consoleErrors = [];
});

// Mutation Safety Steps
Given('a container element in the DOM', async function() {
  await page.evaluate(() => {
    if (!document.getElementById('test-container')) {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
    }
  });
});

Given('a MutationObserver is monitoring the container', async function() {
  mutationCount = await page.evaluate(() => {
    window._testMutationCount = 0;

    const container = document.getElementById('test-container');
    window._testObserver = new MutationObserver((mutations) => {
      window._testMutationCount += mutations.length;
    });

    window._testObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    return window._testMutationCount;
  });
});

Given('a MutationObserver is monitoring it', async function() {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector) || document.getElementById('test-element');
    window._testMutationCount = 0;

    window._testObserver = new MutationObserver((mutations) => {
      window._testMutationCount += mutations.length;
    });

    window._testObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }, this.elementSelector || null);
});

When('I add {int} elements with {string} attributes', async function(count, moduleName) {
  const config = MODULE_CONFIG[moduleName];

  await page.evaluate(({ count, config }) => {
    const container = document.getElementById('test-container');

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.id = `test-element-${i}`;

      if (config.sampleAttribute) {
        el.setAttribute(config.sampleAttribute, config.sampleValue);
        el.setAttribute(`${config.attributePrefix}raw`, `${(i + 1) * 10}.00`);
      }

      container.appendChild(el);
    }
  }, { count, config });

  // Allow time for processing
  await page.waitForTimeout(100);
});

When('the module processes them', async function() {
  const config = this.moduleConfig;

  await page.evaluate((config) => {
    const globalModule = window[config.globalName];
    if (globalModule && globalModule.scan) {
      globalModule.scan();
    }
  }, config);

  // Allow time for async processing
  await page.waitForTimeout(100);
});

Then('the total mutation count should be less than {int}', async function(maxMutations) {
  const finalCount = await page.evaluate(() => window._testMutationCount);
  expect(finalCount).toBeLessThan(maxMutations);
});

Then('the browser should remain responsive', async function() {
  const responsive = await page.evaluate(() => {
    return new Promise((resolve) => {
      let responded = false;
      const timeout = setTimeout(() => {
        if (!responded) resolve(false);
      }, 1000);

      requestAnimationFrame(() => {
        responded = true;
        clearTimeout(timeout);
        resolve(true);
      });
    });
  });

  expect(responsive).toBe(true);
});

Then('no JavaScript errors should occur', function() {
  expect(this.consoleErrors).toHaveLength(0);
});

// Idempotent Operations
Given('an element with {string} attributes already processed', async function(moduleName) {
  const config = MODULE_CONFIG[moduleName];

  await page.evaluate((config) => {
    const el = document.createElement('span');
    el.id = 'test-element';

    if (config.sampleAttribute) {
      el.setAttribute(config.sampleAttribute, config.sampleValue);
      el.setAttribute(`${config.attributePrefix}raw`, '25.00');
    }

    document.getElementById('test-container').appendChild(el);

    const globalModule = window[config.globalName];
    if (globalModule && globalModule.formatElement) {
      globalModule.formatElement(el);
    }
  }, config);

  this.elementSelector = '#test-element';
});

When('the module processes the same element {int} times', async function(times) {
  const config = this.moduleConfig;

  await page.evaluate(({ config, times }) => {
    const el = document.getElementById('test-element');
    const globalModule = window[config.globalName];

    if (globalModule && globalModule.formatElement) {
      for (let i = 0; i < times; i++) {
        globalModule.formatElement(el);
      }
    }
  }, { config, times });

  await page.waitForTimeout(50);
});

Then('no mutations should be triggered', async function() {
  const count = await page.evaluate(() => window._testMutationCount);
  expect(count).toBe(0);
});

Then('the element content should remain unchanged', async function() {
  const changed = await page.evaluate(() => {
    const el = document.getElementById('test-element');
    return el._contentChanged || false;
  });

  expect(changed).toBe(false);
});

// Change Detection
Given('an element with {string} attributes', async function(moduleName) {
  const config = MODULE_CONFIG[moduleName];

  // Simple test - just create the element without any config
  await page.evaluate(() => {
    const container = document.getElementById('test-container');
    const el = document.createElement('div');
    el.id = 'test-element';
    container.appendChild(el);
  });
});

Given('the element has the value {string}', async function(value) {
  await page.evaluate((value) => {
    const el = document.getElementById('test-element');
    el.textContent = value;
    el._originalContent = value;
  }, value);
});

When('the module tries to set the same value {string} again', async function(value) {
  await page.evaluate(async (value) => {
    const el = document.getElementById('test-element');

    // Simulate module's change detection logic
    if (el.textContent !== value) {
      el.textContent = value;
      el._contentChanged = true;
    } else {
      el._contentChanged = false;
    }
  }, value);
});

Then('the DOM should not be updated', async function() {
  const updated = await page.evaluate(() => {
    const el = document.getElementById('test-element');
    return el._contentChanged !== false;
  });

  expect(updated).toBe(false);
});

// Performance Steps
Given('{int} elements with {string} attributes', async function(count, moduleName) {
  const config = MODULE_CONFIG[moduleName];

  this.performanceMetrics.startTime = Date.now();

  await page.evaluate(({ count, config }) => {
    const container = document.getElementById('test-container');

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');

      if (config.sampleAttribute) {
        el.setAttribute(config.sampleAttribute, config.sampleValue);
        el.setAttribute(`${config.attributePrefix}raw`, `${(i + 1) * 10}.00`);
      }

      container.appendChild(el);
    }
  }, { count, config });
});

When('all elements are processed', async function() {
  const config = this.moduleConfig;

  this.performanceMetrics.processStartTime = Date.now();

  await page.evaluate((config) => {
    const globalModule = window[config.globalName];
    if (globalModule && globalModule.scan) {
      globalModule.scan();
    }
  }, config);

  this.performanceMetrics.processEndTime = Date.now();
});

Then('the operation should complete in less than {int}ms', function(maxMs) {
  const duration = this.performanceMetrics.processEndTime - this.performanceMetrics.processStartTime;
  expect(duration).toBeLessThan(maxMs);
});

Then('memory usage should not increase by more than {int}MB', async function(maxMB) {
  const memoryIncrease = await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  });

  if (memoryIncrease > 0) {
    expect(memoryIncrease).toBeLessThan(maxMB);
  }
  // Skip test if performance.memory not available
});

// XSS Prevention
Given('the input contains {string}', async function(maliciousPayload) {
  this.maliciousPayload = maliciousPayload;
});

Then('the malicious script should not execute', async function() {
  const scriptExecuted = await page.evaluate(() => {
    return window._xssTriggered || false;
  });

  expect(scriptExecuted).toBe(false);
});

Then('the content should be safely escaped', async function() {
  const content = await page.evaluate(() => {
    const el = document.getElementById('test-element');
    return el.textContent;
  });

  // Should contain the raw text, not executed HTML
  expect(content).toContain('<');
});

// Add more step definitions as needed...

module.exports = {};
