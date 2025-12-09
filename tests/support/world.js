const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

// Shared browser instance reused across scenarios to speed up and stabilize tests.
let _sharedBrowser = null;

class GenXWorld extends World {
    constructor(options) {
        super(options);
        this.browser = null;   // reference to shared browser
        this.context = null;   // per-scenario context
        this.page = null;      // per-scenario page
        this.modules = {};
        this.elements = new Map();
    }

    // Launch a shared browser for the test worker (called from hooks BeforeAll)
    static async openSharedBrowser() {
        if (!_sharedBrowser) {
            _sharedBrowser = await chromium.launch({ headless: true });
        }
        return _sharedBrowser;
    }

    // Close the shared browser (called from hooks AfterAll)
    static async closeSharedBrowser() {
        if (_sharedBrowser) {
            try {
                await _sharedBrowser.close();
            } finally {
                _sharedBrowser = null;
            }
        }
    }

    // Open a new context and page for this scenario (uses shared browser)
    async openBrowser() {
        this.browser = await GenXWorld.openSharedBrowser();
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    // Close only the per-scenario page/context; do NOT close the shared browser here.
    async closeBrowser() {
        try {
            if (this.page && !this.page.isClosed()) await this.page.close();
        } catch (e) {
            // ignore errors during close
        }
        try {
            if (this.context) await this.context.close();
        } catch (e) {
            // ignore errors
        }
        this.page = null;
        this.context = null;
        // keep this.browser pointing to shared browser for diagnostics
    }

    async loadGenX() {
        // Navigate to the test fixture page that loads genX modules
        await this.page.goto('http://localhost:3000/fixtures/navx.html');
        // Wait for page to load
        await this.page.waitForLoadState('load');
    }

    async waitForGenXReady() {
        return this.page.evaluate(() => {
            return new Promise((resolve) => {
                window.addEventListener('genx:ready', (event) => {
                    resolve(event.detail);
                });
            });
        });
    }
}

setWorldConstructor(GenXWorld);

module.exports = { GenXWorld };
