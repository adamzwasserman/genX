# GenX Collaborative System - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Start the Collaboration Server

```bash
# Clone the repo
git clone https://github.com/genx-dev/collaborative-system
cd collaborative-system/collaboration-server

# Install and start
npm install
npm start

# Server runs on http://localhost:3000
```

### Step 2: Install Chrome Extension (for Domain Experts)

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `/chrome-extension` folder
5. Pin the extension to toolbar

### Step 3: Install VS Code Extension (for Developers)

```bash
cd vscode-extension
npm install
npm run compile

# Package and install
npx vsce package
code --install-extension genx-*.vsix
```

## 👥 How It Works

### Domain Expert Workflow (Non-Technical Users)

1. **Open any website** with the Chrome extension active
2. **Click the extension icon** → Enter your name
3. **Click elements** on the page that need improvement
4. **Add annotations** like:
   - "This price should show currency symbol"
   - "Image needs description for screen readers"
   - "This text is too small to read"
5. **Review developer fixes** when they appear
6. **Approve or reject** with feedback

### Developer Workflow (Technical Users)

1. **Open HTML file** in VS Code
2. **Press Cmd+Shift+A** to connect to collaboration session
3. **See annotations** appear in Problems panel
4. **Click lightbulb** for quick fixes
5. **Apply GenX attributes** automatically
6. **Send proposals** back to users for approval
7. **Export manifest** for deployment

## 🎯 Real Example

### Domain Expert sees:
```
Website shows: 2499.99
Annotation: "This should display as $2,499.99"
```

### Developer receives:
```javascript
{
  selector: ".price",
  annotation: "This should display as $2,499.99",
  priority: "high",
  context: { valueType: "currency" }
}
```

### Developer proposes:
```html
<!-- Before -->
<span class="price">2499.99</span>

<!-- After -->
<span class="price" fx-format="currency" fx-currency="USD">2499.99</span>
```

### Domain Expert approves → Fix is applied!

## 💡 Key Benefits

### For Domain Experts
- **No coding required** - Just point and describe
- **Real-time collaboration** - See developers working
- **Validation power** - Approve/reject changes
- **Domain knowledge valued** - Your expertise matters

### For Developers
- **Clear requirements** - No guessing what users want
- **Contextual feedback** - Understand the "why"
- **Faster approval** - Pre-validated fixes
- **Less back-and-forth** - Real-time clarification

### For Organizations
- **Faster compliance** - Parallel discovery and fixing
- **Better quality** - Domain experts validate
- **Cost savings** - Reduce iteration cycles
- **Team empowerment** - Everyone contributes

## 🔧 Common Scenarios

### Scenario 1: E-commerce Accessibility
```
Marketing Manager: "All prices need currency symbols"
Developer: Adds fx-format="currency" to all .price elements
Manager: Approves after preview
Result: Site-wide fix in minutes, not days
```

### Scenario 2: Healthcare Compliance
```
Nurse: "This form needs clearer labels for medications"
Developer: Adds detailed aria-labels
Nurse: Tests with screen reader, approves
Result: HIPAA-compliant forms
```

### Scenario 3: International Sites
```
Translator: "Dates wrong format for Spanish users"
Developer: Adds fx-locale="es-ES" attributes
Translator: Validates formatting
Result: Properly localized content
```

## 🎨 What Gets Generated

The system produces a **GenX Manifest** that can be:

1. **Applied immediately** in VS Code
2. **Exported as JSON** for other developers
3. **Used in CI/CD** pipelines
4. **Converted to tests** for validation

Example manifest:
```json
{
  "transformations": [
    {
      "selector": ".price",
      "attributes": {
        "fx-format": "currency",
        "fx-currency": "USD"
      },
      "approvedBy": "jane@example.com",
      "annotation": "Display with currency symbol"
    }
  ]
}
```

## 🚦 Status Indicators

### Chrome Extension
- 🟢 **Green** - Connected to server
- 🟡 **Yellow** - Developer reviewing
- 🔵 **Blue** - Proposal awaiting approval
- 🔴 **Red** - Connection issue

### VS Code
- **Problems Panel** - Shows all annotations
- **Status Bar** - Connection status
- **Code Lens** - Inline suggestions

## 🆘 Troubleshooting

### Can't connect?
1. Check server is running: `http://localhost:3000/health`
2. Verify URL matches between Chrome and VS Code
3. Check firewall allows WebSocket connections

### Annotations not appearing?
1. Ensure both parties are on same URL
2. Check role settings (domain expert vs developer)
3. Refresh the connection

### Changes not applying?
1. Verify selector specificity
2. Check for conflicting CSS
3. Ensure GenX libraries are loaded

## 📚 Learn More

- **Full Documentation**: [See COLLABORATIVE-ARCHITECTURE.md](COLLABORATIVE-ARCHITECTURE.md)
- **VS Code Extension**: [See vscode-extension/README.md](vscode-extension/README.md)
- **Chrome Extension**: [See chrome-extension/README.md](chrome-extension/README.md)
- **Server API**: [See collaboration-server/API.md](collaboration-server/API.md)

## 🎉 You're Ready!

Start collaborating on better web accessibility today. The system handles the technical complexity while you focus on making the web better for everyone.

**Remember**: Domain experts identify problems, developers implement solutions, everyone wins!
