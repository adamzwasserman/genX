/**
 * dragX BDD steps.
 *
 * Fixtures are appended to the page body (so Givens can be combined in any
 * order) and DragX.init() is re-run after each one, as the readme says apps
 * should after dynamic changes. Drags use real page.mouse input with short
 * waits so dragX's throttled pointermove handler sees every position.
 * Every dx:* event is recorded in window.__dxEvents with element ids.
 */
const { Given, When, Then } = require('@cucumber/cucumber');
const { defineElement } = require('../support/element-fixtures');
const assert = require('assert');
const { expect } = require('@playwright/test');

// Geometry shared by the fixtures (viewport pixels).
const CARD = { left: 50, top: 50, size: 100 };
const CARD_CENTER = { x: 100, y: 100 };
const ZONE_CENTER = { x: 400, y: 400 };   // #dropzone: 300..500
const OUTSIDE = { x: 700, y: 120 };
const DOC_CSS = `
.dx-dragging { opacity: 0.7; cursor: grabbing; }
.dx-ghost { pointer-events: none; opacity: 0.8; }
.dx-drag-over { border: 2px dashed #4a90e2; background: rgba(74, 144, 226, 0.1); }
`;
const MOVE_WAIT_MS = 40;                   // > dragX's 16.67ms throttle

// ============================================================================
// HELPERS
// ============================================================================

async function loadDragX(world, config) {
    await world.page.goto('about:blank');
    await world.page.addScriptTag({ path: './src/genx-common.js' });
    await world.page.addScriptTag({ path: './src/dragx.js' });
    await world.page.waitForFunction(() => window.DragX !== undefined);
    // The app stylesheet from the readme's "CSS Classes" section.
    await world.page.addStyleTag({ content: DOC_CSS });
    await world.page.evaluate((cfg) => {
        const id = (el) => (el && el.id) || null;
        window.__dxEvents = [];
        ['dx:dragstart', 'dx:drop', 'dx:dragend'].forEach((name) => {
            window.addEventListener(name, (e) => {
                const d = e.detail || {};
                window.__dxEvents.push({
                    name,
                    target: id(e.target),
                    element: id(d.element),
                    dropZone: id(d.dropZone),
                    type: d.type,
                    data: d.data,
                    x: d.x,
                    y: d.y,
                    keyboard: !!d.keyboard,
                    success: d.success,
                    cancelled: d.cancelled
                });
            });
        });
        if (cfg) {
            window.DragX.init(cfg);
        }
    }, config || null);
}

async function mount(world, html) {
    await world.page.evaluate((h) => {
        document.body.insertAdjacentHTML('beforeend', h);
        window.DragX.init();
    }, html);
}

function cardHtml(attrs, inner = 'Drag me', id = 'draggable') {
    return `<div id="${id}" ${attrs} style="position:absolute;left:${CARD.left}px;top:${CARD.top}px;` +
        `width:${CARD.size}px;height:${CARD.size}px;background:#36c;color:#fff;">${inner}</div>`;
}

function zoneHtml(attrs, id = 'dropzone', box = 'left:300px;top:300px;width:200px;height:200px') {
    return `<div id="${id}" ${attrs} style="position:absolute;${box};background:#ddd;">Drop here</div>`;
}

async function mountCard(world, attrs) {
    await mount(world, cardHtml(attrs));
    world.element = world.page.locator('#draggable');
}

async function ensureCard(world, type = 'card') {
    const exists = await world.page.evaluate(() => !!document.getElementById('draggable'));
    if (!exists) {
        await mountCard(world, `dx-draggable="${type}"`);
    }
}

async function moveTo(world, p) {
    await world.page.mouse.move(p.x, p.y, { steps: 4 });
    await world.page.waitForTimeout(MOVE_WAIT_MS);
}

async function startDrag(world, from = CARD_CENTER) {
    await world.page.mouse.move(from.x, from.y);
    await world.page.waitForTimeout(MOVE_WAIT_MS);
    await world.page.mouse.down();
    await moveTo(world, { x: from.x + 20, y: from.y + 20 });
}

async function dragTo(world, target, from = CARD_CENTER) {
    await startDrag(world, from);
    await moveTo(world, target);
}

async function release(world) {
    await world.page.mouse.up();
    await world.page.waitForTimeout(MOVE_WAIT_MS);
}

async function dragState(world) {
    return world.page.evaluate(() => {
        const s = window.DragX.getState();
        return {
            phase: s.phase,
            element: s.element ? (s.element.id || 'anonymous') : null,
            zone: s.dropZone ? s.dropZone.name : null
        };
    });
}

async function events(world, name) {
    const all = await world.page.evaluate(() => window.__dxEvents);
    return name ? all.filter(e => e.name === name) : all;
}

async function lastEvent(world, name) {
    const list = await events(world, name);
    assert.ok(list.length > 0, `expected a ${name} event, got ${JSON.stringify(await events(world))}`);
    return list[list.length - 1];
}

async function hasClass(world, selector, cls) {
    return world.page.evaluate(([sel, c]) => {
        const el = document.querySelector(sel);
        if (!el) {
            throw new Error(`${sel} not found`);
        }
        return el.classList.contains(c);
    }, [selector, cls]);
}

async function rectOf(world, selector) {
    return world.page.evaluate((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
    }, selector);
}

async function liveText(world) {
    return world.page.evaluate(() => {
        const r = document.getElementById('dx-aria-live') ||
            document.querySelector('[aria-live]');
        return r ? r.textContent : null;
    });
}

// ============================================================================
// BACKGROUND
// ============================================================================

Given('the dragX module is loaded', async function() {
    await loadDragX(this);
});

Given('the dragX module is initialized with observe=true', async function() {
    await loadDragX(this, { observe: true });
});

// Note: "the DOM is ready" step is defined in common.steps.js

// ============================================================================
// FIXTURES
// ============================================================================

defineElement('an element with dx-draggable={string}', async function(type) {
    await mountCard(this, `dx-draggable="${type}"`);
});

defineElement('an element with dx-draggable={string} dx-axis={string}', async function(type, axis) {
    await mountCard(this, `dx-draggable="${type}" dx-axis="${axis}"`);
});

defineElement('an element with dx-draggable={string} dx-grid={string}', async function(type, grid) {
    await mountCard(this, `dx-draggable="${type}" dx-grid="${grid}"`);
});

defineElement('an element with dx-draggable={string} dx-data={string}', async function(type, data) {
    // A board zone with an app-style listener, as in the readme's dx:drop example.
    await mount(this, cardHtml(`dx-draggable="${type}" dx-data='${data}'`) + zoneHtml('dx-drop-zone="board"'));
    await this.page.evaluate(() => {
        document.getElementById('dropzone').addEventListener('dx:drop', (e) => {
            e.currentTarget.dataset.droppedId = String(e.detail.data.id);
        });
    });
    this.element = this.page.locator('#draggable');
});

Given('a draggable element', async function() {
    await mountCard(this, 'dx-draggable="card"');
});

Given('a draggable element with dx-revert={string}', async function(revert) {
    await mountCard(this, `dx-draggable="card" dx-revert="${revert}"`);
});

Given('a div with dx-drop-zone={string}', async function(zoneName) {
    await mount(this, zoneHtml(`dx-drop-zone="${zoneName}"`));
});

Given('a div with dx-drop-zone={string} dx-accepts={string}', async function(zoneName, accepts) {
    await mount(this, zoneHtml(`dx-drop-zone="${zoneName}" dx-accepts="${accepts}"`));
});

Given('a drop zone that accepts cards', async function() {
    await mount(this, zoneHtml('dx-drop-zone="board" dx-accepts="card"'));
});

Given('a drop zone', async function() {
    await mount(this, cardHtml('dx-draggable="card"') + zoneHtml('dx-drop-zone="board"'));
});

Given('a drop zone without dx-accepts', async function() {
    await mount(this, zoneHtml('dx-drop-zone="anything"'));
});

Given('a screen reader user', async function() {
    await mount(this, cardHtml('dx-draggable="card"') + zoneHtml('dx-drop-zone="board" dx-accepts="card"'));
    this.element = this.page.locator('#draggable');
});

Given('a card with dx-draggable={string} dx-handle={string}', async function(type, handle) {
    // One 20px-tall handle strip per class in the selector list, then a body area.
    const handles = handle.split(',').map(s => s.trim().replace(/^\./, ''));
    const strips = handles.map(cls =>
        `<div class="${cls}" style="height:20px;background:#024;">grip</div>`).join('');
    await mountCard(this, `dx-draggable="${type}" dx-handle="${handle}"`);
    await this.page.evaluate((html) => {
        const card = document.getElementById('draggable');
        card.innerHTML = html + '<div class="card-body">Card body</div>';
    }, strips);
    this.handleCount = handles.length;
});

Given('a .drag-handle element inside the card', async function() {
    const count = await this.page.locator('#draggable .drag-handle').count();
    assert.strictEqual(count, 1, 'the card should contain one .drag-handle');
});

Given('drop zones scattered across the page', async function() {
    const boxes = [
        ['zone-nw', 'left:20px;top:20px'], ['zone-ne', 'left:620px;top:20px'],
        ['zone-sw', 'left:20px;top:420px'], ['zone-se', 'left:620px;top:420px']
    ];
    await mount(this, boxes.map(([id, pos]) =>
        zoneHtml(`dx-drop-zone="${id}"`, id, `${pos};width:120px;height:120px`)).join(''));
});

Given('a drop zone {string}', async function(name) {
    await mount(this, zoneHtml(`dx-drop-zone="${name}"`, `${name}-zone`,
        'left:300px;top:300px;width:300px;height:300px'));
});

Given('a nested drop zone {string} inside {word}', async function(inner, outer) {
    await this.page.evaluate(([i, o]) => {
        document.getElementById(`${o}-zone`).insertAdjacentHTML('beforeend',
            `<div id="${i}-zone" dx-drop-zone="${i}" style="position:absolute;left:50px;top:50px;width:100px;height:100px;background:#bbb;">${i}</div>`);
        window.DragX.init();
    }, [inner, outer]);
});

Given('nested drop zones', async function() {
    await mount(this, cardHtml('dx-draggable="card"') + zoneHtml('dx-drop-zone="outer"', 'outer-zone',
        'left:300px;top:300px;width:300px;height:300px'));
    await this.page.evaluate(() => {
        const outer = document.getElementById('outer-zone');
        outer.insertAdjacentHTML('beforeend',
            '<div id="inner-zone" dx-drop-zone="inner" style="position:absolute;left:50px;top:50px;width:100px;height:100px;background:#bbb;">inner</div>');
        outer.addEventListener('dx:drop', (e) => {
            outer.dataset.handledDropOn = e.target.id; 
        });
        window.DragX.init();
    });
});

Given('inner zone rejects the dragged type', async function() {
    await this.page.evaluate(() => {
        document.getElementById('inner-zone').setAttribute('dx-accepts', 'image');
        window.DragX.init();
    });
});

Given('a focused draggable element', async function() {
    await mount(this, cardHtml('dx-draggable="card" dx-data=\'{"id":7}\'') +
        zoneHtml('dx-drop-zone="zone1" dx-accepts="card"', 'zone-1', 'left:300px;top:50px;width:150px;height:150px') +
        zoneHtml('dx-drop-zone="zone2" dx-accepts="card"', 'zone-2', 'left:300px;top:300px;width:150px;height:150px'));
    await this.page.focus('#draggable');
    this.element = this.page.locator('#draggable');
});

Given('an element in keyboard drag mode', async function() {
    await mount(this, cardHtml('dx-draggable="card" dx-data=\'{"id":7}\'') +
        zoneHtml('dx-drop-zone="zone1" dx-accepts="card"', 'zone-1', 'left:300px;top:50px;width:150px;height:150px') +
        zoneHtml('dx-drop-zone="zone2" dx-accepts="card"', 'zone-2', 'left:300px;top:300px;width:150px;height:150px'));
    this.element = this.page.locator('#draggable');
    this.startRect = await rectOf(this, '#draggable');
    await this.page.focus('#draggable');
    await this.page.keyboard.press('Space');
    assert.ok(await hasClass(this, '#draggable', 'dx-keyboard-dragging'), 'keyboard drag should be active');
});

Given('a draggable card being dragged via touch', async function() {
    await mountCard(this, 'dx-draggable="card"');
    const touch = async (type, x, y, onElement) => {
        await this.page.evaluate(([t, px, py, on]) => {
            const target = on ? document.getElementById('draggable') : document;
            target.dispatchEvent(new PointerEvent(t, {
                bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch',
                isPrimary: true, clientX: px, clientY: py
            }));
        }, [type, x, y, onElement]);
        await this.page.waitForTimeout(MOVE_WAIT_MS);
    };
    await touch('pointerdown', CARD_CENTER.x, CARD_CENTER.y, true);
    await touch('pointermove', CARD_CENTER.x + 20, CARD_CENTER.y + 20, false);
    await touch('pointermove', ZONE_CENTER.x, ZONE_CENTER.y, false);
    assert.strictEqual((await dragState(this)).phase, 'dragging');
    this.touch = touch;
});

Given('an event listener that calls preventDefault\\(\\)', async function() {
    await this.page.evaluate(() => {
        window.__dragstartPrevented = 0;
        document.addEventListener('dx:dragstart', (e) => {
            e.preventDefault();
            window.__dragstartPrevented++;
        });
    });
});

defineElement('an element with dx-draggable=""', async function() {
    this.consoleMessages = [];
    await mountCard(this, 'dx-draggable=""');
});

// ============================================================================
// POINTER ACTIONS
// ============================================================================

When('the user starts dragging the element', async function() {
    await startDrag(this);
});

When('drag starts', async function() {
    await startDrag(this);
});

When('drag begins', async function() {
    await startDrag(this);
});

When('drag ends', async function() {
    await release(this);
});

When('drag completes', async function() {
    await startDrag(this);
    await release(this);
});

When('the user drags the card over the board', async function() {
    await dragTo(this, ZONE_CENTER);
});

When('the user drags the card to the board', async function() {
    await dragTo(this, ZONE_CENTER);
});

When('the user drags the image to the board', async function() {
    await dragTo(this, ZONE_CENTER);
});

When('the user releases the card', async function() {
    await release(this);
});

When('a card is dragged over it', async function() {
    await ensureCard(this);
    await dragTo(this, ZONE_CENTER);
});

When('the card leaves the drop zone', async function() {
    await moveTo(this, OUTSIDE);
});

When('the element is dropped', async function() {
    await dragTo(this, ZONE_CENTER);
    await release(this);
});

When('an element is dropped', async function() {
    await dragTo(this, ZONE_CENTER);
    await release(this);
});

When('dropped successfully', async function() {
    await moveTo(this, ZONE_CENTER);
    await release(this);
});

When('dropped on a zone that rejects it', async function() {
    await mount(this, zoneHtml('dx-drop-zone="photos" dx-accepts="image"'));
    await dragTo(this, ZONE_CENTER);
    await release(this);
});

When('an item is dragged over inner', async function() {
    await ensureCard(this, 'item');
    await dragTo(this, ZONE_CENTER);   // inner-zone spans 350..450
});

When('dropped on inner', async function() {
    await dragTo(this, ZONE_CENTER);
    await release(this);
});

When('the user drags the element', async function() {
    // Up-right diagonal so axis and grid constraints have something to remove.
    await this.page.mouse.move(CARD_CENTER.x, CARD_CENTER.y);
    await this.page.mouse.down();
    await moveTo(this, { x: CARD_CENTER.x + 20, y: CARD_CENTER.y + 20 });
    await moveTo(this, { x: 237, y: 223 });
});

When('the user drags the handle', async function() {
    await startDrag(this, { x: CARD_CENTER.x, y: CARD.top + 10 });
});

When('the user drags from another area of the card', async function() {
    await release(this);
    this.dragstartsBefore = (await events(this, 'dx:dragstart')).length;
    const body = await rectOf(this, '#draggable .card-body');
    await startDrag(this, { x: body.left + body.width / 2, y: body.top + body.height / 2 });
});

When('the user drags either handle', async function() {
    for (let i = 0; i < this.handleCount; i++) {
        await startDrag(this, { x: CARD_CENTER.x, y: CARD.top + 10 + i * 20 });
        this.lastHandleState = await dragState(this);
        assert.strictEqual(this.lastHandleState.phase, 'dragging', `handle ${i + 1} should start a drag`);
        await release(this);
        // The free-form drop moves the card; put it back for the next handle.
        await this.page.evaluate(() => {
            document.getElementById('draggable').style.transform = ''; 
        });
    }
});

When('the user releases their finger over the drop zone', async function() {
    await this.touch('pointerup', ZONE_CENTER.x, ZONE_CENTER.y, false);
});

When('the element is removed from DOM', async function() {
    await this.page.evaluate(() => {
        window.__removedDraggable = document.getElementById('draggable');
        window.__removedDraggable.remove();
    });
});

When('a new element with dx-draggable={string} is added', async function(type) {
    await this.page.evaluate((t) => {
        document.body.insertAdjacentHTML('beforeend',
            `<div id="draggable" dx-draggable="${t}" style="position:absolute;left:50px;top:50px;width:100px;height:100px;">New</div>`);
    }, type);
});

// ============================================================================
// KEYBOARD AND INIT ACTIONS
// ============================================================================

When('the user tabs to the element', async function() {
    await this.page.keyboard.press('Tab');
});

When('the user presses Space', async function() {
    await this.page.keyboard.press('Space');
});

When('in dragX, the user presses Tab', async function() {
    await this.page.keyboard.press('Tab');
});

When('the user presses Enter', async function() {
    await this.page.keyboard.press('Enter');
});

// Shared with tablex.feature.
When('the user presses Escape', async function() {
    await this.page.keyboard.press('Escape');
});

When('the module initializes', async function() {
    await this.page.evaluate(() => window.DragX.init());
});

When('the dragX module initializes', async function() {
    await this.page.evaluate(() => window.DragX.init());
});

// ============================================================================
// ASSERTIONS: POINTER DRAG
// ============================================================================

Then('the element should have visual drag feedback', async function() {
    assert.ok(await hasClass(this, '#draggable', 'dx-dragging'), 'element should have dx-dragging');
    assert.strictEqual((await dragState(this)).phase, 'dragging');
    const ghosts = await this.page.locator('.dx-ghost').count();
    assert.strictEqual(ghosts, 1, 'a ghost should follow the pointer');
});

Then('the cursor should change to indicate dragging', async function() {
    // dragX adds .dx-dragging; the readme's stylesheet gives it cursor: grabbing.
    const cursor = await this.page.evaluate(() => {
        const el = document.elementFromPoint(120, 120);
        return el && getComputedStyle(el).cursor;
    });
    assert.strictEqual(cursor, 'grabbing');
});

Then('the drop zone should highlight', async function() {
    assert.ok(await hasClass(this, '#dropzone', 'dx-drag-over'), 'zone should have dx-drag-over');
});

Then('a drop indicator should be visible', async function() {
    const s = await dragState(this);
    assert.strictEqual(s.phase, 'hovering');
    assert.strictEqual(s.zone, 'board');
    await expect(this.page.locator('#dropzone.dx-drag-over')).toBeVisible();
});

Then('in dragX, a {string} event should be emitted', async function(eventName) {
    await lastEvent(this, eventName);
});

Then('the card should be moved to the board', async function() {
    // The readme leaves the DOM move to the app; dragX reports which card went where.
    const drop = await lastEvent(this, 'dx:drop');
    assert.strictEqual(drop.element, 'draggable');
    assert.strictEqual(drop.dropZone, 'dropzone');
    assert.strictEqual(drop.type, 'card');
    const end = await lastEvent(this, 'dx:dragend');
    assert.strictEqual(end.success, true);
});

Then('the drop should be allowed', async function() {
    const s = await dragState(this);
    assert.strictEqual(s.phase, 'hovering');
    assert.strictEqual(s.zone, 'board');
    assert.ok(await hasClass(this, '#dropzone', 'dx-drag-over'));
});

Then('the drop should be rejected', async function() {
    const s = await dragState(this);
    assert.strictEqual(s.phase, 'dragging', 'no zone should be targeted');
    assert.strictEqual(s.zone, null);
    await release(this);
    assert.strictEqual((await events(this, 'dx:drop')).length, 0, 'no dx:drop for a rejected type');
});

Then('the drop zone should not highlight', async function() {
    assert.ok(!(await hasClass(this, '#dropzone', 'dx-drag-over')), 'zone should not have dx-drag-over');
});

Then('the drop zone should have class {string}', async function(className) {
    assert.ok(await hasClass(this, '#dropzone', className), `zone should have ${className}`);
});

Then('the drop zone class should be removed', async function() {
    assert.ok(!(await hasClass(this, '#dropzone', 'dx-drag-over')));
    assert.strictEqual((await dragState(this)).zone, null);
});

Then('the drop should complete successfully', async function() {
    const drop = await lastEvent(this, 'dx:drop');
    assert.strictEqual(drop.dropZone, 'dropzone');
    assert.strictEqual(drop.element, 'draggable');
    assert.strictEqual((await dragState(this)).phase, 'idle');
});

Then('a ghost image should appear', async function() {
    await expect(this.page.locator('.dx-ghost')).toHaveCount(1);
});

Then('it should follow the cursor', async function() {
    const before = await rectOf(this, '.dx-ghost');
    await moveTo(this, { x: CARD_CENTER.x + 60, y: CARD_CENTER.y + 50 });
    const after = await rectOf(this, '.dx-ghost');
    assert.ok(Math.abs((after.left - before.left) - 40) <= 1, `ghost x moved ${after.left - before.left}, want 40`);
    assert.ok(Math.abs((after.top - before.top) - 30) <= 1, `ghost y moved ${after.top - before.top}, want 30`);
});

Then('it should have reduced opacity', async function() {
    const opacity = await this.page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('.dx-ghost')).opacity));
    assert.ok(opacity > 0 && opacity < 1, `ghost opacity ${opacity} should be between 0 and 1`);
});

Then('the dragging class should be removed', async function() {
    assert.ok(!(await hasClass(this, '#draggable', 'dx-dragging')));
    assert.strictEqual((await dragState(this)).phase, 'idle');
    await expect(this.page.locator('.dx-ghost')).toHaveCount(0);
});

Then('the entire card should drag', async function() {
    const s = await dragState(this);
    assert.strictEqual(s.phase, 'dragging');
    assert.strictEqual(s.element, 'draggable', 'the card, not the handle, is the dragged element');
    assert.ok(await hasClass(this, '#draggable', 'dx-dragging'));
});

Then('no drag should occur', async function() {
    assert.strictEqual((await dragState(this)).phase, 'idle');
    assert.ok(!(await hasClass(this, '#draggable', 'dx-dragging')));
    assert.strictEqual((await events(this, 'dx:dragstart')).length, this.dragstartsBefore);
    await expect(this.page.locator('.dx-ghost')).toHaveCount(0);
});

Then('the card should drag', async function() {
    const starts = await events(this, 'dx:dragstart');
    assert.strictEqual(starts.length, this.handleCount, 'each handle should start one drag');
    assert.ok(starts.every(e => e.element === 'draggable'));
});

Then('it should only move horizontally', async function() {
    const ghost = await rectOf(this, '.dx-ghost');
    assert.strictEqual(Math.round(ghost.left), 237, 'ghost follows the pointer horizontally');
    assert.strictEqual(Math.round(ghost.top), CARD_CENTER.y, 'ghost stays on the starting row');
});

Then('vertical movement should be ignored', async function() {
    await release(this);
    const transform = await this.page.evaluate(() => document.getElementById('draggable').style.transform);
    assert.strictEqual(transform, 'translate(137px, 0px)');
});

Then('it should snap to {int}px grid increments', async function(grid) {
    const ghost = await rectOf(this, '.dx-ghost');
    const dx = Math.round(ghost.left) - CARD_CENTER.x;
    const dy = Math.round(ghost.top) - CARD_CENTER.y;
    assert.strictEqual(dx % grid, 0, `ghost x offset ${dx} should be a multiple of ${grid}`);
    assert.strictEqual(dy % grid, 0, `ghost y offset ${dy} should be a multiple of ${grid}`);
    assert.deepStrictEqual([dx, dy], [140, 120]);   // pointer moved 137, 123
    await release(this);
    const transform = await this.page.evaluate(() => document.getElementById('draggable').style.transform);
    assert.strictEqual(transform, 'translate(140px, 120px)');
});

Then('the drop event should contain the data', async function() {
    const drop = await lastEvent(this, 'dx:drop');
    assert.deepStrictEqual(drop.data, { id: 123 });
});

Then('the data should be accessible as event.detail.data', async function() {
    const seen = await this.page.evaluate(() => document.getElementById('dropzone').dataset.droppedId);
    assert.strictEqual(seen, '123');
});

Then('the element should snap back to origin', async function() {
    const r = await rectOf(this, '#draggable');
    assert.deepStrictEqual([r.left, r.top], [CARD.left, CARD.top]);
    const transform = await this.page.evaluate(() => document.getElementById('draggable').style.transform);
    assert.ok(transform === '' || transform === 'none', `unexpected transform ${transform}`);
    assert.strictEqual((await events(this, 'dx:drop')).length, 0);
    const end = await lastEvent(this, 'dx:dragend');
    assert.strictEqual(end.success, false);
});

// ============================================================================
// ASSERTIONS: EVENTS
// ============================================================================

Then('event.detail should contain element info', async function() {
    const start = await lastEvent(this, 'dx:dragstart');
    assert.strictEqual(start.element, 'draggable');
    assert.strictEqual(start.type, 'card');
    assert.strictEqual(typeof start.x, 'number');
    assert.strictEqual(typeof start.y, 'number');
});

Then('event.detail should contain dragged element', async function() {
    assert.strictEqual((await lastEvent(this, 'dx:drop')).element, 'draggable');
});

Then('event.detail should contain drop zone', async function() {
    assert.strictEqual((await lastEvent(this, 'dx:drop')).dropZone, 'dropzone');
});

Then('event.detail should contain drag coordinates', async function() {
    const drop = await lastEvent(this, 'dx:drop');
    assert.deepStrictEqual([drop.x, drop.y], [ZONE_CENTER.x, ZONE_CENTER.y]);
});

Then('the drag should be cancelled', async function() {
    assert.ok(await this.page.evaluate(() => window.__dragstartPrevented) >= 1, 'listener should run');
    await moveTo(this, ZONE_CENTER);
    assert.strictEqual((await dragState(this)).phase, 'idle');
    assert.ok(!(await hasClass(this, '#draggable', 'dx-dragging')));
    await expect(this.page.locator('.dx-ghost')).toHaveCount(0);
    expect(await this.element.getAttribute('aria-grabbed')).toBe('false');
});

// ============================================================================
// ASSERTIONS: KEYBOARD AND ACCESSIBILITY
// ============================================================================

Then('the element should receive keyboard focus', async function() {
    expect(await this.page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('draggable');
});

Then('a focus indicator should be visible', async function() {
    expect(await this.page.evaluate(() => document.getElementById('draggable').matches(':focus-visible'))).toBe(true);
});

Then('drag mode should activate', async function() {
    assert.ok(await hasClass(this, '#draggable', 'dx-keyboard-dragging'));
    expect(await this.element.getAttribute('aria-grabbed')).toBe('true');
});

Then('available drop zones should highlight', async function() {
    assert.ok(await hasClass(this, '#zone-1', 'dx-keyboard-drop-zone'));
    assert.ok(await hasClass(this, '#zone-2', 'dx-keyboard-drop-zone'));
});

Then('focus should move to the next drop zone', async function() {
    assert.ok(await hasClass(this, '#zone-1', 'dx-keyboard-hover'), 'Tab should target the first zone');
    assert.ok(!(await hasClass(this, '#zone-2', 'dx-keyboard-hover')));
    expect(await liveText(this)).toContain('zone1');
});

Then('the drop should complete', async function() {
    const drop = await lastEvent(this, 'dx:drop');
    assert.strictEqual(drop.keyboard, true);
    assert.strictEqual(drop.dropZone, 'zone-1');
    assert.deepStrictEqual(drop.data, { id: 7 });
    assert.ok(!(await hasClass(this, '#draggable', 'dx-keyboard-dragging')));
    expect(await this.element.getAttribute('aria-grabbed')).toBe('false');
    expect(await liveText(this)).toContain('Dropped');
});

Then('drag mode should cancel', async function() {
    assert.ok(!(await hasClass(this, '#draggable', 'dx-keyboard-dragging')));
    assert.ok(!(await hasClass(this, '#zone-1', 'dx-keyboard-drop-zone')));
    expect(await this.element.getAttribute('aria-grabbed')).toBe('false');
    expect(await liveText(this)).toContain('cancelled');
    assert.strictEqual((await events(this, 'dx:drop')).length, 0);
});

Then('the element should return to original position', async function() {
    const r = await rectOf(this, '#draggable');
    assert.deepStrictEqual([r.left, r.top], [this.startRect.left, this.startRect.top]);
    const transform = await this.page.evaluate(() => document.getElementById('draggable').style.transform);
    assert.ok(transform === '' || transform === 'none', `unexpected transform ${transform}`);
});

Then('the element should have aria-grabbed={string}', async function(value) {
    expect(await this.element.getAttribute('aria-grabbed')).toBe(value);
});

Then('aria-grabbed should change to {string}', async function(value) {
    expect(await this.element.getAttribute('aria-grabbed')).toBe(value);
});

Then('an announcement should be made: {string}', async function(text) {
    await expect.poll(() => liveText(this)).toContain(text);
});

Then('aria-describedby should reference instructions', async function() {
    const ok = await this.page.evaluate(() => {
        const id = document.getElementById('draggable').getAttribute('aria-describedby');
        return !!id && !!document.getElementById(id);
    });
    assert.ok(ok, 'aria-describedby should point at an element in the page');
});

Then('instructions should explain keyboard controls', async function() {
    const text = await this.page.evaluate(() => {
        const id = document.getElementById('draggable').getAttribute('aria-describedby');
        return document.getElementById(id).textContent;
    });
    for (const key of ['Space', 'arrow', 'Enter', 'Escape']) {
        assert.ok(text.includes(key), `instructions should mention ${key}: "${text}"`);
    }
});

// ============================================================================
// ASSERTIONS: SPATIAL INDEX, OBSERVER, CLEANUP, ERRORS, NESTING
// ============================================================================

Then('a quad-tree index should be built', async function() {
    const metrics = await this.page.evaluate(() => window.DragX.getPerformanceMetrics());
    assert.strictEqual(metrics.memoryUsage.dropZoneCount, 4);
});

Then('zones should be partitioned by location', async function() {
    const result = await this.page.evaluate(() => {
        const { buildQuadTree, queryQuadTreePoint } = window.DragX._internal;
        const zones = [...document.querySelectorAll('[dx-drop-zone]')].map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.id, rect: { x: r.left, y: r.top, width: r.width, height: r.height } };
        });
        const tree = buildQuadTree(zones, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
        const at = (x, y) => queryQuadTreePoint(tree, x, y).map(z => z.id);
        return {
            nw: at(80, 80), ne: at(680, 80), sw: at(80, 480), se: at(680, 480), gap: at(400, 300)
        };
    });
    assert.deepStrictEqual(result, { nw: ['zone-nw'], ne: ['zone-ne'], sw: ['zone-sw'], se: ['zone-se'], gap: [] });
});

Then('the element should become draggable automatically', async function() {
    await this.page.waitForFunction(() => {
        const el = document.getElementById('draggable');
        return el && el.getAttribute('tabindex') === '0' && el.getAttribute('role') === 'button' &&
            el.getAttribute('aria-grabbed') === 'false';
    });
    await startDrag(this);
    assert.ok(await hasClass(this, '#draggable', 'dx-dragging'), 'observed element should drag');
});

Then('event listeners should be cleaned up', async function() {
    const session = await this.page.context().newCDPSession(this.page);
    const { result } = await session.send('Runtime.evaluate', { expression: 'window.__removedDraggable' });
    const { listeners } = await session.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    await session.detach();
    assert.deepStrictEqual(listeners.map(l => l.type), [], 'removed element should hold no listeners');
});

Then('dragX memory should be released', async function() {
    const s = await dragState(this);
    assert.strictEqual(s.element, null);
    assert.strictEqual(s.phase, 'idle');
    const metrics = await this.page.evaluate(() => window.DragX.getPerformanceMetrics());
    assert.strictEqual(metrics.memoryUsage.activeGhosts, 0);
    await expect(this.page.locator('.dx-ghost')).toHaveCount(0);
});

Then('a dragX validation error should be logged', async function() {
    const errors = this.consoleMessages.filter(m => m.type === 'error' && m.text.includes('[dragX] Invalid dx-draggable'));
    assert.ok(errors.length >= 1, `expected a dragX validation error, got ${JSON.stringify(this.consoleMessages)}`);
});

Then('the element should not become draggable', async function() {
    expect(await this.element.getAttribute('tabindex')).toBeNull();
    expect(await this.element.getAttribute('role')).toBeNull();
    await startDrag(this);
    assert.strictEqual((await dragState(this)).phase, 'idle');
    assert.strictEqual((await events(this, 'dx:dragstart')).length, 0);
});

Then('it should accept all types by default', async function() {
    const accepts = await this.page.evaluate(() =>
        window.DragX.parseDropZone(document.getElementById('dropzone')).accepts);
    assert.deepStrictEqual(accepts, ['*']);
    await mountCard(this, 'dx-draggable="photo"');
    await dragTo(this, ZONE_CENTER);
    assert.ok(await hasClass(this, '#dropzone', 'dx-drag-over'), 'any type should be accepted');
});

Then('only inner should highlight', async function() {
    assert.ok(await hasClass(this, '#inner-zone', 'dx-drag-over'));
    assert.strictEqual((await dragState(this)).zone, 'inner');
});

Then('outer should not respond', async function() {
    assert.ok(!(await hasClass(this, '#outer-zone', 'dx-drag-over')));
    await release(this);
    const drop = await lastEvent(this, 'dx:drop');
    assert.strictEqual(drop.dropZone, 'inner-zone');
});

Then('the drop should bubble to outer zone', async function() {
    const drop = await lastEvent(this, 'dx:drop');
    assert.strictEqual(drop.dropZone, 'outer-zone');
});

Then('outer should handle the drop', async function() {
    const handled = await this.page.evaluate(() => document.getElementById('outer-zone').dataset.handledDropOn);
    assert.strictEqual(handled, 'outer-zone');
});
