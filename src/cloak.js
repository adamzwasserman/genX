/**
 * genX Cloak — opt-in FOUC (format-on-load flash) remover.
 * @version 1.0.0
 *
 * genX serves raw values and formats them on the client, so there is a one-to-two
 * frame window where the raw value ("871580000000") paints before genX rewrites it
 * ("$871.58B"). This module hides genX-marked elements until genX has processed them,
 * so the raw value never flashes — while guaranteeing the cloak can never outlive genX.
 *
 * It is a GENERAL continuous-reconciliation primitive: it watches the DOM for any genX
 * marker appearing (initial parse AND later HTMX/dynamic swaps, uniformly) and reveals
 * each element the instant its module stamps its done-marker. Shipped wired to
 * fx-format -> fx-raw; other modules plug in by declaring their own {mark, done} pair.
 *
 * Fail-open is the whole point: this file loads SYNCHRONOUSLY, before the deferred
 * bootloader, and its watchdog survives the bootloader never running. If genX does not
 * finish, elements reveal their (correct) raw value rather than staying blank.
 *
 * Principles applied:
 * - Configuration as Parameters: config resolved once at the boundary (init).
 * - No Implicit Defaults (Rule 14): absence of cloakTimeoutMs is a named case resolved
 *   explicitly in resolveCloakConfig, exercised by a test — not an `=` default.
 * - Pure Functions: resolve/build/select/collect are input-in, output-out.
 * - I/O at the Boundary: DOM mutation and timers live only in the lifecycle functions.
 * - Declarative reveal: an element reveals itself via CSS the instant it gains fx-raw;
 *   no per-element JavaScript on the happy path.
 */
(function () {
    'use strict';

    // --- Constants ---

    // 1500ms sits comfortably above the observed live format-pass time (247-512ms on
    // the CDN), so the failsafe is a genuine last resort rather than a routine racer
    // against formatting. genx:error still lifts the cloak immediately on a real failure.
    const DEFAULT_TIMEOUT_MS = 1500;
    const DEFAULT_MARKERS = [{ mark: 'fx-format', done: 'fx-raw' }];
    // Generic failsafe escape: force-revealed elements gain this attribute. It is module
    // -agnostic on purpose — the watchdog cannot synthesise a valid per-module done value,
    // so it reveals via a neutral marker that genX still ignores when it later processes.
    const UNCLOAK_ATTR = 'genx-uncloak';

    // --- Pure Functions ---

    /** Resolve genxConfig into an explicit cloak plan. Absence is a named case here. */
    const resolveCloakConfig = (genxConfig) => {
        const cfg = genxConfig || {};
        const timeoutMs = cfg.cloakTimeoutMs === undefined ? DEFAULT_TIMEOUT_MS : cfg.cloakTimeoutMs;
        return {
            enabled: cfg.cloak === true,
            timeoutMs,
            markers: cfg.cloakMarkers || DEFAULT_MARKERS
        };
    };

    /** One selector clause per marker: hidden while not-done and not force-revealed. */
    const markerClause = (m) => `[${m.mark}]:not([${m.done}]):not([${UNCLOAK_ATTR}])`;

    /** Selector matching every element that is still cloaked. Pure. */
    const cloakSelector = (markers) => markers.map(markerClause).join(',');

    /** The persistent cloak stylesheet text. visibility (not display) reserves layout. */
    const buildCloakCss = (markers) => `${cloakSelector(markers)}{visibility:hidden}`;

    /** Extract still-cloaked elements from a set of inserted nodes. Pure over the DOM. */
    const collectCloakable = (nodes, selector) => {
        const out = [];
        const seen = new Set();
        const add = (el) => { if (!seen.has(el)) { seen.add(el); out.push(el); } };
        for (const node of nodes) {
            if (!node || node.nodeType !== 1) continue;
            if (node.matches && node.matches(selector)) add(node);
            if (node.querySelectorAll) node.querySelectorAll(selector).forEach(add);
        }
        return out;
    };

    // --- I/O at the Boundary (DOM + timers) ---

    /** Inject the persistent cloak stylesheet synchronously. Returns the style element. */
    const installCloakStyle = (doc, css) => {
        const style = doc.createElement('style');
        style.setAttribute('data-genx-cloak', '');
        style.textContent = css;
        (doc.head || doc.documentElement).appendChild(style);
        return style;
    };

    /** Force-reveal one element (idempotent): show its raw value despite not being done. */
    const revealElement = (el) => {
        if (el && el.setAttribute) el.setAttribute(UNCLOAK_ATTR, '');
    };

    /** Force-reveal every element that is currently still cloaked. */
    const revealAll = (doc, selector) => {
        doc.querySelectorAll(selector).forEach(revealElement);
    };

    // --- Lifecycle (the single boundary that wires pure logic to DOM + time) ---

    /**
     * Install the cloak and its fail-open machinery — the single boundary wiring the pure
     * logic to the DOM and timers. Runs synchronously on load; a no-op (returns null) when
     * cloak is disabled, which is the default.
     *
     * @param {Window}   win - boundary source: reads win.genxConfig and uses win.setTimeout,
     *   win.MutationObserver, win.addEventListener (passed in so tests can inject them).
     * @param {Document} doc - document to cloak: the <style> is injected into its <head> and
     *   its documentElement is observed for genX markers appearing (initial parse and swaps).
     * @returns {?{reveal: function, selector: string, observer: MutationObserver}} null when
     *   disabled; otherwise a handle — reveal() one-shot force-lifts the whole cloak, selector
     *   is the still-cloaked predicate, observer is the live fail-open watchdog.
     */
    const init = (win, doc) => {
        const cfg = resolveCloakConfig(win.genxConfig);
        if (!cfg.enabled) return null;

        const selector = cloakSelector(cfg.markers);
        installCloakStyle(doc, buildCloakCss(cfg.markers));

        // One-shot global reveal: lifts the cloak from everything currently hidden.
        let revealed = false;
        const revealEverything = () => {
            if (revealed) return;
            revealed = true;
            revealAll(doc, selector);
        };

        // Per-batch fail-open: each batch of cloaked elements that appears gets its own
        // timer, so a batch inserted at T=0 and a swap inserted at T=10s each reveal
        // within timeoutMs if genX never stamps them. This is the half CSS cannot do.
        // Re-check the selector at fire time so an element genX has since finished (it
        // now carries its done-marker) is NOT stamped with a redundant failsafe escape.
        const armReveal = (elements) => {
            if (elements.length === 0) return;
            win.setTimeout(() => {
                for (const el of elements) {
                    if (el.matches && el.matches(selector)) revealElement(el);
                }
            }, cfg.timeoutMs);
        };

        // The watchdog: the one signal that survives a dead bootloader. It watches for
        // genX markers appearing — initial body parse and later swaps, the same path.
        const observer = new win.MutationObserver((records) => {
            const appeared = [];
            for (const rec of records) {
                for (const node of rec.addedNodes) appeared.push(node);
            }
            armReveal(collectCloakable(appeared, selector));
        });
        observer.observe(doc.documentElement, { childList: true, subtree: true });

        // Absolute ceiling for elements already present at install time: if genX never
        // runs at all, the whole cloak lifts by timeoutMs regardless of the observer.
        win.setTimeout(revealEverything, cfg.timeoutMs);

        // Fast paths — reveal sooner than the ceiling, whichever comes first.
        win.addEventListener('genx:ready', revealEverything, { once: true });
        win.addEventListener('genx:error', revealEverything, { once: true });

        return { reveal: revealEverything, selector, observer };
    };

    // --- Exports ---

    const api = {
        version: '1.0.0',
        resolveCloakConfig, cloakSelector, buildCloakCss, collectCloakable,
        installCloakStyle, revealElement, revealAll, init
    };

    if (typeof window !== 'undefined') {
        window.genxCloak = api;
        // Run synchronously on load. When cloak is off (the default), init is a no-op.
        if (window.document) init(window, window.document);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})();
