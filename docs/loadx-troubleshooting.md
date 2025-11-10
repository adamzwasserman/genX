# loadX Troubleshooting Guide

**Common Issues and Solutions**

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Loading State Not Appearing](#loading-state-not-appearing)
3. [Loading State Not Removing](#loading-state-not-removing)
4. [HTMX Integration Issues](#htmx-integration-issues)
5. [Styling Issues](#styling-issues)
6. [Performance Issues](#performance-issues)
7. [Accessibility Issues](#accessibility-issues)
8. [Browser Compatibility](#browser-compatibility)
9. [Debug Mode](#debug-mode)

---

## Installation Issues

### Problem: `window.loadX is undefined`

**Cause:** loadX script not loaded or loaded in wrong order

**Solution:**
```html
<!-- Ensure loadX is loaded before use -->
<script src="loadx.js"></script>
<script>
    // Now loadX is available
    const api = window.loadX.initLoadX();
</script>
```

**NPM/Module bundlers:**
```javascript
// Ensure loadX is imported
import { initLoadX } from '@genx/core';

// Initialize
const api = initLoadX();
```

### Problem: CSS styles not applying

**Cause:** Missing CSS file

**Solution:**
```html
<!-- Load CSS before loadx.js -->
<link rel="stylesheet" href="loadx.css">
<script src="loadx.js"></script>
```

**NPM:**
```javascript
import '@genx/core/dist/loadx.css';
import { initLoadX } from '@genx/core';
```

---

## Loading State Not Appearing

### Problem: Spinner/skeleton doesn't show

**Check 1: Is loadX initialized?**
```javascript
// Verify initialization
console.log(window.loadX); // Should be defined

// Initialize if needed
if (!window.loadX.config) {
    window.loadX.initLoadX();
}
```

**Check 2: Is element properly configured?**
```html
<!-- Verify attribute syntax -->
<div lx-strategy="spinner">Content</div>

<!-- Check console for errors -->
<script>
const element = document.querySelector('[lx-strategy]');
console.log(window.loadX.parseElementAttributes(element));
// Should show: { strategy: 'spinner', ... }
</script>
```

**Check 3: Is loading state applied?**
```javascript
const element = document.getElementById('myElement');

// Manually apply
window.loadX.applyLoading(element, {
    strategy: 'spinner'
});

// Check element
console.log(element.getAttribute('aria-busy')); // Should be 'true'
console.log(element.classList.contains('lx-loading')); // Should be true
```

**Check 4: CSS conflicts**
```css
/* Check for conflicting styles */
.lx-spinner {
    display: block !important; /* Ensure visibility */
}
```

### Problem: HTMX requests don't show loading state

**Solution 1: Enable auto-detect**
```javascript
window.loadX.initLoadX({
    autoDetect: true  // Must be true for HTMX
});
```

**Solution 2: Verify HTMX is loaded**
```javascript
// Check HTMX availability
console.log(typeof htmx); // Should be 'object'
```

**Solution 3: Manual event handling**
```javascript
// If auto-detect doesn't work, use manual handling
document.body.addEventListener('htmx:beforeRequest', (evt) => {
    const element = evt.detail.elt;
    window.loadX.applyLoading(element, {
        strategy: 'spinner'
    });
});

document.body.addEventListener('htmx:afterSwap', (evt) => {
    const element = evt.detail.elt;
    window.loadX.removeLoading(element);
});
```

---

## Loading State Not Removing

### Problem: Spinner stays visible after loading

**Cause 1: `removeLoading()` not called**
```javascript
async function loadData() {
    const element = document.getElementById('data');

    window.loadX.applyLoading(element, { strategy: 'spinner' });

    try {
        const response = await fetch('/api/data');
        element.innerHTML = await response.text();
    } finally {
        // IMPORTANT: Always remove in finally block
        window.loadX.removeLoading(element);
    }
}
```

**Cause 2: Element reference lost**
```javascript
// BAD: Element reference changes
let element = document.getElementById('data');
window.loadX.applyLoading(element, { strategy: 'spinner' });

element = document.getElementById('data'); // New reference!
window.loadX.removeLoading(element); // Won't work

// GOOD: Keep same reference
const element = document.getElementById('data');
window.loadX.applyLoading(element, { strategy: 'spinner' });
window.loadX.removeLoading(element); // Works
```

**Cause 3: HTMX target replacement**
```html
<!-- If HTMX replaces element, loading state is lost -->
<div id="content" lx-strategy="skeleton">
    <!-- This div gets replaced -->
</div>

<button hx-get="/data" hx-target="#content" hx-swap="outerHTML">
    Load
</button>

<!-- Solution: Use innerHTML or beforeend -->
<button hx-get="/data" hx-target="#content" hx-swap="innerHTML">
    Load
</button>
```

**Manual removal:**
```javascript
// Force remove loading state
const element = document.getElementById('stuck-spinner');

// Remove all loading classes
element.classList.remove('lx-loading', 'lx-spinner', 'lx-skeleton', 'lx-progress', 'lx-fade');

// Remove ARIA attributes
element.removeAttribute('aria-busy');

// Restore original content if stored
const original = element.getAttribute('data-lx-original-content');
if (original) {
    element.innerHTML = original;
    element.removeAttribute('data-lx-original-content');
}
```

---

## HTMX Integration Issues

### Problem: Loading state applies to wrong element

**Cause:** HTMX target confusion

**Solution:**
```html
<!-- Loading state on button (trigger) -->
<button
    hx-get="/data"
    hx-target="#content"
    lx-strategy="spinner">
    Load
</button>

<!-- Loading state on target -->
<div id="content" lx-strategy="skeleton">
    <!-- Content here -->
</div>

<script>
// Or manually control both
document.body.addEventListener('htmx:beforeRequest', (evt) => {
    const trigger = evt.detail.elt;
    const targetSelector = trigger.getAttribute('hx-target');

    if (targetSelector) {
        const target = document.querySelector(targetSelector);

        // Apply to trigger
        window.loadX.applyLoading(trigger, { strategy: 'spinner' });

        // Apply to target
        window.loadX.applyLoading(target, { strategy: 'skeleton' });
    }
});
</script>
```

### Problem: HTMX events not firing

**Debug:**
```javascript
// Listen for ALL HTMX events
htmx.logAll();

// Or specific events
document.body.addEventListener('htmx:beforeRequest', (evt) => {
    console.log('HTMX request starting:', evt.detail);
});

document.body.addEventListener('htmx:afterSwap', (evt) => {
    console.log('HTMX swap complete:', evt.detail);
});
```

---

## Styling Issues

### Problem: Spinner/skeleton looks wrong

**Check 1: CSS loaded**
```javascript
// Check if loadx.css is loaded
const hasLoadXStyles = Array.from(document.styleSheets).some(sheet => {
    try {
        return sheet.href && sheet.href.includes('loadx');
    } catch (e) {
        return false;
    }
});

console.log('loadX CSS loaded:', hasLoadXStyles);
```

**Check 2: CSS conflicts**
```css
/* Check for conflicting styles */
.lx-spinner {
    /* Ensure these are applied */
    display: inline-block;
    width: 40px;
    height: 40px;
}

/* Check specificity issues */
div.lx-spinner {
    /* Higher specificity might be needed */
}
```

**Check 3: Custom styles**
```css
/* Override default styles */
.lx-spinner {
    --lx-spinner-size: 60px;
    --lx-spinner-color: #007bff;
}

.lx-skeleton {
    --lx-skeleton-bg: #e0e0e0;
    --lx-skeleton-highlight: #f5f5f5;
}
```

### Problem: Layout shift when loading state appears

**Solution: Set minimum dimensions**
```html
<!-- Set min-height to prevent shift -->
<div lx-strategy="skeleton" style="min-height: 200px;">
    Content
</div>

<!-- Or use CSS -->
<style>
.loadable-content {
    min-height: 200px;
}
</style>

<div class="loadable-content" lx-strategy="skeleton">
    Content
</div>
```

### Problem: Skeleton doesn't match content

**Solution: Configure rows and dimensions**
```html
<!-- Specify number of rows -->
<div lx-strategy="skeleton" lx-rows="5">
    Content
</div>

<!-- Set custom width -->
<div lx-strategy="skeleton" lx-width="80%">
    Content
</div>

<!-- Use CSS for fine control -->
<style>
.my-skeleton {
    --lx-skeleton-row-height: 20px;
    --lx-skeleton-row-spacing: 10px;
}
</style>

<div class="my-skeleton" lx-strategy="skeleton">
    Content
</div>
```

---

## Performance Issues

### Problem: Loading state appears too quickly (flashing)

**Solution: Set minimum display time**
```javascript
window.loadX.initLoadX({
    minDisplayMs: 300  // Only show if loading takes > 300ms
});
```

**Or implement manually:**
```javascript
async function loadData() {
    const element = document.getElementById('data');
    const startTime = Date.now();

    window.loadX.applyLoading(element, { strategy: 'spinner' });

    try {
        const response = await fetch('/api/data');
        const data = await response.text();

        // Ensure minimum display time
        const elapsed = Date.now() - startTime;
        const minTime = 300;

        if (elapsed < minTime) {
            await new Promise(resolve =>
                setTimeout(resolve, minTime - elapsed)
            );
        }

        element.innerHTML = data;
    } finally {
        window.loadX.removeLoading(element);
    }
}
```

### Problem: Animations are janky

**Solution 1: Use CSS animations**
```css
/* loadX uses CSS animations by default */
.lx-spinner {
    animation: spin 1s linear infinite;
}

/* Ensure hardware acceleration */
.lx-spinner {
    transform: translateZ(0);
    will-change: transform;
}
```

**Solution 2: Reduce motion for performance**
```css
@media (prefers-reduced-motion: reduce) {
    .lx-spinner,
    .lx-skeleton {
        animation: none !important;
    }
}
```

### Problem: Large bundle size

**Solution: Import only needed strategies**
```javascript
// Instead of full bundle
import { initLoadX } from '@genx/core';

// Import only spinner
import { initLoadX, applySpinnerStrategy } from '@genx/core/spinner';

// Or only skeleton
import { initLoadX, applySkeletonStrategy } from '@genx/core/skeleton';
```

---

## Accessibility Issues

### Problem: Screen readers not announcing loading state

**Solution 1: Ensure ARIA live region exists**
```javascript
// Check for live region
const liveRegion = document.getElementById('lx-live-region');
console.log('Live region exists:', !!liveRegion);

// If missing, reinitialize
if (!liveRegion) {
    window.loadX.initLoadX();
}
```

**Solution 2: Add custom ARIA labels**
```html
<div
    lx-strategy="spinner"
    lx-aria-label="Loading user data">
    Content
</div>
```

**Solution 3: Verify ARIA attributes**
```javascript
const element = document.getElementById('myElement');

window.loadX.applyLoading(element, { strategy: 'spinner' });

// Check ARIA attributes
console.log('aria-busy:', element.getAttribute('aria-busy')); // Should be 'true'
console.log('aria-live:', element.getAttribute('aria-live')); // May be 'polite'
```

### Problem: Progress bar not accessible

**Solution: Ensure proper ARIA attributes**
```javascript
// Progress bar should have:
const progress = document.getElementById('progress');

console.log('role:', progress.getAttribute('role')); // 'progressbar'
console.log('aria-valuenow:', progress.getAttribute('aria-valuenow')); // Current value
console.log('aria-valuemin:', progress.getAttribute('aria-valuemin')); // '0'
console.log('aria-valuemax:', progress.getAttribute('aria-valuemax')); // Max value

// If missing, reapply with proper config
window.loadX.applyProgressStrategy(progress, {
    value: 50,
    max: 100,
    ariaLabel: 'File upload progress'
});
```

---

## Browser Compatibility

### Problem: Doesn't work in older browsers

**Check browser support:**
```javascript
// Check for required features
const isSupported = (
    'classList' in document.documentElement &&
    'MutationObserver' in window &&
    'Promise' in window
);

if (!isSupported) {
    console.warn('loadX requires modern browser features');
    // Provide fallback
}
```

**Solution: Add polyfills**
```html
<!-- Polyfills for older browsers -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Promise,MutationObserver,classList"></script>
<script src="loadx.js"></script>
```

### Problem: CSS custom properties not working

**Solution: Fallback values**
```css
.lx-spinner {
    /* Fallback */
    width: 40px;
    height: 40px;
    color: #333;

    /* Modern */
    width: var(--lx-spinner-size, 40px);
    height: var(--lx-spinner-size, 40px);
    color: var(--lx-spinner-color, #333);
}
```

---

## Debug Mode

### Enable Verbose Logging

```javascript
// Enable debug mode
window.loadX.debug = true;

// Or set during initialization
window.loadX.initLoadX({
    debug: true,
    logLevel: 'verbose'
});

// Now loadX will log all operations
// Check browser console for debug output
```

### Inspect Element State

```javascript
// Check element configuration
const element = document.getElementById('myElement');
const config = window.loadX.parseElementAttributes(element);

console.log('Element config:', config);
console.log('Strategy:', config.strategy);
console.log('Options:', config);

// Check loading state
console.log('Is loading:', element.classList.contains('lx-loading'));
console.log('ARIA busy:', element.getAttribute('aria-busy'));
console.log('Original content:', element.getAttribute('data-lx-original-content'));
```

### Test Strategies Manually

```javascript
const element = document.getElementById('test');

// Test spinner
window.loadX.applySpinnerStrategy(element, {
    variant: 'dots',
    size: 'large'
});

setTimeout(() => {
    window.loadX.removeSpinnerStrategy(element);

    // Test skeleton
    window.loadX.applySkeletonStrategy(element, {
        rows: 3
    });
}, 2000);

setTimeout(() => {
    window.loadX.removeSkeletonStrategy(element);

    // Test progress
    window.loadX.applyProgressStrategy(element, {
        value: 50,
        max: 100
    });
}, 4000);
```

---

## Common Error Messages

### `loadX config error: minDisplayMs must be a number`

**Cause:** Invalid configuration type

**Fix:**
```javascript
// Wrong
window.loadX.initLoadX({
    minDisplayMs: '300'  // String
});

// Correct
window.loadX.initLoadX({
    minDisplayMs: 300  // Number
});
```

### `loadX config error: strategies must be an array`

**Fix:**
```javascript
// Wrong
window.loadX.initLoadX({
    strategies: 'spinner'  // String
});

// Correct
window.loadX.initLoadX({
    strategies: ['spinner', 'skeleton']  // Array
});
```

### `Cannot read property 'applyLoading' of undefined`

**Cause:** loadX not initialized

**Fix:**
```javascript
// Initialize first
const api = window.loadX.initLoadX();

// Then use
api.applyLoading(element, { strategy: 'spinner' });
```

---

## Getting Help

### Check Documentation

1. [API Reference](loadx-api.md) - Complete API documentation
2. [Usage Guide](loadx-usage.md) - Usage examples
3. [Integration Guide](loadx-integration.md) - Framework integration

### Report Issues

**Include in bug report:**
1. Browser and version
2. loadX version
3. Minimal reproduction code
4. Console errors (if any)
5. Expected vs actual behavior

**GitHub Issues:** https://github.com/genx-software/genx/issues

### Community Support

- **Discord:** https://discord.gg/genx
- **Stack Overflow:** Tag `loadx` or `genx`

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Need more help?** Check the [API Reference](loadx-api.md) or file an issue
