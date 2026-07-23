/**
 * Unit tests for src/cloak.js — the pure core of the FOUC cloak primitive.
 *
 * These cover the pure function points (no timing, no live DOM lifecycle):
 *   - resolveCloakConfig: boundary resolution incl. explicit absence (Honest Code Rule 14)
 *   - buildCloakCss:      the persistent cloak rule (visibility, not display)
 *   - cloakSelector:      which elements count as still-cloaked
 *   - collectCloakable:   pure extraction of cloakable elements from inserted nodes
 *
 * DOM/timing/lifecycle behaviour lives in tests/features/genx-cloak.feature (Playwright).
 */

const cloak = require('../../src/cloak.js');

const DEFAULT_MARKERS = [{ mark: 'fx-format', done: 'fx-raw' }];

describe('resolveCloakConfig — config gate and explicit-absence defaulting', () => {
    // FP: absent config -> disabled
    test('undefined genxConfig resolves to disabled', () => {
        const r = cloak.resolveCloakConfig(undefined);
        expect(r.enabled).toBe(false);
    });

    // FP: cloak:false -> disabled (default posture preserved)
    test('cloak:false resolves to disabled', () => {
        const r = cloak.resolveCloakConfig({ cloak: false });
        expect(r.enabled).toBe(false);
    });

    // FP: cloak:true -> enabled with the sensible default timeout
    test('cloak:true with no cloakTimeoutMs resolves to enabled at the 400ms default', () => {
        const r = cloak.resolveCloakConfig({ cloak: true });
        expect(r.enabled).toBe(true);
        expect(r.timeoutMs).toBe(400);
    });

    // FP: explicit timeout is honoured (the named-present case that pairs with the absent case)
    test('cloak:true with cloakTimeoutMs uses the caller value, not the default', () => {
        const r = cloak.resolveCloakConfig({ cloak: true, cloakTimeoutMs: 250 });
        expect(r.timeoutMs).toBe(250);
    });

    // FP: default marker wiring is fx-format -> fx-raw
    test('resolves the fx-format/fx-raw marker pair by default', () => {
        const r = cloak.resolveCloakConfig({ cloak: true });
        expect(r.markers).toEqual(DEFAULT_MARKERS);
    });
});

describe('buildCloakCss — the persistent cloak rule', () => {
    // FP: rule keys on the fx-raw done-marker and the generic failsafe escape
    test('hides fx-format elements that lack fx-raw and lack the failsafe escape', () => {
        const css = cloak.buildCloakCss(DEFAULT_MARKERS);
        expect(css).toContain('[fx-format]:not([fx-raw]):not([genx-uncloak])');
    });

    // FP: uses visibility:hidden so layout is reserved (no reflow on reveal)
    test('uses visibility:hidden, never display:none', () => {
        const css = cloak.buildCloakCss(DEFAULT_MARKERS).replace(/\s+/g, '');
        expect(css).toContain('visibility:hidden');
        expect(css).not.toContain('display:none');
    });

    // FP: generalises to multiple markers (one selector clause per module marker)
    test('emits one selector clause per marker for a multi-module config', () => {
        const css = cloak.buildCloakCss([
            { mark: 'fx-format', done: 'fx-raw' },
            { mark: 'bx-bind', done: 'bx-ready' },
        ]);
        expect(css).toContain('[fx-format]:not([fx-raw]):not([genx-uncloak])');
        expect(css).toContain('[bx-bind]:not([bx-ready]):not([genx-uncloak])');
    });
});

describe('cloakSelector — the still-cloaked predicate', () => {
    // FP: selector matches exactly the elements the rule hides
    test('matches fx-format without fx-raw and without the failsafe escape', () => {
        expect(cloak.cloakSelector(DEFAULT_MARKERS))
            .toBe('[fx-format]:not([fx-raw]):not([genx-uncloak])');
    });
});

describe('collectCloakable — pure extraction from inserted nodes', () => {
    // FP: a directly-inserted cloakable element is collected
    test('collects a top-level fx-format element that is not yet done', () => {
        const el = document.createElement('span');
        el.setAttribute('fx-format', 'currency');
        el.textContent = '871580000000';
        const out = cloak.collectCloakable([el], cloak.cloakSelector(DEFAULT_MARKERS));
        expect(out).toEqual([el]);
    });

    // FP: cloakable descendants of an inserted subtree are collected (HTMX swap shape)
    test('collects cloakable descendants inside an inserted subtree', () => {
        const wrap = document.createElement('div');
        wrap.innerHTML = '<span fx-format="percent">14.3</span><span>plain</span>';
        const target = wrap.querySelector('[fx-format]');
        const out = cloak.collectCloakable([wrap], cloak.cloakSelector(DEFAULT_MARKERS));
        expect(out).toEqual([target]);
    });

    // FP: already-done and non-genX nodes are never collected (scope guard)
    test('ignores already-formatted elements, plain elements, and text nodes', () => {
        const done = document.createElement('span');
        done.setAttribute('fx-format', 'currency');
        done.setAttribute('fx-raw', '871580000000');
        const plain = document.createElement('span');
        plain.textContent = 'not genX';
        const textNode = document.createTextNode('871580000000');
        const out = cloak.collectCloakable([done, plain, textNode], cloak.cloakSelector(DEFAULT_MARKERS));
        expect(out).toEqual([]);
    });
});
