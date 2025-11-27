# loadX v2.0 Migration Guide

**Last Updated**: 2025-11-13
**Breaking Changes**: Yes (opt-in)

## Overview

loadX v2.0 simplifies attribute parsing by deprecating legacy CSS class and colon syntax in favor of modern HTML data attributes and JSON configuration. This provides better separation of concerns, improved IDE support, and clearer intent.

## What's Changing

### Deprecated Syntaxes (Still Supported)

1. **CSS Class Syntax** - `class="lx-spinner"`
2. **Colon Syntax** - `class="lx:spinner:300"`

### Modern Syntax (Recommended)

1. **Data Attributes** - `data-lx-strategy="spinner"`
2. **JSON Config** - `lx-config='{"strategy":"spinner","duration":300}'`

## Migration Path

### Option 1: Gradual Migration (Recommended)

Continue using legacy syntax with deprecation warnings. Migrate at your own pace:

```javascript
// No config changes needed - legacy syntax still works
window.loadX.init();
```

You'll see console warnings like:
```
[loadX v2.0] CSS class syntax (lx-spinner) is deprecated. Use data-lx-strategy="spinner" instead.
[loadX v2.0] Colon syntax (lx:spinner:300) is deprecated. Use data attributes or JSON config.
```

### Option 2: Modern Mode (Strict)

Enable strict mode to disable legacy parsing and enforce modern syntax:

```javascript
window.loadX.init({
    modernSyntax: true  // Disables CSS class and colon syntax
});
```

## Migration Examples

### Example 1: Simple Spinner

**Before (Deprecated)**:
```html
<button class="lx-spinner">Load Data</button>
```

**After (Modern)**:
```html
<button data-lx-strategy="spinner">Load Data</button>
```

### Example 2: Spinner with Duration

**Before (Deprecated)**:
```html
<button class="lx:spinner:500">Load Data</button>
```

**After (Modern - Option A: Data Attributes)**:
```html
<button data-lx-strategy="spinner" data-lx-duration="500">Load Data</button>
```

**After (Modern - Option B: JSON Config)**:
```html
<button lx-config='{"strategy":"spinner","duration":500}'>Load Data</button>
```

### Example 3: Progress Bar

**Before (Deprecated)**:
```html
<div class="lx-progress"></div>
```

**After (Modern)**:
```html
<div data-lx-strategy="progress"></div>
```

### Example 4: Skeleton Loader

**Before (Deprecated)**:
```html
<article class="lx-skeleton"></article>
```

**After (Modern)**:
```html
<article data-lx-strategy="skeleton"></article>
```

### Example 5: Fade Effect

**Before (Deprecated)**:
```html
<div class="lx:fade:400"></div>
```

**After (Modern)**:
```html
<div data-lx-strategy="fade" data-lx-duration="400"></div>
```

## Why This Change?

### Problems with CSS Class Syntax

1. **Separation of Concerns**: CSS classes should define styling, not behavior
2. **IDE Support**: Data attributes provide better autocomplete and validation
3. **Clarity**: `data-lx-strategy="spinner"` is more explicit than `class="lx-spinner"`
4. **Tooling**: Build tools can't optimize behavioral classes as effectively

### Problems with Colon Syntax

1. **Non-Standard**: Not a recognized HTML pattern
2. **Parsing Complexity**: Adds ~50 lines of parsing code
3. **Fragile**: Easy to typo, hard to debug
4. **Limited**: Can't express complex configurations

### Benefits of Modern Syntax

1. **Standard HTML**: Uses native data attributes
2. **Type Safety**: JSON config provides structure
3. **Tooling**: Better linting, formatting, validation
4. **Performance**: Simpler parsing = faster initialization
5. **Maintainability**: Less code, clearer intent

## Timeline

- **v1.x**: All syntaxes supported, no warnings
- **v2.0**: Legacy syntax deprecated with warnings (current)
- **v3.0** (future): Legacy syntax removed completely

## Testing Your Migration

### Step 1: Enable Deprecation Warnings

```javascript
// Default behavior in v2.0 - warnings enabled
window.loadX.init();
```

### Step 2: Review Console for Warnings

Open browser DevTools and check console for:
```
[loadX v2.0] Found 3 elements using deprecated syntax
[loadX v2.0] CSS class syntax (lx-spinner) is deprecated. Use data-lx-strategy="spinner" instead.
```

### Step 3: Migrate Elements

Update HTML to use modern syntax (see examples above).

### Step 4: Test Thoroughly

Verify all loading indicators still work after migration.

### Step 5: Enable Strict Mode (Optional)

```javascript
window.loadX.init({
    modernSyntax: true  // Throws errors for legacy syntax
});
```

## Automated Migration

### Find & Replace Patterns

Use your IDE's find & replace (with regex) to migrate:

**Pattern 1: CSS Class to Data Attribute**
```regex
Find:    class="([^"]*)\s*lx-(\w+)([^"]*)"
Replace: class="$1$3" data-lx-strategy="$2"
```

**Pattern 2: Colon Syntax to Data Attributes**
```regex
Find:    lx:(\w+):(\d+)
Replace: data-lx-strategy="$1" data-lx-duration="$2"
```

**Note**: These patterns are simplified. Test thoroughly and review changes manually.

## Need Help?

- **Documentation**: https://genx.software/docs/loadx
- **Issues**: https://github.com/genx-tech/loadx/issues
- **Migration Tool**: Coming in v2.1

## Backward Compatibility

loadX v2.0 maintains full backward compatibility by default:

- Legacy syntax continues to work
- Deprecation warnings can be silenced: `window.loadX.init({ silenceDeprecations: true })`
- Opt-in to strict mode when ready

This gives teams time to migrate at their own pace while encouraging adoption of modern syntax.
