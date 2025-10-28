# GenX Accessibility Tagger for VS Code

Visual accessibility tagging and automated fixes for HTML with GenX attributes. Point, click, and fix accessibility issues without leaving your editor.

![GenX Tagger Demo](media/demo.gif)

## Features

### 🎯 Visual Tagger
- **Split-pane interface** - See your HTML preview and tagging panel side-by-side
- **Point-and-click selection** - Click elements in the preview to add transformations
- **Smart detection** - Automatically detects:
  - Currency values that need formatting
  - Dates in various formats
  - Phone numbers
  - Images missing alt text
  - Form fields without labels
  - Navigation areas needing ARIA roles

### 🛡️ Lighthouse-Style Accessibility Audit
- **Instant scanning** - Run comprehensive accessibility audits with one click
- **Severity grouping** - Issues organized by Critical, Serious, Moderate, Minor
- **Visual highlighting** - See issues highlighted directly in your code
- **Score tracking** - Get a 0-100 accessibility score like Lighthouse
- **Auto-fix suggestions** - One-click fixes for common issues

### ✨ Smart Code Actions
- **Inline hints** - See accessibility issues as you type
- **Quick fixes** - Right-click any element for fix suggestions
- **Bulk operations** - Apply fixes to all similar elements at once
- **Undo support** - Full VS Code undo/redo integration

### 📋 Manifest System
- **Import/Export** - Share transformation rules across projects
- **AI-ready format** - Generate prompts for GitHub Copilot, Cursor, etc.
- **Version control friendly** - JSON manifests work great with Git

## Installation

1. Install from VS Code Marketplace:
   ```
   ext install genx-accessibility-tagger
   ```

2. Or install manually:
   ```bash
   git clone https://github.com/genx-dev/vscode-extension
   cd vscode-extension
   npm install
   npm run compile
   code --install-extension genx-tagger-0.1.0.vsix
   ```

## Usage

### Quick Start

1. Open any HTML file
2. Press `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows/Linux) to open the tagger
3. Click elements in the preview to see suggestions
4. Click suggestions to apply transformations

### Running an Audit

#### Method 1: Command Palette
- Press `Cmd+Shift+P` → "GenX: Run Accessibility Audit"

#### Method 2: Status Bar
- Click the shield icon in the status bar

#### Method 3: Editor Title
- Click the eye icon in the editor title bar (HTML files only)

### Applying Fixes

#### Individual Fixes
1. Hover over any diagnostic (red/yellow underline)
2. Click the lightbulb icon
3. Select the fix to apply

#### Bulk Fixes from Audit
1. Run audit → View issues in Problems panel
2. Right-click → "Fix all GenX issues"

#### From Manifest
1. `Cmd+Shift+P` → "GenX: Apply Manifest"
2. Select your `.genx.json` file
3. All transformations applied automatically

## Snippets

Type these prefixes in HTML files for quick insertion:

| Prefix | Description | Example |
|--------|-------------|---------|
| `gx-currency` | Currency formatting | `fx-format="currency" fx-currency="USD"` |
| `gx-date` | Date formatting | `fx-format="date" fx-date-style="medium"` |
| `gx-phone` | Phone formatting | `fx-format="phone" fx-country="US"` |
| `ax-image` | Image accessibility | `ax-enhance="image" alt="Description"` |
| `ax-form` | Form field label | `ax-enhance="form" aria-label="Field"` |
| `ax-nav` | Navigation ARIA | `ax-enhance="navigation" role="navigation"` |
| `gx-product` | Complete product card | Full accessible product template |

## Configuration

Configure in VS Code settings (`Cmd+,`):

```json
{
  "genx.enableAutoAudit": true,        // Auto-audit HTML files on open
  "genx.auditOnSave": false,           // Run audit when saving
  "genx.showInlineHints": true,        // Show code lens hints
  "genx.defaultCurrency": "USD",       // Default currency for formatting
  "genx.defaultDateFormat": "medium",  // short|medium|long|full
  "genx.severityLevel": "moderate"     // Minimum severity to report
}
```

## Manifest Format

The extension generates and consumes manifests in this format:

```json
{
  "version": "1.0",
  "generator": "GenX VS Code Extension",
  "created": "2025-01-15T10:30:00Z",
  "transformations": [
    {
      "selector": ".price",
      "attributes": {
        "fx-format": "currency",
        "fx-currency": "USD"
      },
      "type": "Currency Format",
      "severity": "moderate"
    },
    {
      "selector": "img",
      "attributes": {
        "ax-enhance": "image",
        "alt": "Product image"
      },
      "type": "Add Alt Text",
      "severity": "critical"
    }
  ]
}
```

## Keyboard Shortcuts

| Command | Mac | Windows/Linux |
|---------|-----|---------------|
| Open Tagger | `Cmd+Shift+A` | `Ctrl+Shift+A` |
| Run Audit | `Cmd+Shift+U` | `Ctrl+Shift+U` |
| Quick Fix | `Cmd+.` | `Ctrl+.` |
| Export Manifest | `Cmd+Shift+E` | `Ctrl+Shift+E` |

## Integration with CI/CD

### GitHub Actions

```yaml
name: Accessibility Check
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run GenX Audit
        run: |
          npx genx-cli audit src/**/*.html
          npx genx-cli apply manifest.genx.json
      - name: Upload manifest
        uses: actions/upload-artifact@v2
        with:
          name: genx-manifest
          path: manifest.genx.json
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run GenX audit on staged HTML files
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.html$')

if [ -n "$staged_files" ]; then
  npx genx-cli audit $staged_files
  if [ $? -ne 0 ]; then
    echo "❌ Accessibility issues found. Run 'genx fix' to resolve."
    exit 1
  fi
fi
```

## Troubleshooting

### Webview not loading
- Ensure VS Code has permission to run local servers
- Try reloading the window: `Cmd+R`

### Audit not finding issues
- Check that axe-core is installed: `npm list axe-core`
- Verify HTML is valid: malformed HTML may cause issues
- Check severity level in settings

### Transformations not applying
- Ensure selectors are specific enough
- Check for conflicting attributes
- Verify file has write permissions

## Development

### Building from source

```bash
git clone https://github.com/genx-dev/vscode-extension
cd vscode-extension
npm install
npm run compile

# Run in development
code . 
# Press F5 to launch extension development host
```

### Running tests

```bash
npm test
```

### Publishing

```bash
vsce package
vsce publish
```

## License

MIT

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## Roadmap

- [ ] Multi-file audit reports
- [ ] Custom rule definitions
- [ ] Integration with ESLint
- [ ] Real-time collaboration features
- [ ] AI-powered alt text generation
- [ ] Support for Vue/React/Angular templates
- [ ] Export to PDF reports
- [ ] Team sharing of manifests

## Support

- 📧 Email: support@genx.dev
- 💬 Discord: discord.gg/genx
- 🐛 Issues: github.com/genx-dev/vscode-extension/issues

---

Made with ❤️ by the GenX team
