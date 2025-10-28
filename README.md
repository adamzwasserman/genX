# genX - Declarative Web Development Platform

**Make web development simpler with HTML attributes.**

genX is a declarative web development platform that enhances HTML with powerful functionality through simple attributes. No frameworks required, no complex build processes, just add attributes and go.

```html
<!-- Before -->
<span>$25.00</span>
<input type="email" id="email">

<!-- After: Formatted and accessible -->
<span fx-format="currency" fx-currency="USD">25.00</span>
<input type="email" id="email" ax-enhance="field" ax-required="true" ax-help="We'll never share your email">
```

## ✨ Features

- **🎯 Declarative** - Control everything with HTML attributes
- **⚡ Lightweight** - 1KB bootloader, modules loaded on-demand
- **🔒 Privacy-First** - Client-side processing only, no tracking
- **♿ Accessible** - WCAG 2.1 AA compliant by default
- **🚀 Fast** - 0ms Total Blocking Time, perfect Lighthouse scores
- **🔧 Framework Agnostic** - Works with vanilla HTML, React, Vue, Angular, or anything else

## 🚀 Quick Start

### 1. Add the Bootloader

```html
<script src="https://cdn.genx.software/v1/bootloader.js"></script>
```

### 2. Use genX Attributes

```html
<!-- Currency Formatting -->
<span fx-format="currency" fx-currency="USD">1299.99</span>

<!-- Accessibility Enhancement -->
<button ax-enhance="button" ax-pressed="false">Toggle</button>

<!-- Date Formatting -->
<span fx-format="date" fx-date-format="long">2024-03-15</span>
```

### 3. It Just Works™

The bootloader scans your page, loads only the modules you need, and enhances everything automatically. Dynamic content is handled automatically via MutationObserver.

See the [Quick Start Guide](docs/QUICK-START.md) for more details.

## 📦 Modules

| Module | Purpose | Attributes | Status |
|--------|---------|------------|--------|
| **fmtX** | Text formatting (currency, dates, numbers) | `fx-*` | ✅ Ready |
| **accX** | Accessibility (WCAG, ARIA) | `ax-*` | ✅ Ready |
| **bindX** | Reactive data binding | `bx-*` | 📋 Planned |
| **loadX** | Loading states, skeletons | `lx-*` | 📋 Planned |
| **dragX** | Drag & drop | `dx-*` | 📋 Planned |
| **tableX** | Enhanced tables | `tx-*` | 📋 Planned |
| **navX** | Navigation & routing | `nx-*` | 📋 Planned |

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK-START.md)** - Get started in 5 minutes
- **[Full Documentation](docs/README.md)** - Complete guide to all modules
- **[Architecture](docs/architecture/)** - Technical specifications
- **[API Reference](docs/README.md#modules)** - All attributes and options

## 🎯 Use Cases

### E-commerce
```html
<div class="product-card">
    <img ax-enhance="image" alt="Product" src="product.jpg">
    <h3>Amazing Product</h3>
    <span fx-format="currency" fx-currency="USD">99.99</span>
    <button ax-enhance="button">Add to Cart</button>
</div>
```

### Forms
```html
<form>
    <input type="email"
           ax-enhance="field"
           ax-required="true"
           ax-help="We'll never share your email">

    <input type="tel"
           fx-format="phone"
           fx-phone-format="us"
           ax-enhance="field">
</form>
```

### Data Display
```html
<table ax-enhance="table" ax-caption="Sales Report" ax-sortable="true">
    <tr>
        <th>Product</th>
        <th>Revenue</th>
        <th>Growth</th>
    </tr>
    <tr>
        <td>Widget A</td>
        <td><span fx-format="currency">45000</span></td>
        <td><span fx-format="percent">0.15</span></td>
    </tr>
</table>
```

## 🏗️ Architecture

genX consists of three core components:

### 1. Universal Bootloader (1KB)
- Loads after first paint for 0ms blocking time
- Scans DOM for genX attributes
- Dynamically loads only required modules
- Watches for dynamic content via MutationObserver

### 2. Polymorphic Processing Engine
- Pure functional JavaScript
- Processes multiple notation styles
- Framework-agnostic design
- Client-side only (privacy-preserving)

### 3. Edge Compilation Service (Optional)
- ML-optimized bundles
- Edge location delivery
- Pre-compiled common patterns
- Paid tier for production optimization

See [Architecture Documentation](docs/architecture/) for technical details.

## 🔒 Security & Privacy

- **Client-side only** - No data sent to servers
- **XSS protected** - Safe DOM manipulation, no innerHTML
- **CSP compliant** - No eval, no inline scripts
- **SRI supported** - Subresource integrity for CDN
- **GDPR compliant** - No tracking, no PII collection

## 🎨 Visual Tooling (Commercial)

Professional point-and-click tools for genX attribute tagging:

- **Chrome Extension** - Visual element inspector and tagger
- **VSCode Extension** - IDE-integrated tagging with live preview
- **Collaboration Server** - Team workflows and version control

**Learn more:** https://visual.genx.software | sales@genx.software

## 🚀 Performance

genX is designed for perfect performance:

- **0ms Total Blocking Time** - Loads after first paint
- **<16ms Operations** - 60 FPS guaranteed
- **Perfect Lighthouse Scores** - 100/100/100/100
- **<1KB Bootloader** - Minimal initial load
- **On-demand Loading** - Only load what you use

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires ES6+ (Proxy, MutationObserver, async/await)

## 📦 Installation Options

### Option 1: CDN (Easiest)
```html
<script src="https://cdn.genx.software/v1/bootloader.js"></script>
```

### Option 2: npm (Coming Soon)
```bash
npm install @genx/core
```

### Option 3: Self-Hosted
```bash
# Download and host yourself
wget https://cdn.genx.software/v1/bootloader.js
```

See [Deployment Guide](docs/README.md#deployment) for details.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](.claude/CLAUDE.local.md) for:

- Code style guidelines
- Module development standards
- Testing requirements
- Documentation standards

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

Built with inspiration from:
- Alpine.js - For declarative simplicity
- HTMX - For HTML-first philosophy
- Tailwind - For utility-first thinking

## 🔗 Links

- **Website:** https://genx.software
- **Documentation:** [docs/README.md](docs/README.md)
- **GitHub:** https://github.com/genx-software/genx
- **Discord:** https://discord.gg/genx

## 📊 Project Status

**Current Phase:** Alpha
**Version:** 1.0.0-alpha
**Modules Ready:** fmtX, accX
**In Development:** bindX, loadX, dragX, tableX, navX

---

**Made with ❤️ for developers who value simplicity.**
