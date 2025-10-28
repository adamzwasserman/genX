const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

class GenXWorld extends World {
    constructor(options) {
        super(options);
        this.browser = null;
        this.context = null;
        this.page = null;
        this.modules = {};
        this.elements = new Map();
    }

    async openBrowser() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    async closeBrowser() {
        if (this.page) await this.page.close();
        if (this.context) await this.context.close();
        if (this.browser) await this.browser.close();
    }

    async loadGenX() {
        // Load bootloader and modules
        await this.page.addScriptTag({ path: './src/bootloader.js' });
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
