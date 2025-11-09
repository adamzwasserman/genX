/**
 * Shared test utilities for all genX modules
 * Used by Cucumber, Playwright, and Jest tests
 */

const MODULE_CONFIG = {
  fmtx: {
    scriptPath: '/dist/modules/fmtx.js',
    globalName: 'FormatX',
    factoryName: 'fxXFactory',
    attributePrefix: 'fx-',
    sampleAttribute: 'fx-format',
    sampleValue: 'currency',
    sampleRaw: '25.00',
    expectedOutput: '$25.00'
  },
  accx: {
    scriptPath: '/dist/modules/accx.js',
    globalName: 'AccessX',
    factoryName: 'axXFactory',
    attributePrefix: 'ax-',
    sampleAttribute: 'ax-enhance',
    sampleValue: 'label',
    sampleRaw: 'Click me',
    expectedOutput: null // accx doesn't transform content
  },
  bootloader: {
    scriptPath: '/src/bootloader.js',
    globalName: 'genx',
    factoryName: null,
    attributePrefix: null,
    sampleAttribute: null,
    sampleValue: null,
    sampleRaw: null,
    expectedOutput: null
  }
};

/**
 * Create test element configuration for a module
 * @param {string} moduleName - Module name (fmtx, accx, etc.)
 * @param {object} config - Optional overrides
 * @returns {object} Element configuration
 */
function createTestElement(moduleName, config = {}) {
  const moduleConfig = MODULE_CONFIG[moduleName];

  if (!moduleConfig) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  return {
    tag: config.tag || 'span',
    id: config.id || 'test-element',
    attributes: {
      [moduleConfig.sampleAttribute]: config.value || moduleConfig.sampleValue,
      [`${moduleConfig.attributePrefix}raw`]: config.raw || moduleConfig.sampleRaw,
      ...config.attributes
    },
    content: config.content || moduleConfig.sampleRaw
  };
}

/**
 * Setup MutationObserver in browser context
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector to observe
 * @returns {Promise<number>} Initial mutation count
 */
async function setupMutationObserver(page, selector = '#test-container') {
  return page.evaluate((sel) => {
    window._testMutationCount = 0;
    const target = document.querySelector(sel);

    if (!target) {
      throw new Error(`Element not found: ${sel}`);
    }

    window._testObserver = new MutationObserver((mutations) => {
      window._testMutationCount += mutations.length;

      // Store mutation details for debugging
      if (!window._testMutations) {
        window._testMutations = [];
      }

      mutations.forEach(m => {
        window._testMutations.push({
          type: m.type,
          target: m.target.nodeName,
          attributeName: m.attributeName
        });
      });
    });

    window._testObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    return window._testMutationCount;
  }, selector);
}

/**
 * Get current mutation count
 * @param {Page} page - Playwright page object
 * @returns {Promise<number>} Mutation count
 */
async function getMutationCount(page) {
  return page.evaluate(() => window._testMutationCount || 0);
}

/**
 * Disconnect MutationObserver
 * @param {Page} page - Playwright page object
 */
async function disconnectObserver(page) {
  await page.evaluate(() => {
    if (window._testObserver) {
      window._testObserver.disconnect();
      window._testObserver = null;
    }
  });
}

/**
 * Check if browser is responsive
 * @param {Page} page - Playwright page object
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<boolean>} True if responsive
 */
async function checkResponsiveness(page, timeoutMs = 1000) {
  return page.evaluate((timeout) => {
    return new Promise((resolve) => {
      let responded = false;

      const timer = setTimeout(() => {
        if (!responded) {
          console.error('Browser unresponsive');
          resolve(false);
        }
      }, timeout);

      requestAnimationFrame(() => {
        responded = true;
        clearTimeout(timer);
        resolve(true);
      });
    });
  }, timeoutMs);
}

/**
 * Measure performance of an async operation
 * @param {Function} operation - Async function to measure
 * @returns {Promise<{duration: number, result: any}>}
 */
async function measurePerformance(operation) {
  const startTime = Date.now();
  const result = await operation();
  const endTime = Date.now();

  return {
    duration: endTime - startTime,
    result
  };
}

/**
 * Get memory usage in browser
 * @param {Page} page - Playwright page object
 * @returns {Promise<{used: number, total: number} | null>} Memory in MB
 */
async function getMemoryUsage(page) {
  return page.evaluate(() => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024) * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024) * 100) / 100,
        limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024) * 100) / 100
      };
    }
    return null;
  });
}

/**
 * Force garbage collection (requires --expose-gc flag)
 * @param {Page} page - Playwright page object
 */
async function forceGarbageCollection(page) {
  try {
    await page.evaluate(() => {
      if (typeof gc === 'function') {
        gc();
      }
    });
  } catch (e) {
    // gc() not available, that's okay
  }
}

/**
 * Check for JavaScript errors
 * @param {Page} page - Playwright page object
 * @returns {Promise<string[]>} Array of error messages
 */
async function getJavaScriptErrors(page) {
  return page.evaluate(() => {
    return window._consoleErrors || [];
  });
}

/**
 * Load module in browser
 * @param {Page} page - Playwright page object
 * @param {string} moduleName - Module name
 * @returns {Promise<void>}
 */
async function loadModule(page, moduleName) {
  const config = MODULE_CONFIG[moduleName];

  if (!config) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  // Load module script
  await page.addScriptTag({
    path: `${__dirname}/../../${config.scriptPath}`
  });

  // Wait for module to initialize
  if (config.globalName) {
    await page.waitForFunction(
      (globalName) => window[globalName] !== undefined,
      config.globalName
    );
  }
}

/**
 * Create multiple test elements
 * @param {Page} page - Playwright page object
 * @param {string} moduleName - Module name
 * @param {number} count - Number of elements
 * @param {string} containerSelector - Container selector
 */
async function createMultipleElements(page, moduleName, count, containerSelector = '#test-container') {
  const config = MODULE_CONFIG[moduleName];

  await page.evaluate(({ count, config, containerSelector }) => {
    const container = document.querySelector(containerSelector);

    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.id = `test-element-${i}`;

      if (config.sampleAttribute) {
        el.setAttribute(config.sampleAttribute, config.sampleValue);
        el.setAttribute(`${config.attributePrefix}raw`, `${(i + 1) * 10}.00`);
      }

      container.appendChild(el);
    }
  }, { count, config: MODULE_CONFIG[moduleName], containerSelector });
}

/**
 * Check if XSS was triggered
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
async function checkXSSTriggered(page) {
  return page.evaluate(() => window._xssTriggered === true);
}

/**
 * Reset XSS trap
 * @param {Page} page - Playwright page object
 */
async function resetXSSTrap(page) {
  await page.evaluate(() => {
    window._xssTriggered = false;
  });
}

/**
 * Check frame rate
 * @param {Page} page - Playwright page object
 * @param {Function} operation - Operation to perform while measuring
 * @param {number} targetFPS - Target FPS (default 60)
 * @returns {Promise<{fps: number, maxFrameTime: number, passed: boolean}>}
 */
async function checkFrameRate(page, operation, targetFPS = 60) {
  await page.evaluate(() => {
    window._frameTimings = [];
    let lastTime = performance.now();

    function measureFrame() {
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      window._frameTimings.push(delta);
      lastTime = currentTime;

      if (window._frameTimings.length < 100) {
        requestAnimationFrame(measureFrame);
      }
    }

    requestAnimationFrame(measureFrame);
  });

  await operation();

  await page.waitForTimeout(100);

  return page.evaluate((targetFPS) => {
    const timings = window._frameTimings || [];
    const maxFrameTime = Math.max(...timings);
    const targetFrameTime = 1000 / targetFPS;

    return {
      fps: Math.round(1000 / (timings.reduce((a, b) => a + b, 0) / timings.length)),
      maxFrameTime: Math.round(maxFrameTime * 10) / 10,
      passed: maxFrameTime <= targetFrameTime,
      targetFrameTime,
      frameCount: timings.length
    };
  }, targetFPS);
}

module.exports = {
  MODULE_CONFIG,
  createTestElement,
  setupMutationObserver,
  getMutationCount,
  disconnectObserver,
  checkResponsiveness,
  measurePerformance,
  getMemoryUsage,
  forceGarbageCollection,
  getJavaScriptErrors,
  loadModule,
  createMultipleElements,
  checkXSSTriggered,
  resetXSSTrap,
  checkFrameRate
};
