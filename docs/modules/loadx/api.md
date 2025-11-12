# loadX API Reference

**Version:** 1.0.0
**Module:** Declarative Loading States
**Bundle Size:** ~3.5KB gzipped (1.2KB core + 2.3KB strategies + CSS)

## Overview

loadX provides automatic loading state management for web applications through declarative HTML attributes. It offers four loading strategies (spinner, skeleton, progress, fade) with zero layout shift, full accessibility, and seamless HTMX integration.

---

## Table of Contents

1. [Initialization](#initialization)
2. [Configuration](#configuration)
3. [Loading Strategies](#loading-strategies)
4. [HTML Attributes](#html-attributes)
5. [JavaScript API](#javascript-api)
6. [CSS Classes](#css-classes)
7. [ARIA Attributes](#aria-attributes)
8. [Events](#events)
9. [Type Definitions](#type-definitions)

---

## Initialization

### `initLoadX(config)`

Initialize the loadX module with optional configuration.

**Syntax:**
```javascript
const loadXAPI = window.loadX.initLoadX(config);
```

**Parameters:**
- `config` (Object, optional): Configuration options

**Returns:**
- Object with frozen API methods and configuration

**Example:**
```javascript
const api = window.loadX.initLoadX({
    minDisplayMs: 300,
    autoDetect: true,
    telemetry: false
});
```

---

## Configuration

### Configuration Object

```typescript
interface LoadXConfig {
    minDisplayMs?: number;    // Minimum time to display loading (default: 300)
    autoDetect?: boolean;     // Auto-detect async operations (default: true)
    strategies?: string[];    // Available strategies (default: [])
    telemetry?: boolean;      // Enable telemetry (default: false)
}
```

### Configuration Properties

#### `minDisplayMs`
- **Type:** `number`
- **Default:** `300`
- **Description:** Minimum milliseconds to display loading indicator to prevent flashing
- **Validation:** Must be non-negative number

#### `autoDetect`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Automatically detect and show loading states for HTMX requests
- **Behavior:** When `true`, listens for htmx:beforeRequest and htmx:afterSwap events

#### `strategies`
- **Type:** `string[]`
- **Default:** `[]`
- **Description:** Array of enabled loading strategies
- **Options:** `['spinner', 'skeleton', 'progress', 'fade']`

#### `telemetry`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable anonymous usage telemetry (privacy-preserving)
- **Note:** Disabled by default in accordance with privacy-first principles

---

## Loading Strategies

### 1. Spinner Strategy

Displays an animated spinner indicator.

**Attributes:**
- `lx-strategy="spinner"` or `class="lx-spinner"`
- `lx-variant` - Spinner variant: `dots`, `circle`, `bars` (default: `circle`)
- `lx-size` - Size: `small`, `medium`, `large` (default: `medium`)
- `lx-color` - Custom color (CSS color value)

**Example:**
```html
<div lx-strategy="spinner" lx-variant="dots">
    Content
</div>
```

**Function:**
```javascript
applySpinnerStrategy(element, options)
```

**Options:**
```typescript
interface SpinnerOptions {
    variant?: 'dots' | 'circle' | 'bars';
    size?: 'small' | 'medium' | 'large';
    color?: string;
}
```

### 2. Skeleton Strategy

Displays a skeleton placeholder that matches content structure.

**Attributes:**
- `lx-strategy="skeleton"` or `class="lx-skeleton"`
- `lx-rows` - Number of skeleton rows (default: auto-detected)
- `lx-animate` - Enable shimmer animation (default: `true`)
- `lx-width` - Skeleton width (default: `100%`)

**Example:**
```html
<div lx-strategy="skeleton" lx-rows="3">
    Content
</div>
```

**Function:**
```javascript
applySkeletonStrategy(element, options)
```

**Options:**
```typescript
interface SkeletonOptions {
    rows?: number;
    animate?: boolean;
    width?: string;
}
```

**Auto-detection:**
- Detects text content elements (p, h1-h6, span)
- Detects list elements (ul, ol, li)
- Detects containers (div.card, article, section)
- Preserves element dimensions for zero layout shift

### 3. Progress Strategy

Displays a progress bar for determinate or indeterminate operations.

**Attributes:**
- `lx-strategy="progress"` or `class="lx-progress"`
- `lx-value` - Current progress value (0-100)
- `lx-max` - Maximum value (default: `100`)
- `lx-show-percentage` - Show percentage text (default: `false`)
- `lx-label` - Custom label text

**Example:**
```html
<!-- Determinate -->
<div lx-strategy="progress" lx-value="50" lx-max="100">
    Upload Progress
</div>

<!-- Indeterminate -->
<div lx-strategy="progress">
    Loading...
</div>
```

**Functions:**
```javascript
applyProgressStrategy(element, options)
updateProgressValue(element, value)
```

**Options:**
```typescript
interface ProgressOptions {
    value?: number;
    max?: number;
    showPercentage?: boolean;
    label?: string;
    indeterminate?: boolean;
    color?: string;
    height?: string;
}
```

**ARIA:**
- `role="progressbar"`
- `aria-valuenow` (for determinate)
- `aria-valuemin="0"`
- `aria-valuemax` (from max option)

### 4. Fade Strategy

Fades content opacity during loading.

**Attributes:**
- `lx-strategy="fade"` or `class="lx-fade"`
- `lx-duration` - Fade duration in ms (default: `300`)
- `lx-opacity` - Target opacity (0-1, default: `0.5`)
- `lx-message` - Loading message to display

**Example:**
```html
<div lx-strategy="fade" lx-duration="500" lx-opacity="0.3" lx-message="Loading...">
    Content
</div>
```

**Function:**
```javascript
applyFadeStrategy(element, options)
```

**Options:**
```typescript
interface FadeOptions {
    duration?: number;
    opacity?: number;
    message?: string;
}
```

---

## HTML Attributes

### Strategy Selection

Multiple ways to specify loading strategy (priority order):

1. **JSON Config** (highest priority)
   ```html
   <div lx-config='{"strategy":"skeleton","rows":5}'></div>
   ```

2. **HTML Attribute**
   ```html
   <div lx-strategy="spinner"></div>
   ```

3. **Data Attribute**
   ```html
   <div data-lx-strategy="progress"></div>
   ```

4. **CSS Class**
   ```html
   <div class="lx-skeleton"></div>
   ```

5. **Colon Syntax**
   ```html
   <div class="lx:progress:50"></div>
   ```

### Common Attributes

| Attribute | Type | Description | Default |
|-----------|------|-------------|---------|
| `lx-strategy` | string | Loading strategy | `spinner` |
| `lx-loading` | boolean | Force loading state | - |
| `lx-config` | JSON | Complete configuration | `{}` |
| `lx-duration` | number | Animation duration (ms) | `300` |
| `lx-min-height` | string | Minimum height | auto |
| `lx-aria-label` | string | Custom ARIA label | - |

### Strategy-Specific Attributes

#### Spinner
- `lx-variant`: `dots | circle | bars`
- `lx-size`: `small | medium | large`
- `lx-color`: CSS color value

#### Skeleton
- `lx-rows`: number
- `lx-animate`: boolean
- `lx-width`: CSS size value

#### Progress
- `lx-value`: number (0-100)
- `lx-max`: number
- `lx-show-percentage`: boolean
- `lx-label`: string

#### Fade
- `lx-opacity`: number (0-1)
- `lx-message`: string

---

## JavaScript API

### Public Functions

#### `initLoadX(config)`
Initialize loadX module.

```javascript
const api = window.loadX.initLoadX({
    minDisplayMs: 300,
    autoDetect: true
});
```

#### `applyLoading(element, options)`
Apply loading state to element.

```javascript
api.applyLoading(document.getElementById('myDiv'), {
    strategy: 'spinner',
    variant: 'dots'
});
```

#### `removeLoading(element)`
Remove loading state from element.

```javascript
api.removeLoading(document.getElementById('myDiv'));
```

#### `updateProgressValue(element, value)`
Update progress bar value.

```javascript
window.loadX.updateProgressValue(element, 75);
```

#### `parseElementAttributes(element)`
Parse and return element's loadX configuration.

```javascript
const config = window.loadX.parseElementAttributes(element);
// Returns: { strategy: 'spinner', duration: 300, ... }
```

### Strategy Functions

#### `applySpinnerStrategy(element, options)`
```javascript
window.loadX.applySpinnerStrategy(element, {
    variant: 'dots',
    size: 'large'
});
```

#### `removeSpinnerStrategy(element)`
```javascript
window.loadX.removeSpinnerStrategy(element);
```

#### `applySkeletonStrategy(element, options)`
```javascript
window.loadX.applySkeletonStrategy(element, {
    rows: 3,
    animate: true
});
```

#### `removeSkeletonStrategy(element)`
```javascript
window.loadX.removeSkeletonStrategy(element);
```

#### `applyProgressStrategy(element, options)`
```javascript
window.loadX.applyProgressStrategy(element, {
    value: 50,
    max: 100,
    showPercentage: true
});
```

#### `removeProgressStrategy(element)`
```javascript
window.loadX.removeProgressStrategy(element);
```

#### `applyFadeStrategy(element, options)`
```javascript
window.loadX.applyFadeStrategy(element, {
    duration: 500,
    opacity: 0.3,
    message: 'Loading...'
});
```

#### `removeFadeStrategy(element)`
```javascript
window.loadX.removeFadeStrategy(element);
```

---

## CSS Classes

### Applied Classes

| Class | Applied By | Description |
|-------|-----------|-------------|
| `lx-loading` | All strategies | Base loading class |
| `lx-spinner` | Spinner | Spinner indicator active |
| `lx-skeleton` | Skeleton | Skeleton placeholder active |
| `lx-progress` | Progress | Progress bar active |
| `lx-fade` | Fade | Fade effect active |
| `lx-animate` | Skeleton | Animation enabled |
| `lx-reduced-motion` | All | Reduced motion mode |

### Declarative Classes

Use these classes to trigger loading strategies:

```html
<div class="lx-spinner">...</div>
<div class="lx-skeleton">...</div>
<div class="lx-progress">...</div>
<div class="lx-fade">...</div>
```

### Colon Syntax Classes

```html
<div class="lx:spinner:500">...</div>           <!-- spinner with 500ms duration -->
<div class="lx:skeleton:3">...</div>            <!-- skeleton with 3 rows -->
<div class="lx:progress:50">...</div>           <!-- progress at 50% -->
<div class="lx:fade:300">...</div>              <!-- fade with 300ms duration -->
```

---

## ARIA Attributes

### Applied ARIA Attributes

#### All Strategies
- `aria-busy="true"` - Applied during loading
- `aria-live="polite"` - Live region announcements

#### Progress Strategy
- `role="progressbar"`
- `aria-valuenow` - Current value
- `aria-valuemin="0"` - Minimum value
- `aria-valuemax` - Maximum value
- `aria-label` - Custom label

### Custom ARIA Labels

```html
<div lx-strategy="spinner" lx-aria-label="Loading user data">
    ...
</div>
```

---

## Events

loadX does not emit custom events by default. It integrates with HTMX events:

### HTMX Events (Auto-Detect Mode)

When `autoDetect: true`:

- **htmx:beforeRequest** - Apply loading state
- **htmx:afterSwap** - Remove loading state
- **htmx:afterRequest** - Cleanup (on error)

---

## Type Definitions

### TypeScript Definitions

```typescript
interface LoadXAPI {
    config: Readonly<LoadXConfig>;
    registry: Map<string, any>;
    applyLoading: (element: HTMLElement, options?: LoadingOptions) => void;
    removeLoading: (element: HTMLElement) => void;
}

interface LoadXConfig {
    minDisplayMs: number;
    autoDetect: boolean;
    strategies: readonly string[];
    telemetry: boolean;
}

interface LoadingOptions {
    strategy?: 'spinner' | 'skeleton' | 'progress' | 'fade';
    duration?: number;
    [key: string]: any;
}

interface SpinnerOptions {
    variant?: 'dots' | 'circle' | 'bars';
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

interface SkeletonOptions {
    rows?: number;
    animate?: boolean;
    width?: string;
}

interface ProgressOptions {
    value?: number;
    max?: number;
    showPercentage?: boolean;
    label?: string;
    indeterminate?: boolean;
    color?: string;
    height?: string;
}

interface FadeOptions {
    duration?: number;
    opacity?: number;
    message?: string;
}
```

---

## Error Handling

### Validation Errors

loadX validates configuration and throws descriptive errors:

```javascript
// Invalid minDisplayMs type
initLoadX({ minDisplayMs: 'invalid' });
// Error: loadX config error: minDisplayMs must be a number, got string

// Negative minDisplayMs
initLoadX({ minDisplayMs: -100 });
// Error: loadX config error: minDisplayMs must be non-negative, got -100

// Invalid autoDetect type
initLoadX({ autoDetect: 'yes' });
// Error: loadX config error: autoDetect must be a boolean, got string
```

### Graceful Degradation

- Null/undefined elements: Function returns silently
- Missing attributes: Falls back to defaults
- Invalid JSON in `lx-config`: Logs warning, uses other methods
- Unknown strategy: Falls back to `spinner`

---

## Performance Characteristics

### Bundle Size
- **Core:** ~1.2KB gzipped
- **With all strategies:** ~3.5KB gzipped
- **With CSS:** ~4.5KB total gzipped

### Execution Speed
- **Strategy selection:** <0.1ms
- **Skeleton generation:** <5ms
- **Layout shift:** 0 (perfect CLS score)
- **Animation performance:** 60 FPS (CSS animations)

### Memory Usage
- **Per element:** ~100 bytes overhead
- **Live regions:** 1 global instance
- **Configuration:** Frozen/immutable (no memory leaks)

---

## Browser Compatibility

- **Modern browsers:** Full support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Legacy browsers:** Graceful degradation (IE11 requires polyfills)
- **Mobile:** Full support on iOS 14+, Android 90+

### Required Features
- CSS Custom Properties
- MutationObserver (optional, for auto-detect)
- IntersectionObserver (optional, for lazy loading)

---

## Security

### XSS Prevention
- All HTML generation is sanitized
- Attribute values are escaped
- No innerHTML injection from user input
- Content Security Policy (CSP) compatible

### Privacy
- **Telemetry disabled by default**
- No external requests
- No cookies or storage
- No fingerprinting

---

## License

MIT License - See LICENSE file for details

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Maintainer:** genX Team
