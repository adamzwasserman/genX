const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');

BeforeAll(async function() {
    console.log('Starting genX Test Suite');
});

Before(async function() {
    // Open browser for each scenario
    await this.openBrowser();
});

After(async function() {
    // Close browser after each scenario
    await this.closeBrowser();
});

AfterAll(async function() {
    console.log('genX Test Suite Complete');
});
