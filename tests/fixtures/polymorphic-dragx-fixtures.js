/**
 * DragX (dragX) Polymorphic Notation Test Fixtures
 *
 * Tests all 4 notation styles produce identical drag-and-drop behavior:
 * 1. Verbose: dx-draggable="card" dx-data='{"id":123}' dx-handle=".drag-handle"
 * 2. Colon: dx-drag="card:123:.drag-handle"
 * 3. JSON: dx-opts='{"draggable":"card","data":{"id":123},"handle":".drag-handle"}'
 * 4. CSS Class: class="drag-card-123-.drag-handle"
 */

export const dragxBasicDraggableFixtures = {
    name: 'Basic draggable element',
    verbose: '<div dx-draggable="card">Card Content</div>',
    colon: '<div dx-draggable="card">Card Content</div>',
    json: '<div dx-opts=\'{"draggable":"card"}\'>Card Content</div>',
    cssClass: '<div class="drag-card">Card Content</div>',
    expectedDraggable: 'card',
    expectedBehavior: 'Element should be draggable',
    description: 'Basic draggable element setup'
};

export const dragxDataAttributeFixture = {
    name: 'Draggable with data payload',
    verbose: '<div dx-draggable="task" dx-data=\'{"id":456,"type":"task"}\'>Task Item</div>',
    colon: '<div dx-drag="task:456:task">Task Item</div>',
    json: '<div dx-opts=\'{"draggable":"task","data":{"id":456,"type":"task"}}\'>Task Item</div>',
    cssClass: '<div class="drag-task-456-task">Task Item</div>',
    expectedData: { id: 456, type: 'task' },
    expectedBehavior: 'Data payload transferred on drop',
    description: 'Drag with data payload'
};

export const dragxHandleFixtures = {
    name: 'Draggable with restricted handle',
    verbose: `<div dx-draggable="panel" dx-handle=".panel-header">
        <div class="panel-header">Header (drag here)</div>
        <div class="panel-body">Content</div>
    </div>`,
    colon: `<div dx-draggable="panel" dx-handle=".panel-header">
        <div class="panel-header">Header (drag here)</div>
        <div class="panel-body">Content</div>
    </div>`,
    json: `<div dx-opts='{"draggable":"panel","handle":".panel-header"}'>
        <div class="panel-header">Header (drag here)</div>
        <div class="panel-body">Content</div>
    </div>`,
    cssClass: `<div class="drag-panel-.panel-header">
        <div class="panel-header">Header (drag here)</div>
        <div class="panel-body">Content</div>
    </div>`,
    expectedHandle: '.panel-header',
    expectedBehavior: 'Only panel-header can initiate drag',
    description: 'Restricted drag handle'
};

export const dragxComplexConfigFixture = {
    name: 'Complex drag with multiple constraints',
    verbose: `<div dx-draggable="list-item" dx-handle=".drag-icon" dx-constraint="parent" dx-axis="y" dx-ghost="true">
        <span class="drag-icon">☰</span>
        <span>Item</span>
    </div>`,
    colon: `<div dx-drag="list-item:.drag-icon:parent:y:true">
        <span class="drag-icon">☰</span>
        <span>Item</span>
    </div>`,
    json: `<div dx-opts='{"draggable":"list-item","handle":".drag-icon","constraint":"parent","axis":"y","ghost":true}'>
        <span class="drag-icon">☰</span>
        <span>Item</span>
    </div>`,
    cssClass: `<div class="drag-list-item-.drag-icon-parent-y-true">
        <span class="drag-icon">☰</span>
        <span>Item</span>
    </div>`,
    expectedHandle: '.drag-icon',
    expectedConstraint: 'parent',
    expectedAxis: 'y',
    expectedGhost: true,
    expectedBehavior: 'Dragging from icon only, constrained to parent, Y-axis only, with ghost image',
    description: 'Complex drag with constraints and visual feedback'
};

export const dragxEdgeCaseFixture = {
    name: 'Draggable without configuration',
    verbose: '<div dx-draggable="">Empty draggable</div>',
    colon: '<div dx-draggable="">Empty draggable</div>',
    json: '<div dx-opts=\'{"draggable":""}\'>Empty draggable</div>',
    cssClass: '<div class="drag-">Empty draggable</div>',
    expectedDraggable: '',
    expectedBehavior: 'No drag behavior applied',
    description: 'Empty configuration should not enable dragging'
};

export const dragxDropTargetFixtures = {
    name: 'Drop target with accept rules',
    verbose: '<div dx-drop-zone="accept" dx-accept-types="card,task" dx-drop-effect="move">Drop here</div>',
    colon: '<div dx-drop="accept:card,task:move">Drop here</div>',
    json: '<div dx-opts=\'{"drop_zone":"accept","accept_types":"card,task","drop_effect":"move"}\'>Drop here</div>',
    cssClass: '<div class="drop-accept-card,task-move">Drop here</div>',
    expectedAcceptTypes: ['card', 'task'],
    expectedDropEffect: 'move',
    expectedBehavior: 'Only card and task types can be dropped here',
    description: 'Drop zone with type filtering'
};

export const dragxDropEffectFixture = {
    name: 'Drop effect specification',
    verbose: '<div dx-drop-zone="true" dx-drop-effect="copy">Copy items here</div>',
    colon: '<div dx-drop="true:copy">Copy items here</div>',
    json: '<div dx-opts=\'{"drop_zone":true,"drop_effect":"copy"}\'>Copy items here</div>',
    cssClass: '<div class="drop-true-copy">Copy items here</div>',
    expectedDropEffect: 'copy',
    expectedBehavior: 'Dropped items should be copied, not moved',
    description: 'Copy vs move drop effect'
};

export const dragxSwapBehaviorFixture = {
    name: 'Drag with swap behavior',
    verbose: `<div dx-draggable="sortable-item" dx-behavior="swap" dx-constraint="parent">
        <span>Drag to reorder</span>
    </div>`,
    colon: `<div dx-drag="sortable-item::parent:swap">
        <span>Drag to reorder</span>
    </div>`,
    json: `<div dx-opts='{"draggable":"sortable-item","constraint":"parent","behavior":"swap"}'>
        <span>Drag to reorder</span>
    </div>`,
    cssClass: `<div class="drag-sortable-item--parent-swap">
        <span>Drag to reorder</span>
    </div>`,
    expectedBehavior: 'swap',
    expectedConstraint: 'parent',
    expectedBehavior_desc: 'Items swap positions when reordered',
    description: 'Sortable list with swap behavior'
};

export const dragxAnimationFixture = {
    name: 'Drag with animation',
    verbose: `<div dx-draggable="animated" dx-animate="true" dx-animate-duration="300" dx-animate-easing="ease-out">
        Animated drag
    </div>`,
    colon: `<div dx-drag="animated::300:ease-out:true">
        Animated drag
    </div>`,
    json: `<div dx-opts='{"draggable":"animated","animate":true,"animate_duration":300,"animate_easing":"ease-out"}'>
        Animated drag
    </div>`,
    cssClass: `<div class="drag-animated--300-ease-out-true">
        Animated drag
    </div>`,
    expectedAnimation: true,
    expectedDuration: 300,
    expectedEasing: 'ease-out',
    expectedBehavior: 'Smooth animation with ease-out for 300ms',
    description: 'Drag with custom animation'
};

export const dragxGhostImageFixture = {
    name: 'Custom ghost image during drag',
    verbose: `<div dx-draggable="photo" dx-ghost="true" dx-ghost-src="custom-ghost.png" dx-ghost-offset="10,10">
        <img src="photo.jpg" alt="Photo">
    </div>`,
    colon: `<div dx-drag="photo:::custom-ghost.png:10,10:true">
        <img src="photo.jpg" alt="Photo">
    </div>`,
    json: `<div dx-opts='{"draggable":"photo","ghost":true,"ghost_src":"custom-ghost.png","ghost_offset":"10,10"}'>
        <img src="photo.jpg" alt="Photo">
    </div>`,
    cssClass: `<div class="drag-photo---custom-ghost.png-10,10-true">
        <img src="photo.jpg" alt="Photo">
    </div>`,
    expectedGhost: true,
    expectedGhostSrc: 'custom-ghost.png',
    expectedGhostOffset: '10,10',
    expectedBehavior: 'Uses custom image with 10px offset for ghost',
    description: 'Custom ghost image feedback'
};

export const dragxConstraintFixtures = {
    name: 'Drag constraint to parent boundaries',
    verbose: `<div style="width:300px;height:300px" dx-draggable="constrained" dx-constraint="parent">
        Constrained to parent
    </div>`,
    colon: `<div style="width:300px;height:300px" dx-drag="constrained::parent">
        Constrained to parent
    </div>`,
    json: `<div style="width:300px;height:300px" dx-opts='{"draggable":"constrained","constraint":"parent"}'>
        Constrained to parent
    </div>`,
    cssClass: `<div style="width:300px;height:300px" class="drag-constrained--parent">
        Constrained to parent
    </div>`,
    expectedConstraint: 'parent',
    expectedBehavior: 'Cannot drag outside parent boundaries',
    description: 'Constrain drag to parent element'
};

export const dragxAxisConstraintFixture = {
    name: 'Drag constrained to single axis',
    verbose: `<div dx-draggable="slider" dx-axis="x">
        Horizontal slider
    </div>`,
    colon: `<div dx-drag="slider::x">
        Horizontal slider
    </div>`,
    json: `<div dx-opts='{"draggable":"slider","axis":"x"}'>
        Horizontal slider
    </div>`,
    cssClass: `<div class="drag-slider--x">
        Horizontal slider
    </div>`,
    expectedAxis: 'x',
    expectedBehavior: 'Can only drag horizontally (X-axis)',
    description: 'Drag constrained to X or Y axis'
};

export const dragxScrollableContainerFixture = {
    name: 'Drag within scrollable container',
    verbose: `<div style="overflow:auto;height:200px" dx-scroll="true" dx-scroll-sensitivity="50">
        <div dx-draggable="item">Item 1</div>
        <div dx-draggable="item">Item 2</div>
    </div>`,
    colon: `<div style="overflow:auto;height:200px" dx-scroll="true:50">
        <div dx-draggable="item">Item 1</div>
        <div dx-draggable="item">Item 2</div>
    </div>`,
    json: `<div style="overflow:auto;height:200px" dx-opts='{"scroll":true,"scroll_sensitivity":50}'>
        <div dx-opts='{"draggable":"item"}''>Item 1</div>
        <div dx-opts='{"draggable":"item"}''>Item 2</div>
    </div>`,
    cssClass: `<div style="overflow:auto;height:200px" class="drag-scroll-50">
        <div class="drag-item">Item 1</div>
        <div class="drag-item">Item 2</div>
    </div>`,
    expectedScroll: true,
    expectedSensitivity: 50,
    expectedBehavior: 'Container auto-scrolls when dragging near edge',
    description: 'Auto-scroll in scrollable containers'
};

export const dragxCallbackFixture = {
    name: 'Drag callbacks',
    verbose: `<div dx-draggable="tracked" dx-on-drag-start="handleStart" dx-on-drag-end="handleEnd" dx-on-drop="handleDrop">
        Tracked drag
    </div>`,
    colon: `<div dx-drag="tracked:::handleStart:handleEnd:handleDrop">
        Tracked drag
    </div>`,
    json: `<div dx-opts='{"draggable":"tracked","on_drag_start":"handleStart","on_drag_end":"handleEnd","on_drop":"handleDrop"}'>
        Tracked drag
    </div>`,
    cssClass: `<div class="drag-tracked---handleStart-handleEnd-handleDrop">
        Tracked drag
    </div>`,
    expectedCallbacks: {
        onDragStart: 'handleStart',
        onDragEnd: 'handleEnd',
        onDrop: 'handleDrop'
    },
    expectedBehavior: 'Callbacks fired at each drag phase',
    description: 'Lifecycle callbacks for drag operations'
};

export const dragxMultiSelectFixture = {
    name: 'Multi-select drag with Ctrl+click',
    verbose: `<div dx-draggable="multi-select" dx-multi-select="true" dx-select-class="selected">
        Selectable item
    </div>`,
    colon: `<div dx-drag="multi-select::true:selected">
        Selectable item
    </div>`,
    json: `<div dx-opts='{"draggable":"multi-select","multi_select":true,"select_class":"selected"}'>
        Selectable item
    </div>`,
    cssClass: `<div class="drag-multi-select--true-selected">
        Selectable item
    </div>`,
    expectedMultiSelect: true,
    expectedSelectClass: 'selected',
    expectedBehavior: 'Ctrl+click selects/deselects, drag all selected items',
    description: 'Drag multiple selected items together'
};

/**
 * Test page with all dragX notation styles
 */
export function createDragXTestPage(dragType = 'basic') {
    const fixtures = {
        basic: dragxBasicDraggableFixtures,
        data: dragxDataAttributeFixture,
        handle: dragxHandleFixtures,
        complex: dragxComplexConfigFixture,
        dropZone: dragxDropTargetFixtures,
        swap: dragxSwapBehaviorFixture,
        animation: dragxAnimationFixture,
        ghost: dragxGhostImageFixture,
        constraint: dragxConstraintFixtures,
        axis: dragxAxisConstraintFixture
    };

    const fixture = fixtures[dragType] || fixtures.basic;

    return `
        <div data-test="dragx-polymorphic-notation">
            <section data-notation="verbose">
                <h3>Verbose Notation</h3>
                ${fixture.verbose}
            </section>
            <section data-notation="colon">
                <h3>Colon Notation</h3>
                ${fixture.colon}
            </section>
            <section data-notation="json">
                <h3>JSON Notation</h3>
                ${fixture.json}
            </section>
            <section data-notation="class">
                <h3>CSS Class Notation</h3>
                ${fixture.cssClass}
            </section>
        </div>
    `;
}

/**
 * Performance test: All notation styles with 1000 elements
 */
export function createDragXPerformanceTest(count = 1000) {
    const templates = [
        '<div dx-draggable="item">Item {{i}}</div>',
        '<div dx-draggable="item">Item {{i}}</div>',
        '<div dx-opts=\'{"draggable":"item"}\'>Item {{i}}</div>',
        '<div class="drag-item">Item {{i}}</div>'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        elements.push(template.replace('{{i}}', i));
    }

    return `
        <div data-test="dragx-performance" data-count="${count}">
            ${elements.join('\n')}
        </div>
    `;
}

/**
 * Priority resolution test
 */
export const dragxPriorityTestFixture = {
    name: 'Priority resolution - JSON > Colon > Verbose > Class',
    description: 'JSON should take priority over other notations',
    element: '<div dx-draggable="verbose" dx-opts=\'{"draggable":"json"}\' class="drag-class">Content</div>',
    expectedDraggable: 'json',
    reason: 'dx-opts (JSON) takes priority'
};

export default {
    dragxBasicDraggableFixtures,
    dragxDataAttributeFixture,
    dragxHandleFixtures,
    dragxComplexConfigFixture,
    dragxEdgeCaseFixture,
    dragxDropTargetFixtures,
    dragxDropEffectFixture,
    dragxSwapBehaviorFixture,
    dragxAnimationFixture,
    dragxGhostImageFixture,
    dragxConstraintFixtures,
    dragxAxisConstraintFixture,
    dragxScrollableContainerFixture,
    dragxCallbackFixture,
    dragxMultiSelectFixture,
    createDragXTestPage,
    createDragXPerformanceTest,
    dragxPriorityTestFixture
};
