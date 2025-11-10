const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { JSDOM } = require('jsdom');
const fixtures = require('../fixtures/loadx-fixtures');

// Load loadX implementation
let dom, window, document, loadX;

// Helper to create fresh DOM for each scenario
const createDOM = (html = '<body></body>') => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
        url: 'http://localhost',
        runScripts: 'dangerously',
        resources: 'usable'
    });
    window = dom.window;
    document = window.document;

    // Load loadX in the window context
    const fs = require('fs');
    const path = require('path');
    const loadXSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/loadx.js'),
        'utf-8'
    );

    // Execute loadX in window context
    const script = document.createElement('script');
    script.textContent = loadXSource;
    document.head.appendChild(script);

    loadX = window.loadX;

    return { dom, window, document, loadX };
};

// Store current element and config for tests
let currentElement;
let currentConfig;
let processedResult;
let parseError;

// Background
Given('loadX is initialized with default configuration', function() {
    createDOM();
    currentConfig = loadX.initLoadX(fixtures.defaultConfig);
});

// HTML attribute syntax
Given('an element with lx-strategy={string}', function(strategy) {
    const html = `<div lx-strategy="${strategy}">Loading...</div>`;
    createDOM(html);
    currentElement = document.querySelector('[lx-strategy]');
    currentConfig = loadX.initLoadX();
});

// CSS class syntax
Given('an element with class={string}', function(className) {
    const html = `<div class="${className}">Content</div>`;
    createDOM(html);
    currentElement = document.querySelector('div');
    currentConfig = loadX.initLoadX();
});

// JSON configuration
Given('an element with lx-config={string}', function(configStr) {
    const html = `<div lx-config='${configStr}'>Loading</div>`;
    createDOM(html);
    currentElement = document.querySelector('[lx-config]');
    currentConfig = loadX.initLoadX();
});

// Multiple attributes
Given('an element with lx-strategy={string} and class={string}', function(strategy, className) {
    const html = `<div lx-strategy="${strategy}" class="${className}">Content</div>`;
    createDOM(html);
    currentElement = document.querySelector('div');
    currentConfig = loadX.initLoadX();
});

// Data attribute
Given('an element with data-lx-strategy={string}', function(strategy) {
    const html = `<div data-lx-strategy="${strategy}">Content</div>`;
    createDOM(html);
    currentElement = document.querySelector('[data-lx-strategy]');
    currentConfig = loadX.initLoadX();
});

// lx-loading without strategy
Given('an element with lx-loading={string} but no strategy', function(loading) {
    const html = `<div lx-loading="${loading}">Content</div>`;
    createDOM(html);
    currentElement = document.querySelector('[lx-loading]');
    currentConfig = loadX.initLoadX();
});

// Multiple elements
Given('multiple elements with different lx- syntax styles', function() {
    const html = `
        <div lx-strategy="spinner">Element 1</div>
        <div class="lx-skeleton">Element 2</div>
        <div lx-config='{"strategy":"progress"}'>Element 3</div>
        <div class="lx:fade">Element 4</div>
    `;
    createDOM(html);
    currentConfig = loadX.initLoadX();
});

// When steps
When('loadX processes the element', function() {
    try {
        processedResult = window.loadX.parseElementAttributes(currentElement);
    } catch (error) {
        parseError = error;
    }
});

When('loadX scans the DOM', function() {
    // Scan happens automatically in initLoadX
    processedResult = document.querySelectorAll('[class*="lx-"], [lx-strategy], [lx-config], [lx-loading]');
});

// Then steps - Strategy selection
Then('spinner strategy should be selected', function() {
    expect(processedResult).to.exist;
    expect(processedResult.strategy).to.equal('spinner');
});

Then('skeleton strategy should be selected', function() {
    expect(processedResult).to.exist;
    expect(processedResult.strategy).to.equal('skeleton');
});

Then('progress strategy should be selected', function() {
    expect(processedResult).to.exist;
    expect(processedResult.strategy).to.equal('progress');
});

Then('the default strategy should be selected', function() {
    expect(processedResult).to.exist;
    expect(processedResult.strategy).to.equal('spinner'); // Default is spinner
});

// Configuration parsing
Then('configuration should be parsed correctly', function() {
    expect(processedResult).to.exist;
    expect(processedResult).to.be.an('object');
});

Then('duration should be set to {int}ms', function(duration) {
    expect(processedResult).to.exist;
    expect(processedResult.duration).to.equal(duration);
});

Then('mode should be set to {string}', function(mode) {
    expect(processedResult).to.exist;
    expect(processedResult.mode).to.equal(mode);
});

Then('minHeight should be set to {string}', function(minHeight) {
    expect(processedResult).to.exist;
    expect(processedResult.minHeight).to.equal(minHeight);
});

Then('animate should be true', function() {
    expect(processedResult).to.exist;
    expect(processedResult.animate).to.be.true;
});

// Registration
Then('the element should be registered for loading management', function() {
    expect(currentElement).to.exist;
    // Element should have internal tracking property or be in registry
    const tracked = currentElement.hasAttribute('data-lx-tracked') ||
                   window.loadX._registry?.has(currentElement);
    expect(tracked).to.be.true;
});

// Precedence
Then('attribute syntax should take precedence over class syntax', function() {
    expect(processedResult).to.exist;
    expect(processedResult.strategy).to.equal('spinner');
    expect(processedResult.strategy).to.not.equal('skeleton');
});

// Error handling
Then('a parsing error should be logged', function() {
    expect(parseError).to.exist;
    expect(parseError.message).to.include('parse');
});

Then('the element should fall back to default strategy', function() {
    // Despite error, should still process with default
    expect(processedResult.strategy).to.equal('spinner');
});

// Multiple elements
Then('all elements should be processed correctly', function() {
    expect(processedResult).to.exist;
    expect(processedResult.length).to.be.greaterThan(0);
});

Then('each should have the correct strategy assigned', function() {
    const elements = Array.from(processedResult);

    // Element 1: lx-strategy="spinner"
    const el1Result = window.loadX.parseElementAttributes(elements[0]);
    expect(el1Result.strategy).to.equal('spinner');

    // Element 2: class="lx-skeleton"
    const el2Result = window.loadX.parseElementAttributes(elements[1]);
    expect(el2Result.strategy).to.equal('skeleton');

    // Element 3: lx-config with progress
    const el3Result = window.loadX.parseElementAttributes(elements[2]);
    expect(el3Result.strategy).to.equal('progress');

    // Element 4: class="lx:fade"
    const el4Result = window.loadX.parseElementAttributes(elements[3]);
    expect(el4Result.strategy).to.equal('fade');
});
