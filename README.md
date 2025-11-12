# genX

## Declarative HTML attribute-based formatting and UI enhancement library

genX is a lightweight, modular JavaScript library that enhances HTML elements with formatting, accessibility, drag-and-drop, navigation, and loading state capabilities—all controlled through simple HTML attributes.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://genx.software/examples/genx-demo.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Table of Contents

| | | |
|---|---|---|
| [Features](#features) | [Architecture](#architecture) | [Browser Support](#browser-support) |
| [Quick Start](#quick-start) | [Documentation](#documentation) | [Installation Options](#installation-options) |
| [Modules](#modules) | [Testing](#testing) | [Contributing](#contributing) |
| [fmtX Examples](#fmtx-examples) | [Privacy & Security](#privacy--security) | [Project Status](#project-status) |
| | [License](#license) | [Links](#links) |

## Features

- **Declarative** - Control everything with HTML attributes (`fx-*`, `ax-*`, `dx-*`, etc.)
- **Lightweight** - ~1KB bootloader, modules loaded on-demand
- **Privacy-First** - 100% client-side processing, no tracking, no external calls
- **Accessible** - WCAG 2.1 AA compliant made easy
- **Fast** - Designed for <16ms operations (60 FPS)
- **Framework Agnostic** - Works with vanilla HTML, React, Vue, Angular, htmx, or anything else

## Quick Start

### View the Live Demo

See all modules in action: **[genX Interactive Demo](https://genx.software/examples/genx-demo.html)**

### Installation

#### Option 1: CDN (Easiest)

```html
<!-- Add to your HTML <head> with defer attribute -->
<script src="https://cdn.genx.software/v1/bootloader.js" defer></script>
```

#### Option 2: Self-Hosted

1. Copy genX files to your static directory:

```bash
# Clone the repository
git clone https://github.com/adamzwasserman/genX.git

# Copy src files to your project's static/js directory
cp genX/src/*.js your-project/static/js/
```

2. Add to your HTML `<head>` with `defer` attribute:

```html
<script src="/static/js/bootloader.js" defer></script>
```

**Important:** Always use the `defer` attribute to ensure genX loads after the DOM is parsed without blocking page rendering.

### Basic Usage

```html
<!-- Currency Formatting -->
<span fx-format="currency" fx-currency="USD">1299.99</span>
<!-- Displays: $1,299.99 -->

<!-- Phone Number Formatting -->
<input type="tel" fx-format="phone" fx-phone-format="us" value="5551234567">
<!-- Displays: (555) 123-4567 -->

<!-- Date Formatting -->
<span fx-format="date" fx-date-format="long">2024-03-15</span>
<!-- Displays: March 15, 2024 -->

<!-- Percentage with Decimal Control -->
<span fx-format="percent" fx-decimals="2">0.1567</span>
<!-- Displays: 15.67% -->
```

## Modules

| Module | Purpose | Prefix | Status | Documentation |
|--------|---------|--------|--------|---------------|
| **fmtX** | Text formatting (currency, dates, numbers, phones) | `fx-*` | ✅ v1.0 | [Architecture](docs/architecture/fmtx-architecture-v1.0.md) |
| **accX** | Accessibility (WCAG, ARIA) | `ax-*` | ✅ v1.0 | [Architecture](docs/architecture/accx-architecture-v1.0.md) |
| **loadX** | Loading states, skeletons, spinners | `lx-*` | ✅ v1.0 | [Architecture](docs/architecture/loadx-architecture-v1.0.md) |
| **navX** | Navigation & routing | `nx-*` | ✅ v1.0 | [Architecture](docs/architecture/navx-architecture-v1.0.md) |
| **dragX** | Drag & drop | `dx-*` | ✅ v1.0 | [Architecture](docs/architecture/dragx-architecture-v1.0.md) |
| **bindX** | Reactive data binding | `bx-*` | 🚧 In Progress | [Architecture](docs/architecture/bindx-technical-architecture-v1.0.md) |
| **tableX** | Enhanced tables | `tx-*` | 📋 Planned | [Architecture](docs/architecture/tablex-architecture-v1.0.md) |

## fmtX Examples

The fmtX module supports comprehensive formatting with input type selectors:

### Currency Formatting

```html
<!-- Basic currency -->
<span fx-format="currency" fx-currency="USD">42.50</span>

<!-- Input type selector: dollars or cents -->
<span fx-format="currency" fx-currency="USD" fx-input-type="cents">4250</span>
<!-- Input: 4250 cents → Output: $42.50 -->
```

### Phone Numbers

Supports multiple US formats and international numbers:

```html
<!-- US formats -->
<span fx-format="phone" fx-phone-format="us">5551234567</span>
<!-- Output: (555) 123-4567 -->

<span fx-format="phone" fx-phone-format="us-dash">5551234567</span>
<!-- Output: 555-123-4567 -->

<span fx-format="phone" fx-phone-format="us-dot">5551234567</span>
<!-- Output: 555.123.4567 -->

<!-- International format -->
<span fx-format="phone" fx-phone-format="intl">+44 20 7946 0958</span>
<!-- Output: +44 20 7946 0958 (normalized) -->
```

**Input format flexibility:** Accepts raw digits, pre-formatted numbers, numbers with spaces, or international format. Gracefully handles:

- 10-digit US numbers
- 11-digit numbers with country code
- Already-formatted numbers (with parentheses, dashes, or dots)
- Extra spaces (stripped automatically)
- European/international numbers (preserved as-is)

### Date & Time

```html
<!-- Date input types: iso, unix, ms -->
<span fx-format="date" fx-date-format="long" fx-input-type="unix">1710518400</span>

<!-- Relative time (always UTC input) -->
<span fx-format="relative">2024-03-15T12:00:00Z</span>
<!-- Output: "2 hours ago" or "in 3 days" -->
```

### Numbers & Percentages

```html
<!-- Percentage with decimal control -->
<span fx-format="percent" fx-decimals="2">0.1567</span>
<!-- Output: 15.67% -->

<!-- Compact numbers (auto-scales: K, M, B, T) -->
<span fx-format="compact">1500000</span>
<!-- Output: 1.5M -->

<!-- File sizes (auto-scales: KB, MB, GB, TB) -->
<span fx-format="filesize">1073741824</span>
<!-- Output: 1.00 GB -->

<!-- Decimal precision control -->
<span fx-format="decimal" fx-decimals="3">3.14159</span>
<!-- Output: 3.142 -->
```

## Architecture

### Universal Bootloader (~1KB)

- Scans DOM for genX attributes
- Dynamically loads only required modules
- Watches for dynamic content via MutationObserver
- Zero dependencies

### Module Design

- **Pure functional JavaScript** - No classes, no complex state
- **Polymorphic processing** - Handles multiple input/output formats
- **Client-side only** - Privacy-preserving, no external calls
- **Performance-first** - All operations target <16ms (60 FPS)

See [Architecture Documentation](docs/architecture/) for technical specifications.

## Documentation

- **[Live Demo](https://genx.software/examples/genx-demo.html)** - Interactive examples of all modules
- **[Architecture Specs](docs/architecture/)** - Technical documentation for each module
- **[Implementation Plans](docs/implementation/)** - Development roadmaps and completion reports
- **[Testing Guide](docs/testing/getting-started.md)** - BDD/TDD testing framework

## Testing

genX uses a comprehensive BDD/TDD testing framework:

- **Cucumber BDD** - Human-readable feature specifications
- **Playwright** - Browser automation for UI testing
- **Jest** - Unit tests for pure functions
- **Manual Test Suite** - Visual verification in `tests/manual/`

```bash
# Run all tests
npm test

# Run browser tests
npm run test:browser

# Run unit tests
npm run test:unit

# Run BDD tests
npm run test:bdd
```

## Privacy & Security

- **100% Client-Side** - No data sent to servers, ever
- **No Tracking** - No analytics, no telemetry, no cookies
- **XSS Protected** - Safe DOM manipulation, no innerHTML
- **CSP Compliant** - No eval, no inline scripts
- **GDPR Compliant** - No PII collection

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires modern JavaScript features: ES6+, Proxy, MutationObserver, async/await

## Installation Options

### Option 1: Direct Script Tag

```html
<script src="https://cdn.genx.software/v1/bootloader.js"></script>
```

### Option 2: Local Development

```bash
git clone https://github.com/adamzwasserman/genX.git
cd genX
# Include src/bootloader.js in your project
```

### Option 3: npm (Coming Soon)

```bash
npm install @genx/core
```

## Contributing

Contributions welcome! This project follows:

- **BDD/TDD** - All features require tests (Cucumber + Playwright + Jest)
- **Architecture-first** - Specifications before implementation
- **Performance budget** - <16ms operations, <1KB bootloader
- **Privacy-first** - No external calls, no tracking

See implementation plans in `docs/implementation/` for current development status.

## Project Status

**Version:** 1.0.0-alpha
**Modules Complete:** fmtX, accX, loadX, navX, dragX
**In Development:** bindX
**Planned:** tableX

**Recent Updates:**

- ✅ Phone number formatting with comprehensive US/international support
- ✅ Input type selectors for dates, currency, percentages
- ✅ Decimal precision control for percentages and numbers
- ✅ Comprehensive BDD test suite with Cucumber/Playwright/Jest
- ✅ Manual test files for visual verification
- ✅ Updated demo page with clean, minimal styling

## License

MIT License - See [LICENSE](LICENSE) for details

## Links

- **Website:** [https://genx.software](https://genx.software)
- **Repository:** [https://github.com/adamzwasserman/genX](https://github.com/adamzwasserman/genX)
- **Live Demo:** [https://genx.software/examples/genx-demo.html](https://genx.software/examples/genx-demo.html)
- **Issues:** [https://github.com/adamzwasserman/genX/issues](https://github.com/adamzwasserman/genX/issues)

---

Made for developers who value simplicity, privacy, and performance.
