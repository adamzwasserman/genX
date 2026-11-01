@cloak @bootloader
Feature: Content that arrives after load is formatted, and the cloak waits for it
  The shipped bootloader bundle formats content swapped in after load (HTMX swaps,
  fetch renders) with no extra script and no manual rescan. The cloak never reveals a
  swapped element raw: at genx:ready it formats what is still cloaked and reveals each
  element on its done-marker, with a timeout as the fail-open backstop.

  These scenarios run the real cloak, the real bootloader bundle and the real fmtX.

  Background:
    Given the genX bundle is served from a test origin

  Scenario: A swap that lands at genx:ready is formatted before it is revealed
    Given the live page body is:
      """
      <div id="target"><span id="first" fx-format="currency">1234.5</span></div>
      """
    And a swap adds "<span id='late' fx-format='currency'>9876.5</span>" to "target" at genx:ready
    When the live page loads with the cloak enabled
    And genX has finished booting
    Then at genx:ready element "late" was hidden and unformatted
    And element "late" becomes formatted
    And element "late" is visible
    And element "late" is not failsafe-marked
    And element "first" is not failsafe-marked

  Scenario: Content swapped in after boot is formatted with no manual rescan
    Given the live page body is:
      """
      <div id="target"><p>No genX elements yet.</p></div>
      """
    When the live page loads with the cloak enabled
    And genX has finished booting
    And an HTMX-style swap replaces "target" with "<div><span id='late' fx-format='currency'>4321.5</span></div>"
    Then element "late" becomes formatted
    And element "late" is visible

  Scenario: The timeout still reveals an element genX cannot format
    Given the live page body is:
      """
      <div id="target"><span id="first" fx-format="currency">1234.5</span></div>
      """
    And the cloak also hides "data-late" elements until they gain "data-late-done"
    And a swap adds "<span id='late' data-late='1'>9876.5</span>" to "target" at genx:ready
    When the live page loads with the cloak enabled and a 300ms timeout
    And genX has finished booting
    Then element "late" is hidden
    When 400ms pass
    Then element "late" is visible
    And element "late" is failsafe-marked
