/**
 * Steps shared by the bindX framework adapter features (React, Vue, Svelte, Angular).
 * Each feature's "@genx/bindx-<framework> package is installed" step compiles that
 * adapter through tests/support/bindx-adapter-harness.js.
 */
const { Given } = require('@cucumber/cucumber');
const assert = require('assert');
const path = require('path');

Given('the bindX core library is loaded', function() {
    assert.ok(this.ad, 'an adapter package step must run first');
    const core = this.ad.core;
    for (const api of ['reactive', 'computed', 'watch', 'isReactive']) {
        assert.strictEqual(typeof core[api], 'function', `bindX.${api} should be a function`);
    }
    assert.strictEqual(require.resolve(path.resolve(__dirname, '../../src/bindx.js')) in require.cache, true);
    // Count live watchers so cleanup steps can check the adapter unwatches what it watches
    const ad = this.ad;
    ad.activeWatchers = 0;
    globalThis.bindX = Object.assign({}, core, {
        watch(...args) {
            const unwatch = core.watch(...args);
            ad.activeWatchers++;
            let done = false;
            return () => {
                if (!done) {
                    done = true;
                    ad.activeWatchers--;
                }
                return unwatch();
            };
        }
    });
    ad.bindX = globalThis.bindX;
});
