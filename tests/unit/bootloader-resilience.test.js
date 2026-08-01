/**
 * Regression tests for two bootloader resilience bugs:
 *
 *  1. Bootstrap gated on requestAnimationFrame never runs in hidden/unfocused tabs
 *     (browsers pause rAF when the document is hidden), so nothing formats until the
 *     tab is focused. Fixed by scheduling the body via rAF AND a timer fallback, run
 *     once. See genx-raf-hidden-tab-bootstrap-bug report.
 *
 *  2. load(prefix) dereferenced modules[prefix] with no guard, throwing an opaque
 *     "Cannot read properties of undefined (reading 'startsWith')" for an unknown
 *     prefix. Fixed to reject with a named error before dereferencing.
 */

const bootloader = require('../../src/bootloader.js');

describe('scheduleOnce: bootstrap runs in hidden/unfocused tabs', () => {
    // A fake window where requestAnimationFrame either fires (foreground) or is paused
    // (hidden tab), and setTimeout queues callbacks we flush on demand.
    const makeWin = ({ rafFires }) => {
        const timers = [];
        return {
            requestAnimationFrame: (cb) => { if (rafFires) cb(); },
            setTimeout: (cb) => { timers.push(cb); return 1; },
            flushTimers: () => timers.splice(0).forEach((cb) => cb()),
        };
    };

    test('foreground tab: rAF fires, body runs once, the fallback timer does not re-run it', () => {
        const fn = jest.fn();
        const win = makeWin({ rafFires: true });
        bootloader.scheduleOnce(fn, win);
        expect(fn).toHaveBeenCalledTimes(1);
        win.flushTimers();                     // the fallback timer also fires...
        expect(fn).toHaveBeenCalledTimes(1);   // ...but the one-shot guard prevents a second run
    });

    test('hidden tab: rAF is paused, the fallback timer still runs the body once', () => {
        const fn = jest.fn();
        const win = makeWin({ rafFires: false });   // requestAnimationFrame never calls back
        bootloader.scheduleOnce(fn, win);
        expect(fn).not.toHaveBeenCalled();          // the old bug: stalled here forever
        win.flushTimers();
        expect(fn).toHaveBeenCalledTimes(1);        // body runs despite no paint frame
    });

    test('runs exactly once even if both rAF and the timer fire', () => {
        const fn = jest.fn();
        const win = makeWin({ rafFires: true });
        bootloader.scheduleOnce(fn, win);
        win.flushTimers();
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('load: guards an unknown module prefix', () => {
    test('rejects with a named error, not an opaque TypeError, for an unknown prefix', async () => {
        await expect(bootloader.load('definitely-not-a-real-prefix'))
            .rejects.toThrow(/unknown module prefix/i);
    });

    test('rejects when called with no prefix at all', async () => {
        await expect(bootloader.load()).rejects.toThrow(/unknown module prefix/i);
    });
});
