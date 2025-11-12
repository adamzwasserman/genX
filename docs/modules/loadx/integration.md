# loadX Integration Guide

**Complete Integration Patterns for Popular Frameworks and Tools**

## Table of Contents

1. [HTMX Integration](#htmx-integration)
2. [Fetch API Integration](#fetch-api-integration)
3. [Form Handling](#form-handling)
4. [React Integration](#react-integration)
5. [Vue Integration](#vue-integration)
6. [Alpine.js Integration](#alpinejs-integration)
7. [Vanilla JavaScript](#vanilla-javascript)
8. [Server-Side Rendering](#server-side-rendering)

---

## HTMX Integration

loadX is designed for seamless HTMX integration with automatic loading state detection.

### Automatic Loading States

Enable automatic detection during initialization:

```javascript
window.loadX.initLoadX({
    minDisplayMs: 300,
    autoDetect: true  // Enable HTMX auto-detection
});
```

### Basic HTMX Request

```html
<!-- Spinner on button -->
<button
    hx-get="/api/users"
    hx-target="#user-list"
    lx-strategy="spinner"
    lx-variant="dots">
    Load Users
</button>

<!-- Skeleton in target container -->
<div id="user-list" lx-strategy="skeleton" lx-rows="5">
    <!-- Users loaded here -->
</div>
```

**How it works:**
1. User clicks button
2. `htmx:beforeRequest` fires → loadX applies spinner to button
3. HTMX makes request
4. `htmx:afterSwap` fires → loadX removes spinner
5. Content appears in target

### HTMX with Progress

Track request progress:

```html
<form
    hx-post="/upload"
    hx-encoding="multipart/form-data"
    hx-target="#result">
    <input type="file" name="file">
    <button type="submit" lx-strategy="progress" lx-value="0">
        Upload File
    </button>
</form>

<div id="result"></div>

<script>
document.body.addEventListener('htmx:xhr:progress', (evt) => {
    const button = evt.detail.elt.querySelector('button');
    const percent = (evt.detail.loaded / evt.detail.total) * 100;
    window.loadX.updateProgressValue(button, percent);
});
</script>
```

### HTMX Polling

Show loading state during polling:

```html
<div
    hx-get="/api/status"
    hx-trigger="every 5s"
    lx-strategy="fade"
    lx-opacity="0.7"
    lx-message="Refreshing...">
    <!-- Status content -->
</div>
```

### HTMX Infinite Scroll

Loading indicator for infinite scroll:

```html
<div id="content">
    <!-- Initial content -->
</div>

<div
    hx-get="/api/posts?page=2"
    hx-trigger="revealed"
    hx-swap="beforeend"
    hx-target="#content"
    lx-strategy="spinner"
    lx-variant="dots">
    Loading more...
</div>
```

### HTMX Target Strategies

Apply different strategies to trigger vs target:

```html
<!-- Spinner on trigger button -->
<button
    hx-get="/api/data"
    hx-target="#data-container"
    lx-strategy="spinner">
    Load Data
</button>

<!-- Skeleton on target container -->
<div id="data-container" lx-strategy="skeleton" lx-rows="3">
    <!-- Data loaded here -->
</div>

<script>
// Custom handling for both elements
document.body.addEventListener('htmx:beforeRequest', (evt) => {
    const trigger = evt.detail.elt;
    const targetId = trigger.getAttribute('hx-target');

    if (targetId) {
        const target = document.querySelector(targetId);
        if (target) {
            // Apply loading to target as well
            window.loadX.applyLoading(target, {
                strategy: 'skeleton'
            });
        }
    }
});
</script>
```

---

## Fetch API Integration

### Basic Fetch

```javascript
async function loadData(url) {
    const container = document.getElementById('data-container');

    // Apply loading state
    window.loadX.applyLoading(container, {
        strategy: 'skeleton',
        rows: 5
    });

    try {
        const response = await fetch(url);
        const data = await response.json();

        container.innerHTML = renderData(data);
    } catch (error) {
        container.innerHTML = '<p>Error loading data</p>';
    } finally {
        // Remove loading state
        window.loadX.removeLoading(container);
    }
}
```

### Fetch with Minimum Display Time

Prevent flash of loading state:

```javascript
async function loadDataWithMinTime(url) {
    const container = document.getElementById('data-container');
    const startTime = Date.now();
    const minDisplayMs = 300;

    window.loadX.applyLoading(container, {
        strategy: 'skeleton'
    });

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Ensure minimum display time
        const elapsed = Date.now() - startTime;
        if (elapsed < minDisplayMs) {
            await new Promise(resolve =>
                setTimeout(resolve, minDisplayMs - elapsed)
            );
        }

        container.innerHTML = renderData(data);
    } finally {
        window.loadX.removeLoading(container);
    }
}
```

### Fetch with Progress

Track download progress:

```javascript
async function fetchWithProgress(url) {
    const container = document.getElementById('content');
    const progressBar = document.getElementById('progress');

    window.loadX.applyProgressStrategy(progressBar, {
        value: 0,
        max: 100,
        showPercentage: true
    });

    const response = await fetch(url);
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');

    let receivedLength = 0;
    let chunks = [];

    while(true) {
        const {done, value} = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress
        const percent = (receivedLength / contentLength) * 100;
        window.loadX.updateProgressValue(progressBar, percent);
    }

    const blob = new Blob(chunks);
    const data = await blob.text();

    container.innerHTML = data;
    window.loadX.removeProgressStrategy(progressBar);
}
```

---

## Form Handling

### Basic Form Submission

```html
<form id="contact-form" lx-strategy="spinner">
    <input type="email" name="email" required>
    <button type="submit">Subscribe</button>
</form>

<script>
const form = document.getElementById('contact-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    window.loadX.applyLoading(form, {
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
            form.innerHTML = '<p>Thank you for subscribing!</p>';
        } else {
            throw new Error('Subscription failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        window.loadX.removeLoading(form);
    }
});
</script>
```

### File Upload with Progress

```html
<form id="upload-form">
    <input type="file" id="file-input">
    <button type="submit">Upload</button>
</form>

<div id="upload-progress"></div>

<script>
const form = document.getElementById('upload-form');
const progressBar = document.getElementById('upload-progress');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = document.getElementById('file-input').files[0];
    if (!file) return;

    // Show progress bar
    window.loadX.applyProgressStrategy(progressBar, {
        value: 0,
        max: 100,
        showPercentage: true,
        label: `Uploading ${file.name}...`
    });

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            window.loadX.updateProgressValue(progressBar, percent);
        }
    });

    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            window.loadX.removeProgressStrategy(progressBar);
            alert('Upload complete!');
        }
    });

    xhr.addEventListener('error', () => {
        window.loadX.removeProgressStrategy(progressBar);
        alert('Upload failed');
    });

    xhr.open('POST', '/upload');
    xhr.send(formData);
});
</script>
```

### Multi-Step Form

```html
<form id="wizard">
    <div class="step active" data-step="1">
        <h2>Step 1</h2>
        <input type="text" name="name">
        <button type="button" onclick="nextStep(2)">Next</button>
    </div>

    <div class="step" data-step="2" style="display: none;">
        <h2>Step 2</h2>
        <input type="email" name="email">
        <button type="button" onclick="nextStep(3)">Next</button>
    </div>
</form>

<script>
function nextStep(stepNumber) {
    const form = document.getElementById('wizard');

    // Fade out current step
    window.loadX.applyFadeStrategy(form, {
        duration: 200,
        opacity: 0
    });

    setTimeout(() => {
        // Hide current, show next
        const current = form.querySelector('.step.active');
        const next = form.querySelector(`[data-step="${stepNumber}"]`);

        current.classList.remove('active');
        current.style.display = 'none';

        next.classList.add('active');
        next.style.display = 'block';

        // Fade in
        window.loadX.removeFadeStrategy(form);
    }, 200);
}
</script>
```

---

## React Integration

### Function Component

```jsx
import { useEffect, useState } from 'react';

function DataLoader({ url }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        async function fetchData() {
            if (containerRef.current) {
                window.loadX.applyLoading(containerRef.current, {
                    strategy: 'skeleton',
                    rows: 5
                });
            }

            try {
                const response = await fetch(url);
                const json = await response.json();
                setData(json);
            } finally {
                if (containerRef.current) {
                    window.loadX.removeLoading(containerRef.current);
                }
                setLoading(false);
            }
        }

        fetchData();
    }, [url]);

    return (
        <div ref={containerRef}>
            {!loading && data && (
                <div>{/* Render data */}</div>
            )}
        </div>
    );
}
```

### Custom Hook

```jsx
import { useEffect, useRef } from 'react';

function useLoadX(strategy = 'spinner', options = {}) {
    const elementRef = useRef(null);

    const startLoading = () => {
        if (elementRef.current) {
            window.loadX.applyLoading(elementRef.current, {
                strategy,
                ...options
            });
        }
    };

    const stopLoading = () => {
        if (elementRef.current) {
            window.loadX.removeLoading(elementRef.current);
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            stopLoading();
        };
    }, []);

    return { elementRef, startLoading, stopLoading };
}

// Usage
function MyComponent() {
    const { elementRef, startLoading, stopLoading } = useLoadX('skeleton');

    async function handleClick() {
        startLoading();
        try {
            await fetchData();
        } finally {
            stopLoading();
        }
    }

    return (
        <div ref={elementRef}>
            <button onClick={handleClick}>Load Data</button>
        </div>
    );
}
```

---

## Vue Integration

### Component with loadX

```vue
<template>
    <div ref="container">
        <button @click="loadData">Load Data</button>
        <div v-if="data">{{ data }}</div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            data: null
        };
    },
    methods: {
        async loadData() {
            window.loadX.applyLoading(this.$refs.container, {
                strategy: 'skeleton',
                rows: 3
            });

            try {
                const response = await fetch('/api/data');
                this.data = await response.json();
            } finally {
                window.loadX.removeLoading(this.$refs.container);
            }
        }
    }
};
</script>
```

### Vue Composition API

```vue
<template>
    <div ref="containerRef">
        <button @click="loadData">Load</button>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const containerRef = ref(null);
const data = ref(null);

const loadData = async () => {
    window.loadX.applyLoading(containerRef.value, {
        strategy: 'spinner',
        variant: 'dots'
    });

    try {
        const response = await fetch('/api/data');
        data.value = await response.json();
    } finally {
        window.loadX.removeLoading(containerRef.value);
    }
};
</script>
```

---

## Alpine.js Integration

### Alpine Component

```html
<div x-data="dataLoader()">
    <div x-ref="container">
        <button @click="load()">Load Data</button>

        <template x-if="data">
            <div x-text="data"></div>
        </template>
    </div>
</div>

<script>
function dataLoader() {
    return {
        data: null,

        async load() {
            window.loadX.applyLoading(this.$refs.container, {
                strategy: 'skeleton'
            });

            try {
                const response = await fetch('/api/data');
                this.data = await response.text();
            } finally {
                window.loadX.removeLoading(this.$refs.container);
            }
        }
    };
}
</script>
```

---

## Vanilla JavaScript

### Class-Based Pattern

```javascript
class DataLoader {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
    }

    async load(url) {
        this.showLoading();

        try {
            const response = await fetch(url);
            const data = await response.json();
            this.render(data);
        } catch (error) {
            this.showError(error);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        window.loadX.applyLoading(this.container, {
            strategy: this.options.strategy || 'skeleton',
            ...this.options
        });
    }

    hideLoading() {
        window.loadX.removeLoading(this.container);
    }

    render(data) {
        this.container.innerHTML = this.template(data);
    }

    showError(error) {
        this.container.innerHTML = `<p>Error: ${error.message}</p>`;
    }

    template(data) {
        return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

// Usage
const loader = new DataLoader('data-container', {
    strategy: 'skeleton',
    rows: 5
});

loader.load('/api/users');
```

---

## Server-Side Rendering

### Initial State with SSR

```html
<!-- Server renders with loading state -->
<div id="user-list" lx-strategy="skeleton" lx-rows="5">
    <!-- SSR placeholder -->
</div>

<script>
// Client hydration
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('user-list');

    const response = await fetch('/api/users');
    const users = await response.json();

    // Replace skeleton with real content
    container.innerHTML = renderUsers(users);
    window.loadX.removeLoading(container);
});
</script>
```

### Progressive Enhancement

```html
<!-- Works without JavaScript -->
<noscript>
    <div id="content">
        <!-- Static content for no-JS users -->
    </div>
</noscript>

<!-- Enhanced with JavaScript -->
<div id="content" lx-strategy="skeleton">
    <!-- JavaScript will load dynamic content -->
</div>

<script>
if ('loadX' in window) {
    loadDynamicContent();
}
</script>
```

---

## Best Practices

1. **Always cleanup:** Remove loading states in `finally` blocks
2. **Minimum display time:** Use 300-500ms to prevent flashing
3. **Choose appropriate strategy:**
   - Spinner: Quick operations
   - Skeleton: Content loading
   - Progress: File uploads
   - Fade: Transitions

4. **HTMX integration:** Enable `autoDetect: true` for automatic handling
5. **Accessibility:** Provide ARIA labels for meaningful context
6. **Performance:** Import only needed strategies to minimize bundle size

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Next:** See [Troubleshooting Guide](troubleshooting.md) for common issues
