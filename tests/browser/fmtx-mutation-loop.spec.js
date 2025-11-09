/**
 * Browser integration test for fmtx MutationObserver infinite loop bug (bd-79)
 *
 * This test MUST run in a real browser because jsdom's MutationObserver
 * doesn't replicate the exact behavior that causes infinite loops.
 */

const { test, expect } = require('@playwright/test');

test.describe('fmtx MutationObserver Infinite Loop Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Load test fixture with fmtx
    await page.goto('/tests/browser/fixtures/fmtx-test.html');

    // Wait for fmtx to load and initialize
    await page.waitForFunction(() => window.FormatX !== undefined && window.testReady === true);
  });

  test('should not freeze browser with repeated formatElement calls', async ({ page }) => {
    // Set page timeout detector
    const freezeDetected = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frozen = false;
        const timeout = setTimeout(() => {
          frozen = true;
          resolve(true); // Browser froze
        }, 2000);

        // Create element with formatting
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.setAttribute('fx-raw', '25.00');
        el.textContent = '$25.00';
        document.getElementById('test-container').appendChild(el);

        // This should trigger formatElement via MutationObserver
        // If bug exists, browser will freeze here

        // Wait 100ms then resolve successfully
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(false); // No freeze
        }, 100);
      });
    });

    expect(freezeDetected).toBe(false);
  });

  test('should handle rapid mutations without infinite loop', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const container = document.getElementById('test-container');
        let mutationCount = 0;
        let completed = false;

        // Monitor for excessive mutations (sign of infinite loop)
        const observer = new MutationObserver((mutations) => {
          mutationCount += mutations.length;

          // If we get > 50 mutations, we have a loop
          if (mutationCount > 50) {
            observer.disconnect();
            resolve({
              success: false,
              error: `Infinite loop: ${mutationCount} mutations`,
              mutationCount
            });
          }
        });

        observer.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });

        // Create formatted element
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.setAttribute('fx-raw', '25.00');
        container.appendChild(el);

        // Trigger formatElement via FormatX API
        if (window.FormatX && window.FormatX.formatElement) {
          window.FormatX.formatElement(el);
        }

        // Call formatElement multiple times with same value
        // This should NOT trigger new mutations due to change detection
        setTimeout(() => {
          for (let i = 0; i < 10; i++) {
            if (window.FormatX && window.FormatX.formatElement) {
              window.FormatX.formatElement(el);
            }
          }

          // Wait to see final mutation count
          setTimeout(() => {
            observer.disconnect();
            completed = true;
            resolve({
              success: true,
              mutationCount,
              // Should be very low (< 10) due to change detection
              efficient: mutationCount < 10
            });
          }, 200);
        }, 100);
      });
    });

    expect(result.success).toBe(true);
    expect(result.mutationCount).toBeLessThan(10);
    expect(result.efficient).toBe(true);
  });

  test('should only update DOM when value actually changes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const el = document.createElement('span');
      el.setAttribute('fx-format', 'currency');
      el.setAttribute('fx-raw', '25.00');
      el.textContent = '$25.00';

      const container = document.getElementById('test-container');
      container.appendChild(el);

      let characterDataMutations = 0;
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          if (m.type === 'characterData' ||
              (m.type === 'childList' && m.target === el)) {
            characterDataMutations++;
          }
        });
      });

      observer.observe(el, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Set same value 5 times - should cause 0 mutations
      for (let i = 0; i < 5; i++) {
        if (el.textContent !== '$25.00') {
          el.textContent = '$25.00';
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          const sameValueMutations = characterDataMutations;

          // Now change value - should cause 1 mutation
          if (el.textContent !== '$30.00') {
            el.textContent = '$30.00';
          }

          setTimeout(() => {
            observer.disconnect();
            resolve({
              sameValueMutations, // Should be 0
              totalMutations: characterDataMutations, // Should be 1
            });
          }, 50);
        }, 50);
      });
    });

    expect(result.sameValueMutations).toBe(0);
    expect(result.totalMutations).toBeLessThanOrEqual(1);
  });

  test('should not trigger observer callback when formatting unchanged element', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const container = document.getElementById('test-container');

        const el = document.createElement('span');
        el.setAttribute('fx-format', 'number');
        el.setAttribute('fx-raw', '1234');
        el.textContent = '1,234'; // Already formatted
        container.appendChild(el);

        let observerCallCount = 0;
        const observer = new MutationObserver(() => {
          observerCallCount++;
        });

        observer.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });

        // Format element that's already formatted correctly
        if (window.FormatX && window.FormatX.formatElement) {
          window.FormatX.formatElement(el);
          window.FormatX.formatElement(el);
          window.FormatX.formatElement(el);
        }

        setTimeout(() => {
          observer.disconnect();
          resolve({
            observerCallCount,
            passed: observerCallCount === 0
          });
        }, 150);
      });
    });

    expect(result.passed).toBe(true);
    expect(result.observerCallCount).toBe(0);
  });

  test('browser should remain responsive during formatting', async ({ page }) => {
    // Test that we can interact with page during/after formatting
    await page.evaluate(() => {
      const container = document.getElementById('test-container');

      // Add 100 formatted elements
      for (let i = 0; i < 100; i++) {
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.setAttribute('fx-raw', (i * 10.50).toString());
        container.appendChild(el);
      }

      // Scan all elements
      if (window.FormatX && window.FormatX.scan) {
        window.FormatX.scan();
      }
    });

    // If page froze, this will timeout
    const buttonClicked = await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'test-button';
      btn.textContent = 'Click Me';
      document.body.appendChild(btn);

      return new Promise((resolve) => {
        btn.addEventListener('click', () => resolve(true));
        btn.click();
      });
    });

    expect(buttonClicked).toBe(true);
  });
});
