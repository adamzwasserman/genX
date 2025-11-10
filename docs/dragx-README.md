# dragX - Declarative Drag-and-Drop Module

**Version**: 1.0.0
**Bundle Size**: ~4KB gzipped
**Browser Support**: All modern browsers with Pointer Events API

## Overview

dragX is a high-performance, accessibility-first drag-and-drop module for the genX platform. It provides touch-first, declarative drag-and-drop with zero framework dependencies.

### Key Features

- **Touch-First Design**: Unified pointer event handling for mouse, touch, and pen
- **Accessibility**: Full keyboard navigation and screen reader support (WCAG 2.1 AA)
- **High Performance**: Quad-tree spatial indexing for O(log n) drop zone detection
- **Canvas Ghost Images**: Memory-efficient custom drag previews with badges
- **Pure Functional**: Immutable state machine with predictable transitions
- **Zero Dependencies**: No external libraries required

### Performance Targets

- Bundle size: <4KB gzipped
- Event processing: <0.5ms
- Visual updates: 60 FPS
- Spatial queries: <1ms for 100+ drop zones

## Installation

Include dragX in your HTML:

```html
<script src="https://cdn.genx.software/dragx@1.0.0/dragx.min.js"></script>
```

Or install via npm:

```bash
npm install @genx/dragx
```

## Quick Start

### Basic Draggable

```html
<!-- Verbose attribute syntax -->
<div dx-draggable="card" dx-data='{"id":123}'>
  Drag me!
</div>

<!-- Compact colon syntax -->
<div dx-drag="card:123">
  Drag me!
</div>

<!-- Class-based syntax -->
<div class="drag-card" data-id="123">
  Drag me!
</div>
```

### Drop Zone

```html
<div dx-drop-zone="board" dx-accepts="card">
  Drop here!
</div>
```

### Handle Drop Events

```javascript
document.addEventListener('dx:drop', (event) => {
  const { element, dropZone, type, data } = event.detail;
  console.log(`Dropped ${type} on ${dropZone.id}`, data);
});
```

## Attribute Syntax

### Draggable Elements

dragX supports **4 syntax styles**:

#### 1. Verbose Attributes (Recommended)

```html
<div
  dx-draggable="card"
  dx-data='{"id":123,"name":"Task"}'
  dx-ghost="true"
  dx-constraint="horizontal"
  dx-handle=".handle">
  Draggable Card
</div>
```

#### 2. Compact Colon Syntax

```html
<div dx-drag="card:123:ghost:horizontal">
  Draggable Card
</div>
```

#### 3. Class-Based Syntax

```html
<div class="drag-card drag-ghost" data-id="123" data-constraint="horizontal">
  Draggable Card
</div>
```

#### 4. JSON Configuration

```html
<div dx-config='{"draggable":"card","data":{"id":123},"ghost":true}'>
  Draggable Card
</div>
```

### Drop Zones

```html
<div
  dx-drop-zone="board"
  dx-accepts="card,image"
  dx-priority="1">
  Drop Zone
</div>
```

**Attributes:**

- `dx-drop-zone`: Zone name/identifier
- `dx-accepts`: Comma-separated list of accepted types (default: `*`)
- `dx-priority`: Priority for overlapping zones (higher = preferred)

## Events

dragX emits three custom events:

### dx:dragstart

Fired when drag begins (after threshold):

```javascript
document.addEventListener('dx:dragstart', (event) => {
  const { element, type, data, x, y } = event.detail;
  console.log('Drag started:', type, data);
});
```

### dx:drop

Fired on successful drop:

```javascript
document.addEventListener('dx:drop', (event) => {
  const { element, dropZone, type, data, x, y, keyboard } = event.detail;

  // Move element to drop zone
  dropZone.appendChild(element);

  // Update application state
  updateDatabase(data.id, dropZone.id);
});
```

### dx:dragend

Fired when drag ends (success or cancel):

```javascript
document.addEventListener('dx:dragend', (event) => {
  const { element, dropZone, success, cancelled } = event.detail;

  if (success) {
    console.log('Drop successful');
  } else if (cancelled) {
    console.log('Drag cancelled');
  } else {
    console.log('Invalid drop');
  }
});
```

## Keyboard Navigation

dragX provides full keyboard accessibility:

### Keyboard Shortcuts

- **Space**: Start/grab focused draggable element
- **Arrow Keys**: Move element (10px per press)
- **Enter**: Drop at current position
- **Escape**: Cancel drag operation
- **Tab**: Cycle through available drop zones

### Screen Reader Support

- Automatic ARIA attributes (`role`, `tabindex`, `aria-grabbed`)
- Live region announcements for all actions
- Contextual feedback during drag operations

### Usage

```html
<!-- Elements automatically get tabindex="0" and role="button" -->
<div dx-draggable="card">
  Keyboard accessible!
</div>

<!-- Or manually specify -->
<div dx-draggable="card" tabindex="0" role="button">
  Custom tab order
</div>
```

## Performance

### Spatial Indexing

dragX uses quad-tree spatial indexing for efficient drop zone detection:

```javascript
// Automatically built on init
// Supports 1000+ drop zones efficiently
// O(log n) query time vs O(n) linear search

// Manual rebuild after dynamic changes
DragX.init();
```

### Canvas Ghost Images

Memory-efficient canvas-based drag previews:

```javascript
// Canvas pool automatically manages memory
// Max 5 canvases cached
// Supports multi-selection badges

const metrics = DragX.getPerformanceMetrics();
console.log('Canvas pool size:', metrics.memoryUsage.canvasPoolSize);
```

### Performance Monitoring

```javascript
// Get performance metrics
const metrics = DragX.getPerformanceMetrics();
console.log('Drag count:', metrics.dragCount);
console.log('Avg event processing:', metrics.avgEventProcessingTime);

// Run benchmark
const results = DragX.runPerformanceBenchmark(100);
console.log('Spatial query avg:', results.spatialQueries.avg);

// Detect memory leaks
DragX.detectMemoryLeaks();

// Reset metrics
DragX.resetPerformanceMetrics();
```

## API Reference

### DragX.init()

Initialize or reinitialize dragX module.

```javascript
DragX.init();
```

Call after:
- Dynamic element creation
- DOM structure changes
- Window resize (automatic with debounce)

### DragX.getState()

Get current drag state:

```javascript
const state = DragX.getState();
console.log('Phase:', state.phase); // 'idle', 'pending', 'dragging', 'hovering'
console.log('Element:', state.element);
console.log('Drop zone:', state.dropZone);
```

### DragX.isDragging()

Check if drag operation active:

```javascript
if (DragX.isDragging()) {
  console.log('Drag in progress');
}
```

### DragX.parseDraggable(element)

Parse draggable configuration:

```javascript
const config = DragX.parseDraggable(element);
console.log('Type:', config.type);
console.log('Data:', config.data);
console.log('Ghost:', config.ghost);
```

### DragX.parseDropZone(element)

Parse drop zone configuration:

```javascript
const zone = DragX.parseDropZone(element);
console.log('Name:', zone.name);
console.log('Accepts:', zone.accepts);
console.log('Priority:', zone.priority);
```

### DragX.startKeyboardDrag(element)

Programmatically start keyboard drag:

```javascript
const element = document.getElementById('card-1');
DragX.startKeyboardDrag(element);
```

### DragX.cancelKeyboardDrag()

Cancel active keyboard drag:

```javascript
DragX.cancelKeyboardDrag();
```

### DragX.getPerformanceMetrics()

Get performance metrics:

```javascript
const metrics = DragX.getPerformanceMetrics();
console.log(JSON.stringify(metrics, null, 2));
```

### DragX.runPerformanceBenchmark(iterations)

Run performance benchmark:

```javascript
const results = DragX.runPerformanceBenchmark(100);
console.log('Spatial queries:', results.spatialQueries);
console.log('Canvas creation:', results.canvasCreation);
```

### DragX.detectMemoryLeaks()

Detect and cleanup memory leaks:

```javascript
DragX.detectMemoryLeaks();
```

## Advanced Usage

### Custom Ghost Images

Disable default ghost and provide custom:

```html
<div dx-draggable="card" dx-ghost="false" id="custom">
  Custom ghost
</div>
```

```javascript
document.addEventListener('dx:dragstart', (event) => {
  const custom = document.createElement('div');
  custom.className = 'my-custom-ghost';
  custom.textContent = 'Custom!';
  document.body.appendChild(custom);
});
```

### Multi-Selection

```html
<div dx-draggable="card" dx-data='{"id":1,"multiCount":3}'>
  3 items selected
</div>
```

Canvas ghost will display badge with count.

### Drag Constraints

```html
<!-- Horizontal only -->
<div dx-draggable="slider" dx-axis="horizontal">
  Horizontal drag
</div>

<!-- Vertical only -->
<div dx-draggable="slider" dx-axis="vertical">
  Vertical drag
</div>
```

### Drop Zone Priority

```html
<div dx-drop-zone="primary" dx-priority="10">High priority</div>
<div dx-drop-zone="secondary" dx-priority="1">Low priority</div>
```

Higher priority zones are preferred for overlapping regions.

### Dynamic Elements

```javascript
// Add elements dynamically
const newCard = document.createElement('div');
newCard.setAttribute('dx-draggable', 'card');
newCard.setAttribute('dx-data', '{"id":456}');
container.appendChild(newCard);

// Reinitialize dragX
DragX.init();
```

## CSS Classes

dragX automatically applies CSS classes for styling:

```css
/* Element being dragged */
.dx-dragging {
  opacity: 0.7;
  cursor: grabbing;
}

/* Ghost image */
.dx-ghost {
  pointer-events: none;
  opacity: 0.8;
}

/* Drop zone with hovering element */
.dx-drag-over {
  border: 2px dashed #4a90e2;
  background: rgba(74, 144, 226, 0.1);
}

/* Keyboard drag mode */
.dx-keyboard-dragging {
  outline: 2px solid #4a90e2;
}

/* Available drop zone during keyboard drag */
.dx-keyboard-drop-zone {
  border: 1px dashed #ccc;
}

/* Hovered drop zone during keyboard drag */
.dx-keyboard-hover {
  border: 2px solid #4a90e2;
  background: rgba(74, 144, 226, 0.2);
}
```

## Best Practices

### Performance

1. **Use spatial indexing**: Supports 100+ drop zones efficiently
2. **Limit canvas pool**: Automatically capped at 5
3. **Debounce resize**: Window resize automatically debounced (250ms)
4. **Monitor metrics**: Use `getPerformanceMetrics()` to track

### Accessibility

1. **Provide labels**: Use meaningful `dx-draggable` types
2. **Test keyboard**: All functionality via keyboard
3. **Screen reader**: Test with NVDA/JAWS/VoiceOver
4. **Focus visible**: Ensure focus indicators visible

### Security

1. **Sanitize data**: XSS prevention in `dx-data` parsing
2. **Validate types**: Check `dx-accepts` matches `dx-draggable`
3. **Prototype pollution**: Automatic protection in JSON parsing

## Browser Support

- Chrome 55+ ✅
- Firefox 52+ ✅
- Safari 13+ ✅
- Edge 79+ ✅
- iOS Safari 13+ ✅
- Chrome Android 55+ ✅

**Requirements:**
- Pointer Events API
- ES6 (const, let, arrow functions)
- Canvas API (for ghost images)

## Migration Guide

### From HTML5 Drag API

```html
<!-- Before (HTML5) -->
<div draggable="true" ondragstart="handleDragStart(event)">
  Drag me
</div>

<!-- After (dragX) -->
<div dx-draggable="card" dx-data='{"id":123}'>
  Drag me
</div>
```

```javascript
// Before (HTML5)
element.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', '123');
});

// After (dragX)
document.addEventListener('dx:dragstart', (e) => {
  console.log('Data:', e.detail.data.id);
});
```

### From jQuery UI Draggable

```javascript
// Before (jQuery UI)
$('.draggable').draggable({
  helper: 'clone',
  revert: 'invalid'
});

// After (dragX)
// Just add attributes - no JS needed!
```

```html
<div dx-draggable="card" dx-ghost="true">
  Drag me
</div>
```

## Troubleshooting

### Ghost not appearing

Check that element has visible content:

```html
<!-- Bad - empty element -->
<div dx-draggable="card"></div>

<!-- Good - has content -->
<div dx-draggable="card">Content</div>
```

### Drop zone not detecting

Ensure `dx-accepts` matches `dx-draggable`:

```html
<div dx-draggable="card">Card</div>
<div dx-drop-zone="board" dx-accepts="card">Drop here</div>
```

### Keyboard navigation not working

Ensure element has `tabindex`:

```html
<!-- Automatic -->
<div dx-draggable="card">Auto tabindex</div>

<!-- Manual -->
<div dx-draggable="card" tabindex="0">Manual</div>
```

### Performance issues

Check metrics and run benchmark:

```javascript
const metrics = DragX.getPerformanceMetrics();
if (metrics.avgEventProcessingTime > 0.5) {
  console.warn('Performance degraded');
  DragX.detectMemoryLeaks();
}

DragX.runPerformanceBenchmark(100);
```

## Contributing

dragX follows BDD/TDD development:

1. Write feature file (Gherkin)
2. Run tests (should fail)
3. Implement feature
4. Run tests (should pass)
5. Commit

See `/Users/adam/dev/genX/docs/implementation/01-dragx-implementation-plan-v1_0.md` for details.

## License

MIT License - see LICENSE file

## Support

- Documentation: https://genx.software/dragx
- Issues: https://github.com/genx/dragx/issues
- Email: support@genx.software

---

**dragX** - Built with ❤️ for the genX platform
