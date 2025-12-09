const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const { GenXWorld } = require('./world');
const { startServer, stopServer } = require('../fixtures/server');

BeforeAll(async function() {
    console.log('Starting genX Test Suite');
    // Start the static test server
    await startServer();
    // Launch a shared browser once per worker to reduce overhead and flakiness
    await GenXWorld.openSharedBrowser();
});

Before(async function() {
    // Open a fresh context and page for each scenario
    await this.openBrowser();
});

After(async function() {
    // Close only per-scenario resources (page + context). Shared browser remains.
    await this.closeBrowser();
});

AfterAll(async function() {
    // Close the shared browser at the end of the worker run
    await GenXWorld.closeSharedBrowser();
    // Stop the static test server
    await stopServer();
    console.log('genX Test Suite Complete');
});
