/**
 * DragX - Declarative drag-and-drop module for genX
 * @version 1.0.0
 *
 * Architecture:
 * - Pure functional state machine for drag operations
 * - Unified pointer event handling (touch/mouse/pen)
 * - Quad-tree spatial indexing for O(log n) drop zone detection
 * - Canvas-based ghost images with custom rendering
 * - Full keyboard accessibility
 *
 * Performance targets:
 * - Bundle size: <4KB gzipped
 * - Event processing: <0.5ms
 * - Visual updates: 60 FPS
 * - Spatial queries: <1ms for 100 drop zones
 */
(function() {
    'use strict';

    // ============================================================================
    // PHASE 1: FOUNDATION - POLYMORPHIC ATTRIBUTE PARSER
    // ============================================================================

    /**
     * Safe JSON parsing with prototype pollution prevention.
     *
     * @param {string} str - JSON string to parse
     * @returns {Object|null} Parsed object or null
     */
    const safeJSONParse = (str) => {
        if (!str) {
            return null;
        }

        try {
            const parsed = JSON.parse(str);

            // Prevent prototype pollution
            if (parsed && typeof parsed === 'object') {
                delete parsed.__proto__;
                delete parsed.constructor;
            }

            return Object.freeze(parsed);
        } catch (e) {
            console.warn('[dragX] Invalid JSON in attribute:', str);
            return null;
        }
    };

    /**
     * Parse verbose attribute syntax.
     * Example: dx-draggable="card" dx-data='{"id":123}'
     */
    const parseAttributes = (element) => {
        const type = element.getAttribute('dx-draggable');
        if (!type) {
            return null;
        }

        return {
            type,
            data: safeJSONParse(element.getAttribute('dx-data')) || {},
            ghost: element.hasAttribute('dx-ghost'),
            constraint: element.getAttribute('dx-constraint'),
            handle: element.getAttribute('dx-handle'),
            mode: element.getAttribute('dx-mode') || 'move',
            effect: element.getAttribute('dx-effect') || 'move',
            axis: element.getAttribute('dx-axis')
        };
    };

    /**
     * Parse compact colon syntax.
     * Example: dx-drag="card:123:ghost:horizontal"
     */
    const parseColon = (element) => {
        const dragAttr = element.getAttribute('dx-drag');
        if (!dragAttr) {
            return null;
        }

        const parts = dragAttr.split(':');
        const [type, id, ...flags] = parts;

        return {
            type,
            data: id ? {id: parseInt(id, 10)} : {},
            ghost: flags.includes('ghost'),
            constraint: flags.find(f => ['horizontal', 'vertical'].includes(f)),
            axis: flags.find(f => ['horizontal', 'vertical'].includes(f))
        };
    };

    /**
     * Parse class-based syntax.
     * Example: class="drag-card" data-id="123"
     */
    const parseClasses = (element) => {
        const dragClass = Array.from(element.classList)
            .find(cls => cls.startsWith('drag-'));

        if (!dragClass) {
            return null;
        }

        const type = dragClass.replace('drag-', '');

        return {
            type,
            data: {...element.dataset},
            ghost: element.classList.contains('drag-ghost'),
            constraint: element.dataset.constraint,
            axis: element.dataset.axis
        };
    };

    /**
     * Parse JSON configuration.
     * Example: dx-config='{"draggable":"card","data":{"id":123}}'
     */
    const parseJSON = (element) => {
        const configAttr = element.getAttribute('dx-config');
        if (!configAttr) {
            return null;
        }

        const config = safeJSONParse(configAttr);
        if (!config || !config.draggable) {
            return null;
        }

        return {
            type: config.draggable,
            data: config.data || {},
            ghost: config.ghost || false,
            constraint: config.constraint,
            handle: config.handle,
            mode: config.mode || 'move',
            effect: config.effect || 'move',
            axis: config.axis
        };
    };

    /**
     * Parse draggable element configuration from multiple syntax styles.
     * Pure function with no side effects.
     *
     * @param {HTMLElement} element - Element to parse
     * @returns {Object} Parsed configuration
     */
    const parseDraggable = (element) => {
        // Try to get config from bootloader cache first (if using genX bootloader)
        if (window.genx && window.genx.getConfig) {
            const cachedConfig = window.genx.getConfig(element);
            if (cachedConfig && cachedConfig.draggable) {
                // Got cached config - convert to expected format
                return Object.freeze({
                    type: cachedConfig.draggable,
                    data: cachedConfig.data || {},
                    ghost: cachedConfig.ghost !== undefined ? cachedConfig.ghost : false,
                    constraint: cachedConfig.constraint,
                    handle: cachedConfig.handle,
                    mode: cachedConfig.mode || 'move',
                    effect: cachedConfig.effect || 'move',
                    axis: cachedConfig.axis
                });
            }
        }

        // Fallback to polymorphic notation parsing (legacy standalone mode)
        // Use polymorphic parser from genx-common (supports Verbose, Colon, JSON, CSS Class)
        const parsed = window.genxCommon
            ? window.genxCommon.notation.parseNotation(element, 'dx')
            : {};  // Fallback if genx-common not loaded

        if (!parsed.draggable) {
            throw new Error(
                'Element missing dx-draggable attribute. ' +
                `Add dx-draggable="type" to ${element.tagName}#${element.id || 'unknown'}. ` +
                'See: https://genx.software/dragx/docs#draggable'
            );
        }

        // Map parseNotation keys to dragX config format
        return Object.freeze({
            type: parsed.draggable,
            data: parsed.data || {},
            ghost: parsed.ghost !== undefined ? parsed.ghost : false,
            constraint: parsed.constraint,
            handle: parsed.handle,
            mode: parsed.mode || 'move',
            effect: parsed.effect || 'move',
            axis: parsed.axis
        });
    };

    /**
     * Parse drop zone configuration.
     * Example: dx-drop-zone="board" dx-accepts="card,image"
     */
    const parseDropZone = (element) => {
        // Try to get config from bootloader cache first (if using genX bootloader)
        if (window.genx && window.genx.getConfig) {
            const cachedConfig = window.genx.getConfig(element);
            if (cachedConfig && cachedConfig.dropZone) {
                const acceptsAttr = cachedConfig.accepts;
                const accepts = acceptsAttr ?
                    (typeof acceptsAttr === 'string' ? acceptsAttr.split(',').map(s => s.trim()) : acceptsAttr) :
                    ['*'];

                return Object.freeze({
                    name: cachedConfig.dropZone,
                    accepts,
                    element,
                    priority: parseInt(cachedConfig.priority || '0', 10),
                    sort: cachedConfig.sort || false
                });
            }
        }

        // Fallback to polymorphic notation parsing (legacy standalone mode)
        // Use polymorphic parser from genx-common (supports Verbose, Colon, JSON, CSS Class)
        const parsed = window.genxCommon
            ? window.genxCommon.notation.parseNotation(element, 'dx')
            : {};  // Fallback if genx-common not loaded

        if (!parsed.dropZone) {
            return null;
        }

        const acceptsAttr = parsed.accepts;
        const accepts = acceptsAttr ?
            (typeof acceptsAttr === 'string' ? acceptsAttr.split(',').map(s => s.trim()) : acceptsAttr) :
            ['*'];

        return Object.freeze({
            name: parsed.dropZone,
            accepts,
            element,
            priority: parseInt(parsed.priority || '0', 10),
            sort: parsed.sort || false
        });
    };

    // ============================================================================
    // PHASE 1: UNIFIED POINTER EVENT HANDLING
    // ============================================================================

    /**
     * Normalize pointer event to unified format.
     * Works with mouse, touch, and pen input.
     *
     * @param {PointerEvent} event - Browser pointer event
     * @returns {Object} Normalized event data
     */
    const normalizePointerEvent = (event) => {
        return Object.freeze({
            x: event.clientX,
            y: event.clientY,
            target: event.target,
            timestamp: event.timeStamp,
            type: event.pointerType  // 'mouse', 'touch', 'pen'
        });
    };

    /**
     * Create throttled function that executes at most once per interval.
     * Used to throttle pointer move events to 60 FPS (16.67ms).
     *
     * @param {Function} fn - Function to throttle
     * @param {number} ms - Minimum interval between calls
     * @returns {Function} Throttled function
     */
    const throttle = (fn, ms = 16.67) => {
        let lastCall = 0;

        return (...args) => {
            const now = Date.now();

            if (now - lastCall >= ms) {
                lastCall = now;
                return fn(...args);
            }
        };
    };

    // ============================================================================
    // PHASE 1: DRAG STATE MACHINE
    // ============================================================================

    /**
     * Drag state machine phases.
     * Uses string constants for type safety.
     */
    const DragPhase = Object.freeze({
        IDLE: 'idle',
        PENDING: 'pending',
        DRAGGING: 'dragging',
        HOVERING: 'hovering',
        DROPPED: 'dropped',
        CANCELLED: 'cancelled'
    });

    /**
     * Create initial drag state.
     *
     * @returns {Object} Initial state object
     */
    const createInitialState = () => {
        return Object.freeze({
            phase: DragPhase.IDLE,
            element: null,
            type: null,
            data: {},
            config: {},
            position: {x: 0, y: 0},
            startPosition: {x: 0, y: 0},
            dropZone: null,
            ghost: null,
            timestamp: 0
        });
    };

    // Global state container (mutable for performance)
    let dragState = createInitialState();

    /**
     * Transition state based on event.
     * Pure function - returns new state, never mutates.
     *
     * @param {Object} currentState - Current drag state
     * @param {string} eventType - Event type (start, move, end, cancel)
     * @param {Object} eventData - Normalized event data
     * @returns {Object} New state
     */
    const transitionState = (currentState, eventType, eventData) => {
        const transitions = {
            start: handleStart,
            move: handleMove,
            end: handleEnd,
            cancel: handleCancel
        };

        const handler = transitions[eventType];
        if (!handler) {
            console.warn(`[dragX] Unknown event type: ${eventType}`);
            return currentState;
        }

        const newState = handler(currentState, eventData);

        // Always return frozen immutable state
        return Object.freeze({
            ...newState,
            timestamp: Date.now()
        });
    };

    /**
     * Handle pointer start event.
     * Idle → Pending transition.
     */
    const handleStart = (state, event) => {
        if (state.phase !== DragPhase.IDLE) {
            return state;  // Ignore if already dragging
        }

        // Check if target is draggable
        const draggableEl = findDraggableAncestor(event.target);
        if (!draggableEl) {
            return state;
        }

        try {
            const config = parseDraggable(draggableEl);

            return {
                ...state,
                phase: DragPhase.PENDING,
                element: draggableEl,
                type: config.type,
                data: config.data,
                config,
                position: {x: event.x, y: event.y},
                startPosition: {x: event.x, y: event.y}
            };
        } catch (e) {
            console.warn('[dragX]', e.message);
            return state;
        }
    };

    /**
     * Handle pointer move event.
     * Pending → Dragging (if threshold exceeded)
     * Dragging → Hovering (if over drop zone)
     */
    const handleMove = (state, event) => {
        const DRAG_THRESHOLD = 5;  // pixels

        // Pending → Dragging
        if (state.phase === DragPhase.PENDING) {
            const distance = Math.sqrt(
                Math.pow(event.x - state.startPosition.x, 2) +
                Math.pow(event.y - state.startPosition.y, 2)
            );

            if (distance > DRAG_THRESHOLD) {
                // Track metric
                performanceMetrics.dragCount++;

                // Emit drag start event
                emitDragEvent('dx:dragstart', state.element, {
                    element: state.element,
                    type: state.type,
                    data: state.data,
                    x: event.x,
                    y: event.y
                });

                // Add dragging class
                state.element.classList.add('dx-dragging');

                // Create ghost image if needed
                const ghost = createGhostImage(state.element, event.x, event.y, state.config);

                return {
                    ...state,
                    phase: DragPhase.DRAGGING,
                    position: {x: event.x, y: event.y},
                    ghost
                };
            }

            return state;  // Still pending
        }

        // Dragging → update position and check drop zones
        if (state.phase === DragPhase.DRAGGING || state.phase === DragPhase.HOVERING) {
            const dropZone = findDropZoneAt(event.x, event.y, state.type);
            const previousZone = state.dropZone;

            // Update ghost position
            if (state.ghost) {
                updateGhostPosition(state.ghost, event.x, event.y);
            }

            // Handle drop zone transitions
            if (dropZone !== previousZone) {
                if (previousZone) {
                    previousZone.element.classList.remove('dx-drag-over');
                }
                if (dropZone) {
                    dropZone.element.classList.add('dx-drag-over');
                }
            }

            return {
                ...state,
                phase: dropZone ? DragPhase.HOVERING : DragPhase.DRAGGING,
                position: {x: event.x, y: event.y},
                dropZone
            };
        }

        return state;
    };

    /**
     * Handle pointer end event.
     * Pending → Idle (no drag occurred)
     * Dragging → Cancelled (invalid drop)
     * Hovering → Dropped (valid drop)
     */
    const handleEnd = (state, event) => {
        // Pending → Idle (no drag)
        if (state.phase === DragPhase.PENDING) {
            return createInitialState();
        }

        // Hovering → Dropped
        if (state.phase === DragPhase.HOVERING && state.dropZone) {
            // Track metric
            performanceMetrics.dropCount++;

            // Emit drop event
            emitDragEvent('dx:drop', state.dropZone.element, {
                element: state.element,
                dropZone: state.dropZone.element,
                type: state.type,
                data: state.data,
                x: event.x,
                y: event.y
            });

            // Cleanup
            cleanup(state);

            // Emit drag end event
            emitDragEvent('dx:dragend', state.element, {
                element: state.element,
                dropZone: state.dropZone.element,
                success: true
            });

            return createInitialState();
        }

        // Dragging → Cancelled (no valid drop)
        if (state.phase === DragPhase.DRAGGING) {
            // Track metric
            performanceMetrics.cancelCount++;

            // Animate back to origin
            animateRevert(state.element, state.ghost, state.startPosition);

            // Cleanup
            cleanup(state);

            // Emit drag end event
            emitDragEvent('dx:dragend', state.element, {
                element: state.element,
                dropZone: null,
                success: false
            });

            return createInitialState();
        }

        return state;
    };

    /**
     * Handle cancel event (escape key, etc).
     * Any → Idle
     */
    const handleCancel = (state, _event) => {
        if (state.phase !== DragPhase.IDLE) {
            // Animate back to origin
            animateRevert(state.element, state.ghost, state.startPosition);

            // Cleanup
            cleanup(state);

            // Emit drag end event
            emitDragEvent('dx:dragend', state.element, {
                element: state.element,
                dropZone: null,
                success: false,
                cancelled: true
            });
        }

        return createInitialState();
    };

    /**
     * Check if state represents an active drag.
     *
     * @param {Object} state - Drag state
     * @returns {boolean} True if dragging
     */
    const isDragging = (state) => {
        return [DragPhase.PENDING, DragPhase.DRAGGING, DragPhase.HOVERING]
            .includes(state.phase);
    };

    // ============================================================================
    // PHASE 2: SPATIAL INDEXING - QUAD-TREE
    // ============================================================================

    /**
     * Quad-tree configuration constants.
     */
    const MAX_ZONES_PER_LEAF = 4;
    const MAX_TREE_DEPTH = 8;

    /**
     * Create empty quad-tree node.
     *
     * @param {Object} bounds - Bounding box {x, y, width, height}
     * @param {number} depth - Current depth
     * @returns {Object} Quad-tree node
     */
    const createQuadTreeNode = (bounds, depth = 0) => {
        return {
            bounds: Object.freeze(bounds),
            zones: [],
            children: null,  // null = leaf, array = split
            depth
        };
    };

    /**
     * Check if two rectangles intersect.
     *
     * @param {Object} rect1 - {x, y, width, height}
     * @param {Object} rect2 - {x, y, width, height}
     * @returns {boolean} True if intersecting
     */
    const intersects = (rect1, rect2) => {
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect2.x + rect2.width < rect1.x ||
            rect1.y + rect1.height < rect2.y ||
            rect2.y + rect2.height < rect1.y
        );
    };

    /**
     * Check if rectangle contains point.
     *
     * @param {Object} rect - {x, y, width, height}
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point inside
     */
    const containsPoint = (rect, x, y) => {
        return x >= rect.x &&
               x <= rect.x + rect.width &&
               y >= rect.y &&
               y <= rect.y + rect.height;
    };

    /**
     * Split quad-tree node into 4 children.
     *
     * @param {Object} node - Node to split
     * @returns {Object} Node with 4 children
     */
    const splitQuadTreeNode = (node) => {
        const {x, y, width, height} = node.bounds;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const newDepth = node.depth + 1;

        // Create 4 quadrants
        const children = [
            createQuadTreeNode({x, y, width: halfWidth, height: halfHeight}, newDepth),  // NW
            createQuadTreeNode({x: x + halfWidth, y, width: halfWidth, height: halfHeight}, newDepth),  // NE
            createQuadTreeNode({x, y: y + halfHeight, width: halfWidth, height: halfHeight}, newDepth),  // SW
            createQuadTreeNode({x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight}, newDepth)  // SE
        ];

        // Redistribute zones to children
        for (const zone of node.zones) {
            for (const child of children) {
                if (intersects(child.bounds, zone.rect)) {
                    child.zones.push(zone);
                }
            }
        }

        return {
            ...node,
            zones: [],  // Zones moved to children
            children
        };
    };

    /**
     * Insert drop zone into quad-tree.
     *
     * @param {Object} node - Current node
     * @param {Object} zone - Drop zone to insert
     * @returns {Object} Updated node
     */
    const insertZoneIntoQuadTree = (node, zone) => {
        // Check if zone intersects this node's bounds
        if (!intersects(node.bounds, zone.rect)) {
            return node;  // Zone not in this region
        }

        // Leaf node - add zone if space available
        if (!node.children &&
            (node.zones.length < MAX_ZONES_PER_LEAF || node.depth >= MAX_TREE_DEPTH)) {
            return {
                ...node,
                zones: [...node.zones, zone]
            };
        }

        // Need to split node
        if (!node.children) {
            node = splitQuadTreeNode(node);
        }

        // Insert into children
        const newChildren = node.children.map(child =>
            insertZoneIntoQuadTree(child, zone)
        );

        return {
            ...node,
            children: newChildren
        };
    };

    /**
     * Query quad-tree for zones at point.
     *
     * @param {Object} node - Quad-tree node
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Array} Drop zones at point
     */
    const queryQuadTreePoint = (node, x, y) => {
        if (!node) {
            return [];
        }

        // Check if point is in this node's bounds
        if (!containsPoint(node.bounds, x, y)) {
            return [];
        }

        // Leaf node - filter zones containing point
        if (!node.children) {
            return node.zones.filter(zone =>
                containsPoint(zone.rect, x, y)
            );
        }

        // Query children and merge results
        return node.children.flatMap(child =>
            queryQuadTreePoint(child, x, y)
        );
    };

    /**
     * Build quad-tree from array of drop zones.
     *
     * @param {Array} zones - Drop zones with rect property
     * @param {Object} viewport - Viewport bounds
     * @returns {Object} Complete quad-tree
     */
    const buildQuadTree = (zones, viewport) => {
        let tree = createQuadTreeNode(viewport);

        for (const zone of zones) {
            tree = insertZoneIntoQuadTree(tree, zone);
        }

        return tree;
    };

    /**
     * Sort zones by priority (higher priority first).
     *
     * @param {Array} zones - Drop zones
     * @returns {Array} Sorted zones
     */
    const sortByPriority = (zones) => {
        return [...zones].sort((a, b) =>
            (b.priority || 0) - (a.priority || 0)
        );
    };

    // Spatial index (quad-tree)
    let spatialIndex = null;

    // ============================================================================
    // PHASE 4: ACCESSIBILITY - KEYBOARD NAVIGATION
    // ============================================================================

    /**
     * Keyboard drag state.
     */
    let keyboardDragState = {
        active: false,
        element: null,
        position: {x: 0, y: 0},
        dropZoneIndex: -1
    };

    /**
     * ARIA live region for screen reader announcements.
     */
    let ariaLiveRegion = null;

    /**
     * Create ARIA live region for announcements.
     *
     * @returns {HTMLElement} Live region element
     */
    const createAriaLiveRegion = () => {
        if (ariaLiveRegion) {
            return ariaLiveRegion;
        }

        const region = document.createElement('div');
        region.id = 'dx-aria-live';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.style.position = 'absolute';
        region.style.left = '-10000px';
        region.style.width = '1px';
        region.style.height = '1px';
        region.style.overflow = 'hidden';

        document.body.appendChild(region);
        ariaLiveRegion = region;
        return region;
    };

    /**
     * Announce message to screen readers.
     *
     * @param {string} message - Message to announce
     */
    const announceToScreenReader = (message) => {
        const region = createAriaLiveRegion();
        region.textContent = message;

        // Clear after announcement
        setTimeout(() => {
            region.textContent = '';
        }, 1000);
    };

    /**
     * Initialize keyboard accessibility for draggable elements.
     */
    const initKeyboardAccessibility = () => {
        // Add tabindex and ARIA attributes to draggables
        document.querySelectorAll('[dx-draggable], [dx-drag], .drag-*').forEach(el => {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            if (!el.hasAttribute('role')) {
                el.setAttribute('role', 'button');
            }
            if (!el.hasAttribute('aria-grabbed')) {
                el.setAttribute('aria-grabbed', 'false');
            }
        });

        // Add ARIA attributes to drop zones
        document.querySelectorAll('[dx-drop-zone]').forEach(el => {
            if (!el.hasAttribute('role')) {
                el.setAttribute('role', 'region');
            }
            if (!el.hasAttribute('aria-dropeffect')) {
                el.setAttribute('aria-dropeffect', 'move');
            }
        });
    };

    /**
     * Start keyboard drag mode.
     *
     * @param {HTMLElement} element - Element to drag
     */
    const startKeyboardDrag = (element) => {
        const rect = element.getBoundingClientRect();
        keyboardDragState = {
            active: true,
            element,
            position: {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            },
            dropZoneIndex: -1
        };

        // Update ARIA attributes
        element.setAttribute('aria-grabbed', 'true');
        element.classList.add('dx-keyboard-dragging');

        // Highlight available drop zones
        dropZones.forEach(zone => {
            zone.element.classList.add('dx-keyboard-drop-zone');
        });

        announceToScreenReader(
            `Started dragging ${element.getAttribute('dx-draggable') || 'element'}. ` +
            'Use arrow keys to move, Enter to drop, Escape to cancel.'
        );
    };

    /**
     * Move dragged element with keyboard.
     *
     * @param {number} dx - X delta
     * @param {number} dy - Y delta
     */
    const moveKeyboardDrag = (dx, dy) => {
        if (!keyboardDragState.active) {
            return;
        }

        keyboardDragState.position.x += dx;
        keyboardDragState.position.y += dy;

        // Check if over a drop zone
        const dropZone = findDropZoneAt(
            keyboardDragState.position.x,
            keyboardDragState.position.y,
            keyboardDragState.element.getAttribute('dx-draggable')
        );

        if (dropZone) {
            // Highlight drop zone
            dropZones.forEach(zone => {
                if (zone === dropZone) {
                    zone.element.classList.add('dx-keyboard-hover');
                    zone.element.setAttribute('aria-dropeffect', 'move');
                } else {
                    zone.element.classList.remove('dx-keyboard-hover');
                }
            });

            announceToScreenReader(`Over ${dropZone.name} drop zone`);
        } else {
            dropZones.forEach(zone => {
                zone.element.classList.remove('dx-keyboard-hover');
            });
        }

        // Visual feedback - move element slightly
        keyboardDragState.element.style.transform =
            `translate(${dx}px, ${dy}px)`;
    };

    /**
     * Cycle to next drop zone with Tab key.
     */
    const cycleToNextDropZone = () => {
        if (!keyboardDragState.active || dropZones.length === 0) {
            return;
        }

        // Remove highlight from current zone
        if (keyboardDragState.dropZoneIndex >= 0) {
            dropZones[keyboardDragState.dropZoneIndex].element
                .classList.remove('dx-keyboard-hover');
        }

        // Move to next zone
        keyboardDragState.dropZoneIndex =
            (keyboardDragState.dropZoneIndex + 1) % dropZones.length;

        const zone = dropZones[keyboardDragState.dropZoneIndex];
        zone.element.classList.add('dx-keyboard-hover');

        announceToScreenReader(`Focused on ${zone.name} drop zone`);
    };

    /**
     * Drop element at current keyboard position.
     */
    const dropKeyboardDrag = () => {
        if (!keyboardDragState.active) {
            return;
        }

        const dropZone = findDropZoneAt(
            keyboardDragState.position.x,
            keyboardDragState.position.y,
            keyboardDragState.element.getAttribute('dx-draggable')
        );

        if (dropZone) {
            // Emit drop event
            emitDragEvent('dx:drop', dropZone.element, {
                element: keyboardDragState.element,
                dropZone: dropZone.element,
                type: keyboardDragState.element.getAttribute('dx-draggable'),
                data: {},
                x: keyboardDragState.position.x,
                y: keyboardDragState.position.y,
                keyboard: true
            });

            announceToScreenReader(
                `Dropped on ${dropZone.name}. Drag complete.`
            );
        } else {
            announceToScreenReader(
                'Cannot drop here. No valid drop zone.'
            );
        }

        cancelKeyboardDrag();
    };

    /**
     * Cancel keyboard drag.
     */
    const cancelKeyboardDrag = () => {
        if (!keyboardDragState.active) {
            return;
        }

        // Remove ARIA and classes
        keyboardDragState.element.setAttribute('aria-grabbed', 'false');
        keyboardDragState.element.classList.remove('dx-keyboard-dragging');
        keyboardDragState.element.style.transform = '';

        // Remove drop zone highlighting
        dropZones.forEach(zone => {
            zone.element.classList.remove('dx-keyboard-drop-zone');
            zone.element.classList.remove('dx-keyboard-hover');
        });

        announceToScreenReader('Drag cancelled');

        keyboardDragState = {
            active: false,
            element: null,
            position: {x: 0, y: 0},
            dropZoneIndex: -1
        };
    };

    // ============================================================================
    // PHASE 3: CANVAS GHOST IMAGES
    // ============================================================================

    /**
     * Canvas pool for ghost image reuse (memory efficiency).
     */
    const canvasPool = [];

    /**
     * Get or create canvas for ghost rendering.
     *
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {HTMLCanvasElement} Canvas element
     */
    const getCanvas = (width, height) => {
        // Try to reuse existing canvas from pool
        const canvas = canvasPool.pop() || document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        return canvas;
    };

    /**
     * Return canvas to pool for reuse.
     *
     * @param {HTMLCanvasElement} canvas - Canvas to return
     */
    const returnCanvas = (canvas) => {
        if (canvasPool.length < 5) { // Limit pool size
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvasPool.push(canvas);
        }
    };

    /**
     * Create canvas-based ghost image with custom rendering.
     *
     * @param {HTMLElement} element - Element being dragged
     * @param {Object} config - Drag configuration
     * @returns {Object} Ghost data {canvas, width, height}
     */
    const createCanvasGhost = (element, config) => {
        const rect = element.getBoundingClientRect();
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);

        // Get canvas from pool
        const canvas = getCanvas(width + 20, height + 20); // Extra space for shadow
        const ctx = canvas.getContext('2d');

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw element snapshot
        // For now, use a simple colored rectangle (full DOM-to-canvas is complex)
        const computedStyle = window.getComputedStyle(element);
        ctx.fillStyle = computedStyle.backgroundColor || '#4a5568';
        ctx.fillRect(10, 10, width, height);

        // Draw text content if available
        ctx.shadowColor = 'transparent'; // Disable shadow for text
        ctx.fillStyle = computedStyle.color || '#ffffff';
        ctx.font = computedStyle.font || '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = element.textContent.trim().substring(0, 20);
        ctx.fillText(text, 10 + width / 2, 10 + height / 2);

        // Draw badge if multi-selection
        if (config.multiCount && config.multiCount > 1) {
            const badgeSize = 24;
            const badgeX = width + 10 - badgeSize / 2;
            const badgeY = 10 - badgeSize / 2;

            // Badge circle
            ctx.fillStyle = '#e53e3e';
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Badge count
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.multiCount.toString(), badgeX, badgeY);
        }

        return {
            canvas,
            width: canvas.width,
            height: canvas.height
        };
    };

    /**
     * Create ghost image wrapper element.
     *
     * @param {Object} ghostData - Ghost canvas data
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {HTMLElement} Ghost wrapper element
     */
    const createGhostElement = (ghostData, x, y) => {
        const wrapper = document.createElement('div');
        wrapper.id = 'dx-ghost';
        wrapper.className = 'dx-ghost';

        // Position absolutely
        wrapper.style.position = 'fixed';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.zIndex = '9999';
        wrapper.style.left = `${x - ghostData.width / 2}px`;
        wrapper.style.top = `${y - ghostData.height / 2}px`;
        wrapper.style.opacity = '0.8';

        // Add canvas to wrapper
        wrapper.appendChild(ghostData.canvas);

        document.body.appendChild(wrapper);
        return wrapper;
    };

    /**
     * Update ghost element position.
     *
     * @param {HTMLElement} ghost - Ghost element
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    const updateGhostElementPosition = (ghost, x, y) => {
        if (ghost && ghost.firstChild) {
            const width = ghost.firstChild.width;
            const height = ghost.firstChild.height;
            ghost.style.left = `${x - width / 2}px`;
            ghost.style.top = `${y - height / 2}px`;
        }
    };

    /**
     * Cleanup ghost element and return canvas to pool.
     *
     * @param {HTMLElement} ghost - Ghost element
     */
    const cleanupGhostElement = (ghost) => {
        if (ghost && ghost.parentNode) {
            // Return canvas to pool
            const canvas = ghost.querySelector('canvas');
            if (canvas) {
                returnCanvas(canvas);
            }

            // Remove ghost element
            ghost.parentNode.removeChild(ghost);
        }
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Find draggable ancestor element.
     *
     * @param {HTMLElement} target - Event target
     * @returns {HTMLElement|null} Draggable element or null
     */
    const findDraggableAncestor = (target) => {
        let current = target;
        while (current && current !== document.body) {
            if (current.hasAttribute('dx-draggable') ||
                current.hasAttribute('dx-drag') ||
                Array.from(current.classList).some(cls => cls.startsWith('drag-'))) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    };

    /**
     * Create ghost image for drag (supports both canvas and DOM modes).
     *
     * @param {HTMLElement} element - Element being dragged
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} config - Drag configuration
     * @returns {HTMLElement} Ghost element
     */
    const createGhostImage = (element, x, y, config = {}) => {
        // Use canvas ghost if enabled (better performance)
        if (config.ghost !== false) {
            const ghostData = createCanvasGhost(element, config);
            return createGhostElement(ghostData, x, y);
        }

        // Fallback to DOM cloning
        const ghost = element.cloneNode(true);
        ghost.id = ghost.id ? `${ghost.id}-ghost` : 'dx-ghost';
        ghost.classList.add('dx-ghost');

        // Position absolutely
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.opacity = '0.5';
        ghost.style.zIndex = '9999';
        ghost.style.left = `${x}px`;
        ghost.style.top = `${y}px`;

        document.body.appendChild(ghost);
        return ghost;
    };

    /**
     * Update ghost position.
     *
     * @param {HTMLElement} ghost - Ghost element
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    const updateGhostPosition = (ghost, x, y) => {
        if (ghost) {
            // Check if it's a canvas ghost (has canvas child)
            if (ghost.querySelector('canvas')) {
                updateGhostElementPosition(ghost, x, y);
            } else {
                // DOM clone ghost
                ghost.style.left = `${x}px`;
                ghost.style.top = `${y}px`;
            }
        }
    };

    /**
     * Drop zones registry.
     */
    let dropZones = [];

    /**
     * Find drop zone at coordinates using spatial index.
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} type - Draggable type
     * @returns {Object|null} Drop zone or null
     */
    const findDropZoneAt = (x, y, type) => {
        // Use spatial index if available (O(log n))
        if (spatialIndex) {
            const candidates = queryQuadTreePoint(spatialIndex, x, y);
            const sorted = sortByPriority(candidates);

            for (const zone of sorted) {
                // Check if zone accepts this type
                if (zone.accepts.includes('*') || zone.accepts.includes(type)) {
                    return zone;
                }
            }
            return null;
        }

        // Fallback to linear search (O(n))
        for (const zone of dropZones) {
            const rect = zone.element.getBoundingClientRect();

            if (x >= rect.left && x <= rect.right &&
                y >= rect.top && y <= rect.bottom) {

                // Check if zone accepts this type
                if (zone.accepts.includes('*') || zone.accepts.includes(type)) {
                    return zone;
                }
            }
        }
        return null;
    };

    /**
     * Cleanup after drag operation.
     *
     * @param {Object} state - Drag state
     */
    const cleanup = (state) => {
        // Remove dragging class
        if (state.element) {
            state.element.classList.remove('dx-dragging');
        }

        // Remove ghost (with canvas cleanup if applicable)
        if (state.ghost) {
            if (state.ghost.querySelector('canvas')) {
                cleanupGhostElement(state.ghost);
            } else if (state.ghost.parentNode) {
                state.ghost.parentNode.removeChild(state.ghost);
            }
        }

        // Remove drop zone highlighting
        if (state.dropZone) {
            state.dropZone.element.classList.remove('dx-drag-over');
        }
    };

    /**
     * Animate element reverting to original position.
     *
     * @param {HTMLElement} element - Element
     * @param {HTMLElement} ghost - Ghost element
     * @param {Object} startPosition - Start position {x, y}
     */
    const animateRevert = (element, ghost, _startPosition) => {
        // Remove ghost immediately (with canvas cleanup if applicable)
        if (ghost) {
            if (ghost.querySelector('canvas')) {
                cleanupGhostElement(ghost);
            } else if (ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
        }

        // Remove dragging class
        if (element) {
            element.classList.remove('dx-dragging');
        }
    };

    /**
     * Emit custom drag event.
     *
     * @param {string} eventName - Event name
     * @param {HTMLElement} target - Target element
     * @param {Object} detail - Event detail
     */
    const emitDragEvent = (eventName, target, detail) => {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        target.dispatchEvent(event);
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Initialize dragX module.
     */
    const init = () => {
        // Register drop zones
        const dropZoneElements = document.querySelectorAll('[dx-drop-zone]');
        dropZones = Array.from(dropZoneElements)
            .map(el => {
                const zone = parseDropZone(el);
                if (zone) {
                    // Add bounding rect to zone for spatial indexing
                    const rect = el.getBoundingClientRect();
                    zone.rect = {
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height
                    };
                }
                return zone;
            })
            .filter(zone => zone !== null);

        // Build spatial index if we have drop zones
        if (dropZones.length > 0) {
            const viewport = {
                x: 0,
                y: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
            spatialIndex = buildQuadTree(dropZones, viewport);
            console.log('[dragX] Built spatial index with', dropZones.length, 'zones');
        }

        // Rebuild spatial index on window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (dropZones.length > 0) {
                    // Update zone rects
                    dropZones.forEach(zone => {
                        const rect = zone.element.getBoundingClientRect();
                        zone.rect = {
                            x: rect.left,
                            y: rect.top,
                            width: rect.width,
                            height: rect.height
                        };
                    });

                    // Rebuild spatial index
                    const viewport = {
                        x: 0,
                        y: 0,
                        width: window.innerWidth,
                        height: window.innerHeight
                    };
                    spatialIndex = buildQuadTree(dropZones, viewport);
                    console.log('[dragX] Rebuilt spatial index on resize');
                }
            }, 250); // Debounce resize events
        });

        // Attach global pointer event listeners
        document.addEventListener('pointerdown', (e) => {
            dragState = transitionState(dragState, 'start', normalizePointerEvent(e));
        });

        document.addEventListener('pointermove', throttle((e) => {
            if (isDragging(dragState)) {
                e.preventDefault();
                dragState = transitionState(dragState, 'move', normalizePointerEvent(e));
            }
        }));

        document.addEventListener('pointerup', (e) => {
            if (isDragging(dragState)) {
                dragState = transitionState(dragState, 'end', normalizePointerEvent(e));
            }
        });

        document.addEventListener('pointercancel', (e) => {
            if (isDragging(dragState)) {
                dragState = transitionState(dragState, 'cancel', normalizePointerEvent(e));
            }
        });

        // Keyboard support for drag operations
        document.addEventListener('keydown', (e) => {
            // Cancel pointer drag with Escape
            if (e.key === 'Escape' && isDragging(dragState)) {
                dragState = transitionState(dragState, 'cancel', {});
                return;
            }

            // Cancel keyboard drag with Escape
            if (e.key === 'Escape' && keyboardDragState.active) {
                e.preventDefault();
                cancelKeyboardDrag();
                return;
            }

            // Start keyboard drag with Space on focused draggable
            if (e.key === ' ' && document.activeElement) {
                const draggable = findDraggableAncestor(document.activeElement);
                if (draggable && !keyboardDragState.active) {
                    e.preventDefault();
                    startKeyboardDrag(draggable);
                    return;
                }
            }

            // Arrow key navigation during keyboard drag
            if (keyboardDragState.active) {
                const MOVE_DISTANCE = 10; // pixels per keypress

                switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    moveKeyboardDrag(0, -MOVE_DISTANCE);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    moveKeyboardDrag(0, MOVE_DISTANCE);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    moveKeyboardDrag(-MOVE_DISTANCE, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    moveKeyboardDrag(MOVE_DISTANCE, 0);
                    break;
                case 'Enter':
                    e.preventDefault();
                    dropKeyboardDrag();
                    break;
                case 'Tab':
                    e.preventDefault();
                    cycleToNextDropZone();
                    break;
                }
            }
        });

        // Initialize keyboard accessibility
        initKeyboardAccessibility();

        console.log('[dragX] Initialized with', dropZones.length, 'drop zones');
    };

    // Auto-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================================================
    // PHASE 5: PERFORMANCE MONITORING
    // ============================================================================

    /**
     * Performance metrics.
     */
    const performanceMetrics = {
        dragCount: 0,
        dropCount: 0,
        cancelCount: 0,
        avgEventProcessingTime: 0,
        maxEventProcessingTime: 0,
        spatialQueryCount: 0,
        avgSpatialQueryTime: 0,
        memoryUsage: {
            canvasPoolSize: 0,
            dropZoneCount: 0,
            activeGhosts: 0
        }
    };

    /**
     * Measure function execution time.
     *
     * @param {Function} fn - Function to measure
     * @param {string} label - Metric label
     * @returns {*} Function result
     */
    const _measurePerformance = (fn, label) => {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;

        // Update metrics
        if (label === 'eventProcessing') {
            const count = performanceMetrics.dragCount + performanceMetrics.dropCount;
            performanceMetrics.avgEventProcessingTime =
                (performanceMetrics.avgEventProcessingTime * count + duration) / (count + 1);
            performanceMetrics.maxEventProcessingTime =
                Math.max(performanceMetrics.maxEventProcessingTime, duration);
        } else if (label === 'spatialQuery') {
            performanceMetrics.spatialQueryCount++;
            performanceMetrics.avgSpatialQueryTime =
                (performanceMetrics.avgSpatialQueryTime * (performanceMetrics.spatialQueryCount - 1) + duration) /
                performanceMetrics.spatialQueryCount;
        }

        // Warn if performance target missed
        if (duration > 1 && label === 'spatialQuery') {
            console.warn(`[dragX] Spatial query took ${duration.toFixed(2)}ms (target: <1ms)`);
        }
        if (duration > 0.5 && label === 'eventProcessing') {
            console.warn(`[dragX] Event processing took ${duration.toFixed(2)}ms (target: <0.5ms)`);
        }

        return result;
    };

    /**
     * Get current performance metrics.
     *
     * @returns {Object} Performance metrics
     */
    const getPerformanceMetrics = () => {
        return Object.freeze({
            ...performanceMetrics,
            memoryUsage: {
                canvasPoolSize: canvasPool.length,
                dropZoneCount: dropZones.length,
                activeGhosts: document.querySelectorAll('.dx-ghost').length
            }
        });
    };

    /**
     * Reset performance metrics.
     */
    const resetPerformanceMetrics = () => {
        performanceMetrics.dragCount = 0;
        performanceMetrics.dropCount = 0;
        performanceMetrics.cancelCount = 0;
        performanceMetrics.avgEventProcessingTime = 0;
        performanceMetrics.maxEventProcessingTime = 0;
        performanceMetrics.spatialQueryCount = 0;
        performanceMetrics.avgSpatialQueryTime = 0;
    };

    /**
     * Memory leak detection - check for orphaned elements.
     */
    const detectMemoryLeaks = () => {
        const orphanedGhosts = document.querySelectorAll('.dx-ghost');
        if (orphanedGhosts.length > 0) {
            console.warn(`[dragX] Found ${orphanedGhosts.length} orphaned ghost elements`);
            orphanedGhosts.forEach(ghost => {
                cleanupGhostElement(ghost);
            });
        }

        if (canvasPool.length > 10) {
            console.warn(`[dragX] Canvas pool size exceeds limit: ${canvasPool.length}`);
            canvasPool.length = 5; // Trim pool
        }
    };

    /**
     * Run performance benchmark.
     *
     * @param {number} iterations - Number of iterations
     * @returns {Object} Benchmark results
     */
    const runPerformanceBenchmark = (iterations = 100) => {
        console.log(`[dragX] Running performance benchmark (${iterations} iterations)...`);

        const results = {
            spatialQueries: [],
            eventProcessing: [],
            canvasCreation: []
        };

        // Benchmark spatial queries
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            if (spatialIndex) {
                queryQuadTreePoint(spatialIndex, Math.random() * window.innerWidth, Math.random() * window.innerHeight);
            }
            results.spatialQueries.push(performance.now() - start);
        }

        // Benchmark canvas creation
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const canvas = getCanvas(100, 100);
            returnCanvas(canvas);
            results.canvasCreation.push(performance.now() - start);
        }

        // Calculate statistics
        const stats = (arr) => ({
            avg: arr.reduce((a, b) => a + b, 0) / arr.length,
            min: Math.min(...arr),
            max: Math.max(...arr),
            p95: arr.sort((a, b) => a - b)[Math.floor(arr.length * 0.95)]
        });

        const report = {
            spatialQueries: stats(results.spatialQueries),
            canvasCreation: stats(results.canvasCreation),
            memoryUsage: getPerformanceMetrics().memoryUsage
        };

        console.log('[dragX] Benchmark results:', report);
        return report;
    };

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    window.DragX = Object.freeze({
        version: '1.0.0',
        init,

        // State machine
        getState: () => dragState,
        isDragging: () => isDragging(dragState),

        // Parsers (exposed for testing)
        parseDraggable,
        parseDropZone,

        // Performance monitoring
        getPerformanceMetrics,
        resetPerformanceMetrics,
        detectMemoryLeaks,
        runPerformanceBenchmark,

        // Keyboard accessibility
        startKeyboardDrag,
        cancelKeyboardDrag,

        // For testing
        _internal: {
            DragPhase,
            createInitialState,
            transitionState,
            normalizePointerEvent,
            safeJSONParse,
            buildQuadTree,
            queryQuadTreePoint,
            createCanvasGhost
        }
    });

})();
