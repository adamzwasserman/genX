# Creating a Custom genX Module for Your Project

genX ships a handful of modules — formatting, accessibility, binding, drag, loading, navigation, tables, UI. But the architecture is open: any project can write its own module, host it anywhere, and have genX load and manage it exactly like a built-in. This guide walks through the module contract, builds a real one end to end, and wires it into a specific project.

## The mental model

A genX module turns a **declarative HTML attribute** into a **client-side enhancement**. You write `<time ta-since="2026-07-01">` in your markup; the module finds it after the page paints and rewrites it to `3 weeks ago`. The DOM is the source of truth — genX reads intent from attributes and reconciles the element to its finished state. There is no client-side store, no framework, no build step required in the page. That is the whole model, and your module follows it too.

A module is three small things: **pure functions** that compute the enhancement, a **scan** that finds the elements and applies it, and a **factory** — a single global the bootloader looks for by name. Everything else is convention.

## The contract

When the bootloader loads a module for the prefix `ta`, it does exactly one thing after the script runs: it looks for a global named `taXFactory` on `window`. The rule is `window[prefix + 'XFactory']`. If that global is missing, the module is considered broken and genX logs an error. If it is present, genX calls it to initialize the module.

The factory is a plain object with an `init` and/or an `autoInit` method. genX prefers `autoInit` because it follows the DOM-as-state principle — it is handed the live DOM to read from, rather than pre-built data:

```js
// genX calls whichever of these you expose, preferring autoInit:
factory.autoInit(document.body, moduleConfig);   // preferred: read state from the DOM
factory.init(moduleConfig);                       // fallback: no DOM handed in
```

`moduleConfig` is whatever the consuming project put under `genxConfig.modules[prefix]` — your module's configuration, passed in as a parameter (never read from a global inside the module). Whatever `init`/`autoInit` returns is the module's **public API**. If that API exposes a `scan(root)` method, genX keeps a reference to it and calls it again whenever new content is inserted — so your module handles HTMX swaps, infinite scroll, and any dynamic DOM for free. Return at least `{ scan, destroy }`.

That is the entire contract:

1. Expose `window.<prefix>XFactory` with `init(config)` and/or `autoInit(root, config)`.
2. Return an API object; include `scan(root)` so genX can re-run you on new content, and `destroy()` for teardown.
3. Keep the transform itself in pure functions.

## Build one: `timeagoX`

Here is a complete module. It enhances any element carrying `ta-since` (an ISO date) into a human-readable relative time, and keeps it accurate. The prefix is `ta`, so the factory must be `window.taXFactory`.

```js
// timeagox.js — a custom genX module (prefix "ta")
(function () {
  'use strict';

  // --- Pure functions: input in, output out, no DOM, no globals ---

  const UNITS = [
    ['year',   31536000000],
    ['month',   2592000000],
    ['week',     604800000],
    ['day',       86400000],
    ['hour',       3600000],
    ['minute',       60000]
  ];

  // relativeTime(fromISO, nowMs) -> "3 weeks ago" | "in 2 days" | "just now"
  const relativeTime = (fromISO, nowMs) => {
    const then = Date.parse(fromISO);
    if (Number.isNaN(then)) return fromISO;            // fail safe: show the raw value
    const diff = nowMs - then;
    const abs = Math.abs(diff);
    for (const [unit, ms] of UNITS) {
      if (abs >= ms) {
        const n = Math.round(abs / ms);
        const label = n === 1 ? unit : unit + 's';
        return diff >= 0 ? `${n} ${label} ago` : `in ${n} ${label}`;
      }
    }
    return 'just now';
  };

  // --- Enhancement: apply the transform to one element, then to a subtree ---

  const enhanceElement = (el, nowMs) => {
    const since = el.getAttribute('ta-since');
    if (!since) return;
    el.textContent = relativeTime(since, nowMs);
    el.setAttribute('ta-done', '');                    // mark as processed (see cloak section)
  };

  const scanElements = (root, nowMs) => {
    if (root.matches && root.matches('[ta-since]')) enhanceElement(root, nowMs);
    root.querySelectorAll && root.querySelectorAll('[ta-since]').forEach(el => enhanceElement(el, nowMs));
  };

  // --- Factory: the single global the bootloader looks for ---

  const create = (config) => {
    const refresh = () => scanElements(document, Date.now());
    // Keep relative times fresh; interval is configurable, resolved explicitly at the boundary.
    const everyMs = config.refreshMs === undefined ? 60000 : config.refreshMs;
    const timer = everyMs > 0 ? setInterval(refresh, everyMs) : null;
    return {
      // scan(root) is the important one — genX calls it on dynamically inserted content.
      scan: (root) => scanElements(root || document, Date.now()),
      destroy: () => { if (timer) clearInterval(timer); }
    };
  };

  window.taXFactory = {
    // Preferred: read straight from the DOM.
    autoInit: (root, config) => { const api = create(config || {}); api.scan(root || document); return api; },
    // Fallback for environments without a root element.
    init: (config) => { const api = create(config || {}); api.scan(document); return api; }
  };

  // Optional: work standalone (without the bootloader) too.
  if (!window.genx && document.readyState !== 'loading') window.taXFactory.init({});
  else if (!window.genx) document.addEventListener('DOMContentLoaded', () => window.taXFactory.init({}));
})();
```

Notice the shape: `relativeTime` is pure and independently testable (`relativeTime('2026-07-01', Date.parse('2026-07-22')) === '3 weeks ago'`), the DOM work is confined to `enhanceElement`/`scanElements`, and the factory wires it together and returns `{ scan, destroy }`. No class, no `this`, no hidden state.

## Wire it into your project

Your module lives at a URL you control — your own CDN, your app's static assets, anywhere. You tell genX about it through `window.genxConfig`, set **before** the bootloader script runs.

```html
<script>
  window.genxConfig = {
    // Map your prefix to your module's URL. An absolute URL is used as-is;
    // a leading-slash path is resolved against `cdn` (below).
    modulePaths: { ta: 'https://assets.myproject.com/genx/timeagox.min.js' },
    // Per-module config, handed to your init/autoInit as the `config` parameter.
    modules:     { ta: { refreshMs: 30000 } },
    // Optional: subresource integrity for your module.
    sri:         { ta: 'sha384-…' }
  };
</script>

<!-- The genX bootloader (built-in modules load automatically by their attributes). -->
<script src="https://cdn.genx.software/v1/bootloader.<hash>.min.js" defer></script>

<!-- Custom prefixes aren't in the bootloader's built-in attribute table, so ask for
     yours explicitly. genx.init() loads it, initializes it, and registers it so genX
     drives its scan() on all future dynamic content. -->
<script>
  addEventListener('genx:ready', () => window.genx.init('ta'));
</script>
```

That single `genx.init('ta')` call does the whole lifecycle: it fetches your script (applying `sri` if given), verifies `window.taXFactory` exists, calls `autoInit(document.body, { refreshMs: 30000 })`, and remembers the returned API so every later `rescan` re-runs your `scan`. From then on your module is a first-class citizen alongside the built-ins.

**Why the explicit `init` call?** genX auto-loads its *built-in* modules by recognizing their entry attributes (`fx-format`, `ax-enhance`, and so on) during its initial DOM scan. That attribute table is fixed in the bootloader, so a brand-new prefix like `ta-since` won't trigger an automatic load — you opt it in with one line. Everything after that (dynamic rescanning, teardown, config) is automatic.

### Simpler still: standalone

If you don't need the bootloader to manage your module, just load it with a plain `<script>` and let it self-initialize (the last few lines of the module above handle that). You lose automatic rescanning, but you can call `window.genx?.rescan(node)` yourself after inserting content, or run your own observer. Use this when the module is small and self-contained; use the bootloader-managed path when you want lifecycle and dynamic content handled for you.

## Dynamic content is already handled

Because genX kept a reference to your `scan`, anything that inserts `ta-since` elements later — an HTMX swap, a "load more" button, a client render — is picked up automatically. genX watches the DOM and calls your `scan(insertedSubtree)`; your enhancement runs on exactly the new nodes. You wrote `scan` once; you never wire up a MutationObserver yourself.

If you're in standalone mode, do the same thing manually after an insert:

```js
container.insertAdjacentHTML('beforeend', newRowsHtml);
window.genx ? window.genx.rescan(container) : window.taXFactory.init({});
```

## Advanced: opt your module into the cloak

genX serves raw values and formats them on the client, so a value can flash in its raw form for a frame or two before your module rewrites it — the same format-on-load flash the built-in **cloak** removes. The cloak is a general primitive: it hides any element carrying a *marker* attribute until that element gains its *done* attribute. Out of the box it is wired only to formatting (`fx-format` → `fx-raw`), but a project can extend it to a custom module by adding a marker pair.

Our `timeagoX` module already stamps `ta-done` on each element after it processes it (see `enhanceElement`). That's the done-marker. Tell the cloak about it:

```html
<script>
  window.genxConfig = {
    cloak: true,
    cloakMarkers: [
      { mark: 'fx-format', done: 'fx-raw'  },   // keep the built-in default
      { mark: 'ta-since',  done: 'ta-done' }    // add yours
    ],
    modulePaths: { ta: 'https://assets.myproject.com/genx/timeagox.min.js' }
  };
</script>
<!-- Load the cloak synchronously, before the bootloader, then the bootloader. -->
<script src="https://cdn.genx.software/v1/cloak.<hash>.min.js"></script>
<script src="https://cdn.genx.software/v1/bootloader.<hash>.min.js" defer></script>
```

Now a `<time ta-since="…">` is hidden (its layout reserved, not collapsed) until your module stamps `ta-done` — so the raw ISO date never flashes. And it still **fails open**: if your module never runs, the cloak's timeout reveals the raw value rather than leaving a blank. Your module got FOUC protection for free, just by stamping one attribute.

## Checklist

- **Prefix is unique.** Avoid the built-ins (`fx`, `ax`, `bx`, `dx`, `lx`, `tx`, `nx`, `sx`, `ux`). Pick a two-or-three letter prefix that's yours.
- **Factory name matches.** Prefix `ta` → global `window.taXFactory`. genX looks for exactly `prefix + 'XFactory'`.
- **Return an API with `scan(root)`.** That's what makes dynamic content work. Add `destroy()` for teardown.
- **Prefer `autoInit(root, config)`.** Read state from the DOM you're handed; take config as a parameter, never from a global.
- **Keep the transform pure.** The function that computes the enhancement should take inputs and return outputs — no DOM, no `this`. Test it directly.
- **Configure from the project, not the module.** `genxConfig.modulePaths` points at your URL; `genxConfig.modules[prefix]` carries your options.
- **Opt into the cloak** if your module rewrites visible values, by stamping a done-marker and adding a `cloakMarkers` pair.

That's the whole surface. A genX module is a global factory over a couple of pure functions — small enough to read in one sitting, and once registered, it behaves exactly like the modules genX ships.
