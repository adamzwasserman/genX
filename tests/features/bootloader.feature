Feature: Universal Bootloader
  As a web developer
  I want the bootloader to automatically load only required modules
  So that my page has zero blocking time and optimal performance

  Background:
    Given a clean browser environment
    And the bootloader is loaded

  Scenario: Bootloader loads after first paint
    Given an HTML page with genX attributes
    When the page loads
    Then the bootloader should execute after first paint
    And Total Blocking Time should be 0ms

  Scenario: Automatic module detection from DOM
    Given an HTML page with the following content:
      """
      <span fx-format="currency">25.00</span>
      <button ax-enhance="button">Click</button>
      """
    When the bootloader scans the DOM
    Then it should detect the "fx" prefix
    And it should detect the "ax" prefix
    And it should not detect any other prefixes

  Scenario: Detect all module types
    Given an HTML page with all module attributes:
      """
      <span fx-format="currency">25.00</span>
      <button ax-enhance="button">Click</button>
      <input bx-model="user.name" />
      <div dx-draggable="card">Card</div>
      <img lx-lazy src="/image.jpg" />
      <table tx-sort="true"></table>
      <nav nx-nav="main"></nav>
      """
    When the bootloader scans the DOM
    Then it should detect all 7 prefixes: "fx", "ax", "bx", "dx", "lx", "tx", "nx"

  Scenario: Dynamic module loading
    Given an HTML page with fx- attributes
    When the bootloader initializes
    Then it should load "fmtx.js" module
    And it should not load "accx.js" module
    And it should not load "bindx.js" module

  Scenario: Load correct module for each prefix
    Given an HTML page with bx- attributes
    When the bootloader initializes
    Then it should load "bindx.js" from "/modules/bindx.js"
    Given an HTML page with dx- attributes
    Then it should load "dragx.js" from "/modules/dragx.js"
    Given an HTML page with lx- attributes
    Then it should load "loadx.js" from "/modules/loadx.js"
    Given an HTML page with tx- attributes
    Then it should load "tablex.js" from "/modules/tablex.js"
    Given an HTML page with nx- attributes
    Then it should load "navx.js" from "/modules/navx.js"

  Scenario: Factory pattern initialization
    Given the "fmtx.js" module is loaded
    When the bootloader initializes the module
    Then it should call "window.fxXFactory.init()"
    And the module should be marked as loaded
    And the module should be added to the loaded list

  Scenario: Multiple modules loading
    Given an HTML page with fx- and ax- attributes
    When the bootloader initializes
    Then it should load both "fmtx.js" and "accx.js"
    And both modules should be initialized in parallel
    And the genx:ready event should fire with both modules listed

  Scenario: MutationObserver for dynamic content
    Given the bootloader is initialized
    And all initial modules are loaded
    When new content with "bx-" attributes is added to the DOM
    Then the MutationObserver should detect the change
    And it should load "bindx.js" module
    And it should initialize the new module

  Scenario: Prevent duplicate module loading
    Given "fmtx.js" is already loaded
    When new content with fx- attributes is added
    Then the bootloader should not load fmtx.js again
    And it should reuse the existing factory

  Scenario: Handle missing modules gracefully
    Given an HTML page with "zx-" attributes
    When the bootloader tries to load the module
    Then it should log an error to console
    And it should continue loading other modules
    And it should not break the page

  Scenario: CDN configuration
    Given the bootloader config:
      """
      {
        "cdn": "https://cdn.example.com/genx"
      }
      """
    When the bootloader loads a module
    Then it should request from "https://cdn.example.com/genx/modules/fmtx.js"

  Scenario: SRI hash verification
    Given the bootloader config with SRI hashes:
      """
      {
        "sri": {
          "fx": "sha384-abc123..."
        }
      }
      """
    When the bootloader loads "fmtx.js"
    Then the script tag should have integrity="sha384-abc123..."
    And the script tag should have crossorigin="anonymous"

  Scenario: genx:ready event emission
    Given an HTML page with fx- and ax- attributes
    When the bootloader completes initialization
    Then it should emit a "genx:ready" CustomEvent
    And the event detail should contain loaded modules ["fx", "ax"]

  Scenario: Module loading timeout
    Given "fmtx.js" fails to load within 10 seconds
    When the bootloader waits for initialization
    Then it should timeout gracefully
    And it should log an error
    And other modules should continue loading

  Scenario: Bootloader size requirement
    Given the bootloader source code
    When minified and gzipped
    Then the file size should be less than 1KB

  Scenario: No framework dependencies
    Given the bootloader code
    When analyzed for dependencies
    Then it should have zero external dependencies
    And it should use only vanilla JavaScript
    And it should not require React, Vue, or Angular
