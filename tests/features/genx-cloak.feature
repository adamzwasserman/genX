@cloak
Feature: Opt-in cloak removes the format-on-load flash (FOUC)
  As a genX consumer serving raw values formatted on the client
  I want raw values hidden until genX formats them, but never past genX finishing
  So that dense pages never flash "recalculating" values, yet never stay blank if genX fails

  The cloak is a general continuous-reconciliation primitive shipped wired to
  fx-format -> fx-raw. It hides a genX-marked element until that element gains its
  done-marker, and a fail-open watchdog (living outside genX) guarantees every
  cloaked element reveals its raw value if genX does not finish in time.

  Background:
    Given a static server is serving the genX source

  # --- Acceptance criterion: default is unchanged ---

  Scenario: The cloak is off by default
    Given genX cloak is left at its default
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    Then no cloak stylesheet is present
    And element "mc" is visible

  # --- Acceptance criterion: on -> raw never paints ---

  Scenario: Enabling the cloak injects the stylesheet synchronously and hides raw values
    Given genX cloak is enabled
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    Then a cloak stylesheet is present
    And element "mc" is hidden before any genX signal

  Scenario: A cloaked number reserves its layout so revealing causes no shift
    Given genX cloak is enabled
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    Then element "mc" is hidden
    And element "mc" still reserves layout space

  # --- Acceptance criterion: formatted values appear, no layout shift ---

  Scenario: genX finishing a number reveals it formatted
    Given genX cloak is enabled
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    And genX formats element "mc" as "$871.58B"
    Then element "mc" is visible
    And element "mc" shows "$871.58B"

  Scenario: The genX ready event lifts the cloak
    Given genX cloak is enabled
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    And genX signals ready
    Then element "mc" is visible

  # --- Acceptance criterion: genX blocked -> reveal raw within timeout, nothing blank ---

  Scenario: The failsafe timeout lifts the cloak when genX never runs
    Given genX cloak is enabled with a 120ms timeout
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    And the failsafe timeout elapses
    Then element "mc" is visible
    And element "mc" shows "871580000000"

  Scenario: A loader error lifts the cloak immediately
    Given genX cloak is enabled
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    And genX signals a load error
    Then element "mc" is visible
    And element "mc" shows "871580000000"

  Scenario: Reveal is one-shot and a later signal never re-hides a revealed value
    Given genX cloak is enabled with a 120ms timeout
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      """
    When the cloak page is rendered
    And the failsafe timeout elapses
    And genX signals ready
    Then element "mc" is visible

  # --- Acceptance criterion: cloak scoped only to elements genX will process ---

  Scenario: Non-genX values are never cloaked
    Given genX cloak is enabled
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      <span id="plain">871580000000</span>
      """
    When the cloak page is rendered
    Then element "mc" is hidden
    And element "plain" is visible

  # --- Acceptance criterion: mid-format error ---

  Scenario: A mid-format error leaves formatted values formatted and reveals the rest raw
    Given genX cloak is enabled with a 120ms timeout
    And the page body is:
      """
      <span id="mc" fx-format="currency">871580000000</span>
      <span id="peer" fx-format="percent">14.3</span>
      """
    When the cloak page is rendered
    And genX formats element "mc" as "$871.58B"
    And genX signals a load error
    Then element "mc" shows "$871.58B"
    And element "peer" is visible
    And element "peer" shows "14.3"

  # --- Acceptance criterion: HTMX / dynamically-inserted elements ---

  Scenario: A swapped-in number is cloaked and reveals when genX stamps it
    Given genX cloak is enabled
    And the page body is:
      """
      <div id="list"></div>
      """
    When the cloak page is rendered
    And genX signals ready
    And a number "14.3" is swapped into "list" as element "row1"
    Then element "row1" is hidden
    When genX formats element "row1" as "+14.3%"
    Then element "row1" is visible
    And element "row1" shows "+14.3%"

  Scenario: A swapped-in number fails open when genX is dead
    Given genX cloak is enabled with a 120ms timeout
    And the page body is:
      """
      <div id="list"></div>
      """
    When the cloak page is rendered
    And the failsafe timeout elapses
    And a number "14.3" is swapped into "list" as element "row1"
    Then element "row1" is hidden
    When the failsafe timeout elapses
    Then element "row1" is visible
    And element "row1" shows "14.3"
