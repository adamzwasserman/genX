# loadX Usage Guide

**Complete Guide to Declarative Loading States**

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Usage](#basic-usage)
3. [Loading Strategies](#loading-strategies)
4. [HTMX Integration](#htmx-integration)
5. [Advanced Patterns](#advanced-patterns)
6. [Accessibility](#accessibility)
7. [Performance Optimization](#performance-optimization)
8. [Examples](#examples)

---

## Quick Start

### Installation

**Via CDN:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@genx/core/dist/loadx.css">
<script src="https://cdn.jsdelivr.net/npm/@genx/core/dist/loadx.min.js"></script>
```

**Via NPM:**
```bash
npm install @genx/core
```

```javascript
import '@genx/core/dist/loadx.css';
import { initLoadX } from '@genx/core';
```

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="loadx.css">
</head>
<body>
    <!-- Your content here -->

    <script src="loadx.js"></script>
    <script>
        // Initialize loadX
        const loadX = window.loadX.initLoadX({
            minDisplayMs: 300,
            autoDetect: true
        });
    </script>
</body>
</html>
```

---

## Basic Usage

### Spinner Loading

Display an animated spinner during loading:

```html
<!-- HTML attribute -->
<div lx-strategy="spinner">
    Content loading...
</div>

<!-- CSS class -->
<div class="lx-spinner">
    Content loading...
</div>

<!-- Colon syntax with variant -->
<button class="lx:spinner:dots">
    Click me
</button>
```

### Skeleton Placeholder

Show a skeleton placeholder that matches your content structure:

```html
<!-- Auto-detected skeleton -->
<div lx-strategy="skeleton">
    <h1>Article Title</h1>
    <p>Article content will appear here...</p>
</div>

<!-- Custom row count -->
<div lx-strategy="skeleton" lx-rows="3">
    Loading article...
</div>
```

### Progress Bar

Display progress for determinate operations:

```html
<!-- Determinate progress -->
<div lx-strategy="progress" lx-value="50" lx-max="100">
    Uploading file...
</div>

<!-- Indeterminate progress -->
<div lx-strategy="progress">
    Processing...
</div>

<!-- With percentage display -->
<div lx-strategy="progress" lx-value="75" lx-show-percentage="true">
    Upload Progress
</div>
```

### Fade Effect

Fade content opacity during loading:

```html
<!-- Basic fade -->
<div lx-strategy="fade">
    Loading content...
</div>

<!-- Custom fade with message -->
<div lx-strategy="fade" lx-opacity="0.3" lx-message="Please wait...">
    Your content here
</div>
```

---

## Loading Strategies

### 1. Spinner Strategy

**Best for:** Short operations (< 2 seconds), button clicks, form submissions

**Variants:**
- `circle` (default) - Circular spinner
- `dots` - Three animated dots
- `bars` - Animated bars

**Example:**
```html
<!-- Circle spinner (default) -->
<button lx-strategy="spinner">
    Submit
</button>

<!-- Dots variant -->
<button lx-strategy="spinner" lx-variant="dots">
    Save
</button>

<!-- Custom color and size -->
<button lx-strategy="spinner" lx-color="#ff0000" lx-size="large">
    Upload
</button>
```

**JavaScript control:**
```javascript
const button = document.getElementById('myButton');

// Apply spinner
loadX.applyLoading(button, {
    strategy: 'spinner',
    variant: 'dots',
    size: 'large'
});

// Remove spinner
loadX.removeLoading(button);
```

### 2. Skeleton Strategy

**Best for:** Content loading, list items, cards, layouts

**Auto-detection:**
loadX automatically detects content structure:
- Text elements (p, h1-h6, span)
- Lists (ul, ol, li)
- Containers (div.card, article, section)

**Example:**
```html
<!-- Auto-detected skeleton -->
<article lx-strategy="skeleton">
    <h2>Article Title</h2>
    <p>Article content goes here...</p>
    <p>More paragraphs...</p>
</article>

<!-- Manual configuration -->
<div lx-strategy="skeleton" lx-rows="5" lx-animate="true">
    Loading list items...
</div>

<!-- Custom width -->
<div lx-strategy="skeleton" lx-width="80%">
    Loading...
</div>
```

**JavaScript control:**
```javascript
const container = document.getElementById('content');

// Apply skeleton
loadX.applyLoading(container, {
    strategy: 'skeleton',
    rows: 3,
    animate: true
});

// Remove skeleton
loadX.removeLoading(container);
```

### 3. Progress Strategy

**Best for:** File uploads, downloads, multi-step processes

**Modes:**
- **Determinate:** Known progress (0-100%)
- **Indeterminate:** Unknown duration

**Example:**
```html
<!-- Determinate progress -->
<div id="upload-progress" lx-strategy="progress" lx-value="0" lx-max="100">
    Upload: 0%
</div>

<!-- Indeterminate -->
<div lx-strategy="progress">
    Processing...
</div>

<!-- With custom label -->
<div lx-strategy="progress" lx-value="60" lx-label="Uploading files...">
    Progress
</div>
```

**JavaScript control:**
```javascript
const progress = document.getElementById('upload-progress');

// Apply progress bar
loadX.applyLoading(progress, {
    strategy: 'progress',
    value: 0,
    max: 100,
    showPercentage: true
});

// Update progress
window.loadX.updateProgressValue(progress, 50);
window.loadX.updateProgressValue(progress, 100);

// Remove when complete
loadX.removeLoading(progress);
```

### 4. Fade Strategy

**Best for:** Content transitions, soft loading states, background updates

**Example:**
```html
<!-- Basic fade -->
<div lx-strategy="fade" lx-duration="300">
    Content
</div>

<!-- Custom opacity and message -->
<div lx-strategy="fade" lx-opacity="0.5" lx-message="Refreshing...">
    Content being updated
</div>
```

**JavaScript control:**
```javascript
const content = document.getElementById('content');

// Apply fade
loadX.applyLoading(content, {
    strategy: 'fade',
    duration: 500,
    opacity: 0.3,
    message: 'Loading new data...'
});

// Remove fade
loadX.removeLoading(content);
```

---

## HTMX Integration

loadX automatically detects HTMX requests when `autoDetect: true`.

### Automatic Loading States

```html
<!-- Spinner on HTMX request -->
<button hx-get="/api/data" hx-target="#content" lx-strategy="spinner">
    Load Data
</button>

<!-- Skeleton in target container -->
<div id="content" lx-strategy="skeleton">
    <!-- Content will be replaced -->
</div>

<!-- Progress bar for upload -->
<form hx-post="/upload" hx-target="#result" lx-strategy="progress">
    <input type="file" name="file">
    <button type="submit">Upload</button>
</form>
```

### HTMX Indicators

loadX works alongside HTMX indicators:

```html
<!-- Both loadX and HTMX indicators -->
<button
    hx-get="/api/slow"
    hx-indicator="#spinner"
    lx-strategy="spinner"
    lx-variant="dots">
    Load
</button>

<div id="spinner" class="htmx-indicator">
    Additional indicator
</div>
```

### HTMX Target Elements

Apply loading state to target element:

```html
<!-- Loading state on button -->
<button
    hx-get="/api/users"
    hx-target="#user-list"
    lx-strategy="spinner">
    Load Users
</button>

<!-- Loading state on target -->
<div id="user-list" lx-strategy="skeleton" lx-rows="5">
    <!-- Users will appear here -->
</div>
```

### HTMX Event Handling

loadX listens to HTMX events:

- `htmx:beforeRequest` → Apply loading state
- `htmx:afterSwap` → Remove loading state
- `htmx:afterRequest` → Cleanup on error

**Custom event handlers:**
```javascript
document.body.addEventListener('htmx:beforeRequest', (evt) => {
    const element = evt.detail.elt;

    // Apply custom loading state
    loadX.applyLoading(element, {
        strategy: 'progress',
        indeterminate: true
    });
});

document.body.addEventListener('htmx:afterSwap', (evt) => {
    const element = evt.detail.elt;

    // Remove loading state
    loadX.removeLoading(element);
});
```

---

## Advanced Patterns

### Configuration Priority

Multiple ways to configure (priority order):

```html
<!-- 1. JSON config (highest) -->
<div lx-config='{"strategy":"skeleton","rows":5,"animate":true}'>
    Content
</div>

<!-- 2. HTML attributes -->
<div lx-strategy="skeleton" lx-rows="5" lx-animate="true">
    Content
</div>

<!-- 3. Data attributes -->
<div data-lx-strategy="skeleton">
    Content
</div>

<!-- 4. CSS classes -->
<div class="lx-skeleton">
    Content
</div>

<!-- 5. Colon syntax (lowest) -->
<div class="lx:skeleton:5">
    Content
</div>
```

### Manual Control

Full JavaScript control for dynamic scenarios:

```javascript
const api = window.loadX.initLoadX();

// Apply loading
function startLoading(element) {
    api.applyLoading(element, {
        strategy: 'spinner',
        variant: 'dots'
    });
}

// Remove loading
function stopLoading(element) {
    api.removeLoading(element);
}

// Async operation example
async function fetchData() {
    const container = document.getElementById('data');

    startLoading(container);

    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        container.innerHTML = renderData(data);
    } catch (error) {
        container.innerHTML = '<p>Error loading data</p>';
    } finally {
        stopLoading(container);
    }
}
```

### Progress Tracking

Track upload/download progress:

```javascript
const progressBar = document.getElementById('progress');

async function uploadFile(file) {
    // Apply progress bar
    window.loadX.applyProgressStrategy(progressBar, {
        value: 0,
        max: 100,
        showPercentage: true,
        label: `Uploading ${file.name}...`
    });

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            window.loadX.updateProgressValue(progressBar, percentComplete);
        }
    });

    xhr.addEventListener('load', () => {
        window.loadX.removeProgressStrategy(progressBar);
        console.log('Upload complete!');
    });

    xhr.open('POST', '/upload');
    xhr.send(file);
}
```

### Form Submissions

Enhanced form submission UX:

```html
<form id="myForm" lx-strategy="spinner">
    <input type="text" name="email" placeholder="Email">
    <button type="submit">Subscribe</button>
</form>

<script>
const form = document.getElementById('myForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Apply loading state
    loadX.applyLoading(form, {
        strategy: 'spinner',
        variant: 'dots'
    });

    try {
        const formData = new FormData(form);
        const response = await fetch('/subscribe', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            form.innerHTML = '<p>Success! Thank you for subscribing.</p>';
        }
    } catch (error) {
        console.error('Submission failed:', error);
    } finally {
        loadX.removeLoading(form);
    }
});
</script>
```

### Multiple Elements

Apply loading to multiple elements:

```javascript
const elements = document.querySelectorAll('.loadable');

// Apply to all
elements.forEach(el => {
    loadX.applyLoading(el, {
        strategy: 'skeleton'
    });
});

// Remove from all
setTimeout(() => {
    elements.forEach(el => {
        loadX.removeLoading(el);
    });
}, 2000);
```

---

## Accessibility

### ARIA Attributes

loadX automatically manages ARIA attributes:

```html
<!-- Spinner with ARIA -->
<button lx-strategy="spinner" lx-aria-label="Loading data">
    Load Data
</button>

<!-- Results in: -->
<button aria-busy="true" aria-label="Loading data">
    <!-- Spinner content -->
</button>
```

### Screen Reader Announcements

loadX creates a global live region for announcements:

```html
<!-- Automatically announced to screen readers -->
<div lx-strategy="progress" lx-value="50" lx-label="Upload progress">
    Uploading...
</div>
```

### Reduced Motion

Respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
    .lx-skeleton,
    .lx-spinner,
    .lx-progress {
        animation: none !important;
    }
}
```

### Keyboard Navigation

Loading states preserve keyboard navigation:

```html
<!-- Focus maintained during loading -->
<button lx-strategy="spinner">
    Click me
</button>
```

---

## Performance Optimization

### Bundle Size

Choose only the strategies you need:

```javascript
// Import only spinner strategy
import { initLoadX, applySpinnerStrategy } from '@genx/core/spinner';

// Full bundle
import { initLoadX } from '@genx/core';
```

### Lazy Loading

Defer loading of non-critical content:

```html
<img
    src="placeholder.jpg"
    data-src="large-image.jpg"
    lx-strategy="skeleton"
    loading="lazy">
```

### Minimize Display Time

Prevent flash of loading state:

```javascript
const api = window.loadX.initLoadX({
    minDisplayMs: 300  // Only show if loading takes > 300ms
});
```

### Zero Layout Shift

loadX preserves element dimensions:

```html
<!-- Skeleton matches original dimensions -->
<div lx-strategy="skeleton" style="min-height: 200px;">
    <h1>Title</h1>
    <p>Content...</p>
</div>
```

**CLS Score:** 0 (Perfect)

---

## Examples

### Example 1: Simple Button

```html
<button
    hx-post="/api/save"
    lx-strategy="spinner"
    lx-variant="dots">
    Save Changes
</button>
```

### Example 2: Content Loading

```html
<div id="content" lx-strategy="skeleton" lx-rows="3">
    <h2>Article Title</h2>
    <p>Article content will load here...</p>
</div>

<script>
async function loadContent() {
    const container = document.getElementById('content');

    // Loading state automatically applied via lx-strategy
    const response = await fetch('/api/article/123');
    const html = await response.text();

    container.innerHTML = html;
    // Loading state automatically removed
}

loadContent();
</script>
```

### Example 3: File Upload

```html
<form id="upload-form">
    <input type="file" id="file-input">
    <button type="submit">Upload</button>
</form>

<div id="upload-progress" lx-strategy="progress" lx-value="0" lx-max="100">
    Upload Progress
</div>

<script>
const form = document.getElementById('upload-form');
const progress = document.getElementById('upload-progress');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = document.getElementById('file-input').files[0];
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            window.loadX.updateProgressValue(progress, percent);
        }
    });

    xhr.addEventListener('load', () => {
        console.log('Upload complete!');
        window.loadX.removeProgressStrategy(progress);
    });

    xhr.open('POST', '/upload');
    xhr.send(formData);
});
</script>
```

### Example 4: Data Table

```html
<table id="data-table" lx-strategy="skeleton" lx-rows="10">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        <!-- Table rows will load here -->
    </tbody>
</table>

<script>
async function loadTable() {
    const table = document.getElementById('data-table');

    const response = await fetch('/api/users');
    const users = await response.json();

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.status}</td>
        </tr>
    `).join('');
}

loadTable();
</script>
```

### Example 5: Multi-Step Form

```html
<form id="wizard" lx-strategy="fade">
    <div class="step step-1">
        <h2>Step 1: Personal Info</h2>
        <input type="text" name="name" placeholder="Name">
        <button type="button" onclick="nextStep()">Next</button>
    </div>
</form>

<script>
function nextStep() {
    const form = document.getElementById('wizard');

    // Apply fade during transition
    window.loadX.applyFadeStrategy(form, {
        duration: 300,
        opacity: 0
    });

    setTimeout(() => {
        // Change step content
        form.querySelector('.step-1').style.display = 'none';
        form.querySelector('.step-2').style.display = 'block';

        // Remove fade
        window.loadX.removeFadeStrategy(form);
    }, 300);
}
</script>
```

---

## Best Practices

1. **Choose the right strategy:**
   - Spinner: Quick operations (< 2s)
   - Skeleton: Content loading, lists
   - Progress: File uploads, known duration
   - Fade: Subtle transitions

2. **Use HTMX integration:**
   - Enable `autoDetect: true` for automatic loading states
   - Let loadX handle HTMX request lifecycle

3. **Preserve layout:**
   - Set `min-height` on containers
   - Use skeleton strategy for zero layout shift

4. **Accessibility first:**
   - Provide `lx-aria-label` for meaningful labels
   - Test with screen readers
   - Respect `prefers-reduced-motion`

5. **Optimize performance:**
   - Set appropriate `minDisplayMs` (300-500ms)
   - Use skeleton for perceived performance
   - Minimize bundle size (import only needed strategies)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Next:** See [API Reference](loadx-api.md) for detailed API documentation
